/**
 * Central API & Socket Configuration
 * Seamlessly supports both:
 * 1. Monolithic / Local deployment (relative paths "")
 * 2. Split deployment (Vercel Frontend -> Render Backend via VITE_API_URL)
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') 
  : '';

export function getApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}
