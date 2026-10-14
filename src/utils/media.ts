export const DEFAULT_PLAYER_PHOTO =
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=500&q=80';

export const DEFAULT_TEAM_LOGO =
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=250&q=80';

export function getSafePlayerPhoto(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_PLAYER_PHOTO;
  }
  return url.trim();
}

export function getSafeTeamLogo(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_TEAM_LOGO;
  }
  return url.trim();
}

/**
 * Compresses an image file client-side into a lightweight JPEG data URL
 * (typically 20KB - 45KB), preventing Firestore 1MB document size limits
 * and ensuring instantaneous, failure-proof saves in Firebase.
 */
export function compressImageFile(
  file: File,
  maxWidth = 480,
  maxHeight = 480,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ফাইল রিড করতে ব্যর্থ হয়েছে'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ছবি লোড করতে ব্যর্থ হয়েছে'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result || ''));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Enables Admin to directly download full-resolution player photos
 * onto their device with clean filename: [PlayerName]_[PlayerID].[ext]
 */
export async function downloadPlayerPhoto(
  photoUrl: string,
  playerName: string,
  playerId: string
): Promise<boolean> {
  const safeName = (playerName || 'player').trim().replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_');
  const safeId = (playerId || 'id').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const baseFilename = `${safeName}_${safeId}`;

  try {
    // 1. If photo is a data URL (base64 image)
    if (photoUrl.startsWith('data:image')) {
      const ext = photoUrl.includes('image/png') ? 'png' : 'jpg';
      const a = document.createElement('a');
      a.href = photoUrl;
      a.download = `${baseFilename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }

    // 2. Fetch as blob to bypass CORS limitations for downloading
    const resp = await fetch(photoUrl, { mode: 'cors' });
    if (resp.ok) {
      const blob = await resp.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${baseFilename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return true;
    }
  } catch (err) {
    console.warn('Direct blob fetch failed, falling back to canvas download:', err);
  }

  // 3. Fallback: Draw to offscreen canvas and download as JPEG
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 480;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${baseFilename}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch {
        const a = document.createElement('a');
        a.href = photoUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = `${baseFilename}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    img.onerror = () => {
      const a = document.createElement('a');
      a.href = photoUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = photoUrl;
    return true;
  } catch {
    return false;
  }
}

