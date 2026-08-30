// Browser-scoped demo session key. Keeps each judge/browser session isolated.
const STORAGE_KEY = "loadguard.session";

export function readSessionKey(): string | null {
    if (typeof window === "undefined") return null;
    let key = window.localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = crypto.randomUUID();
        window.localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
}
