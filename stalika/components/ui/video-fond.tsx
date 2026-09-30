import { cn } from "@/lib/utils";
import { Photo } from "@/components/ui/photo";

/* ---------------------------------------------------------------------------
   Une vidéo en fond de section : le héros, presque toujours.

   Deux ou trois secondes de mouvement sur une vraie photo du client valent
   mieux qu'une image inventée : on voit son lieu, et ça vit. Mais une vidéo
   posée à la va-vite casse tout ce qu'une photo garantissait. D'où ce
   composant, qui ne laisse aucune de ces garanties au hasard :

   - **L'affiche est la photo d'origine**, rendue par `Photo` sous la vidéo.
     Sans JavaScript, avant le chargement, ou si le fichier manque, on voit la
     photo. Jamais un rectangle noir. Pas d'attribut `poster` : il ne sait
     pas changer de cadrage selon l'écran, alors que la photo dessous, si.
   - **`autoPlay muted loop playsInline`**, les quatre ensemble : sans `muted`
     ou sans `playsInline`, le téléphone n'y touche pas. `preload="metadata"`
     pour ne pas tirer deux mégaoctets avant le premier écran.
   - **Mouvement réduit : la vidéo disparaît, la photo reste.** C'est du CSS
     (`motion-reduce:hidden`), pas une condition JavaScript : ça tient même si
     l'hydratation tarde. Pas de `data-mouvement` non plus : la photo doit
     être visible avant que le mouvement ne prenne la main.
   - **Un voile** au-dessus, dans un jeton du thème, pour que le texte se lise
     quel que soit le plan qui passe.

   Ce composant est un Server Component : rien à hydrater, rien qui dépende du
   navigateur. La vidéo se lance toute seule, ou pas. La photo est là.

   Une seule par page. Une deuxième transforme la page en écran de veille.
--------------------------------------------------------------------------- */

export type VideoFondProps = React.ComponentProps<"section"> & {
  /** Le fichier vidéo, transcodé : 720p, sans audio, moins de 3 Mo. */
  src: string;
  /** Version plus légère pour les écrans de moins de 768 px (facultative). */
  srcMobile?: string;
  /** Les mêmes en WebM (VP9), en secours pour les navigateurs sans H.264 (facultatif). */
  srcWebm?: string;
  srcMobileWebm?: string;
  /** La photo d'origine : affiche, repli sans JavaScript, et image en mouvement réduit. */
  affiche: string;
  /** L'affiche des écrans de moins de 768 px, quand la vidéo mobile a son propre cadrage. */
  afficheMobile?: string;
  /** Décrit la scène, pour qui ne la voit pas. */
  alt: string;
  /** Emplacement lu par l'overlay d'édition : c'est par lui qu'on remplace la photo au clic. */
  slot?: string;
  /** Opacité du voile, 0 à 100. 50 laisse lire un titre blanc sur presque tout. */
  voile?: number;
};

export function VideoFond({
  src,
  srcMobile,
  srcWebm,
  srcMobileWebm,
  affiche,
  afficheMobile,
  alt,
  slot = "hero",
  voile = 50,
  className,
  children,
  ...props
}: VideoFondProps) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)} {...props}>
      {/* La photo d'abord : c'est elle qu'on voit tant que la vidéo n'est pas là.
          `Photo` remplit sa boîte toute seule ; on lui donne la boîte. */}
      <Photo
        slot={slot}
        src={affiche}
        alt={alt}
        priority
        className={cn("absolute inset-0 -z-20", afficheMobile && "hidden md:block")}
      />
      {afficheMobile && (
        <Photo slot={`${slot}-mobile`} src={afficheMobile} alt={alt} priority className="absolute inset-0 -z-20 md:hidden" />
      )}
      <video
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        {/* Le navigateur prend la première source qu'il sait lire et dont la
            condition est vraie : la légère sur téléphone, sinon la complète.
            Le WebM (VP9) d'abord : Chrome, Edge, Firefox et Safari récent le
            lisent, pour moitié moins de poids ; le MP4 (H.264) en secours
            pour les appareils plus anciens. */}
        {srcMobileWebm && <source src={srcMobileWebm} type="video/webm" media="(max-width: 767px)" />}
        {srcMobile && <source src={srcMobile} type="video/mp4" media="(max-width: 767px)" />}
        {srcWebm && <source src={srcWebm} type="video/webm" />}
        <source src={src} type="video/mp4" />
      </video>
      <div aria-hidden className="absolute inset-0 -z-10 bg-primary" style={{ opacity: voile / 100 }} />
      {children}
    </section>
  );
}
