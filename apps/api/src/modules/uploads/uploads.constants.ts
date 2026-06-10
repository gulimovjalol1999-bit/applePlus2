export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Storage keys are always `<folder>/<uuid>.<ext>`. Anything else (path
// traversal, foreign prefixes, etc.) is rejected before reaching storage.
export const STORAGE_KEY_REGEX = /^(images|avatars|documents)\/[a-zA-Z0-9-]+\.[a-zA-Z0-9]{1,5}$/;
