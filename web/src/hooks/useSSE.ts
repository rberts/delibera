import { useEffect, useMemo, useRef, useState } from 'react';

export type SSEConnectionStatus = 'idle' | 'connecting' | 'open' | 'error';

export interface SSEEventPayload<T = unknown> {
  event: string;
  data: T;
}

interface UseSSEOptions {
  endpoint: string;
  enabled?: boolean;
  reconnectDelayMs?: number;
  withCredentials?: boolean;
  onEvent?: (payload: SSEEventPayload) => void;
}

interface UseSSEReturn {
  status: SSEConnectionStatus;
  lastEventAt: number | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useSSE({
  endpoint,
  enabled = true,
  reconnectDelayMs = 3000,
  withCredentials = true,
  onEvent,
}: UseSSEOptions): UseSSEReturn {
  const [status, setStatus] = useState<SSEConnectionStatus>('idle');
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onEventRef = useRef<typeof onEvent>(onEvent);

  const url = useMemo(() => `${API_BASE_URL}${endpoint}`, [endpoint]);

  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const cleanupSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimeoutRef.current !== null) return;
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, reconnectDelayMs);
    };

    const handleMessage = (eventName: string, rawData: string) => {
      let parsedData: unknown = rawData;
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        // Keep raw data when payload is not valid JSON.
      }

      setLastEventAt(Date.now());
      onEventRef.current?.({ event: eventName, data: parsedData });
    };

    const connect = () => {
      if (cancelled) return;

      cleanupSource();
      clearReconnect();
      setStatus('connecting');

      const source = new EventSource(url, { withCredentials });
      eventSourceRef.current = source;

      source.onopen = () => {
        if (cancelled) return;
        setStatus('open');
      };

      source.onerror = () => {
        if (cancelled) return;
        setStatus('error');
        cleanupSource();
        scheduleReconnect();
      };

      source.addEventListener('vote_update', (event) => {
        handleMessage('vote_update', (event as MessageEvent).data);
      });
      source.addEventListener('checkin_update', (event) => {
        handleMessage('checkin_update', (event as MessageEvent).data);
      });
      source.addEventListener('agenda_update', (event) => {
        handleMessage('agenda_update', (event as MessageEvent).data);
      });
      source.addEventListener('heartbeat', (event) => {
        handleMessage('heartbeat', (event as MessageEvent).data);
      });
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      cleanupSource();
    };
  }, [enabled, reconnectDelayMs, url, withCredentials]);

  return {
    status,
    lastEventAt,
  };
}
