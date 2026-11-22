import { useEffect, useRef, useState } from 'react';
import bgUrl from '../../assets/images/hrms-loading-bg.jpg';

// Admin portal ka loading screen: background image + ghoomta circle + text + blue progress bar.
// Image 16:9 hai; poora screen cover karti hai, aur circle/text/bar image ke hisaab se
// usi jagah (percent me) rakhe gaye hain taaki har screen size par sahi baithe.
interface AdminLoadingScreenProps {
  /** 0 se 100 tak: server se kitna data aa chuka hai */
  progress: number;
  /** Poora data aa gaya ho to true */
  ready: boolean;
  /** Bar 100% hote hi bulaya jaata hai: tab admin panel kholo */
  onFinished: () => void;
  text?: string;
}

// Bar kam se kam itne time me 0 se 100 tak dheere dheere bharti hai
const MIN_LOAD_MS = 3500;

const RATIO = 1672 / 941;

export function AdminLoadingScreen({ progress, ready, onFinished, text = 'Loading data from server…' }: AdminLoadingScreenProps) {
  const [shown, setShown] = useState(0);
  const latest = useRef({ progress, ready, onFinished });
  latest.current = { progress, ready, onFinished };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let v = 0;
    let finished = false;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const { progress: real, ready: isReady } = latest.current;
      // Data aane tak bar poori nahi bharti (max ~90%), data aate hi 100% tak jaati hai
      const cap = isReady ? 100 : Math.max(12, real * 0.9);
      if (v < cap) v = Math.min(cap, v + (dt * 100) / MIN_LOAD_MS);
      setShown(v);
      if (v >= 100 && !finished) {
        finished = true;
        // 100% dikhne ke baad thodi der ruko, phir panel kholo
        doneTimer = setTimeout(() => latest.current.onFinished(), 450);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, []);

  const pct = Math.max(2, Math.min(100, shown));
  // --w = stage ki chaudai; saare size isi se nikalte hain
  const stageStyle = {
    '--w': `max(100vw, calc(100vh * ${RATIO}))`,
    width: 'var(--w)',
    aspectRatio: `${RATIO}`,
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: '100% 100%',
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#050818]" role="status" aria-live="polite" aria-label="Loading HRMS Admin Panel">
      <style>{`@keyframes hrms-spin{to{transform:rotate(360deg)}}`}</style>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={stageStyle}>
        {/* Ghoomta circle */}
        <div
          className="absolute rounded-full"
          style={{
            left: '49.94%',
            top: '61.96%',
            width: 'calc(var(--w) * 0.0385)',
            height: 'calc(var(--w) * 0.0385)',
            marginLeft: 'calc(var(--w) * -0.01925)',
            marginTop: 'calc(var(--w) * -0.01925)',
            border: 'calc(var(--w) * 0.0036) solid rgba(129,140,248,0.22)',
            borderTopColor: '#8b8bff',
            borderRightColor: '#6366f1',
            animation: 'hrms-spin 0.9s linear infinite',
            boxShadow: '0 0 18px rgba(99,102,241,0.35)',
          }}
        />
        {/* Text */}
        <div
          className="absolute left-0 right-0 text-center text-white"
          style={{ top: '68.4%', transform: 'translateY(-50%)', fontSize: 'calc(var(--w) * 0.0125)', letterSpacing: '0.01em' }}
        >
          {text}
        </div>
        {/* Blue progress line */}
        <div
          className="absolute overflow-hidden rounded-full"
          style={{
            left: '33.4%',
            width: '33.2%',
            top: '73.3%',
            height: 'calc(var(--w) * 0.0102)',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)',
          }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg,#5b5bf0,#8b8bff)',
              boxShadow: '0 0 12px rgba(99,102,241,0.7)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
