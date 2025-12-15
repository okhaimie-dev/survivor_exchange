import Image from "next/image";
import Link from "next/link";

export default function Hero() {
    return (
        <div className="min-w-screen min-h-fit flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-8 w-full h-full">
                <div className="w-fit h-full flex items-center justify-center border-2 border-[rgb(50,255,52)]/20 rounded-2xl p-2">
                    <Image src="/logo.png" alt="logo" width={500} height={500} draggable={false} className="w-[250px] h-[250px]" />
                </div>
                <h1 className="text-4xl font-bold">Loot Auction</h1>
                <p className="text-lg">Bid and Auction monsters from the 
                    <span className="font-bold text-[rgb(50,255,52)]">{" "}
                        <Link href="https://lootsurvivor.io/" target="_blank" className="hover:cursor-pointer hover:underline hover:text-[rgb(50,255,52)]">Loot Survivor</Link>
                    </span>{" "} game
                </p>
            </div>
        </div>
    )
}