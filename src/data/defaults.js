/**
 * Default data templates and app settings for FamilyHabitMasters.
 */

/**
 * Default negotiation threshold for curses (0.0–1.0).
 * Can be overridden per-curse when parent creates one.
 */
export const CURSE_DEFAULT_NEGOTIATION_THRESHOLD = 0.7;

/**
 * Default per-child fields added on creation / migration.
 * baseTime/maxTime will be populated from DEFAULT_SETTINGS at runtime.
 */
export const DEFAULT_CHILD_FIELDS = {
    baseTime: null,      // filled from settings on creation
    maxTime: null,       // filled from settings on creation
    inventory: [],       // vouchers: { id, name, type, value, expiresAt }
    activeCurse: {
        isActive: false,
        requiredPoints: 0,
        gatheredPoints: 0,
        negotiationThreshold: CURSE_DEFAULT_NEGOTIATION_THRESHOLD,
    },
    negotiation: null,   // null | { status: 'requested'|'offered', contractTask?, timestamp }
};

export const DEFAULT_SETTINGS = {
    baseTime: 60,
    maxTime: 90,
    timeStep: 10,
    // XP & Levels
    xpMultiplierOffline: 2,
    levelThresholds: [
        { level: 1, xp: 500, reward: '🍦 Lody' },
        { level: 2, xp: 1500, reward: '📖 Nowa książka' },
        { level: 3, xp: 3000, reward: '🎮 Dodatkowa godzina gry' },
        { level: 4, xp: 5000, reward: '🎬 Kino z rodzicem' },
        { level: 5, xp: 8000, reward: '🎁 Niespodzianka!' },
    ],
    // Offline days
    offlineDaysSchedule: [], // day-of-week numbers: 0=Sun, 1=Mon, ..., 6=Sat
    offlineDaysOverride: {}, // { 'YYYY-MM-DD': true/false }
};

export const DEFAULT_DAILY_QUESTS = [
    { id: 'dq-1', text: 'Pobudka z budzikiem (bez marudzenia!)', category: 'morning', penaltyMinutes: 10, icon: '⏰', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-2', text: 'Ubranie się i poranna toaleta', category: 'morning', penaltyMinutes: 10, icon: '👕', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-3', text: 'Spakowany plecak', category: 'morning', penaltyMinutes: 10, icon: '🎒', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-4', text: 'Wyjście z domu do 7:45', category: 'morning', penaltyMinutes: 10, icon: '🚪', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-5', text: 'Plecak na swoim miejscu', category: 'afternoon', penaltyMinutes: 10, icon: '🎒', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-6', text: 'Śniadaniówka i bidon do kuchni', category: 'afternoon', penaltyMinutes: 10, icon: '🍱', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-7', text: 'Raport ze szkoły i lekcji', category: 'afternoon', penaltyMinutes: 10, icon: '📋', hasNextDayConsequence: false, nextDayPenalty: 0, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-8', text: 'Czysta podłoga w pokoju', category: 'evening', penaltyMinutes: 10, icon: '🧹', hasNextDayConsequence: true, nextDayPenalty: 10, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-9', text: 'Brudne ubrania w koszu, czyste w szafie', category: 'evening', penaltyMinutes: 10, icon: '👔', hasNextDayConsequence: true, nextDayPenalty: 10, xpReward: 100, assignedTo: ['all'] },
    { id: 'dq-10', text: 'Pójście spać zgodnie z planem', category: 'boss', penaltyMinutes: 10, icon: '🌙', hasNextDayConsequence: true, nextDayPenalty: 10, xpReward: 150, assignedTo: ['all'] },
];

export const DEFAULT_BONUS_MISSIONS = [
    { id: 'bm-1', text: 'Opieka nad Geksiem', rewardMinutes: 10, icon: '🦎', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-2', text: 'Zabawa/opieka nad Jadzią', rewardMinutes: 10, icon: '🐈', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-3', text: 'Poskładanie ubrań', rewardMinutes: 10, icon: '👕', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-4', text: 'Opróżnienie zmywarki', rewardMinutes: 10, icon: '🍽️', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-5', text: 'Odkurzanie pokoju', rewardMinutes: 10, icon: '🌪️', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-6', text: 'Zmycie podłogi', rewardMinutes: 10, icon: '💦', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-7', text: 'Wyniesienie śmieci', rewardMinutes: 10, icon: '🗑️', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: false, xpReward: 150, assignedTo: ['all'] },
    { id: 'bm-8', text: 'Czytanie książki (20 min)', rewardMinutes: 10, icon: '📖', hasNextDayConsequence: false, nextDayBonus: 0, multiUse: true, xpReward: 150, assignedTo: ['all'] },
];

export const DEFAULT_PENALTIES = [
    { id: 'pn-1', text: 'Przeciągnięcie czasu gry', penaltyMinutes: 10, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '⏰', multiUse: false, xpPenalty: 0, assignedTo: ['all'] },
    { id: 'pn-2', text: 'Brak zadania / nieprzygotowanie (przyznanie się)', penaltyMinutes: 20, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '🎒', multiUse: false, xpPenalty: 0, assignedTo: ['all'] },
    { id: 'pn-3', text: 'Uwaga w dzienniku', penaltyMinutes: 40, hasNextDayConsequence: true, nextDayPenalty: 10, icon: '📓', multiUse: true, xpPenalty: 0, assignedTo: ['all'] },
    { id: 'pn-4', text: 'Bałagan na noc', penaltyMinutes: 10, hasNextDayConsequence: true, nextDayPenalty: 10, icon: '🌪️', multiUse: false, xpPenalty: 0, assignedTo: ['all'] },
    { id: 'pn-5', text: 'Kłótnia / złe zachowanie', penaltyMinutes: 10, hasNextDayConsequence: false, nextDayPenalty: 0, icon: '🌩️', multiUse: true, xpPenalty: 0, assignedTo: ['all'] },
];

export const CATEGORY_LABELS = {
    morning: { label: '☀️ Poranny Ekspres', order: 0 },
    afternoon: { label: '🏫 Powrót do Bazy', order: 1 },
    evening: { label: '🧹 Strefa Czystości', order: 2 },
    boss: { label: '🏰 Finał Dnia', order: 3 },
};

export const AVATAR_OPTIONS = [
    '🦸', '🧙', '🦊', '🐲', '🦁', '🐯', '🦄', '🐼',
    '🦅', '⚡', '🌟', '🎮', '🏆', '🚀', '🎯', '🛡️',
];

export const ICON_OPTIONS = [
    '⏰', '👕', '🎒', '🚪', '🍱', '📋', '🧹', '👔', '🌙',
    '🦎', '🐈', '🍽️', '🌪️', '💦', '🗑️', '📖', '⭐',
    '📓', '🌩️', '🎯', '🏆', '⚡', '🔥', '💪', '🎮',
    '📚', '🧹', '🛡️', '⚠️', '🚀', '🏠', '🌟', '🎵',
];

export const DAY_LABELS = [
    { value: 0, label: 'Nd' },
    { value: 1, label: 'Pn' },
    { value: 2, label: 'Wt' },
    { value: 3, label: 'Śr' },
    { value: 4, label: 'Cz' },
    { value: 5, label: 'Pt' },
    { value: 6, label: 'Sb' },
];

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
