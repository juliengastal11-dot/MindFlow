"use client";
import type React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "./use-mobile";

/* ---------------------------------------------------------------------------
   « Phone Mockups 1 » de Solace UI (choisi par J sur 21st, 2026-10-02), copié
   depuis le registre public de son auteur (solaceui.com/r/phone-mockups-1),
   le prompt 21st ne contenant pas ce fichier.

   Ce qui a changé, et pourquoi :
   - les couleurs écrites en dur passent par des jetons de même valeur
     (`--color-iphone-*`, app/globals.css), qu'impose le garde-fou du site ;
     sur fond sombre, le cadre prend les valeurs du mode sombre du composant
     (les classes `dark:` ne s'appliquaient jamais ici : le site n'a pas de
     classe `.dark`) ;
   - un iPhone peut montrer un contenu vivant (`children`, et `content` dans
     un élément) : posé PAR-DESSUS l'écran du dessin, pas dans un
     `foreignObject`, où Safari place mal tout ce qui est animé ; l'île est
     redessinée au-dessus ;
   - le carrousel peut être piloté de l'extérieur (`index`, `onIndexChange`,
     `onPauseChange`, `suspendu`) et tourner à un autre rythme (`interval`) ;
     un changement de téléphone relance le compte à rebours ;
   - un glissé du doigt ou de la souris change de téléphone, et un appui sur
     le téléphone met en pause ou relance (J, 2026-10-07 : « enlève ces
     boutons, un appui sur la vidéo fera pause et un swipe changera
     l'app ») ; une icône Lecture au centre dit que c'est en pause. Les trois
     boutons (précédent, pause, suivant) ne se voient plus : ils restent pour
     le clavier et les lecteurs d'écran, transparents, et apparaissent
     quand on y arrive au clavier (critère WCAG 2.2.2 : pouvoir arrêter ce qui
     bouge), comme la commande de la roue des sites ;
   - sur le fond sombre du site, les téléphones se fondent dans la page en bas
     et sur les côtés (un masque), comme sur le fond blanc d'origine ;
   - `height="auto"` n'est plus écrit sur le `<svg>`, qui le refusait ;
   - les libellés d'accessibilité sont en français.
--------------------------------------------------------------------------- */

interface Iphone15ProProps extends React.SVGProps<SVGSVGElement> {
    width?: string | number;
    height?: string | number;
    src?: string;
    alt?: string;
    /** Adaptation Stalika : un contenu vivant posé sur l'écran. */
    children?: React.ReactNode;
}

/* L'écran du dessin, dans le repère du viewBox (433 × 882). */
const ECRAN = { x: 21.25, y: 19.25, l: 389.5, h: 843.5, r: 55.75 };
const pourcent = (v: number, total: number) => `${(v / total) * 100}%`;

const Iphone15Pro: React.FC<Iphone15ProProps> = ({
    width = "100%",
    height = "auto",
    src,
    alt = "iPhone screen content",
    className,
    children,
    ...props
}) => {
    return (
        <div className={cn("relative", className)}>
            <svg
                width={width}
                height={height === "auto" ? undefined : height}
                viewBox="0 0 433 882"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="block transition-all duration-500 ease-in-out"
                {...props}
            >
                {/* Outer frame */}
                <path
                    d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
                    className="fill-iphone-cadre"
                />
                {/* side nubs */}
                <path
                    d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"
                    className="fill-iphone-cadre"
                />
                <path
                    d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"
                    className="fill-iphone-cadre"
                />
                <path
                    d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"
                    className="fill-iphone-cadre"
                />
                <path
                    d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"
                    className="fill-iphone-cadre"
                />
                {/* inner body */}
                <path
                    d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
                    className="fill-iphone-corps"
                />
                <path
                    opacity="0.5"
                    d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"
                    className="fill-iphone-cadre"
                />
                {/* screen area */}
                <path
                    d="M21.25 75C21.25 44.2101 46.2101 19.25 77 19.25H355C385.79 19.25 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 21.25 837.79 21.25 807V75Z"
                    className="fill-iphone-ecran stroke-iphone-ecran stroke-[0.5]"
                    filter="drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))"
                />
                {src && (
                    <foreignObject
                        x="21.25"
                        y="19.25"
                        width="389.5"
                        height="843.5"
                        clipPath="url(#roundedCorners)"
                    >
                        <div
                            style={{ width: "100%", height: "100%", position: "relative" }}
                        >
                            <Image
                                src={src || "/placeholder.svg"}
                                alt={alt}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                                priority
                              unoptimized
                            />
                        </div>
                    </foreignObject>
                )}
                {/* notch area */}
                <path
                    d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
                    className="fill-iphone-corps"
                />
                <path
                    d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
                    className="fill-iphone-corps"
                />
                <path
                    d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"
                    className="fill-iphone-corps"
                />
                {/* highlight */}
                <path
                    d="M76 4C37.3401 4 6 35.3401 6 74V808C6 846.66 37.3401 878 76 878H356C394.66 878 426 846.66 426 808V74C426 35.3401 394.66 4 356 4H76Z"
                    className="fill-transparent stroke-iphone-reflet stroke-[0.5]"
                />
                <defs>
                    <clipPath id="roundedCorners">
                        <rect
                            x="21.25"
                            y="19.25"
                            width="389.5"
                            height="843.5"
                            rx="55.75"
                            ry="55.75"
                        />
                    </clipPath>
                </defs>
            </svg>
            {/* Adaptation Stalika : le contenu vivant, sur l'écran, puis l'île par-dessus. */}
            {children && (
                <>
                    <div
                        className="absolute overflow-hidden"
                        style={{
                            left: pourcent(ECRAN.x, 433),
                            top: pourcent(ECRAN.y, 882),
                            width: pourcent(ECRAN.l, 433),
                            height: pourcent(ECRAN.h, 882),
                            clipPath: `inset(0 round ${pourcent(ECRAN.r, ECRAN.l)} / ${pourcent(ECRAN.r, ECRAN.h)})`,
                        }}
                    >
                        {children}
                    </div>
                    <svg
                        viewBox="0 0 433 882"
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 size-full"
                    >
                        <path
                            d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
                            className="fill-iphone-corps"
                        />
                        <path
                            d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
                            className="fill-iphone-corps"
                        />
                    </svg>
                </>
            )}
        </div>
    );
};

export interface ImageItem {
    src: string;
    alt: string;
    /** Adaptation Stalika : un contenu vivant à la place de l'image. */
    content?: React.ReactNode;
}

interface PhoneCarouselProps {
    images: ImageItem[];
    className?: string;
    featureMode?: boolean;
    featuresData?: { images: ImageItem[] }[];
    activeFeatureIndex?: number;
    /** Adaptations Stalika : le téléphone de face, piloté de l'extérieur. */
    index?: number;
    onIndexChange?: (index: number) => void;
    onPauseChange?: (enPause: boolean) => void;
    /** Rotation suspendue de l'extérieur (carrousel hors de l'écran, mouvement réduit). */
    suspendu?: boolean;
    /** Durée d'un téléphone de face, en millisecondes. */
    interval?: number;
}

export const PhoneCarousel: React.FC<PhoneCarouselProps> = ({
    images,
    className,
    featureMode,
    featuresData,
    activeFeatureIndex = 0,
    index,
    onIndexChange,
    onPauseChange,
    suspendu = false,
    interval: duree = 3000,
}) => {
    const [isClient, setIsClient] = useState<boolean>(false);
    const [indexInterne, setIndexInterne] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const carouselRef = useRef<HTMLDivElement>(null);
    const glisse = useRef<{ x: number; y: number; t: number } | null>(null);
    const isMobile = useIsMobile();

    // Adaptation Stalika : l'index peut venir de l'extérieur.
    const currentIndex = index ?? indexInterne;
    const setCurrentIndex = useCallback(
        (suivant: number | ((prevIndex: number) => number)) => {
            const valeur = typeof suivant === "function" ? suivant(currentIndex) : suivant;
            if (index === undefined) setIndexInterne(valeur);
            onIndexChange?.(valeur);
        },
        [currentIndex, index, onIndexChange]
    );

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        onPauseChange?.(isPaused);
    }, [isPaused, onPauseChange]);

    useEffect(() => {
        if (featureMode) return;

        let interval: NodeJS.Timeout;
        if (!isPaused && !isHovering && !suspendu) {
            interval = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
            }, duree);
        }
        return () => clearInterval(interval);
    }, [isPaused, isHovering, suspendu, images.length, featureMode, duree, setCurrentIndex]);

    if (!isClient) {
        return (
            <div className="w-full h-[400px] flex items-center justify-center">
                <div className="animate-pulse w-64 h-96 rounded-3xl"></div>
            </div>
        );
    }

    // FEATURE MODE
    if (featureMode && featuresData) {
        const total = featuresData.length;
        const active = activeFeatureIndex;
        const prev = (active - 1 + total) % total;
        const next = (active + 1) % total;

        // Each feature has a single image
        const prevImage = featuresData[prev].images[0];
        const activeImage = featuresData[active].images[0];
        const nextImage = featuresData[next].images[0];

        return (
            <section
                className={cn(
                    "relative w-full py-6 md:py-10 overflow-visible",
                    className
                )}
                aria-label="iPhone product showcase in feature mode"
            >
                <div className="relative h-[600px] sm:h-[650px] lg:h-[700px] w-full">
                    {/* Center the phone stack */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                        {/* 1) Back phone (prev) */}
                        <div
                            className="absolute opacity-60"
                            style={{
                                transform: "translateY(-20px) scale(0.92)",
                                zIndex: 10,
                            }}
                        >
                            <Iphone15Pro
                                width={isMobile ? 280 : 350}
                                height="auto"
                                src={prevImage.src}
                                alt={prevImage.alt}
                            />
                        </div>

                        {/* 2) Middle phone (next) */}
                        <div
                            className="absolute opacity-80"
                            style={{
                                transform: "translateY(25px) scale(0.96)",
                                zIndex: 20,
                            }}
                        >
                            <Iphone15Pro
                                width={isMobile ? 280 : 350}
                                height="auto"
                                src={nextImage.src}
                                alt={nextImage.alt}
                            />
                        </div>

                        {/* 3) Front phone (active) */}
                        <div
                            className="relative"
                            style={{
                                transform: "translateY(70px) scale(1)",
                                zIndex: 30,
                            }}
                        >
                            <Iphone15Pro
                                width={isMobile ? 280 : 350}
                                height="auto"
                                src={activeImage.src}
                                alt={activeImage.alt}
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // NORMAL MODE
    const handlePrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const togglePause = () => {
        setIsPaused((prev) => !prev);
    };

    // Adaptation Stalika : un glissé franc, plus horizontal que vertical, change de téléphone ;
    // un appui bref, sans glissé, met en pause ou relance.
    const finGlisse = (e: React.PointerEvent) => {
        const g = glisse.current;
        glisse.current = null;
        if (!g) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            if (dx < 0) handleNext();
            else handlePrevious();
        } else if (Math.hypot(dx, dy) < 10 && performance.now() - g.t < 600) {
            togglePause();
        }
    };

    return (
        <section
            className={cn("relative w-full py-6 md:py-10 overflow-hidden", className)}
            aria-label="Les logiciels, sur iPhone"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative">
                    {/* Main carousel container. Adaptation Stalika : sur le fond sombre du
                        site, les téléphones se fondent dans la page, en bas et sur les côtés,
                        comme ils le font sur le fond blanc d'origine. */}
                    <div
                        ref={carouselRef}
                        className="flex justify-center items-start h-[410px] md:h-[510px] lg:h-[520px] cursor-pointer select-none touch-pan-y [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_13%,black_87%,transparent),linear-gradient(to_bottom,black_84%,transparent)] [mask-repeat:no-repeat]"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            glisse.current = { x: e.clientX, y: e.clientY, t: performance.now() };
                        }}
                        onPointerUp={finGlisse}
                        onPointerCancel={() => {
                            glisse.current = null;
                        }}
                    >
                        <div className="relative flex justify-center w-full">
                            {images.map((image, index) => {
                                const isActive = index === currentIndex;
                                const isPrevious =
                                    index === currentIndex - 1 ||
                                    (currentIndex === 0 && index === images.length - 1);
                                const isNext =
                                    index === currentIndex + 1 ||
                                    (currentIndex === images.length - 1 && index === 0);

                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "absolute transition-all duration-700 ease-in-out transform",
                                            isActive ? "z-20 scale-100" : "opacity-0 scale-90",
                                            isPrevious ? "-translate-x-[10%] opacity-30 z-10" : "",
                                            isNext ? "translate-x-[10%] opacity-30 z-10" : "",
                                            !isActive && !isPrevious && !isNext ? "opacity-0" : ""
                                        )}
                                        style={{
                                            top: "0",
                                            transform: `translateY(0px) ${isPrevious
                                                    ? "translateX(-60%)"
                                                    : isNext
                                                        ? "translateX(60%)"
                                                        : "translateX(0)"
                                                } ${isActive ? "scale(1)" : "scale(0.9)"}`,
                                        }}
                                        aria-hidden={!isActive}
                                    >
                                        <div className="group">
                                            <Iphone15Pro
                                                width={isMobile ? 280 : 350}
                                                height="auto"
                                                src={image.src}
                                                alt={image.alt}
                                                className="transition-all duration-100 hover:scale-105 hover:-rotate-6"
                                            >
                                                {image.content}
                                            </Iphone15Pro>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Adaptation Stalika : l'icône Lecture, au centre du téléphone, dit que tout est en pause ;
                        un nouvel appui relance. */}
                    <div
                        aria-hidden="true"
                        className={cn(
                            "pointer-events-none absolute left-1/2 top-[42%] z-30 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-foreground/20 bg-background/60 shadow-md backdrop-blur-sm transition-all duration-200",
                            isPaused ? "scale-100 opacity-100" : "scale-75 opacity-0"
                        )}
                    >
                        <Play className="ml-0.5 size-7 text-foreground" />
                    </div>

                    {/* Controls. Adaptation Stalika : ils ne se voient plus (J, 2026-10-07), mais restent pour le
                        clavier et les lecteurs d'écran : transparents, sans prise à la souris ni au doigt (l'appui
                        passe au téléphone dessous), et visibles dès qu'on y arrive au clavier. */}
                    <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-30 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevious}
                            className="rounded-full bg-background/60 backdrop-blur-sm border-foreground/20 hover:bg-background/80 shadow-md"
                            aria-label="Logiciel précédent"
                        >
                            <ChevronLeft className="h-5 w-5 text-foreground" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={togglePause}
                            className="rounded-full bg-background/60 backdrop-blur-sm border-foreground/20 hover:bg-background/80 shadow-md"
                            aria-label={isPaused ? "Relancer le défilement et les démos" : "Mettre en pause le défilement et les démos"}
                        >
                            {isPaused ? (
                                <Play className="h-5 w-5 text-foreground" />
                            ) : (
                                <Pause className="h-5 w-5 text-foreground" />
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            className="rounded-full bg-background/60 backdrop-blur-sm border-foreground/20 hover:bg-background/80 shadow-md"
                            aria-label="Logiciel suivant"
                        >
                            <ChevronRight className="h-5 w-5 text-foreground" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};
