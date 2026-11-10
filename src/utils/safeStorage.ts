/**
 * Safe LocalStorage Utility with in-memory fallback
 * Prevents mobile browser crashes (Android Chrome / iOS Safari) caused by:
 * - QuotaExceededError (e.g. large cached database or avatar data)
 * - SecurityError / DOMException (incognito/private mode or strict cookie policies)
 * - JSON parse corruption
 */

const memoryStore = new Map<string, string>();

let isLocalStorageAvailable: boolean | null = null;

function checkStorageAvailability(): boolean {
  if (isLocalStorageAvailable !== null) return isLocalStorageAvailable;
  if (typeof window === 'undefined' || !window.localStorage) {
    isLocalStorageAvailable = false;
    return false;
  }
  try {
    const testKey = '__cfa_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
    return true;
  } catch (e) {
    console.warn('[SafeStorage] localStorage is restricted or disabled. Falling back to memory store.');
    isLocalStorageAvailable = false;
    return false;
  }
}

export const safeStorage = {
  getItem(key: string, fallback: string | null = null): string | null {
    try {
      if (checkStorageAvailability()) {
        const val = window.localStorage.getItem(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read key "${key}" from localStorage:`, e);
    }
    return memoryStore.has(key) ? memoryStore.get(key)! : fallback;
  },

  setItem(key: string, value: string): boolean {
    // Keep in memory copy as well
    memoryStore.set(key, value);

    try {
      if (checkStorageAvailability()) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (e: any) {
      console.warn(`[SafeStorage] Failed to write key "${key}" to localStorage:`, e);
      // If quota exceeded, attempt to prune non-critical caches
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
        try {
          // Clear large non-critical cache items
          window.localStorage.removeItem('cfa_database_cache');
          window.localStorage.removeItem('cfa_users_list_cache');
          window.localStorage.removeItem('cfa_self_reg_draft_v1');
          window.localStorage.setItem(key, value);
          return true;
        } catch {
          // memoryStore still holds the data
        }
      }
    }
    return false;
  },

  removeItem(key: string): void {
    memoryStore.delete(key);
    try {
      if (checkStorageAvailability()) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[SafeStorage] Failed to remove key "${key}":`, e);
    }
  },

  clearAppCache(): void {
    memoryStore.clear();
    try {
      if (checkStorageAvailability()) {
        const cfaKeys = [
          'cfa_auth_token_v1',
          'cfa_current_user_id',
          'cfa_current_user_object',
          'cfa_database_cache',
          'cfa_users_list_cache',
          'cfa_self_reg_draft_v1',
          'cfa_player_registrations',
          'cfa_player_registration_draft',
        ];
        cfaKeys.forEach((k) => window.localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('[SafeStorage] Failed to clear app cache:', e);
    }
  },
};
