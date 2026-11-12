/**
 * Shrinks a photo in the browser before upload: phone photos are 3–8 MB,
 * which is slow on mobile data and wasteful in the database.
 * Returns base64 JPEG data without the "data:" prefix.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<{ data: string; mime: 'image/jpeg' }> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL('image/jpeg', quality);
  return { data: url.slice(url.indexOf(',') + 1), mime: 'image/jpeg' };
}
