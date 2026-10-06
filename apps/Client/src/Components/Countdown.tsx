import { useEffect, useState } from "react";

const split = (ms: number) => ({
  Days: Math.floor(ms / 86_400_000),
  Hours: Math.floor(ms / 3_600_000) % 24,
  Mins: Math.floor(ms / 60_000) % 60,
  Secs: Math.floor(ms / 1000) % 60,
});

// Days, hours, minutes and seconds to `endsAt`, in the design's violet tiles.
export default function Countdown({ endsAt, onEnd }: { endsAt: string; onEnd?: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setLeft(ms);
      if (ms === 0) {
        window.clearInterval(timer);
        onEnd?.();
      }
    };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(timer);
  }, [endsAt, onEnd]);

  return (
    <div className="flex justify-center gap-3" role="timer" aria-label="Time left in the sale">
      {Object.entries(split(left)).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-brand-light text-2xl font-bold tabular-nums text-white">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-2 text-sm text-white/90">{unit}</span>
        </div>
      ))}
    </div>
  );
}
