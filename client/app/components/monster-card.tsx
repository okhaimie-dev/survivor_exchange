import Image from "next/image";

export type Monster = {
    id: string;
    name: string;
    epithet: string;
    affinity: string;
    role: string;
    level: number;
    power: number;
    image: string;
};

type MonsterCardProps = {
    monster: Monster;
    selected: boolean;
    onToggle: () => void;
};

export default function MonsterCard({ monster, selected, onToggle }: MonsterCardProps) {
    const stats = [
        { label: "Affinity", value: monster.affinity },
        { label: "Role", value: monster.role },
        { label: "Level", value: `Lv. ${monster.level}` },
        { label: "Power", value: `${monster.power.toFixed(1)}k` },
    ];

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToggle();
                }
            }}
            className={`group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 transition duration-200 hover:-translate-y-1 hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_18px_45px_rgba(10,30,10,0.45)] hover:cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(50,255,52)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                selected ? "border-[rgb(50,255,52)]/80 shadow-[0_22px_55px_rgba(20,255,80,0.35)]" : ""
            }`}
        >
            <header className="flex flex-col gap-1 text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/75">
                <span>{monster.id}</span>
                <span className="text-[10px] tracking-[0.2em] text-[rgb(186,255,188)]/60">{monster.epithet}</span>
            </header>

            <div className="flex flex-col items-center gap-4 text-center text-white">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/12">
                    <Image
                        src={monster.image}
                        alt={monster.name}
                        width={96}
                        height={96}
                        draggable={false}
                        className="h-16 w-16 object-contain"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-orbitron uppercase tracking-[0.12em]">{monster.name}</h3>
                    <p className="text-xs text-[rgb(186,255,188)]/70">{monster.affinity} lineage</p>
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
                        <p className="text-lg font-orbitron tracking-tight text-white">{stat.value}</p>
                    </div>
                ))}
            </div>
        </article>
    );
}
