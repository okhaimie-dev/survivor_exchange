"use client";

import { parseEndTime } from "../../lib/utils/auction-status";

interface TimelineItem {
  status: string;
  label: string;
  active: boolean;
  completed: boolean;
  time?: string | null;
}

interface AuctionTimelineProps {
  status: string;
  endTime: string;
  executedAt?: string;
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

function formatTime(timestamp: string): string | null {
  try {
    const timestampNum = parseEndTime(timestamp);
    if (isNaN(timestampNum) || timestampNum === 0) return null;
    const date = new Date(timestampNum * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatExecutedAt(executedAt: string | undefined): string | null {
  if (!executedAt) return null;
  try {
    const date = new Date(executedAt);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function AuctionTimeline({
  status,
  endTime,
  executedAt,
  countdown,
}: AuctionTimelineProps) {
  const statusNum = parseInt(status);
  const endTimeFormatted = endTime ? formatTime(endTime) : null;
  const executedAtFormatted = formatExecutedAt(executedAt);

  const timelineItems: TimelineItem[] = [];

  timelineItems.push({
    status: "created",
    label: "Auction Created",
    active: true,
    completed: true,
    time: executedAtFormatted,
  });

  if (endTime) {
    timelineItems.push({
      status: "settled",
      label: "Auction Settled",
      active: statusNum >= 3,
      completed: statusNum >= 3,
      time: endTimeFormatted,
    });
  }

  return (
    <div className="w-full mt-1">
      <div className="w-full rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 p-3 md:p-4">
        <p className="text-[10px] font-orbitron uppercase tracking-[0.18em] text-[rgb(186,255,188)]/70 mb-2 md:mb-3">
          Auction Timeline
        </p>
        <div className="flex flex-col gap-3">
          {timelineItems.map((item, index) => {
            const isLast = index === timelineItems.length - 1;
            return (
              <div key={item.status} className="relative flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      item.completed
                        ? "bg-[rgb(50,255,52)] border-[rgb(50,255,52)]"
                        : item.active
                          ? "bg-[rgb(50,255,52)]/30 border-[rgb(50,255,52)] animate-pulse"
                          : "bg-transparent border-[rgb(186,255,188)]/30"
                    }`}
                  />
                  {!isLast && (
                    <div
                      className={`w-0.5 h-full min-h-[30px] mt-1 ${
                        item.completed || item.active
                          ? "bg-[rgb(50,255,52)]/30"
                          : "bg-[rgb(186,255,188)]/10"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-orbitron uppercase tracking-[0.12em] ${
                      item.active
                        ? "text-[rgb(50,255,52)]"
                        : "text-[rgb(186,255,188)]/70"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.time && (
                    <p className="text-[10px] text-[rgb(186,255,188)]/50 mt-1">
                      {item.time}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Countdown inside the same box */}
        <div className="mt-3 pt-3 border-t border-[rgb(50,255,52)]/20">
          <p className="text-[10px] font-orbitron uppercase tracking-[0.16em] text-[rgb(50,255,52)] mb-1">
            COUNTDOWN
          </p>
          {countdown ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-white font-orbitron text-base tracking-wider">
                {countdown.days}
              </span>
              <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                days
              </span>
              <span className="text-white font-orbitron text-base tracking-wider">
                {countdown.hours}
              </span>
              <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                hrs
              </span>
              <span className="text-white font-orbitron text-base tracking-wider">
                {countdown.minutes}
              </span>
              <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                Mins
              </span>
              <span className="text-white font-orbitron text-base tracking-wider">
                {countdown.seconds}
              </span>
              <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                Secs
              </span>
            </div>
          ) : (
            <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase">
              Auction ended
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
