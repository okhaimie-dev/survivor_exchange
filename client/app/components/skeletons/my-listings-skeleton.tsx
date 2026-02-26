export default function MyListingsSkeleton() {
    return (
        <>
            {[1, 2, 3, 4].map((i) => (
                <article
                    key={i}
                    className="flex w-full flex-col gap-4 rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)] sm:flex-row sm:items-center sm:justify-between animate-pulse"
                >
                    <div className="flex w-full flex-1 items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/20"></div>
                        <div className="flex flex-col gap-2">
                            <div className="h-4 w-16 bg-[rgb(186,255,188)]/20 rounded"></div>
                            <div className="h-5 w-32 bg-white/20 rounded"></div>
                            <div className="h-3 w-24 bg-[rgb(186,255,188)]/20 rounded"></div>
                        </div>
                    </div>

                    <div className="grid w-full max-w-[450px] grid-cols-2 gap-4 text-sm text-white md:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                            <div className="h-3 w-12 bg-[rgb(186,255,188)]/20 rounded mx-auto mb-2"></div>
                            <div className="h-6 w-8 bg-white/20 rounded mx-auto"></div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                            <div className="h-3 w-20 bg-[rgb(186,255,188)]/20 rounded mx-auto mb-2"></div>
                            <div className="h-6 w-12 bg-white/20 rounded mx-auto"></div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                            <div className="h-3 w-14 bg-[rgb(186,255,188)]/20 rounded mx-auto mb-2"></div>
                            <div className="h-6 w-10 bg-white/20 rounded mx-auto"></div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                        <div className="h-8 w-24 bg-[rgb(50,255,52)]/20 rounded-full"></div>
                        <div className="flex flex-row gap-2">
                            <div className="h-10 w-28 bg-red-500/20 rounded-full"></div>
                            <div className="h-10 w-28 bg-orange-500/20 rounded-full"></div>
                        </div>
                    </div>
                </article>
            ))}
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

