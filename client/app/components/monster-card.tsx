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
    { label: "Level", value: `Lv. ${level}` },
    { label: "Power", value: `${parseFloat(power).toFixed(1)}` },
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
      className={`group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        selected
          ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]"
          : ""
      }`}
    >
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute top-4 right-5 z-20 text-[rgb(50,255,52)] transition-all duration-200 group-hover:scale-110"
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )}
      <header className="flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75">
        <span>{tokenIdDisplay}</span>
        {epithet && (
          <span className="text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60">
            {epithet}
          </span>
        )}
      </header>

      <div className="flex flex-col items-center gap-4 text-center text-white">
        <div className="flex h-44 w-fit items-center justify-center rounded-3xl">
          <Image
            src={imageSrc}
            alt={nft.metadataName}
            width={96}
            height={96}
            draggable={false}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-orbitron uppercase tracking-[0.12em]">
            {nft.metadataName}
          </h3>
          <p className="text-xs text-[rgb(186,255,188)]/70">{beastName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-white">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-left"
          >
            <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]">
              {stat.label}
            </p>
            <p className="text-lg font-orbitron tracking-tight text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
