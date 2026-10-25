import { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { AttendanceRecord } from '../../types';
import { sendLocationPingApi } from '../../lib/api';

// App minimize ho, screen band ho ya app background me ho: tab bhi location chalti rehti hai
// (Android me upar notification dikhta hai, wahi "foreground service" hai jo tracking zinda rakhta hai)
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export interface LivePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const SEND_EVERY_MS = 30000; // server ko har 30 second me location bhejo
const NO_FIX_AFTER_MS = 90000; // itni der koi location na aaye to "location band/GPS nahi" maano

// Phone ki live location dekhta hai aur server ko bhejta hai.
// Server khud decide karta hai: radius ke andar = PRESENT, bahar = ABSENT.
export function useGeofenceTracking(employeeId: string | null, onRecord: (record: AttendanceRecord) => void) {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const lastSentAt = useRef(0);
  const lastFixAt = useRef(0);
  const onRecordRef = useRef(onRecord);
  onRecordRef.current = onRecord;

  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    let webWatchId: string | null = null;
    let bgWatcherId: string | null = null;
    lastSentAt.current = 0;
    lastFixAt.current = Date.now();

    // Ek location aayi: screen par dikhao aur (har 30 sec me) server ko bhejo
    const handleFix = (p: LivePosition) => {
      if (cancelled) return;
      lastFixAt.current = Date.now();
      setStatus('granted');
      setPosition(p);

      const now = Date.now();
      if (now - lastSentAt.current >= SEND_EVERY_MS) {
        lastSentAt.current = now;
        sendLocationPingApi(employeeId, p)
          .then((res) => {
            if (res.record) onRecordRef.current(res.record);
          })
          .catch((e) => console.error('Location ping fail:', e));
      }
    };

    const handleError = (code: string, message: string) => {
      if (cancelled) return;
      const msg = `${code} ${message}`.toLowerCase();
      setStatus(msg.includes('not_authorized') || msg.includes('denied') || msg.includes('permission') ? 'denied' : 'unavailable');
    };

    async function start() {
      setStatus('requesting');
      try {
        if (Capacitor.isNativePlatform()) {
          // Android/iOS: background tracking
          const id = await BackgroundGeolocation.addWatcher(
            {
              backgroundTitle: 'Attendance ke liye location chalu hai',
              backgroundMessage: 'Office ki attendance automatic lagane ke liye. Ise band mat karo.',
              requestPermissions: true,
              stale: false,
              distanceFilter: 0,
            },
            (loc, err) => {
              if (err || !loc) {
                handleError(String((err && err.code) || ''), String((err && err.message) || ''));
                return;
              }
              handleFix({ latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy });
            }
          );
          if (cancelled) BackgroundGeolocation.removeWatcher({ id });
          else bgWatcherId = id;
        } else {
          // Browser: sirf jab tab khula ho
          const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
            (pos, err) => {
              if (err || !pos) {
                handleError('', String((err && (err as { message?: string }).message) || ''));
                return;
              }
              handleFix({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
            }
          );
          if (cancelled) Geolocation.clearWatch({ id });
          else webWatchId = id;
        }
      } catch {
        if (!cancelled) setStatus('unavailable');
      }
    }

    start();

    // Location band kar di (ya GPS nahi mil raha): kuch der koi fix na aaye to batao
    const watchdog = setInterval(() => {
      if (cancelled) return;
      if (Date.now() - lastFixAt.current > NO_FIX_AFTER_MS) {
        setStatus((s) => (s === 'granted' || s === 'requesting' ? 'unavailable' : s));
      }
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(watchdog);
      if (bgWatcherId !== null) BackgroundGeolocation.removeWatcher({ id: bgWatcherId });
      if (webWatchId !== null) Geolocation.clearWatch({ id: webWatchId });
    };
  }, [employeeId]);

  return { position, status };
}

// "Location settings kholo" button ke liye
export function openLocationSettings() {
  if (Capacitor.isNativePlatform()) BackgroundGeolocation.openSettings().catch(() => {});
}
