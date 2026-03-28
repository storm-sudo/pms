'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTimerProps {
  onStop: (taskId: string, durationInHours: number) => void;
}

export function useTimer({ onStop }: UseTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // in seconds
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((taskId: string) => {
    if (isRunning && activeTaskId === taskId) return;
    
    // If another timer was running, stop it first
    if (isRunning) {
      stop();
    }

    setActiveTaskId(taskId);
    setIsRunning(true);
    setElapsed(0);

    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  }, [isRunning, activeTaskId]);

  const stop = useCallback(() => {
    if (!isRunning || !activeTaskId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const durationInHours = parseFloat((elapsed / 3600).toFixed(4));
    onStop(activeTaskId, durationInHours);

    setIsRunning(false);
    setActiveTaskId(null);
    setElapsed(0);
  }, [isRunning, activeTaskId, elapsed, onStop]);

  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isRunning,
    elapsed,
    activeTaskId,
    start,
    stop,
    formatTime,
  };
}
