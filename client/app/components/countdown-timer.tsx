import { useState, useEffect, useMemo } from 'react';

interface CountdownTimerProps {
  endTime: string;
  status?: string;
  className?: string;
  showUrgency?: boolean; // Enable urgency styling
  size?: 'sm' | 'md' | 'lg'; // Timer size variant
}

export default function CountdownTimer({
  endTime,
  status,
  className = "",
  showUrgency = true,
  size = 'md'
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      // Check if auction is Ended (status 3)
      if (status) {
        const statusNum = parseInt(status);
        if (statusNum === 3) {
          setTimeLeft('Ended');
          setSecondsRemaining(0);
          return;
        }
      }

      if (!endTime) {
        setTimeLeft('');
        setSecondsRemaining(null);
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
          setSecondsRemaining(null);
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const difference = endTimeNum - now;

        if (difference <= 0) {
          setTimeLeft('Expired');
          setSecondsRemaining(0);
          return;
        }

        setSecondsRemaining(difference);

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
        setSecondsRemaining(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime, status]);

  // Determine urgency level based on time remaining
  const urgencyLevel = useMemo(() => {
    if (!secondsRemaining || secondsRemaining <= 0) return 'none';
    if (secondsRemaining <= 300) return 'critical'; // < 5 minutes
    if (secondsRemaining <= 3600) return 'high'; // < 1 hour
    if (secondsRemaining <= 14400) return 'medium'; // < 4 hours
    return 'normal';
  }, [secondsRemaining]);

  // Get urgency styles
  const urgencyStyles = useMemo(() => {
    if (!showUrgency) return '';

    switch (urgencyLevel) {
      case 'critical':
        return 'text-red-500 animate-pulse font-bold';
      case 'high':
        return 'text-orange-400 font-semibold';
      case 'medium':
        return 'text-yellow-400';
      default:
        return '';
    }
  }, [urgencyLevel, showUrgency]);

  // Get size styles
  const sizeStyles = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg md:text-xl';
      default:
        return 'text-sm';
    }
  }, [size]);

  if (!timeLeft) return null;

  // Show urgency indicator for critical/high urgency
  const showUrgencyIcon = showUrgency && (urgencyLevel === 'critical' || urgencyLevel === 'high');

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeStyles} ${urgencyStyles} ${className}`}>
      {showUrgencyIcon && (
        <svg
          className={`w-3.5 h-3.5 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )}
      {timeLeft}
      {urgencyLevel === 'critical' && showUrgency && (
        <span className="text-[10px] uppercase tracking-wider opacity-80">hurry!</span>
      )}
    </span>
  );
}

