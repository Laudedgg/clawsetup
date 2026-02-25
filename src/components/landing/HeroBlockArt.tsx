'use client';

const ART = ` ██████╗██╗      █████╗ ██╗    ██╗███████╗███████╗████████╗██╗   ██╗██████╗
██╔════╝██║     ██╔══██╗██║    ██║██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
██║     ██║     ███████║██║ █╗ ██║███████╗█████╗     ██║   ██║   ██║██████╔╝
██║     ██║     ██╔══██║██║███╗██║╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
╚██████╗███████╗██║  ██║╚███╔███╔╝███████║███████╗   ██║   ╚██████╔╝██║
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝`;

export default function HeroBlockArt() {
  return (
    <div className="overflow-hidden hero-art-container flex justify-center">
      <pre
        className="hero-block-art hero-sweep select-none leading-[1.05] font-mono font-bold tracking-[-0.05em] text-[1.9vw] sm:text-[1.7vw] md:text-[1.5vw] whitespace-pre text-center"
        aria-label="ClawSetup"
      >
        {ART}
      </pre>
    </div>
  );
}
