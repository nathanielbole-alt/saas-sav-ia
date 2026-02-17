export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full">
            {/* List Skeleton */}
            <div className="w-[380px] shrink-0 border-r border-white/[0.06] p-5 space-y-5">
                <div className="flex justify-between items-center">
                    <div className="h-7 w-20 rounded-lg bg-white/[0.04] animate-pulse" />
                    <div className="h-6 w-6 rounded-md bg-white/[0.04] animate-pulse" />
                </div>
                <div className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
                <div className="h-9 rounded-lg bg-white/[0.04] animate-pulse" />
                <div className="space-y-2 pt-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border border-white/[0.04] p-3.5 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-white/[0.04] animate-pulse" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3.5 w-24 rounded bg-white/[0.04] animate-pulse" />
                                    <div className="h-3 w-40 rounded bg-white/[0.04] animate-pulse" />
                                </div>
                            </div>
                            <div className="h-3 w-48 rounded bg-white/[0.04] animate-pulse" />
                            <div className="flex gap-1.5">
                                <div className="h-4 w-14 rounded-md bg-white/[0.04] animate-pulse" />
                                <div className="h-4 w-10 rounded-md bg-white/[0.04] animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Skeleton */}
            <div className="flex-1 flex flex-col">
                <div className="px-6 py-5 border-b border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-48 rounded bg-white/[0.04] animate-pulse" />
                        <div className="h-5 w-16 rounded-md bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-md bg-white/[0.04] animate-pulse" />
                        <div className="h-3.5 w-32 rounded bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
                <div className="flex-1 p-6 space-y-6">
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/[0.04] animate-pulse" />
                        <div className="h-20 w-64 rounded-xl bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                        <div className="h-8 w-8 rounded-lg bg-white/[0.04] animate-pulse" />
                        <div className="h-28 w-72 rounded-xl bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/[0.04] animate-pulse" />
                        <div className="h-16 w-56 rounded-xl bg-white/[0.04] animate-pulse" />
                    </div>
                </div>
                <div className="p-5">
                    <div className="h-[72px] rounded-xl bg-white/[0.04] animate-pulse" />
                </div>
            </div>
        </div>
    )
}
