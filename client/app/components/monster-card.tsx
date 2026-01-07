import Image from "next/image";
import type { FormattedNFT } from "../lib/types";
import { IMAGE_BASE_URL } from "../lib/constants";

type MonsterCardProps = {
  nft: FormattedNFT;
  selected: boolean;
  onToggle: () => void;
};

export default function MonsterCard({
  nft,
  selected,
  onToggle,
}: MonsterCardProps) {
  const getAttribute = (traitType: string) => {
    const attr = nft.attributes.find((a) => a.trait_type === traitType);
    return attr ? String(attr.value) : undefined;
  };

  const beastName = nft.beastName || "Unknown";
  const beastType = nft.beastType || getAttribute("Type") || "Unknown";
  const tier = nft.tier || getAttribute("Tier") || "—";
  const level = nft.level || getAttribute("Level") || "0";
  const power = nft.power || getAttribute("Power") || "0";
  const prefix = getAttribute("Prefix");
  const suffix = getAttribute("Suffix");

  const epithet =
    prefix && suffix ? `${prefix} ${suffix}` : prefix || suffix || "";

  const imageSrc = nft.metadata?.image
    ? nft.metadata.image
    : nft.imagePath
      ? `${IMAGE_BASE_URL}/${nft.imagePath}`
      : "/logo.png";

  const tokenIdDisplay = `#${parseInt(nft.tokenId, 16).toString()}`;

  const stats = [
    { label: "Type", value: beastType },
    { label: "Tier", value: tier },
    { label: "Level", value: level },
    { label: "Power", value: parseFloat(power).toFixed(0) },
  ];

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={`group relative flex h-full w-full flex-col gap-2 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl border bg-black/70 backdrop-blur-sm p-3 md:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 ${
        selected
          ? "border-[rgb(50,255,52)] shadow-[0_0_20px_rgba(50,255,52,0.3)]"
          : "border-[rgb(50,255,52)]/15 hover:border-[rgb(50,255,52)]/40 hover:bg-black/80"
      }`}
    >
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute top-2 right-2 md:top-3 md:right-3 z-20 w-5 h-5 md:w-7 md:h-7 text-[rgb(50,255,52)]"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )}

      <header className="flex items-center justify-between text-[9px] md:text-[10px] uppercase tracking-wider text-[rgb(186,255,188)]/60">
        <span>{tokenIdDisplay}</span>
        {epithet && (
          <span className="truncate max-w-[50%] text-right">
            {epithet}
          </span>
        )}
      </header>

      <div className="flex flex-row md:flex-col items-center gap-3 text-white">
        <div className="flex h-20 w-20 md:h-28 md:w-28 flex-shrink-0 items-center justify-center">
          <Image
            src={imageSrc}
            alt={nft.metadataName}
            width={112}
            height={112}
            draggable={false}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
        <div className="flex flex-col gap-0.5 md:gap-1 text-left md:text-center flex-1 min-w-0">
          <h3 className="text-sm md:text-base font-orbitron uppercase tracking-wide leading-tight">
            {nft.metadataName}
          </h3>
          <p className="text-[10px] md:text-[11px] text-[rgb(186,255,188)]/50">{beastName}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-2 gap-1 md:gap-2 text-white mt-auto">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col md:flex-row items-center md:justify-between rounded-md md:rounded-lg bg-white/5 px-1.5 md:px-3 py-1.5 md:py-2"
          >
            <span className="text-[rgb(186,255,188)]/50 text-[7px] md:text-[10px] uppercase">
              {stat.label}
            </span>
            <span className="text-[11px] md:text-sm font-medium text-white">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
