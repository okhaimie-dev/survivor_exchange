import Image from "next/image";
import Link from "next/link";

export default function Hero() {
    return (
        <div className="min-w-screen min-h-fit flex flex-col items-center justify-center px-4 py-6 md:py-8">
            <div className="flex flex-col items-center justify-center gap-4 md:gap-8 w-full h-full">
                <div className="w-fit h-full flex items-center justify-center border-2 border-[rgb(50,255,52)]/20 rounded-2xl p-2">
                    <Image src="/logo.png" alt="logo" width={500} height={500} draggable={false} className="w-32 h-32 sm:w-40 sm:h-40 md:w-[250px] md:h-[250px]" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Loot Auction</h1>
                <p className="text-sm sm:text-base md:text-lg text-center px-4">Bid and Auction monsters from the
                    <span className="font-bold text-[rgb(50,255,52)]">{" "}
                        <Link href="https://lootsurvivor.io/" target="_blank" className="hover:cursor-pointer hover:underline hover:text-[rgb(50,255,52)]">Loot Survivor</Link>
                    </span>{" "} game
                </p>
            </div>
        </div>
    )
}