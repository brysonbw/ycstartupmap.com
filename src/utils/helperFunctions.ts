import { v4 as uuidv4 } from 'uuid';
import type { UserAgent } from '../stores/app';
import { COLOR_PALETTE, DEFAULT_BILLBOARD_IMAGE_SIZE } from './constants';

/** Get UUIDv4 */
export function UUIDv4(): string {
  if (crypto && typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback
  return uuidv4();
}

/**
 * Validates URL
 * @param url
 */
export function isURLValid(url: string): boolean {
  let validUrl: URL;

  try {
    validUrl = new URL(url);
  } catch {
    return false;
  }

  return validUrl.protocol === 'https:' ? true : false;
}

/** Detect if WebGL enabled for browser */
export async function detectWebGL(): Promise<boolean> {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return gl instanceof WebGLRenderingContext;
}

/** Detect user (browser) agent */
export function detectUserAgent(): UserAgent {
  const userAgent = window.navigator.userAgent;
  switch (true) {
    case userAgent.includes('Firefox/') && !userAgent.includes('Seamonkey/'):
      return 'firefox';

    case userAgent.includes('Seamonkey/'):
      return 'seamonkey';

    case userAgent.includes('Chrome/') &&
      !userAgent.includes('Chromium/') &&
      !userAgent.includes('Edg/'):
      return 'chrome';

    case userAgent.includes('Chromium/'):
      return 'chromium';

    case userAgent.includes('Safari/') &&
      !userAgent.includes('Chrome/') &&
      !userAgent.includes('Chromium/'):
      return 'safari';

    case userAgent.includes('OPR/'):
      return 'opera';

    case userAgent.includes('Opera/'):
      return 'opera';

    default:
      return 'unknown';
  }
}

/**
 * Get and create a placeholder image
 * @summary Primarily used to create logo for entities with `null` value for image prop/values
 * @param text
 * @param size
 * @param bgColor
 */
export async function getPlaceholderImage(
  text: string,
  size: number = DEFAULT_BILLBOARD_IMAGE_SIZE,
  bgColor: string = COLOR_PALETTE.orange
): Promise<string> {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = size * scale;
  canvas.height = size * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = `${size * 0.6}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text[0]?.toUpperCase() ?? '?', size / 2, size / 2);

  return canvas.toDataURL('image/png');
}
