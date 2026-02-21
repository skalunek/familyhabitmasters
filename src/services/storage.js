/**
 * LocalStorage persistence layer for FamilyHabitMasters.
 * Handles saving/loading app state, PIN hashing, and data export/import.
 */

const STORAGE_KEY = 'familyHabitMasters';

/**
 * Hash a PIN string using SHA-256 via SubtleCrypto.
 */
export async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + '_fhm_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against a stored hash.
 */
export async function verifyPin(inputPin, storedHash) {
    const inputHash = await hashPin(inputPin);
    return inputHash === storedHash;
}

/**
 * Load entire app state from localStorage.
 * Returns null if no data exists.
 */
export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load state:', e);
        return null;
    }
}

/**
 * Save entire app state to localStorage.
 */
export function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

/**
 * Export app data as a downloadable JSON file.
 */
export function exportData(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `familyhabitmasters-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import app data from a JSON file. Returns the parsed state.
 */
export function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (err) {
                reject(new Error('Nieprawidłowy format pliku'));
            }
        };
        reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
        reader.readAsText(file);
    });
}
