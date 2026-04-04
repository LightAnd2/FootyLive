import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface RateLimitStats {
  minute_calls: number;
  minute_limit: number;
  hour_calls: number;
  hour_limit: number;
  day_calls: number;
  day_limit: number;
  minute_remaining: number;
  hour_remaining: number;
  day_remaining: number;
}

const RateLimitStatus: React.FC = () => {
  const [stats, setStats] = useState<RateLimitStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/rate-limit/usage');
        setStats(response.data.current_usage);
      } catch {
        setStats(null);
      }
    };

    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (!stats) {
    return null;
  }

  return (
    <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/30 border border-white/10">
      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">API</span>
      <span className="text-xs text-slate-300 tabular-nums">
        {stats.minute_remaining}/{stats.minute_limit} min
      </span>
      <span className="text-xs text-slate-500 tabular-nums">
        {stats.day_remaining}/{stats.day_limit} day
      </span>
    </div>
  );
};

export default RateLimitStatus;
