import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { AttendanceRecord } from '../../types';
import { sendLocationPingApi } from '../../lib/api';

export interface LivePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const SEND_EVERY_MS = 30000; // server ko har 30 second me location bhejo

// Phone ki live location dekhta hai aur server ko bhejta hai.
// Server khud decide karta hai: radius ke andar = PRESENT, bahar = ABSENT.
export function useGeofenceTracking(employeeId: string | null, onRecord: (record: AttendanceRecord) => void) {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const lastSentAt = useRef(0);
  const onRecordRef = useRef(onRecord);
  onRecordRef.current = onRecord;

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    let watchId: string | null = null;
    lastSentAt.current = 0;

    async function start() {
      setStatus('requesting');
      try {
        if (Capacitor.isNativePlatform()) {
          const perm = await Geolocation.requestPermissions();
          if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
            if (!cancelled) setStatus('denied');
            return;
          }
        }
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
          (pos, err) => {
            if (cancelled) return;
            if (err || !pos) {
              const msg = String((err && (err as { message?: string }).message) || '').toLowerCase();
              setStatus(msg.includes('denied') || msg.includes('permission') ? 'denied' : 'unavailable');
              return;
            }
            setStatus('granted');
            const p: LivePosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            };
            setPosition(p);

            const now = Date.now();
            if (now - lastSentAt.current >= SEND_EVERY_MS) {
              lastSentAt.current = now;
              sendLocationPingApi(employeeId as string, p)
                .then((res) => {
                  if (res.record) onRecordRef.current(res.record);
                })
                .catch((e) => console.error('Location ping fail:', e));
            }
          }
        );
        if (cancelled) {
          Geolocation.clearWatch({ id });
        } else {
          watchId = id;
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }

    start();
    return () => {
      cancelled = true;
      if (watchId !== null) Geolocation.clearWatch({ id: watchId });
    };
  }, [employeeId]);

  return { position, status };
}
