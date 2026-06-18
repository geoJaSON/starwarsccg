import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { CapacitorPluginMlKitTextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';
import { dhashFromImage } from './dhash';

export interface ScanCapture {
  /** Object URL for showing the captured frame in the UI. */
  previewUrl: string;
  /** OCR'd text, split into lines (empty if OCR unavailable, e.g. on web). */
  lines: string[];
  /** dHash (16-char hex) of the framed card region. */
  dhash: string;
  /** True if on-device OCR ran; false means we only have the image. */
  ocrAvailable: boolean;
}

/** Card aspect ratio (2.5" x 3.5") used to crop the centre of the frame. */
const CARD_ASPECT = 2.5 / 3.5;
const MAX_OCR_DIM = 1600;

/** Decode a URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the captured photo.'));
    img.src = src;
  });
}

/** Draw an image (optionally downscaled) to a fresh canvas. */
function toCanvas(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Centre-crop to the card aspect ratio so the dHash ignores background. */
function cropToCard(img: HTMLImageElement): HTMLCanvasElement {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let cw = iw;
  let ch = Math.round(cw / CARD_ASPECT);
  if (ch > ih) {
    ch = ih;
    cw = Math.round(ch * CARD_ASPECT);
  }
  const sx = (iw - cw) / 2;
  const sy = (ih - ch) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext('2d')!.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
  return canvas;
}

async function runOcr(jpegBase64: string): Promise<string[]> {
  try {
    const result = await CapacitorPluginMlKitTextRecognition.detectText({ base64Image: jpegBase64 });
    // Prefer line-level granularity; fall back to splitting the full text.
    const lines = result.blocks?.flatMap((b) => b.lines?.map((l) => l.text) ?? []) ?? [];
    if (lines.length) return lines;
    return (result.text ?? '').split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Take a photo with the device camera, OCR it, and fingerprint the card art.
 * On web (no native OCR) the returned `lines` are empty and `ocrAvailable`
 * is false — the UI then offers a manual-title fallback.
 */
export async function captureCard(): Promise<ScanCapture> {
  const photo = await Camera.takePhoto({
    quality: 90,
    correctOrientation: true,
    saveToGallery: false,
  });

  const src = photo.webPath ?? (photo.uri ? Capacitor.convertFileSrc(photo.uri) : undefined);
  if (!src) throw new Error('No photo was captured.');

  const img = await loadImage(src);

  const native = Capacitor.isNativePlatform();
  let lines: string[] = [];
  let ocrAvailable = false;
  if (native) {
    const ocrCanvas = toCanvas(img, MAX_OCR_DIM);
    const dataUrl = ocrCanvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    lines = await runOcr(base64);
    ocrAvailable = true;
  }

  const dhash = dhashFromImage(cropToCard(img));

  return { previewUrl: src, lines, dhash, ocrAvailable };
}

/** Ask for camera permission up front so the UI can explain a denial. */
export async function ensureCameraPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  // @capacitor/camera captures via the system camera app (an intent), so a
  // 'prompt' state is fine — only an explicit denial blocks us.
  const status = await Camera.checkPermissions();
  if (status.camera !== 'denied') return true;
  const req = await Camera.requestPermissions({ permissions: ['camera'] });
  return req.camera !== 'denied';
}
