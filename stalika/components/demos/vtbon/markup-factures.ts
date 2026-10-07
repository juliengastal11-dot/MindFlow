/* ---------------------------------------------------------------------------
   Markup porté de `C:\VTBON\vtbon site\index.html` (lignes 383-610, écran
   Factures de `#phone-fact`), adapté à l'interface RÉELLE de l'app et au
   scénario du blueprint (6 scènes, §SCÉNARIOS). Copié du dépôt vtbon-site
   (`components/maquettes/`, état du 2026-10-07) pour le téléphone de la section 02 de
   Stalika. Comme `markup-bons.ts`, une constante écrite à la main : aucune donnée
   du visiteur ne l'atteint.

   Écarts assumés avec le site source (l'app a raison, voir le rapport) :
   - Le tunnel de règlement du site source sélectionnait « Facture payée »
     par défaut : la règle métier (CLAUDE.md §3) est l'inverse depuis le
     2026-08-21, « une facture NAÎT en cours », corrigé ici, « En attente de
     paiement » est le choix par défaut.
   - La confirmation « Générer cette facture… » venait d'une feuille à elle
     (`.vt-sheet--confirm`) : l'app réelle l'a unifiée dans LA vitre
     (`confirmSheet`), portée ici, pas la feuille disparue.
   - Le bandeau de recettes du site source n'avait que deux tuiles (En
     attente / Encaissé) : la règle actuelle (CLAUDE.md §3) en compte TROIS
    , En attente · En retard · Encaissé, dans cet ordre, ajoutée ici.
   - Pas d'écran « Bons à facturer » ni de springboard : le scénario démarre
     directement depuis la fiche d'un bon déjà ouverte.
   - Aucun `id` : deux téléphones cohabitent dans la page, tout est scopé par
     `data-*`.
--------------------------------------------------------------------------- */

export const MARKUP_FACTURES = `
<div class="statusbar" aria-hidden="true">
  <span class="statusbar__time">14:31</span>
  <span class="statusbar__icons">
    <svg viewBox="0 0 24 12" width="17" height="9"><rect x="0" y="6" width="3" height="6" rx="1"/><rect x="5" y="4" width="3" height="8" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg viewBox="0 0 26 13" width="22" height="11"><rect x="0.5" y="0.5" width="21" height="12" rx="3" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="2" width="16" height="9" rx="1.5"/><rect x="23" y="4" width="2" height="5" rx="1"/></svg>
  </span>
</div>

<!-- Écran : Factures (En cours | Clôturées + bandeau de recettes) -->
<div class="vt-screen is-active" data-screen="factlist">
  <div class="topbar">
    <div class="logo">Factures</div>
    <div class="tbr">
      <span class="ibtn gold" aria-hidden="true"><span data-icon="calendar"></span></span>
      <span class="ibtn gold" aria-hidden="true"><span data-icon="upload"></span></span>
    </div>
  </div>
  <div style="padding:0 14px 8px">
    <div class="fact-tabs">
      <span class="ftab-pill" aria-hidden="true"></span>
      <span class="ftab on">En cours</span>
      <span class="ftab">Clôturées</span>
    </div>
  </div>
  <div class="hist-ca">
    <div class="fact-tabs ca-chips"><span class="ftab-pill q4" aria-hidden="true"></span><span class="ftab on">Ce mois</span><span class="ftab">Mois dernier</span><span class="ftab">Trimestre</span><span class="ftab">Année</span></div>
    <div class="ca-figs">
      <div class="cafig"><span class="cafig-v" data-ref="fig-attente">102,00 €</span><span class="cafig-l">En attente</span></div>
      <div class="cafig late"><span class="cafig-v" data-ref="fig-retard">0,00 €</span><span class="cafig-l">En retard</span></div>
      <div class="cafig paid"><span class="cafig-v">165,00 €</span><span class="cafig-l">Encaissé</span></div>
    </div>
  </div>
  <div class="hlist">
    <div class="hitem" data-status="attente" data-ref="carte-suivie">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Sophie Bernard<span class="hdoctype">Facture</span></span><span class="hprix-wrap"><span class="hprix">54,00 €</span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 08:20</span><span class="hbadge attente" data-ref="badge-suivie">En cours</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Bastille → Roissy CDG</span></span><span class="hdelai" data-ref="delai-suivie">23 j</span></div>
    </div>
    <div class="hitem" data-status="attente">
      <div class="hr1"><span class="hcli"><span data-icon="user"></span>Marie Lefèvre<span class="hdoctype">Facture</span></span><span class="hprix-wrap"><span class="hprix">48,00 €</span></span></div>
      <div class="hr2"><span class="hdt"><span data-icon="clock"></span>3 sept. 2026 · 11:05</span><span class="hbadge attente">En cours</span></div>
      <div class="hr3"><span class="htraj"><span data-icon="pin"></span><span>Gare de Lyon → Neuilly-sur-Seine</span></span><span class="hdelai">12 j</span></div>
    </div>
  </div>
</div>

<!-- Écran : PDF de la facture générée -->
<div class="vt-screen facpdf" data-screen="facpdf">
  <div class="pdf-scroll">
    <div class="pdf-doc">
      <div class="pdf-head"><div class="pdf-head__l">AR TRANSFERT</div><div class="pdf-head__r"><div class="pdf-title">FACTURE</div><div class="pdf-num">FACT-2026-0041</div><div class="pdf-sub">Émise le 03/09/2026</div></div></div>
      <div class="pdf-sect"><div class="pdf-sect__t">ÉMETTEUR</div><div class="pdf-row"><span>Chauffeur</span><b>Ali Rachid</b></div><div class="pdf-row"><span>SIRET</span><b>902 145 330 00018</b></div></div>
      <div class="pdf-sect"><div class="pdf-sect__t">DESTINATAIRE</div><div class="pdf-row"><span>Nom</span><b>Sophie Bernard</b></div><div class="pdf-row"><span>Adresse</span><b>12 rue de la Bastille, 75011 Paris</b></div></div>
      <div class="pdf-sect"><div class="pdf-sect__t">PRESTATION</div><div class="pdf-row"><span>Départ</span><b>Bastille</b></div><div class="pdf-row"><span>Arrivée</span><b>Roissy CDG</b></div></div>
      <div class="pdf-sect"><div class="pdf-sect__t">RÈGLEMENT</div><div class="pdf-row"><span>Statut</span><b>En attente de paiement</b></div></div>
      <div class="pdf-total"><span class="pdf-total__l">TOTAL TTC</span><span class="pdf-total__a">54,00 €</span></div>
      <div class="pdf-legal">TVA non applicable, art. 293 B du CGI</div>
      <div class="pdf-legal">Document conforme à l'art. L441-1 du Code de commerce · Entreprise Individuelle (EI).</div>
    </div>
  </div>
</div>

<!-- Sheet : Aperçu du bon + Générer la facture -->
<div class="vt-overlay" data-overlay="sheet-fact">
  <div class="vt-sheet">
    <span class="sheet-star" aria-hidden="true"><span data-icon="star"></span></span>
    <span class="sheet-x" aria-hidden="true"><span data-icon="x"></span></span>
    <div class="shandle"></div>
    <div class="sheet-preview">
      <div class="bon-wrap">
        <div class="bon-head"><div class="bon-brand-ar"><span class="bar-logo" aria-hidden="true">AR</span><div class="bar-id"><div class="bar-name">AR Transfert</div><div class="bar-driver">Ali Rachid</div></div></div><div class="bon-sub">BON DE TRANSPORT VTC</div></div>
        <div class="bon-gold"></div>
        <div class="bon-body">
          <div class="bsec"><div class="bsec-lbl">Trajet</div><div class="tblock"><span class="tdot s"></span><span class="ttxt"><small>Départ</small>Bastille</span></div><div class="tline"></div><div class="tblock"><span class="tdot e"></span><span class="ttxt"><small>Arrivée</small>Roissy CDG</span></div><div class="brow" style="margin-top:6px"><span class="k">Prise en charge</span><span class="v">3 sept. 2026 08:20</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Client</div><div class="brow"><span class="k">Nom</span><span class="v">Sophie Bernard</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Chauffeur</div><div class="brow"><span class="k">Chauffeur</span><span class="v">Ali Rachid</span></div></div>
        </div>
      </div>
      <div class="bon-price"><span class="pl">TOTAL TTC</span><span class="pa">54,00 €</span></div>
      <div class="bon-legal">Document conforme à l'arrêté du 6 août 2025 et à l'art. L.3122-2 du Code des transports.</div>
    </div>
    <div class="sheet-actions">
      <div class="spill">
        <span class="spill-seg sms" aria-label="SMS"><span class="si" data-icon="sms"></span></span>
        <span class="spill-div"></span>
        <span class="spill-seg ticket" aria-label="Envoyer en image"><span class="si" data-icon="image"></span></span>
        <span class="spill-div"></span>
        <span class="spill-seg wa" aria-label="WhatsApp"><span class="si" data-icon="whatsapp"></span></span>
      </div>
      <div class="sheet-btns">
        <span class="cta sec" data-ref="btn-gen-facture"><span class="ic-btn" data-icon="file"></span>Générer la facture</span>
        <span class="cta sec save"><span class="ic-btn" data-icon="save"></span>Sauvegarder</span>
      </div>
    </div>
  </div>
</div>

<!-- Modale : Client facturé + Règlement, « En attente de paiement » SÉLECTIONNÉ
     PAR DÉFAUT (une facture naît en attente, jamais « déjà payée »). -->
<div class="vt-overlay" data-overlay="paymodal">
  <div class="vt-sheet vt-sheet--modal">
    <div class="shandle"></div>
    <div class="paymodal">
      <div class="ctitle">Client facturé</div>
      <div class="paycol"><span class="paybox on"><span class="rdo on"></span>Votre client est un particulier</span><span class="paybox"><span class="rdo"></span>Votre client est une entreprise</span></div>
      <div class="f"><label>Adresse complète du client <span class="req">*</span></label><div class="iw"><input type="text" readonly tabindex="-1" value="12 rue de la Bastille, 75011 Paris"></div></div>
      <div class="ctitle" style="margin-top:12px">Règlement de la facture</div>
      <div class="paygrid"><span class="paybox on"><span class="rdo on"></span>En attente de paiement</span><span class="paybox"><span class="rdo"></span>Facture payée</span></div>
      <span class="cta" style="margin-top:12px" data-ref="btn-confirm-ouvre"><span class="ic-btn" data-icon="file"></span>Valider &amp; Télécharger la facture</span>
      <span class="cta sec">Annuler</span>
    </div>
  </div>
</div>

<!-- Sheet : la facture SUIVIE, dépliant qui porte « Relancer le paiement »
     une fois la facture en retard, puis l'historique de suivi. -->
<div class="vt-overlay" data-overlay="sheet-suivie">
  <div class="vt-sheet">
    <span class="sheet-x" aria-hidden="true"><span data-icon="x"></span></span>
    <div class="shandle"></div>
    <div class="sheet-preview">
      <div class="relance-flag" data-ref="relance-flag" style="display:none"><span class="ic" data-icon="clock"></span>Mode relance : le PDF devient une lettre</div>
      <div class="bon-wrap">
        <div class="bon-head"><div class="bon-brand-ar"><span class="bar-logo" aria-hidden="true">AR</span><div class="bar-id"><div class="bar-name">AR Transfert</div><div class="bar-driver">Ali Rachid</div></div></div><div class="bon-sub" data-ref="suivie-soustitre">FACTURE</div></div>
        <div class="bon-gold"></div>
        <div class="bon-body">
          <div class="bsec"><div class="bsec-lbl">Trajet</div><div class="tblock"><span class="tdot s"></span><span class="ttxt"><small>Départ</small>Bastille</span></div><div class="tline"></div><div class="tblock"><span class="tdot e"></span><span class="ttxt"><small>Arrivée</small>Roissy CDG</span></div></div>
          <div class="bsec"><div class="bsec-lbl">Client</div><div class="brow"><span class="k">Nom</span><span class="v">Sophie Bernard</span></div></div>
        </div>
      </div>
      <div class="bon-price"><span class="pl" data-ref="suivie-total-lbl">TOTAL TTC</span><span class="pa">54,00 €</span></div>
      <div class="bon-legal" data-ref="suivie-legal">Document conforme à l'art. L441-1 du Code de commerce.</div>
    </div>
    <div class="sheet-actions">
      <div style="margin:9px 14px 0">
        <button class="cta retard" data-ref="btn-relance" style="width:100%;margin-bottom:9px;display:none"><span class="ic-btn" data-icon="clock"></span><span data-ref="btn-relance-lbl">Relancer le paiement</span></button>
        <div class="relance-hist" data-ref="relance-hist" style="display:none"></div>
      </div>
    </div>
  </div>
</div>

<!-- Vitre modale : « Générer cette facture… », même vitre que celle de la
     démo Bons (pancarte), un contenu différent. -->
<div class="vitre-voile" data-ref="voile"></div>
<div class="vitre" data-ref="vitre" role="dialog" aria-modal="true" aria-hidden="true">
  <div class="vitre-glass" aria-hidden="true"></div>
  <div class="vitre-body">
    <div class="vitre-head">
      <span class="vitre-head-ic" aria-hidden="true"><span data-icon="receipt"></span></span>
      <h2>Générer la facture</h2>
    </div>
    <div class="vitre-scroll">
      <p>Générer cette facture la rend définitive : elle ne pourra plus être supprimée (seul un avoir permettra de l'annuler). Confirmer la génération&nbsp;?</p>
    </div>
    <div class="vitre-pied">
      <button class="cta" data-ref="vitre-primaire">Générer la facture</button>
      <button class="cs-renonce">Annuler</button>
    </div>
  </div>
</div>

<!-- Nav basse : pilule percée, bouton central, FACE NAVIGATION -->
<nav class="bnav" aria-hidden="true">
  <div class="bnav-glass"></div>
  <div class="bnav-clip"><div class="bnav-ring"></div><span class="bnav-pill" data-ref="nav-pill" style="transform:translateX(100%)"></span></div>
  <div class="bnav-layer nav-layer" data-face="nav">
    <span class="ni" data-nav-item="rech"><span class="ico" data-icon="search"></span><span class="lbl">Recherche</span></span>
    <span class="ni on" data-nav-item="fact"><span class="ico" data-icon="receipt"></span><span class="lbl">Factures</span></span>
    <span class="bnav-hole"></span>
    <span class="ni" data-nav-item="bons"><span class="ico" data-icon="file"></span><span class="lbl">Bons</span></span>
    <span class="ni" data-nav-item="prof"><span class="ico" data-icon="user"></span><span class="lbl">Profil</span></span>
  </div>
  <span class="bnav-fab" data-ref="fab">
    <span class="fico" data-fico="zap"><span class="ico" data-icon="zap"></span></span>
    <span class="fico hide" data-fico="edit"><span class="ico" data-icon="edit"></span></span>
    <span class="fico hide" data-fico="check"><svg class="ic ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
    <span class="fab-pulse"></span>
  </span>
</nav>

<div class="cursor" data-ref="cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><g transform="rotate(-12 8 1.8)"><path d="M8 1.8a2 2 0 0 1 2 2v7.9c.9-.5 2-.75 3.15-.6l2.9.4c2.2.3 3.85 2.2 3.85 4.45v1.55c0 3.05-2.47 5.5-5.5 5.5h-2.2c-1.6 0-3.14-.64-4.27-1.77l-4.2-4.2a1.8 1.8 0 0 1 2.27-2.53L6 14.5V3.8a2 2 0 0 1 2-2Z"/></g></svg></div>
<div class="vt-toast" data-ref="toast"></div>
`;
