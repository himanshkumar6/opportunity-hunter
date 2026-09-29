/**
 * Opportunity Hunter — Shared Validation & Sanitization Helpers
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid standard UUID (v1-v5).
 */
export function isValidUuid(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Safely parses and clamps pagination parameters to prevent Denial of Service
 * via oversized page limits or negative offsets.
 */
export function clampPagination(
  rawPage: string | number | null | undefined,
  rawPageSize: string | number | null | undefined,
  defaultPageSize = 20,
  maxPageSize = 100
): { page: number; pageSize: number } {
  let page = typeof rawPage === 'number' ? rawPage : parseInt(String(rawPage || '1'), 10);
  let pageSize =
    typeof rawPageSize === 'number'
      ? rawPageSize
      : parseInt(String(rawPageSize || defaultPageSize), 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(pageSize) || pageSize < 1) {
    pageSize = defaultPageSize;
  }
  if (pageSize > maxPageSize) {
    pageSize = maxPageSize;
  }

  return { page, pageSize };
}
