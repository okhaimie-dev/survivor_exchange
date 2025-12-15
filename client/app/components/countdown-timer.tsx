import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: string;
  status?: string;
  className?: string;
}

export default function CountdownTimer({ endTime, status, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      // Check if auction is Ended (status 3)
      if (status) {
        const statusNum = parseInt(status);
        if (statusNum === 3) {
          setTimeLeft('Ended');
          return;
        }
      }

      if (!endTime) {
        setTimeLeft('');
        return;
      }

      try {
        let endTimeNum: number;
        
        if (endTime.startsWith('0x') || endTime.startsWith('0X')) {
          endTimeNum = parseInt(endTime, 16);
        } else {
          endTimeNum = parseInt(endTime, 10);
        }

        if (isNaN(endTimeNum) || endTimeNum === 0) {
          setTimeLeft('');
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const difference = endTimeNum - now;

        if (difference <= 0) {
          setTimeLeft('Expired');
          return;
        }

        const days = Math.floor(difference / 86400);
        const hours = Math.floor((difference % 86400) / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = difference % 60;

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } catch {
        setTimeLeft('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime, status]);

  if (!timeLeft) return null;

  return (
    <span className={className}>
      {timeLeft}
    </span>
  );
}

