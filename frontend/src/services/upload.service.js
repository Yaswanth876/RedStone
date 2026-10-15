/**
 * RedStone Timetable Upload & Extraction Service
 * Communicates with backend endpoint:
 *   POST /api/timetables/:timetableId/upload
 *
 * Supports PDF, CSV, and XLSX formats with a 10 MB file size limit.
 * Extraction is synchronous and returns candidate entries without
 * writing them to the permanent timetable database.
 */

import { apiClient, ApiError } from './api.js';

/**
 * Maximum upload size enforced by backend multer limit (10 MB).
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10,485,760 bytes

/**
 * Allowed file extensions matching backend configuration.
 */
export const ALLOWED_EXTENSIONS = [
  '.pdf', '.csv', '.xlsx',
  '.png', '.jpg', '.jpeg', '.webp',
];

/**
 * Allowed MIME types accepted by backend fileFilter.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
];

/**
 * Accept attribute string for HTML file input.
 */
export const ACCEPTED_FILE_TYPES_STRING =
  '.pdf,.csv,.xlsx,.png,.jpg,.jpeg,.webp,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/webp';

/**
 * Session storage key for persisting candidate entries for Module 5 review handoff.
 */
export const IMPORT_STORAGE_KEY = 'redstone_import_candidates';

/**
 * Format bytes into human-readable representation (e.g. 245 KB, 1.4 MB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if the file is an image.
 * @param {File|string} fileOrName
 * @returns {boolean}
 */
export function isImageFile(fileOrName) {
  const name = typeof fileOrName === 'string' ? fileOrName : fileOrName?.name || '';
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
}

/**
 * Return a friendly label for the file format.
 * @param {File|string} fileOrName
 * @returns {string}
 */
export function getFileTypeLabel(fileOrName) {
  const name = typeof fileOrName === 'string' ? fileOrName : fileOrName?.name || '';
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'PDF Document';
    case '.csv':
      return 'CSV Spreadsheet';
    case '.xlsx':
      return 'Excel Workbook';
    case '.png':
      return 'PNG Image';
    case '.jpg':
    case '.jpeg':
      return 'JPEG Image';
    case '.webp':
      return 'WebP Image';
    default:
      return 'Document';
  }
}

/**
 * Validate file selection client-side against backend constraints.
 * @param {File|null} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select a timetable document or image to upload.' };
  }

  const filename = file.name || '';
  const extIndex = filename.lastIndexOf('.');
  if (extIndex === -1) {
    return {
      valid: false,
      error: 'The file has no file extension. Supported formats: .pdf, .csv, .xlsx, .png, .jpg, .webp.',
    };
  }

  const ext = filename.slice(extIndex).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (${ext}). Supported formats are PDF (.pdf), Excel (.xlsx), CSV (.csv), and Images (.png, .jpg, .webp).`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes). Please select a valid timetable file.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${formatFileSize(
        MAX_FILE_SIZE_BYTES
      )}.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Upload timetable document to the backend and extract candidate entries.
 *
 * @param {string} timetableId - Target timetable ID
 * @param {File} file - File object
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ message: string, entries: Array, warnings: Array }>}
 */
export async function uploadAndExtractTimetable(timetableId, file, { signal } = {}) {
  if (!timetableId) {
    throw new Error('A timetable ID is required for timetable upload.');
  }

  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append('file', file, file.name);

  // apiClient handles FormData by omitting Content-Type so browser sets boundary,
  // and attaches Bearer authorization token from sessionStorage.
  const result = await apiClient(`/timetables/${timetableId}/upload`, {
    method: 'POST',
    body: formData,
    signal,
  });

  return {
    message: result.message || 'Timetable extracted for review',
    entries: result.entries || [],
    warnings: result.warnings || [],
  };
}

/**
 * Persist extraction results in sessionStorage for Module 5 review handoff.
 * @param {object} payload
 * @param {string} payload.timetableId
 * @param {string} payload.filename
 * @param {Array} payload.entries
 * @param {Array} payload.warnings
 */
export function saveExtractionSession(payload) {
  try {
    sessionStorage.setItem(
      IMPORT_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('Could not save extraction results to sessionStorage:', err);
  }
}

/**
 * Retrieve extraction results from sessionStorage.
 * @returns {object|null}
 */
export function getExtractionSession() {
  try {
    const raw = sessionStorage.getItem(IMPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear stored extraction results from sessionStorage.
 */
export function clearExtractionSession() {
  try {
    sessionStorage.removeItem(IMPORT_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Commit reviewed and approved timetable entries to the backend atomically.
 * Endpoint: POST /api/timetables/:timetableId/entries/import
 *
 * @param {string} timetableId - Target timetable ID
 * @param {Array} entries - Sanitized array of timetable entries
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ message: string, count: number, entries: Array }>}
 */
export async function importEntries(timetableId, entries, { signal } = {}) {
  if (!timetableId) {
    throw new Error('A timetable ID is required to import entries.');
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('At least one valid timetable entry is required for import.');
  }

  const result = await apiClient(`/timetables/${timetableId}/entries/import`, {
    method: 'POST',
    body: { entries },
    signal,
  });

  return {
    message: result.message || 'Timetable entries imported successfully',
    count: result.count || (result.entries || []).length,
    entries: result.entries || [],
  };
}

export { ApiError };

