import Image from "next/image";
import Link from "next/link";

export default function Hero() {
    return (
        <div className="min-w-screen min-h-[calc(100vh-300px)] flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
                <Image src="/logo.png" alt="logo" width={500} height={500} draggable={false} className="w-[500px] h-[500px]" />
                <h1 className="text-4xl font-bold">Loot Auction</h1>
                <p className="text-lg">Bid, Auction and Rent monsters from the 
                    <span className="font-bold text-[rgb(50,255,52)]">{" "}
                        <Link href="https://lootsurvivor.io/" target="_blank" className="hover:cursor-pointer hover:underline hover:text-[rgb(50,255,52)]">Loot Survivor</Link>
                    </span>{" "} game
                </p>
            </div>
        </div>
    )
}