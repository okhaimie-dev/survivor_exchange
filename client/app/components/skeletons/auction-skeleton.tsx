export default function AuctionSkeleton() {
    return (
        <>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col items-center gap-4 text-center text-white">
                                <div className="h-44 w-fit bg-[rgb(50,255,52)]/20 rounded-3xl"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="h-5 w-32 bg-[rgb(50,255,52)]/20 rounded mx-auto"></div>
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mx-auto"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-white">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                                        <div className="h-3 w-12 bg-[rgb(186,255,188)]/20 rounded"></div>
                                        <div className="h-5 w-16 bg-white/20 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col items-center gap-4 text-center text-white">
                                <div className="h-44 w-fit bg-[rgb(50,255,52)]/20 rounded-3xl"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="h-5 w-32 bg-[rgb(50,255,52)]/20 rounded mx-auto"></div>
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mx-auto"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-white">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                                        <div className="h-3 w-12 bg-[rgb(186,255,188)]/20 rounded"></div>
                                        <div className="h-5 w-16 bg-white/20 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col items-center gap-4 text-center text-white">
                                <div className="h-44 w-fit bg-[rgb(50,255,52)]/20 rounded-3xl"></div>
                                <div className="flex flex-col gap-2">
                                    <div className="h-5 w-32 bg-[rgb(50,255,52)]/20 rounded mx-auto"></div>
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mx-auto"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-white">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
                                        <div className="h-3 w-12 bg-[rgb(186,255,188)]/20 rounded"></div>
                                        <div className="h-5 w-16 bg-white/20 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-center">
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 w-10 bg-[rgb(50,255,52)]/20 rounded-full animate-pulse"></div>
                    ))}
                </div>
            </div>
        </>
    );
}
