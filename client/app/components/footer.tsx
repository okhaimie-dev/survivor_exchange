import Image from "next/image";

export default function Footer() {
    return (
        <div className="w-full h-14 bg-black flex flex-row items-center justify-center p-3.5 mt-[50px]">
            <div className="w-full flex flex-row items-center justify-between p-3.5">
                <div className="flex flex-row items-center justify-center space-x-2">
                    <Image src="/logo.png" alt="logo" width={50} height={50} draggable={false} />
                    <p>Loot Auction</p>
                </div>
                <div>
                    <p>Copyright 2025 Loot Auction</p>
                </div>
            </div>
        </div>
    )
}