/**
 * Default data templates and app settings for FamilyHabitMasters.
 */

export const DEFAULT_SETTINGS = {
    baseTime: 60,
    maxTime: 90,
    timeStep: 10,
};

export const DEFAULT_DAILY_QUESTS = [
    { id: 'dq-1', text: 'Pobudka z budzikiem (bez marudzenia!)', category: 'morning', penaltyMinutes: 10, icon: '⏰' },
    { id: 'dq-2', text: 'Ubranie się i poranna toaleta', category: 'morning', penaltyMinutes: 10, icon: '👕' },
    { id: 'dq-3', text: 'Spakowany plecak', category: 'morning', penaltyMinutes: 10, icon: '🎒' },
    { id: 'dq-4', text: 'Wyjście z domu do 7:45', category: 'morning', penaltyMinutes: 10, icon: '🚪' },
    { id: 'dq-5', text: 'Plecak na swoim miejscu', category: 'afternoon', penaltyMinutes: 10, icon: '🎒' },
    { id: 'dq-6', text: 'Śniadaniówka i bidon do kuchni', category: 'afternoon', penaltyMinutes: 10, icon: '🍱' },
    { id: 'dq-7', text: 'Raport ze szkoły i lekcji', category: 'afternoon', penaltyMinutes: 10, icon: '📋' },
    { id: 'dq-8', text: 'Czysta podłoga w pokoju', category: 'evening', penaltyMinutes: 10, icon: '🧹' },
    { id: 'dq-9', text: 'Brudne ubrania w koszu, czyste w szafie', category: 'evening', penaltyMinutes: 10, icon: '👔' },
];

export const DEFAULT_BONUS_MISSIONS = [
    { id: 'bm-1', text: 'Opieka nad Geksiem', rewardMinutes: 10, icon: '🦎' },
    { id: 'bm-2', text: 'Zabawa/opieka nad Jadzią', rewardMinutes: 10, icon: '🐈' },
    { id: 'bm-3', text: 'Poskładanie ubrań', rewardMinutes: 10, icon: '👕' },
    { id: 'bm-4', text: 'Opróżnienie zmywarki', rewardMinutes: 10, icon: '🍽️' },
    { id: 'bm-5', text: 'Odkurzanie pokoju', rewardMinutes: 10, icon: '🌪️' },
    { id: 'bm-6', text: 'Zmycie podłogi', rewardMinutes: 10, icon: '💦' },
    { id: 'bm-7', text: 'Wyniesienie śmieci', rewardMinutes: 10, icon: '🗑️' },
    { id: 'bm-8', text: 'Czytanie książki (20 min)', rewardMinutes: 10, icon: '📖' },
];

export const DEFAULT_PENALTIES = [
    { id: 'pn-1', text: 'Przeciągnięcie czasu gry', penaltyMinutes: 10, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '⏰' },
    { id: 'pn-2', text: 'Brak zadania / nieprzygotowanie (przyznanie się)', penaltyMinutes: 20, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '🎒' },
    { id: 'pn-3', text: 'Uwaga w dzienniku', penaltyMinutes: 40, hasNextDayConsequence: true, nextDayPenalty: 10, icon: '📓' },
    { id: 'pn-4', text: 'Bałagan na noc', penaltyMinutes: 10, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '🌪️' },
    { id: 'pn-5', text: 'Kłótnia / złe zachowanie', penaltyMinutes: 10, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '🌩️' },
];

export const CATEGORY_LABELS = {
    morning: { label: '☀️ Poranny Ekspres', order: 0 },
    afternoon: { label: '🏫 Powrót do Bazy', order: 1 },
    evening: { label: '🧹 Strefa Czystości', order: 2 },
};

export const AVATAR_OPTIONS = [
    '🦸', '🧙', '🦊', '🐲', '🦁', '🐯', '🦄', '🐼',
    '🦅', '⚡', '🌟', '🎮', '🏆', '🚀', '🎯', '🛡️',
];

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
