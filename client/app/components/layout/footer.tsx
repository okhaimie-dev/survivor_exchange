import Image from "next/image";

export default function Footer() {
    return (
        <div className="w-full min-h-14 bg-black flex flex-row items-center justify-center p-3.5 mt-[50px]">
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 p-3.5">
                <div className="flex flex-row items-center justify-center space-x-2">
                    <Image src="/logo.png" alt="logo" width={50} height={50} draggable={false} className="w-10 h-10 md:w-12 md:h-12" />
                    <p className="text-sm md:text-base">Survivor Exchange</p>
                </div>
                <div>
                    <p className="text-xs md:text-sm text-center">Copyright 2026 Survivor Exchange</p>
                </div>
            </div>
        </div>
    )
}