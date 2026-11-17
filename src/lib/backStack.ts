// Back button (laptop browser ka back, ya phone ka back) ek-ek kadam piche jaye, seedha app/portal band na ho.
//
// Kaise: jab bhi koi popup khulta hai ya tab/screen badalti hai, hum browser history me ek entry ("layer") jodte hain.
// Back dabane par sabse upar wali layer band hoti hai (popup band / pichhli tab par wapas).
// Agar popup button se band kiya to uski history entry bhi hata di jati hai, taaki back me khali kadam na bane.
import { useEffect, useRef } from 'react';

interface Layer {
  id: number;
  close: () => void;
}

const stack: Layer[] = [];
let nextId = 1;
let ignorePops = 0; // hamare apne history.back() se aane wale popstate ko ignore karne ke liye

// History ke kaam ek ke baad ek (React StrictMode me bhi order na bigde)
const queue: Array<() => Promise<void>> = [];
let busy = false;
function pump() {
  if (busy) return;
  const task = queue.shift();
  if (!task) return;
  busy = true;
  task().then(() => {
    busy = false;
    pump();
  });
}
const enqueue = (task: () => Promise<void>) => {
  queue.push(task);
  pump();
};

const layerOfCurrentEntry = (): number => {
  const st = window.history.state as { __layer?: number } | null;
  return (st && st.__layer) || 0;
};

function onPop() {
  if (ignorePops > 0) {
    ignorePops -= 1;
    return;
  }
  // Jis entry par pahunche, uske upar ki saari layers band karo (sabse nayi pehle)
  const active = layerOfCurrentEntry();
  while (stack.length && stack[stack.length - 1].id > active) {
    const layer = stack.pop() as Layer;
    try {
      layer.close();
    } catch {
      // ek layer ki galti baaki ko na roke
    }
  }
}

if (typeof window !== 'undefined') window.addEventListener('popstate', onPop);

// Nayi layer: back dabane par `close` chalega
export function pushLayer(close: () => void): number {
  const id = nextId++;
  stack.push({ id, close });
  enqueue(() => {
    window.history.pushState({ __layer: id }, '');
    return Promise.resolve();
  });
  return id;
}

// Layer ko button/code se band kiya: uski history entry bhi hata do (back se band hui ho to kuch nahi karna)
export function removeLayer(id: number) {
  const idx = stack.findIndex((l) => l.id === id);
  if (idx === -1) return;
  const wasTop = idx === stack.length - 1;
  stack.splice(idx, 1);
  if (!wasTop) return; // beech ki layer: entry stale rahegi, koi dikkat nahi
  enqueue(
    () =>
      new Promise<void>((resolve) => {
        if (layerOfCurrentEntry() !== id) return resolve(); // ab hum us entry par nahi hain
        ignorePops += 1;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener('popstate', finish);
          resolve();
        };
        window.addEventListener('popstate', finish);
        window.history.back();
        setTimeout(() => {
          if (!done) {
            ignorePops = Math.max(0, ignorePops - 1);
            finish();
          }
        }, 400);
      })
  );
}

export function resetLayers() {
  stack.length = 0;
}

// Popup/screen ke component me ek line: useBackClose(onClose)
//   active=false ho to koi layer nahi (jaise popup band hai)
export function useBackClose(onClose: () => void, active = true) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!active) return;
    const id = pushLayer(() => ref.current());
    return () => removeLayer(id);
  }, [active]);
}
