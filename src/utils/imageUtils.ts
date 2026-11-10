/**
 * Image processing and compression utility for CASTINDO FOOTBALL ACADEMY
 * Supports high-resolution photos up to 10MB with automated client-side canvas compression.
 */

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_PHOTO_SIZE_LABEL = '10MB';

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Resizes and compresses an image file in the browser using HTML5 Canvas.
 * Accepts files up to 10MB and optimizes them to a lightweight, crisp data URL.
 */
export async function processAndCompressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeBytes?: number;
  } = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.85,
    maxSizeBytes = MAX_PHOTO_SIZE_BYTES,
  } = options;

  if (!file.type.startsWith('image/')) {
    throw new Error('File yang dipilih bukan berkas gambar yang valid.');
  }

  if (file.size > maxSizeBytes) {
    throw new Error(
      `Ukuran file foto (${formatFileSize(file.size)}) melebihi batas maksimal ${MAX_PHOTO_SIZE_LABEL}. Silakan pilih foto dengan ukuran di bawah ${MAX_PHOTO_SIZE_LABEL}.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar dari perangkat Anda.'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Gagal memuat data gambar.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Format file gambar tidak didukung atau berkas rusak.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Compute aspect ratio scaling
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original dataUrl if canvas context not available
            resolve({
              dataUrl,
              originalSize: file.size,
              compressedSize: dataUrl.length,
              width: img.width,
              height: img.height,
            });
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed JPEG
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Estimate byte size of base64
          const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
          const compressedBytes = Math.round((stringLength * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            originalSize: file.size,
            compressedSize: compressedBytes,
            width,
            height,
          });
        } catch (canvasErr) {
          // Graceful fallback to original dataUrl
          resolve({
            dataUrl,
            originalSize: file.size,
            compressedSize: dataUrl.length,
            width: img.width,
            height: img.height,
          });
        }
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
