/**
 * Date formatters using the en-IN locale as documented in Section 12.2.C of migration.txt.
 */

function toValidDate(dateString) {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatShortDate(dateString) {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatLongDate(dateString) {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatSlashDate(dateString) {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('en-IN');
}
