// GPS indoor me idhar-udhar hota hai (baithe-baithe 20-50 m). Pichhle ~60 second ki fixes ka weighted average lete hain
// (jis fix ki galti kam, uska weight zyada), taaki jagah stable rahe aur office me baithe employee "bahar" na dikhe.
export interface Fix {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface Sample extends Fix {
  t: number;
}

const WINDOW_MS = 60000;
const MAX_SAMPLES = 8;

export function createGpsSmoother() {
  let samples: Sample[] = [];

  return (fix: Fix): Fix => {
    const now = Date.now();
    const acc = Math.max(5, fix.accuracy || 50);
    samples = samples.filter((s) => now - s.t <= WINDOW_MS);
    samples.push({ ...fix, accuracy: acc, t: now });
    if (samples.length > MAX_SAMPLES) samples = samples.slice(-MAX_SAMPLES);

    // Kam galti wale (achhe) fixes ko hi ginte hain; bahut kharab fix tabhi jab koi achha na ho
    const best = Math.min(...samples.map((s) => s.accuracy));
    const usable = samples.filter((s) => s.accuracy <= best * 2.5);

    let wSum = 0;
    let lat = 0;
    let lng = 0;
    for (const s of usable) {
      const w = 1 / (s.accuracy * s.accuracy);
      wSum += w;
      lat += s.latitude * w;
      lng += s.longitude * w;
    }
    return { latitude: lat / wSum, longitude: lng / wSum, accuracy: best };
  };
}
