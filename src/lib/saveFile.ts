// File ko phone me save/share karo (Android me share sheet: Drive / Files / PDF viewer), browser me seedha download
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('File padhi nahi ja saki'));
    r.readAsDataURL(blob);
  });
}

export async function saveBlobToDevice(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
    });
    await Share.share({ title: fileName, files: [written.uri], dialogTitle: 'Salary slip save / open karo' });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Phone ke APK me file-save (Filesystem) aur share plugin maujood hain ya nahi (purane APK me nahi hote)
export function canSaveNatively(): boolean {
  if (!Capacitor.isNativePlatform()) return true; // browser: seedha download
  return Capacitor.isPluginAvailable('Filesystem') && Capacitor.isPluginAvailable('Share');
}

// Admin ke liye: naye tab me kholo
export function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
