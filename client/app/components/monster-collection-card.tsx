import Image from "next/image";
import { FormattedNFT } from "../lib/graphql";

type MonsterCollectionCardProps = {
    collection: {
        id: string;
        name: string;
        totalMonsters: number;
        startingPrice: number;
        highestBid?: number;
        image: string;
    };
    isSelected: boolean;
    onSelect: () => void;
    nfts?: FormattedNFT[];
};

export default function MonsterCollectionCard({ collection, isSelected, onSelect, nfts = [] }: MonsterCollectionCardProps) {
    const highestBidDisplay =
        collection.highestBid !== undefined ? `${collection.highestBid.toFixed(2)} ETH` : "No bids yet";

    const stats = [
        {
            label: "Starting",
            value: collection.startingPrice.toFixed(2),
            suffix: "ETH",
        },
        {
            label: "Current Bid",
            value: collection.highestBid !== undefined ? collection.highestBid.toFixed(2) : "—",
            suffix: collection.highestBid !== undefined ? "ETH" : undefined,
        },
    ];

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={`group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isSelected ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]" : ""
            }`}
        >
            <header className="flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75">
                {/* <span>{collection.id}</span> */}
                <span className="text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60">
                    {collection.totalMonsters} nft{collection.totalMonsters === 1 ? '' : 's'} in this collection
                </span>
            </header>

            <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-24 w-24">
                    {nfts.length === 0 ? (
                        <div className="flex h-full w-full items-center justify-center rounded-3xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12">
                            <Image
                                src={collection.image}
                                alt={collection.name}
                                width={96}
                                height={96}
                                draggable={false}
                                className="h-16 w-16 object-contain"
                            />
                        </div>
                    ) : nfts.length === 1 ? (
                        <div className="h-full w-full overflow-hidden rounded-3xl">
                            {(() => {
                                const nft = nfts[0];
                                const imageSrc = nft.metadata?.image 
                                    ? nft.metadata.image 
                                    : nft.imagePath 
                                    ? `https://api.cartridge.gg/x/bm/torii/${nft.imagePath}`
                                    : collection.image;
                                const isBase64 = imageSrc.startsWith("data:");
                                
                                return isBase64 ? (
                                    <img
                                        src={imageSrc}
                                        alt={nft.metadataName || collection.name}
                                        draggable={false}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <Image
                                        src={imageSrc}
                                        alt={nft.metadataName || collection.name}
                                        width={96}
                                        height={96}
                                        draggable={false}
                                        className="h-full w-full object-contain"
                                        unoptimized
                                    />
                                );
                            })()}
                        </div>
                    ) : nfts.length === 2 ? (
                        <div className="flex h-full w-full gap-1">
                            {nfts.slice(0, 2).map((nft, idx) => {
                                const imageSrc = nft.metadata?.image 
                                    ? nft.metadata.image 
                                    : nft.imagePath 
                                    ? `https://api.cartridge.gg/x/bm/torii/${nft.imagePath}`
                                    : collection.image;
                                const isBase64 = imageSrc.startsWith("data:");
                                
                                return (
                                    <div key={`${nft.contractAddress}-${nft.tokenId}-${idx}`} className="h-full w-1/2 overflow-hidden rounded-3xl">
                                        {isBase64 ? (
                                            <img
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Image
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                width={48}
                                                height={96}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid h-full w-full grid-cols-2 gap-1">
                            {/* Top row: first 2 NFTs */}
                            {nfts.slice(0, 2).map((nft, idx) => {
                                const imageSrc = nft.metadata?.image 
                                    ? nft.metadata.image 
                                    : nft.imagePath 
                                    ? `https://api.cartridge.gg/x/bm/torii/${nft.imagePath}`
                                    : collection.image;
                                const isBase64 = imageSrc.startsWith("data:");
                                
                                return (
                                    <div 
                                        key={`${nft.contractAddress}-${nft.tokenId}-${idx}`} 
                                        className="overflow-hidden rounded-3xl"
                                    >
                                        {isBase64 ? (
                                            <img
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Image
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                width={48}
                                                height={48}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            {/* Bottom left: 3rd NFT */}
                            {nfts.length >= 3 && (
                                <div className="overflow-hidden rounded-3xl">
                                    {(() => {
                                        const nft = nfts[2];
                                        const imageSrc = nft.metadata?.image 
                                            ? nft.metadata.image 
                                            : nft.imagePath 
                                            ? `https://api.cartridge.gg/x/bm/torii/${nft.imagePath}`
                                            : collection.image;
                                        const isBase64 = imageSrc.startsWith("data:");
                                        
                                        return isBase64 ? (
                                            <img
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <Image
                                                src={imageSrc}
                                                alt={nft.metadataName || collection.name}
                                                width={48}
                                                height={48}
                                                draggable={false}
                                                className="h-full w-full object-contain"
                                                unoptimized
                                            />
                                        );
                                    })()}
                                </div>
                            )}
                            {/* Bottom right: "+X more" if 4+ NFTs, otherwise empty */}
                            {nfts.length > 3 ? (
                                <div className="flex items-center justify-center rounded-3xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12 text-[10px] font-orbitron uppercase tracking-widest text-[rgb(50,255,52)]">
                                    +{nfts.length - 3} more
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 text-white">
                    <h3 className="text-xl font-orbitron uppercase tracking-[0.12em]">{collection.name}</h3>
                    <p className="text-xs text-[rgb(186,255,188)]/70">{highestBidDisplay} top bid</p>
                </div>
            </div>

            <div className="flex flex-col gap-3 text-white">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-left"
                    >
                        <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase tracking-[0.18em]">
                            {stat.label}
                        </p>
                        <p className="text-2xl font-orbitron tracking-tight text-white">{stat.value}</p>
                        {stat.suffix ? (
                            <span className="text-xs font-orbitron uppercase tracking-[0.18em] text-[rgb(186,255,188)]/80">
                                {stat.suffix}
                            </span>
                        ) : null}
                    </div>
                ))}
            </div>
        </article>
    );
}