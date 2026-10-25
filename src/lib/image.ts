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
