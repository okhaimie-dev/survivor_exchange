export default function BidsSkeleton() {
    return (
        <>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col gap-1">
                                <div className="h-3 w-32 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="h-24 w-24 bg-[rgb(50,255,52)]/20 rounded-2xl"></div>
                                <div className="h-5 w-24 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col gap-3 text-white">
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-20 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-20 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-16 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-2 rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-4 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded"></div>
                                    <div className="h-[60px] w-full bg-[rgb(50,255,52)]/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col gap-1">
                                <div className="h-3 w-32 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="h-24 w-24 bg-[rgb(50,255,52)]/20 rounded-2xl"></div>
                                <div className="h-5 w-24 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col gap-3 text-white">
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-20 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-20 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-16 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-2 rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-4 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded"></div>
                                    <div className="h-[60px] w-full bg-[rgb(50,255,52)]/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex w-full gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                        <div className="group relative flex h-full w-full flex-col gap-6 overflow-hidden rounded-3xl border border-[rgb(50,255,52)]/20 bg-black/60 p-7 animate-pulse">
                            <div className="flex flex-col gap-1">
                                <div className="h-3 w-32 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="h-24 w-24 bg-[rgb(50,255,52)]/20 rounded-2xl"></div>
                                <div className="h-5 w-24 bg-[rgb(50,255,52)]/20 rounded"></div>
                            </div>
                            <div className="flex flex-col gap-3 text-white">
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-20 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/5 px-5 py-3">
                                    <div className="h-3 w-20 bg-[rgb(186,255,188)]/20 rounded mb-2"></div>
                                    <div className="h-6 w-16 bg-white/20 rounded"></div>
                                </div>
                                <div className="flex flex-col gap-2 rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-4 py-3">
                                    <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded"></div>
                                    <div className="h-[60px] w-full bg-[rgb(50,255,52)]/10 rounded"></div>
                                </div>
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

