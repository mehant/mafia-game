'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  endTime: number; // timestamp
  label?: string;
}

export default function Timer({ endTime, label }: TimerProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining <= 10;

  return (
    <div className={`text-center font-mono text-lg ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
      {label && <span className="text-sm text-gray-500 block">{label}</span>}
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}
