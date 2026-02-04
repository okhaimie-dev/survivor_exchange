import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full flex justify-start px-4 py-2">
      <div className="flex flex-col items-start gap-0.5">
        <h1 className="text-sm sm:text-base font-bold font-orbitron">Survivor Exchange</h1>
        <p className="text-[10px] sm:text-xs text-left text-[rgb(186,255,188)]/80">
          Buy, sell, and auction{" "}
          <Link href="https://lootsurvivor.io/" target="_blank" className="font-medium text-[rgb(50,255,52)] hover:underline">Loot Survivor</Link>
          {" "}assets.
        </p>
      </div>
    </div>
  );
}
