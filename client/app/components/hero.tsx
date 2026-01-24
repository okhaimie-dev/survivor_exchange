import Image from "next/image";
import Link from "next/link";

interface HeroProps {
    activeAuctions?: number;
    totalVolume?: number;
    totalBids?: number;
}

export default function Hero({ activeAuctions = 0, totalVolume = 0, totalBids = 0 }: HeroProps) {
    return (
        <div className="w-full min-h-fit flex flex-col items-center justify-center px-4 py-6 md:py-8">
            <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full h-full">
                <div className="w-fit h-full flex items-center justify-center border-2 border-[rgb(50,255,52)]/20 rounded-2xl p-2">
                    <Image src="/logo.png" alt="logo" width={500} height={500} draggable={false} className="w-32 h-32 sm:w-40 sm:h-40 md:w-[250px] md:h-[250px]" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">Survivor Exchange</h1>
                <p className="text-base sm:text-lg md:text-xl text-center px-4 font-medium">Find your next champion.</p>
                <p className="text-sm sm:text-base md:text-lg text-center px-4">Buy, sell, and auction{" "}
                    <span className="font-bold text-[rgb(50,255,52)]">
                        <Link href="https://lootsurvivor.io/" target="_blank" className="hover:cursor-pointer hover:underline hover:text-[rgb(50,255,52)]">Loot Survivor</Link>
                    </span>{" "}beasts.
                </p>

                {/* Platform Stats - Social Proof */}
                {(activeAuctions > 0 || totalVolume > 0) && (
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mt-2 px-4">
                        {activeAuctions > 0 && (
                            <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5">
                                <span className="text-xl md:text-2xl font-bold text-[rgb(50,255,52)] font-orbitron">{activeAuctions}</span>
                                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[rgb(186,255,188)]/70 font-orbitron">Active Auctions</span>
                            </div>
                        )}
                        {totalVolume > 0 && (
                            <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5">
                                <span className="text-xl md:text-2xl font-bold text-[rgb(50,255,52)] font-orbitron">${totalVolume.toLocaleString()}</span>
                                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[rgb(186,255,188)]/70 font-orbitron">Total Volume</span>
                            </div>
                        )}
                        {totalBids > 0 && (
                            <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5">
                                <span className="text-xl md:text-2xl font-bold text-[rgb(50,255,52)] font-orbitron">{totalBids}</span>
                                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[rgb(186,255,188)]/70 font-orbitron">Total Bids</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Trust Badge */}
                <div className="flex items-center gap-2 mt-1 text-xs text-[rgb(186,255,188)]/60">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secured by Starknet Smart Contracts</span>
                </div>
            </div>
        </div>
    )
}