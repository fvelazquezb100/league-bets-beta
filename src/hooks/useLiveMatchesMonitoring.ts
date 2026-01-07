import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type LeaderInfo = {
  key: string;
  userId: string;
  onlineAt: string;
  isCurrentUser: boolean;
};

export type MonitoringStats = {
  leader: LeaderInfo | null;
  totalClients: number;
  callsByFixture: Map<number, number>;
  lastCallTime: string | null;
};

// Shared state across all instances to track calls
const globalCallStats = {
  callsByFixture: new Map<number, number>(),
  lastCallTime: null as string | null,
  listeners: new Set<(stats: MonitoringStats) => void>(),
};

export function useLiveMatchesMonitoring() {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  const [localCalls, setLocalCalls] = useState<Map<number, number>>(new Map());
  const [lastCallTime, setLastCallTime] = useState<string | null>(null);

  const presenceKey = useMemo(() => {
    const rnd =
      (globalThis as any)?.crypto?.randomUUID?.() ??
      `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    return `${user?.id ?? 'anon'}:${rnd}`;
  }, [user?.id]);

  // Subscribe to presence channel to see all connected clients
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('presence-live-matches-monitoring', {
      config: {
        presence: { key: presenceKey },
      },
    });

    const handlePresenceSync = () => {
      const state = channel.presenceState() as Record<string, any>;
      setPresenceState(state);
    };

    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, handlePresenceSync)
      .on('presence', { event: 'leave' }, handlePresenceSync);

    channel.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      await channel.track({
        user_id: user.id,
        username: user.email?.split('@')[0] || 'unknown',
        online_at: new Date().toISOString(),
        is_monitoring: true,
      });
      handlePresenceSync();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, presenceKey]);

  // Subscribe to global call stats updates
  useEffect(() => {
    const updateListener = (stats: MonitoringStats) => {
      setLocalCalls(new Map(stats.callsByFixture));
      setLastCallTime(stats.lastCallTime);
    };

    globalCallStats.listeners.add(updateListener);

    // Initialize with current global state
    updateListener({
      leader: null,
      totalClients: 0,
      callsByFixture: new Map(globalCallStats.callsByFixture),
      lastCallTime: globalCallStats.lastCallTime,
    });

    return () => {
      globalCallStats.listeners.delete(updateListener);
    };
  }, []);

  // Compute leader from presence state
  const leader: LeaderInfo | null = useMemo(() => {
    const keys = Object.keys(presenceState);
    if (keys.length === 0) return null;

    const candidates = keys.map((k) => {
      const meta = presenceState[k]?.[0] ?? presenceState[k]?.metas?.[0] ?? null;
      const onlineAt = meta?.online_at ?? meta?.phx_ref ?? '';
      const userId = k.split(':')[0] || 'unknown';
      return {
        key: k,
        userId,
        onlineAt: String(onlineAt),
        isCurrentUser: k === presenceKey,
      };
    });

    candidates.sort((a, b) => {
      if (a.onlineAt < b.onlineAt) return -1;
      if (a.onlineAt > b.onlineAt) return 1;
      return a.key.localeCompare(b.key);
    });

    return candidates[0] || null;
  }, [presenceState, presenceKey]);

  const stats: MonitoringStats = useMemo(
    () => ({
      leader,
      totalClients: Object.keys(presenceState).length,
      callsByFixture: localCalls,
      lastCallTime,
    }),
    [leader, presenceState, localCalls, lastCallTime],
  );

  return stats;
}

// Function to record a call (called from LiveBets when leader makes a call)
export function recordLiveMatchesCall(fixtureIds: number[]) {
  fixtureIds.forEach((fixtureId) => {
    const current = globalCallStats.callsByFixture.get(fixtureId) || 0;
    globalCallStats.callsByFixture.set(fixtureId, current + 1);
  });
  globalCallStats.lastCallTime = new Date().toISOString();

  // Notify all listeners
  const stats: MonitoringStats = {
    leader: null,
    totalClients: 0,
    callsByFixture: new Map(globalCallStats.callsByFixture),
    lastCallTime: globalCallStats.lastCallTime,
  };

  globalCallStats.listeners.forEach((listener) => {
    listener(stats);
  });
}

// Function to reset call stats
export function resetCallStats() {
  globalCallStats.callsByFixture.clear();
  globalCallStats.lastCallTime = null;

  const stats: MonitoringStats = {
    leader: null,
    totalClients: 0,
    callsByFixture: new Map(),
    lastCallTime: null,
  };

  globalCallStats.listeners.forEach((listener) => {
    listener(stats);
  });
}

