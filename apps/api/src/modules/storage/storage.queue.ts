export const STORAGE_CLEANUP_QUEUE = 'storage-cleanup';
export const STORAGE_CLEANUP_JOB = 'cleanup-stale-pending';

/** How often the stale-PENDING cleanup job runs. */
export const STORAGE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/** PENDING storage_objects older than this with no confirmed upload are removed. */
export const STORAGE_PENDING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
