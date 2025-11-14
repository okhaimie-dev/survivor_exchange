import Image from "next/image";

type Listing = {
    id: string;
    name: string;
    tokenCount: number;
    startingPrice: string;
    highestBid: string;
    status: "active" | "pending" | "sold";
    createdAt: string;
};

const listings: Listing[] = [
    {
        id: "#1127",
        name: "Abyssal Wraith Collective",
        tokenCount: 12,
        startingPrice: "3.25 ETH",
        highestBid: "4.10 ETH",
        status: "active",
        createdAt: "Listed 2h ago",
    },
    {
        id: "#0982",
        name: "Crystal Spire Sentinels",
        tokenCount: 8,
        startingPrice: "1.90 ETH",
        highestBid: "—",
        status: "pending",
        createdAt: "Queued 14h ago",
    },
    {
        id: "#0544",
        name: "Voidborne Choir",
        tokenCount: 16,
        startingPrice: "5.75 ETH",
        highestBid: "6.40 ETH",
        status: "sold",
        createdAt: "Closed yesterday",
    },
];

const statusStyles: Record<Listing["status"], string> = {
    active: "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40",
    pending: "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30",
    sold: "bg-white/10 text-white border border-white/20",
};

export default function MyListings() {
    return (
        <section className="flex w-full flex-col gap-6">
            <header className="flex flex-col gap-2">
                <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">My Listings</h2>
                <p className="text-sm text-[rgb(186,255,188)]/70">
                    Review and manage every collection you have introduced to the Loot Auction habitat.
                </p>
            </header>

            <div className="flex flex-col gap-4">
                {listings.map((listing) => (
                    <article
                        key={listing.id}
                        className="flex w-full flex-col gap-4 rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)] transition hover:cursor-pointer hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_0_40px_rgba(50,255,52,0.18)] sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex w-full flex-1 items-center gap-4">
                            <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                                <Image
                                    src="/logo.png"
                                    alt={listing.name}
                                    width={64}
                                    height={64}
                                    draggable={false}
                                    className="h-full w-full object-cover p-2"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-orbitron uppercase tracking-[0.25em] text-[rgb(186,255,188)]/70">
                                    {listing.id}
                                </span>
                                <h3 className="text-lg font-orbitron uppercase tracking-[0.2em] text-white">
                                    {listing.name}
                                </h3>
                                <p className="text-xs text-[rgb(186,255,188)]/70">{listing.createdAt}</p>
                            </div>
                        </div>

                        <div className="grid w-full flex-1 grid-cols-2 gap-4 text-sm text-white md:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Tokens</p>
                                <p className="font-orbitron text-xl tracking-[0.3em]">{listing.tokenCount}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Starting</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{listing.startingPrice}</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">Top Bid</p>
                                <p className="font-orbitron text-base tracking-[0.3em]">{listing.highestBid}</p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                            <span
                                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-orbitron uppercase tracking-[0.3em] ${statusStyles[listing.status]}`}
                            >
                                {listing.status}
                            </span>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full border border-red-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-red-400 transition hover:cursor-pointer hover:bg-red-500 hover:text-black"
                            >
                                Remove Collection
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}