/* ---------------------------------------------------------------------------
   Markup porté de `C:\VTBON\vtbon site\index.html` (lignes 162-383, écran
   « Nouveau bon » de `#phone-bons`), adapté à l'interface RÉELLE de l'app
   (vérifiée sur le snapshot `app-index-origin.html`) et au scénario du
   blueprint (8 scènes, §SCÉNARIOS). Copié du dépôt vtbon-site (`components/maquettes/`,
   état du 2026-10-07) pour le téléphone de la section 02 de Stalika : le moteur
   (`moteur.ts`) le pose dans l'écran. Ce HTML est une constante écrite ici, à la
   main : aucune donnée du visiteur, aucune réponse d'un serveur n'y entre, il ne
   peut donc rien injecter.

   Écarts assumés avec le site source (l'app a raison, voir le rapport) :
   - Pas d'écran d'accueil iPhone : le scénario démarre DIRECTEMENT sur
     « Nouveau bon ». Depuis le 2026-09-05, deux écrans le suivent : `wa`
     (la conversation WhatsApp où le bon part en image, jusqu'aux coches,
     une AUTRE app, donc aucune variable de palette, seul Nuit/Jour bascule
     ses deux modes) et `bons` (la roue de favoris de l'app, figée sur son
     troisième favori, puis quinze courses qui défilent lentement).
   - Le partage se termine sur WHATSAPP, montré jusqu'à l'envoi, pas sur la
     pancarte, qui a sa propre section sur la page.
   - Le panneau de dictée est porté depuis `#dictee-retro` (l'app réelle,
     bien plus riche que le `.voice-fx` du site source) et affiche la
     QUESTION en plus de la réponse, écart délibéré, signalé dans le rapport.
   - La confirmation de la pancarte réutilise LA MÊME vitre que celle de la
     démo Factures (`confirmSheet` dans l'app réelle n'a qu'UN seul markup
     pour les dix-neuf questions de l'app) : ici son champ de saisie
     (`data-ref="vitre-champ"`) EST la « fenêtre Votre pancarte ».
   - Aucun `id` : deux téléphones cohabitent dans la page, tout est scopé par
     `data-*` et interrogé depuis la racine reçue par le moteur.
--------------------------------------------------------------------------- */

export const MARKUP_BONS = `
<div class="statusbar" aria-hidden="true">
  <span class="statusbar__time">14:30</span>
  <span class="statusbar__icons">
    <svg viewBox="0 0 24 12" width="17" height="9"><rect x="0" y="6" width="3" height="6" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg viewBox="0 0 26 13" width="22" height="11"><rect x="0.5" y="0.5" width="21" height="12" rx="3" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="2" width="16" height="9" rx="1.5"/><rect x="23" y="4" width="2" height="5" rx="1"/></svg>
  </span>
</div>

<!-- Écran : Nouveau bon (unique, le scénario ne visite aucun autre écran) -->
<div class="vt-screen is-active" data-screen="home">
  <div class="topbar">
    <img class="brand-mark" src="/demos/vtbon/logo-vtbon-240.png" alt="VTBON" width="240" height="53">
    <div class="tbr">
      <span class="ibtn gold" aria-hidden="true"><span data-icon="help-circle"></span></span>
      <span class="ibtn gold" aria-hidden="true"><span data-icon="sun"></span></span>
    </div>
  </div>
  <div class="home-scroll" data-ref="home-scroll">
    <div class="card">
      <div class="chead">
        <div class="ctitle">Trajet</div>
        <span class="trip-type" aria-hidden="true">Aller simple<svg viewBox="0 0 10 6" width="9" height="5" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
      <div class="f"><label>Départ <span class="req">*</span></label><div class="iw vm geo" data-field="dep"><input type="text" readonly tabindex="-1" placeholder="Adresse de prise en charge"><span class="vbtn geo" aria-hidden="true"><span data-icon="locate"></span></span><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div></div>
      <div class="stop-add" aria-hidden="true"><span class="stop-add__btn"><span data-icon="plus"></span></span>+ étape</div>
      <div class="f"><label>Arrivée <span class="req">*</span></label><div class="iw vm" data-field="arr"><input type="text" readonly tabindex="-1" placeholder="Destination"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div></div>
    </div>
    <div class="card">
      <div class="chead">
        <div class="ctitle">Client &amp; Passagers</div>
        <span class="trip-type" aria-hidden="true">Client habituel<svg viewBox="0 0 10 6" width="9" height="5" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
      <div class="f"><label>Nom du client <span class="req">*</span></label><div class="iw vm" data-field="cli"><input type="text" readonly tabindex="-1" placeholder="Prénom Nom"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div></div>
      <div class="r2" style="margin-top:10px">
        <div class="f"><label>Tél. client</label><div class="iw vm" data-field="tel"><input type="text" readonly tabindex="-1" placeholder="Téléphone du client"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div></div>
        <div class="f"><label>Nb passagers</label><div class="iw"><div class="fakeselect">1<span class="ic chev" data-icon="chevron-down"></span></div></div></div>
      </div>
    </div>
    <div class="card">
      <div class="ctitle">Planification &amp; Tarif</div>
      <div class="r2">
        <div class="f"><label>Pris en charge le <span class="req">*</span></label><div class="iw"><div class="fakeselect">03/09/2026<span data-icon="calendar"></span></div></div></div>
        <div class="f"><label>À <span class="req">*</span></label><div class="iw"><div class="fakeselect">14:30<span data-icon="clock"></span></div></div></div>
      </div>
      <div class="f" style="margin-top:10px"><label>Prix TTC <span class="req">*</span></label><div class="iw pf" data-field="prix"><input type="text" readonly tabindex="-1" placeholder="0"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span><span class="eur" aria-hidden="true">€</span></div></div>
    </div>
    <div class="card">
      <div class="ctitle">Options avancées</div>
      <div class="f" style="display:flex;align-items:center;gap:8px">
        <span class="paybox" data-ref="st-box" style="flex:0 0 auto;white-space:nowrap;margin:0"><span class="cbx" data-ref="st-cbx" aria-hidden="true"></span>Sous-traitant</span>
        <div class="iw vm" data-field="st" data-ref="st-wrap" style="display:none;flex:1;min-width:0"><input type="text" readonly tabindex="-1" placeholder="Prénom Nom"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div>
      </div>
      <div class="f" style="margin-top:8px"><span class="paybox"><span class="cbx" aria-hidden="true"></span>Coffre volumineux (poussette, vélos)</span></div>
      <div class="f" style="margin-top:10px"><label>N° vol / train</label><div class="iw"><input type="text" readonly tabindex="-1" placeholder="Ex. AF1234"></div></div>
      <div class="f" style="margin-top:10px"><label>Note interne / Instructions</label><div class="iw vm" data-field="note"><input type="text" readonly tabindex="-1" placeholder="Ex. Digicode 4B21, attendre devant"><span class="vbtn" aria-hidden="true"><span data-icon="mic"></span></span></div></div>
    </div>
  </div>
</div>

<!-- Écran : WhatsApp, l'écran d'une AUTRE application, où le bon part en
     image. Couleurs de WhatsApp en dur (ce n'est pas VTBON) ; le bon lui-même
     est un fac-similé FIXE navy + or, comme le PDF que l'app produit. -->
<div class="vt-screen wa" data-screen="wa">
  <div class="wa-head">
    <span class="wa-back" aria-hidden="true"><span data-icon="arrow-left"></span></span>
    <span class="wa-avatar" aria-hidden="true">DM</span>
    <div class="wa-who"><div class="wa-name">Diana Moreau</div><div class="wa-status">en ligne</div></div>
    <span class="wa-hico" aria-hidden="true"><span data-icon="phone"></span></span>
  </div>
  <div class="wa-chat">
    <div class="wa-day">Aujourd'hui</div>
    <div class="wa-bubble out" data-ref="wa-bulle">
      <div class="wa-img">
        <div class="wai-head"><span class="wai-brand">AR TRANSFERT</span><span class="wai-sub">BON DE TRANSPORT VTC · N° 2026-0912</span></div>
        <div class="wai-gold"></div>
        <div class="wai-body">
          <div class="wai-row"><span>Départ</span><b>Gare de Lyon, Paris</b></div>
          <div class="wai-row"><span>Arrivée</span><b>Aéroport Roissy-CDG</b></div>
          <div class="wai-row"><span>Prise en charge</span><b>3 sept. 2026 · 14:30</b></div>
          <div class="wai-row"><span>Client</span><b>Jean Dupont</b></div>
          <div class="wai-row"><span>Sous-traitant</span><b>Diana Moreau</b></div>
          <div class="wai-row"><span>Chauffeur</span><b>Ali Rachid · VTC-074512</b></div>
          <div class="wai-row"><span>Véhicule</span><b>Tesla Model 3 · FS-915-DB</b></div>
          <div class="wai-total"><span>TOTAL TTC</span><b>75,00 €</b></div>
        </div>
        <div class="wa-upload" data-ref="wa-upload"><span class="wa-spin"></span></div>
      </div>
      <div class="wa-caption">Bon de transport pour la course du 3 septembre. Bonne route !</div>
      <span class="wa-meta">14:32<span class="wa-ticks" data-ref="wa-ticks" data-etat=""><span data-tick="1" data-icon="check"></span><span data-tick="2" data-icon="check-check"></span></span></span>
    </div>
  </div>
  <div class="wa-bar">
    <span class="wa-input"><span class="wa-plus" aria-hidden="true"><span data-icon="plus"></span></span>Message<span class="wa-cam" aria-hidden="true"><span data-icon="camera"></span></span></span>
    <span class="wa-mic" aria-hidden="true"><span data-icon="mic"></span></span>
  </div>
</div>

<!-- Écran : Bons, la roue de favoris de l'app (figée sur son troisième
     favori), puis la liste des courses, qui défile lentement (moteur). -->
<div class="vt-screen" data-screen="bons">
  <div class="topbar">
    <div class="logo">Bons</div>
    <div class="tbr">
      <span class="ibtn gold" aria-hidden="true"><span data-icon="calendar"></span></span>
      <span class="ibtn gold" aria-hidden="true"><span data-icon="upload"></span></span>
    </div>
  </div>
  <div class="favwheel">
    <span class="favwheel-close" aria-hidden="true"><span data-icon="chevron-down"></span></span>
    <div class="favwheel-band" aria-hidden="true"></div>
    <div class="favwheel-scroll">
      <div class="favwheel-rows">
        <div class="favwheel-pad"></div>
        <div class="favwheel-row far"><span class="fw-name">Hôtel Le Bristol</span><span class="fw-prix">85,00 €</span></div>
        <div class="favwheel-row near"><span class="fw-name">Sophie Bernard</span><span class="fw-prix">54,00 €</span></div>
        <div class="favwheel-row on"><span class="fw-name">Jean Dupont</span><span class="fw-prix">75,00 €</span></div>
        <div class="favwheel-row near"><span class="fw-name">Marie Lefèvre</span><span class="fw-prix">48,00 €</span></div>
        <div class="favwheel-row far"><span class="fw-name">Clinique des Lilas</span><span class="fw-prix">32,00 €</span></div>
        <div class="favwheel-pad"></div>
      </div>
    </div>
  </div>
  <div class="hlist" data-ref="bons-liste">
    <div class="hlist-defile" data-ref="bons-defile">
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Jean Dupont<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">75,00 €</span><span class="hfav on" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 14:30</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Gare de Lyon → Aéroport Roissy-CDG</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Sophie Bernard<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">54,00 €</span><span class="hfav on" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 12:50</span><span class="hcheck" aria-hidden="true"><span data-icon="check"></span></span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Bastille → Roissy CDG, Terminal 2E</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Hôtel Le Bristol<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">85,00 €</span><span class="hfav on" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 11:20</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Rue du Faubourg Saint-Honoré → Orly, Terminal 3</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Marie Lefèvre<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">48,00 €</span><span class="hfav on" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 09:45</span><span class="hcheck" aria-hidden="true"><span data-icon="check"></span></span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Gare de Lyon → Neuilly-sur-Seine</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Thomas Martin<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">62,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 08:10</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>La Défense → Aéroport Roissy-CDG</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Camille Roux<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">29,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 07:05</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Montparnasse → Boulogne-Billancourt</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Nadia Belkacem<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">41,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 19:40</span><span class="hcheck" aria-hidden="true"><span data-icon="check"></span></span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Orly, Terminal 1 → Place d'Italie</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Clinique des Lilas<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">32,00 €</span><span class="hfav on" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 17:15</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Les Lilas → Gare du Nord</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Pierre Moreau<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">58,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 15:00</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Roissy CDG, Terminal 2F → Saint-Germain-des-Prés</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Lucas Petit<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">37,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 13:30</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Bercy → Levallois-Perret</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Inès Garcia<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">45,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 10:20</span><span class="hcheck" aria-hidden="true"><span data-icon="check"></span></span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Gare de l'Est → Vincennes</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Hugo Fontaine<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">70,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>2 sept. 2026 · 07:50</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Versailles → Orly, Terminal 4</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Léa Dubois<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">26,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>1 sept. 2026 · 21:10</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Opéra → Gare de Lyon</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Yanis Haddad<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">52,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>1 sept. 2026 · 18:35</span><span class="hcheck" aria-hidden="true"><span data-icon="check"></span></span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Roissy CDG, Terminal 1 → Montmartre</span></span></div>
    </div>
    <div class="hitem">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Emma Laurent<span class="hdoctype">Bon</span></span><span class="hprix-wrap"><span class="hprix">39,00 €</span><span class="hfav" aria-hidden="true"><span data-icon="star"></span></span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>1 sept. 2026 · 16:00</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Nation → Issy-les-Moulineaux</span></span></div>
    </div>
    </div>
  </div>
</div>

<!-- Sheet : Aperçu du bon + partage (pilule à 4 segments, Pancarte en tête) -->
<div class="vt-overlay" data-overlay="sheet-bon">
  <div class="vt-sheet">
    <span class="sheet-star" aria-hidden="true"><span data-icon="star"></span></span>
    <span class="sheet-x" aria-hidden="true"><span data-icon="x"></span></span>
    <div class="shandle"></div>
    <div class="sheet-preview">
      <div class="bon-wrap">
        <div class="bon-head"><div class="bon-brand-ar"><span class="bar-logo" aria-hidden="true">AR</span><div class="bar-id"><div class="bar-name">AR Transfert</div><div class="bar-driver">Ali Rachid</div></div></div><div class="bon-sub">BON DE TRANSPORT VTC</div></div>
        <div class="bon-gold"></div>
        <div class="bon-body">
          <div class="bsec"><div class="bsec-lbl">Trajet</div><div class="tblock"><span class="tdot s"></span><span class="ttxt"><small>Départ</small><span data-ref="apercu-dep">Gare de Lyon, Paris</span></span></div><div class="tline"></div><div class="tblock"><span class="tdot e"></span><span class="ttxt"><small>Arrivée</small><span data-ref="apercu-arr">Aéroport Roissy-CDG</span></span></div><div class="brow" style="margin-top:6px"><span class="k">Prise en charge</span><span class="v">3 sept. 2026 14:30</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Client</div><div class="brow"><span class="k">Nom</span><span class="v" data-ref="apercu-cli">Jean Dupont</span></div><div class="brow"><span class="k">Passagers</span><span class="v">1</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Chauffeur</div><div class="brow"><span class="k">Chauffeur</span><span class="v">Ali Rachid</span></div><div class="brow"><span class="k">Carte pro</span><span class="v">VTC-074512</span></div><div class="brow"><span class="k">Sous-traitant</span><span class="v">Diana Moreau</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Véhicule</div><div class="brow"><span class="k"></span><span class="v">Tesla Model 3 · FS-915-DB</span></div></div>
        </div>
      </div>
      <div class="bon-price"><span class="pl">TOTAL TTC</span><span class="pa" data-ref="apercu-prix">75,00 €</span></div>
      <div class="bon-legal">Document conforme à l'arrêté du 6 août 2025 et à l'art. L.3122-2 du Code des transports.</div>
    </div>
    <div class="sheet-actions">
      <div class="spill" data-ref="spill-bon">
        <span class="spill-seg pancarte" data-ref="seg-pancarte" aria-label="Pancarte d'accueil"><span class="si" data-icon="presentation"></span></span>
        <span class="spill-div"></span>
        <span class="spill-seg sms" aria-label="SMS"><span class="si" data-icon="sms"></span></span>
        <span class="spill-div"></span>
        <span class="spill-seg ticket" aria-label="Envoyer en image"><span class="si" data-icon="image"></span></span>
        <span class="spill-div"></span>
        <span class="spill-seg wa" data-ref="seg-wa" aria-label="WhatsApp"><span class="si" data-icon="whatsapp"></span></span>
      </div>
      <div class="sheet-btns">
        <span class="cta sec save"><span class="ic-btn" data-icon="save"></span>Sauvegarder</span>
      </div>
    </div>
  </div>
</div>

<!-- Panneau de dictée (« Le Rétroviseur », porté de #dictee-retro) -->
<div class="vt-dictee" data-ref="vt-dictee" aria-hidden="true">
  <div class="vt-dictee-glass" aria-hidden="true"></div>
  <div class="vt-dictee-body">
    <div class="vt-rail" data-ref="vt-rail"><span class="vt-rail-sweep"></span></div>
    <div class="vt-dictee-q" data-ref="vt-dictee-q"></div>
    <div class="vt-dictee-a" data-ref="vt-dictee-a"></div>
  </div>
</div>

<!-- Vitre modale : une seule question à poser dans ce téléphone, la saisie
     du signe de la pancarte. Même geste que la confirmation de facture de
     l'autre maquette : LA MÊME vitre, un contenu différent. -->
<div class="vitre-voile" data-ref="voile"></div>
<div class="vitre" data-ref="vitre" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="vitre-glass" aria-hidden="true"></div>
  <div class="vitre-body">
    <div class="vitre-head">
      <span class="vitre-head-ic" aria-hidden="true"><span data-icon="presentation"></span></span>
      <h2 data-ref="vitre-titre">Votre pancarte</h2>
    </div>
    <div class="vitre-scroll">
      <p data-ref="vitre-corps">Ajoutez le signe convenu avec votre client : il reconnaîtra votre pancarte, et personne ne pourra la copier.</p>
      <div class="iw" data-ref="vitre-saisie">
        <input type="text" data-ref="vitre-champ" readonly tabindex="-1" autocomplete="off" autocapitalize="characters" value="JEAN DUPONT ★">
      </div>
    </div>
    <div class="vitre-pied">
      <button class="cta" data-ref="vitre-primaire"><span class="ic-btn" data-icon="presentation"></span>Afficher la pancarte</button>
    </div>
  </div>
</div>

<!-- La pancarte : le nom en plein écran, dans le châssis basculé en paysage -->
<div class="pancarte-overlay" data-overlay="pancarte">
  <div class="pancarte-stage">
    <div class="pancarte-bande">
      <div class="pancarte-ruban" data-ref="pancarte-ruban"></div>
    </div>
  </div>
  <span class="ibtn gold pancarte-close" aria-hidden="true"><span data-icon="x"></span></span>
  <span class="ibtn gold pancarte-flip" aria-hidden="true"><span data-icon="restore"></span></span>
</div>

<!-- Nav basse : pilule percée, bouton central, FACE ACTION (écran Bon) -->
<nav class="bnav" aria-hidden="true">
  <div class="bnav-glass"></div>
  <div class="bnav-clip"><div class="bnav-ring"></div><span class="bnav-pill off" data-ref="nav-pill"></span></div>
  <div class="bnav-layer nav-layer out" data-face="nav" data-ref="face-nav">
    <span class="ni" data-nav-item="rech"><span class="ico" data-icon="search"></span><span class="lbl">Recherche</span></span>
    <span class="ni" data-nav-item="fact"><span class="ico" data-icon="receipt"></span><span class="lbl">Factures</span></span>
    <span class="bnav-hole"></span>
    <span class="ni on" data-nav-item="bons"><span class="ico" data-icon="file"></span><span class="lbl">Bons</span></span>
    <span class="ni" data-nav-item="prof"><span class="ico" data-icon="user"></span><span class="lbl">Profil</span></span>
  </div>
  <div class="bnav-layer act-layer" data-face="act" data-ref="face-act">
    <span class="ni" data-nav-item="raz"><span class="ico" data-icon="restore"></span><span class="lbl">Effacer</span></span>
    <span class="ni" data-nav-item="dictee" data-ref="ni-dictee"><span class="ico" data-icon="mic"></span><span class="lbl">Dicter</span></span>
    <span class="bnav-hole"></span>
    <span class="ni" data-nav-item="options"><span class="ico" data-icon="sliders"></span><span class="lbl">Options</span></span>
    <span class="ni" data-nav-item="menu"><span class="ico" data-icon="grid"></span><span class="lbl">Menu</span></span>
  </div>
  <span class="bnav-fab fab-pale" data-ref="fab">
    <span class="fico" data-fico="zap"><span class="ico" data-icon="zap"></span></span>
    <span class="fico hide" data-fico="edit"><span class="ico" data-icon="edit"></span></span>
    <span class="fico hide" data-fico="check"><svg class="ic ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
    <span class="fab-pulse"></span>
  </span>
</nav>

<div class="cursor" data-ref="cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><g transform="rotate(-12 8 1.8)"><path d="M8 1.8a2 2 0 0 1 2 2v7.9c.9-.5 2-.75 3.15-.6l2.9.4c2.2.3 3.85 2.2 3.85 4.45v1.55c0 3.05-2.47 5.5-5.5 5.5h-2.2c-1.6 0-3.14-.64-4.27-1.77l-4.2-4.2a1.8 1.8 0 0 1 2.27-2.53L6 14.5V3.8a2 2 0 0 1 2-2Z"/></g></svg></div>
<div class="vt-toast" data-ref="toast"></div>
`;
