// Camera ki badi photo ko chhota karo (max 1000px, JPEG) taaki upload tez ho aur server par jagah kam lage
export async function compressImage(file: File, maxSide = 1000, quality = 0.7): Promise<{ base64: string; mime: string; previewUrl: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Photo khul nahi paayi'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Photo process nahi ho paayi');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { base64: dataUrl.split(',')[1] || '', mime: 'image/jpeg', previewUrl: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Company logo: max 400px, PNG (transparent background bacha rehta hai)
export async function compressLogo(file: File, maxSide = 400): Promise<{ base64: string; mime: string; previewUrl: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Logo khul nahi paaya'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Logo process nahi ho paaya');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    return { base64: dataUrl.split(',')[1] || '', mime: 'image/png', previewUrl: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Profile photo: beech se chaukor kaat kar 320x320 JPEG (chhota size, avatar jaisa)
export async function compressAvatar(file: File, size = 320, quality = 0.8): Promise<{ base64: string; mime: string; previewUrl: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Photo khul nahi paayi'));
      el.src = url;
    });
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Photo process nahi ho paayi');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { base64: dataUrl.split(',')[1] || '', mime: 'image/jpeg', previewUrl: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}
