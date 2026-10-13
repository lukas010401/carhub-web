const TARGET_BYTES = 700 * 1024;
export const MAX_LISTING_PHOTOS = 10;
export const MAX_SOURCE_IMAGE_MB = 8;
const prepared = new WeakMap<File, Promise<File>>();

export function prepareListingPhoto(file: File): Promise<File> {
  const cached = prepared.get(file);
  if (cached) return cached;
  const task = resizePhoto(file);
  prepared.set(file, task);
  task.catch(() => prepared.delete(file));
  return task;
}

async function resizePhoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Photo illisible : ${file.name}`));
      img.src = url;
    });
    const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossible de préparer les photos sur cet appareil.');
    const draw = () => {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    const encode = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression impossible.')), 'image/jpeg', quality);
    });
    draw();
    let blob = await encode(0.82);
    if (blob.size > TARGET_BYTES) blob = await encode(0.7);
    while (blob.size > TARGET_BYTES && Math.max(canvas.width, canvas.height) > 960) {
      canvas.width = Math.max(1, Math.round(canvas.width * 0.8));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.8));
      draw();
      blob = await encode(0.7);
    }
    if (scale === 1 && file.size <= blob.size && file.size <= TARGET_BYTES) return file;
    if (blob.size > 5 * 1024 * 1024) throw new Error(`Photo trop volumineuse : ${file.name}`);
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
      type: 'image/jpeg', lastModified: file.lastModified
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}