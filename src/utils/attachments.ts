import { API_CONFIG } from '@/config/api';

export function normalizeAttachmentUrl(url?: string, cacheKey?: string): string {
  if (!url) return '';
  // Allow blob URLs as-is
  if (url.startsWith('blob:')) return url;
  // Absolute URL as-is
  if (/^https?:\/\//i.test(url)) {
    return cacheKey ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(cacheKey)}` : url;
  }
  // Ensure leading slash
  const path = url.startsWith('/') ? url : `/${url}`;
  const full = `${API_CONFIG.BASE_URL}${path}`;
  return cacheKey ? `${full}?v=${encodeURIComponent(cacheKey)}` : full;
}

export function inferMimeType(name?: string, fallback: string = 'application/octet-stream'): string {
  if (!name) return fallback;
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'csv':
      return 'text/csv';
    case 'txt':
      return 'text/plain';
    default:
      return fallback;
  }
}

export function normalizeAttachment<T extends Record<string, any>>(att: T): T {
  const id = att.id || att._id || att.name;
  const url = normalizeAttachmentUrl(att.url, String(id || ''));
  const type = att.type || inferMimeType(att.name);
  return {
    ...att,
    id,
    url,
    type,
  };
}

export function normalizeAttachments<T extends Record<string, any>>(arr: T[] = []): T[] {
  return arr.map(normalizeAttachment);
}

