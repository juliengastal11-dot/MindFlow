"""Assistant IA : suggère importance, type, durée et action pour des éléments capturés.

Trois fournisseurs possibles avec la clé apportée par l'utilisateur :
- Anthropic (SDK officiel `anthropic`, sorties structurées JSON),
- OpenAI et Google Gemini (REST via httpx).
Sans aucune clé, un moteur heuristique (mots-clés en français) prend le relais.
"""
from __future__ import annotations

import json
import logging
import re
import unicodedata
from dataclasses import asdict, dataclass

import anthropic
import httpx

from ..config import settings
from ..models import User
from ..security import decrypt

log = logging.getLogger("mindflow.ai")

PRESETS = [5, 15, 30, 60, 120]
IMPORTANCES = {"prioritaire", "important", "urgent", "aucune"}
TYPES = {"task", "idea", "note"}
ACTIONS = {"tache", "idee", "note", "parking"}
LLM_TIMEOUT = 60.0


class AiError(Exception):
    """Erreur fournisseur exposée à l'utilisateur (clé invalide, quota, panne…)."""

    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


@dataclass
class Suggestion:
    id: str
    importance: str
    type: str
    estimated_minutes: int
    action: str

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass
class Entry:
    id: str
    title: str
    note: str = ""


# ---- Heuristiques (sans IA) ---------------------------------------------

def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower().replace("’", "'")
    return re.sub(r"\s+", " ", text).strip()


_WHOLE_WORDS = {"app", "code", "point", "pret", "lien", "info", "note", "memo", "vite", "site", "film", "lire", "mail"}
_PATTERN_CACHE: dict[tuple[str, ...], re.Pattern] = {}


def _pattern(words: tuple[str, ...]) -> re.Pattern:
    """Regex « début de mot » : « recrut » couvre « recrutement », mais « vite » ne matche pas « inviter »."""
    pattern = _PATTERN_CACHE.get(words)
    if pattern is None:
        parts = []
        for word in words:
            w = word.strip()
            parts.append(r"\b" + re.escape(w) + (r"\b" if w in _WHOLE_WORDS else ""))
        pattern = re.compile("|".join(parts))
        _PATTERN_CACHE[words] = pattern
    return pattern


def _has(text: str, words: tuple[str, ...]) -> bool:
    return _pattern(words).search(text) is not None


URGENT_WORDS = (
    "urgent", "urgence", "asap", "vite", "rapidement", "immediat", "aujourd'hui", "aujourd hui", "ce soir",
    "ce matin", "cet apres-midi", "avant demain", "deadline", "dernier delai", "en retard", "relancer",
    "relance", "impaye", "au plus vite", "des que possible", "expire", "echeance",
)
IMPORTANT_WORDS = (
    "client", "devis", "facture", "contrat", "comptable", "compta", "impot", "urssaf", "tva", "banque",
    "paiement", "presentation", "rdv", "rendez-vous", "strategie", "lancement", "recrut", "embauche",
    "juridique", "avocat", "assurance", "prospect", "vente", "signature", "livraison", "produit", "budget",
    "prevision", "objectif", "bilan", "investisseur", "partenariat", "site web", "important", "pitch",
    "financement", "pret", "subvention", "salaire", "fournisseur", "commande client",
)
IDEA_WORDS = (
    "idee", "et si", "peut-etre", "peut etre", "concept", "imaginer", "creer une", "lancer une", "explorer",
    "inventer", "fonctionnalite", "feature", "envie", "reve", "possibilite", "pourquoi pas", "brainstorm",
)
NOTE_WORDS = (
    "note :", "note:", "noter", "penser a", "se souvenir", "rappel :", "info :", "reference", "lien",
    "mot de passe", "code ", "adresse", "numero", "citation", "a retenir", "memo",
)
SOMEDAY_WORDS = (
    "un jour", "voyage", "aller a", "visiter", "lire", "regarder", "film", "serie", "livre", "vacances",
    "week-end", "weekend", "apprendre", "plus tard", "quand j'aurai le temps", "un de ces jours", "bucket",
)
QUICK_WORDS = (
    "appeler", "repondre", "envoyer", "mail", "email", "message", "sms", "valider", "confirmer", "relancer",
    "signer", "payer", "verifier", "reserver", "commander", "acheter", "imprimer", "transferer", "partager",
    "poster", "publier", "programmer", "demander", "prevenir", "accepter", "refuser", "renvoyer",
)
MEDIUM_WORDS = (
    "preparer", "reunion", "point ", "brief", "relire", "corriger", "mettre a jour", "ranger", "trier",
    "organiser", "analyser", "comparer", "chercher", "rechercher", "lister", "planifier", "revoir",
)
LONG_WORDS = (
    "rediger", "ecrire", "presentation", "dossier", "rapport", "devis", "proposition", "faire les comptes",
    "compta", "formation", "former", "atelier", "installer", "configurer", "monter", "designer", "maquette",
    "tourner", "video", "article", "newsletter", "entretien", "declaration",
)
XL_WORDS = (
    "developper", "coder", "creer le site", "site web", "refonte", "construire", "application", "app ",
    "projet", "migrer", "demenager", "strategie", "business plan", "audit", "roadmap", "mvp", "version mobile",
    "integration", "automatiser", "lancement",
)


def _nearest_preset(minutes: int) -> int:
    return min(PRESETS, key=lambda p: abs(p - minutes))


def heuristic(entry: Entry) -> Suggestion:
    title = _normalize(entry.title)
    text = _normalize(f"{entry.title} {entry.note}")
    urgent = _has(text, URGENT_WORDS)
    important = _has(text, IMPORTANT_WORDS)
    if urgent and important:
        importance = "prioritaire"
    elif important:
        importance = "important"
    elif urgent:
        importance = "urgent"
    else:
        importance = "aucune"

    starts_like_note = re.match(r"^(note|memo|info|rappel|reference|ref)\b", title) is not None
    if starts_like_note or (_has(title, NOTE_WORDS) and not _has(title, QUICK_WORDS + MEDIUM_WORDS + LONG_WORDS + XL_WORDS)):
        kind = "note"
    elif _has(text, IDEA_WORDS):
        kind = "idea"
    else:
        kind = "task"

    opening = " ".join(title.split(" ")[:2])  # le verbe en tête de phrase donne le ton : « Appeler le comptable » = rapide
    if kind == "note":
        minutes = 5
    elif _has(opening, QUICK_WORDS):
        minutes = 15
    elif _has(text, XL_WORDS):
        minutes = 120
    elif _has(text, LONG_WORDS):
        minutes = 60
    elif _has(text, MEDIUM_WORDS):
        minutes = 30
    elif _has(text, QUICK_WORDS):
        minutes = 15
    else:
        minutes = 30

    someday = _has(text, SOMEDAY_WORDS)
    if kind == "note":
        action = "note"
    elif kind == "idea":
        action = "parking" if someday else "idee"
    else:
        action = "parking" if (someday and importance == "aucune") else "tache"

    return Suggestion(id=entry.id, importance=importance, type=kind, estimated_minutes=minutes, action=action)


# ---- Fournisseurs LLM ----------------------------------------------------

SYSTEM_PROMPT = """Tu es l'assistant d'organisation de MindFlow Business, une application de productivité pour entrepreneurs.
On te donne des éléments capturés à la volée (tâches, idées, notes), en français. Pour chacun, propose :
- "importance" : "prioritaire" (urgent ET important : je dois le faire), "important" (important mais pas urgent : je dois le planifier), "urgent" (urgent mais pas important : je dois le traiter sans y passer trop de temps), "aucune" (le reste attend).
- "type" : "task" (action concrète), "idea" (idée, projet, envie), "note" (information à conserver).
- "estimated_minutes" : 5, 15, 30, 60 ou 120 (la valeur la plus proche du temps réellement nécessaire).
- "action" : "tache" (à faire), "idee" (idée à explorer), "note" (à conserver), "parking" (à revoir plus tard : envies vagues, « un jour »).
Reste sobre : ne mets "prioritaire" que si l'élément est réellement urgent et important pour un professionnel.
Centres d'intérêt de l'utilisateur : {interests}.
Réponds uniquement avec un objet JSON de la forme {{"suggestions": [{{"id": "...", "importance": "...", "type": "...", "estimated_minutes": 30, "action": "..."}}]}}, un objet par élément, en conservant les identifiants fournis."""

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "suggestions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "importance": {"type": "string", "enum": sorted(IMPORTANCES)},
                    "type": {"type": "string", "enum": sorted(TYPES)},
                    "estimated_minutes": {"type": "integer", "enum": PRESETS},
                    "action": {"type": "string", "enum": sorted(ACTIONS)},
                },
                "required": ["id", "importance", "type", "estimated_minutes", "action"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["suggestions"],
    "additionalProperties": False,
}


def _user_message(entries: list[Entry]) -> str:
    lines = []
    for entry in entries:
        note = f" — note : {entry.note.strip()}" if entry.note and entry.note.strip() else ""
        lines.append(f'- id "{entry.id}" : {entry.title.strip()}{note}')
    return "Éléments à organiser :\n" + "\n".join(lines)


def _system_prompt(user: User) -> str:
    interests = ", ".join(user.interests or []) or "non renseignés"
    return SYSTEM_PROMPT.format(interests=interests)


def _call_anthropic(api_key: str, user: User, entries: list[Entry]) -> str:
    client = anthropic.Anthropic(api_key=api_key, timeout=LLM_TIMEOUT, max_retries=1)
    try:
        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=16000,
            system=_system_prompt(user),
            messages=[{"role": "user", "content": _user_message(entries)}],
            output_config={
                "format": {"type": "json_schema", "schema": JSON_SCHEMA},
                "effort": "low",  # classification simple : rapide et économique
            },
        )
    except anthropic.AuthenticationError:
        raise AiError(400, "Clé Anthropic invalide")
    except anthropic.PermissionDeniedError:
        raise AiError(400, "Cette clé Anthropic n'a pas les droits nécessaires")
    except anthropic.RateLimitError:
        raise AiError(429, "Quota Anthropic dépassé, réessayez dans un instant")
    except anthropic.APIStatusError as exc:
        raise AiError(502, f"Erreur Anthropic ({exc.status_code}) : {exc.message}")
    except anthropic.APIConnectionError:
        raise AiError(502, "Impossible de joindre l'API Anthropic")
    if response.stop_reason == "refusal":
        raise AiError(502, "L'IA n'a pas pu traiter cette demande")
    return next((block.text for block in response.content if block.type == "text"), "")


def _call_openai(api_key: str, user: User, entries: list[Entry]) -> str:
    try:
        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": settings.OPENAI_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": _system_prompt(user)},
                    {"role": "user", "content": _user_message(entries)},
                ],
            },
            timeout=LLM_TIMEOUT,
        )
    except httpx.HTTPError:
        raise AiError(502, "Impossible de joindre l'API OpenAI")
    if response.status_code == 401:
        raise AiError(400, "Clé OpenAI invalide")
    if response.status_code == 429:
        raise AiError(429, "Quota OpenAI dépassé, réessayez dans un instant")
    if response.status_code >= 400:
        raise AiError(502, f"Erreur OpenAI ({response.status_code})")
    try:
        return response.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, ValueError):
        raise AiError(502, "Réponse OpenAI inattendue")


def _call_gemini(api_key: str, user: User, entries: list[Entry]) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    try:
        response = httpx.post(
            url,
            headers={"x-goog-api-key": api_key},
            json={
                "system_instruction": {"parts": [{"text": _system_prompt(user)}]},
                "contents": [{"role": "user", "parts": [{"text": _user_message(entries)}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
            },
            timeout=LLM_TIMEOUT,
        )
    except httpx.HTTPError:
        raise AiError(502, "Impossible de joindre l'API Gemini")
    if response.status_code in (400, 401, 403) and "key" in response.text.lower():
        raise AiError(400, "Clé Gemini invalide")
    if response.status_code == 429:
        raise AiError(429, "Quota Gemini dépassé, réessayez dans un instant")
    if response.status_code >= 400:
        raise AiError(502, f"Erreur Gemini ({response.status_code})")
    try:
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, ValueError):
        raise AiError(502, "Réponse Gemini inattendue")


PROVIDERS = {"anthropic": _call_anthropic, "openai": _call_openai, "gemini": _call_gemini}


def _parse_suggestions(raw: str, entries: list[Entry]) -> dict[str, Suggestion]:
    text = (raw or "").strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        data = json.loads(text)
    except ValueError:
        raise AiError(502, "L'IA a renvoyé une réponse illisible")
    items = data.get("suggestions") if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise AiError(502, "L'IA a renvoyé une réponse inattendue")

    by_id = {entry.id: entry for entry in entries}
    result: dict[str, Suggestion] = {}
    for index, raw_item in enumerate(items):
        if not isinstance(raw_item, dict):
            continue
        item_id = str(raw_item.get("id") or (entries[index].id if index < len(entries) else ""))
        if item_id not in by_id:
            continue
        base = heuristic(by_id[item_id])
        importance = raw_item.get("importance") if raw_item.get("importance") in IMPORTANCES else base.importance
        kind = raw_item.get("type") if raw_item.get("type") in TYPES else base.type
        try:
            minutes = _nearest_preset(int(raw_item.get("estimated_minutes", base.estimated_minutes)))
        except (TypeError, ValueError):
            minutes = base.estimated_minutes
        action = raw_item.get("action") if raw_item.get("action") in ACTIONS else base.action
        result[item_id] = Suggestion(id=item_id, importance=importance, type=kind, estimated_minutes=minutes, action=action)
    return result


# ---- Point d'entrée ------------------------------------------------------

def _resolve_provider(user: User) -> tuple[str, str] | None:
    """(fournisseur, clé) à utiliser : clé de l'utilisateur, sinon clé serveur Anthropic, sinon None."""
    if user.ai_key_encrypted:
        key = decrypt(user.ai_key_encrypted)
        if not key:
            raise AiError(400, "Clé IA illisible : enregistrez-la à nouveau dans les paramètres")
        provider = user.ai_provider if user.ai_provider in PROVIDERS else "openai"
        return provider, key
    if settings.ANTHROPIC_API_KEY:
        return "anthropic", settings.ANTHROPIC_API_KEY
    return None


def organize(user: User, entries: list[Entry]) -> tuple[list[Suggestion], str]:
    """Retourne (suggestions dans l'ordre des entrées, source = 'ai:<fournisseur>' | 'heuristic')."""
    if not entries:
        return [], "heuristic"
    resolved = _resolve_provider(user)
    if resolved is None:
        return [heuristic(entry) for entry in entries], "heuristic"

    provider, key = resolved
    raw = PROVIDERS[provider](key, user, entries)
    parsed = _parse_suggestions(raw, entries)
    return [parsed.get(entry.id) or heuristic(entry) for entry in entries], f"ai:{provider}"


def suggest_one(user: User, text: str) -> tuple[Suggestion, str]:
    suggestions, source = organize(user, [Entry(id="new", title=text)])
    return suggestions[0], source
