/**
 * Tests for defaults.js — data validation.
 */
import { describe, it, expect } from 'vitest';
import {
    DEFAULT_SETTINGS,
    DEFAULT_DAILY_QUESTS,
    DEFAULT_BONUS_MISSIONS,
    DEFAULT_PENALTIES,
    CATEGORY_LABELS,
    AVATAR_OPTIONS,
    ICON_OPTIONS,
    DAY_LABELS,
    generateId,
} from '../data/defaults';

describe('DEFAULT_SETTINGS', () => {
    it('has required time fields', () => {
        expect(DEFAULT_SETTINGS.baseTime).toBeGreaterThan(0);
        expect(DEFAULT_SETTINGS.maxTime).toBeGreaterThan(DEFAULT_SETTINGS.baseTime);
        expect(DEFAULT_SETTINGS.timeStep).toBeGreaterThan(0);
    });

    it('has XP and level settings', () => {
        expect(DEFAULT_SETTINGS.xpMultiplierOffline).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(DEFAULT_SETTINGS.levelThresholds)).toBe(true);
        expect(DEFAULT_SETTINGS.levelThresholds.length).toBeGreaterThan(0);
    });

    it('has offline day settings', () => {
        expect(Array.isArray(DEFAULT_SETTINGS.offlineDaysSchedule)).toBe(true);
        expect(typeof DEFAULT_SETTINGS.offlineDaysOverride).toBe('object');
    });

    it('level thresholds are in ascending XP order', () => {
        const xps = DEFAULT_SETTINGS.levelThresholds.map(t => t.xp);
        for (let i = 1; i < xps.length; i++) {
            expect(xps[i]).toBeGreaterThan(xps[i - 1]);
        }
    });
});

describe('DEFAULT_DAILY_QUESTS', () => {
    it('has at least one quest', () => {
        expect(DEFAULT_DAILY_QUESTS.length).toBeGreaterThan(0);
    });

    it('each quest has required fields', () => {
        DEFAULT_DAILY_QUESTS.forEach(q => {
            expect(q.id).toBeTruthy();
            expect(q.text).toBeTruthy();
            expect(q.category).toBeTruthy();
            expect(q.penaltyMinutes).toBeGreaterThan(0);
            expect(q.icon).toBeTruthy();
            expect(typeof q.hasNextDayConsequence).toBe('boolean');
            expect(Array.isArray(q.assignedTo)).toBe(true);
            expect(typeof q.xpReward).toBe('number');
        });
    });

    it('has quests in known categories', () => {
        const categories = Object.keys(CATEGORY_LABELS);
        DEFAULT_DAILY_QUESTS.forEach(q => {
            expect(categories).toContain(q.category);
        });
    });

    it('includes a boss category quest', () => {
        expect(DEFAULT_DAILY_QUESTS.some(q => q.category === 'boss')).toBe(true);
    });
});

describe('DEFAULT_BONUS_MISSIONS', () => {
    it('has at least one mission', () => {
        expect(DEFAULT_BONUS_MISSIONS.length).toBeGreaterThan(0);
    });

    it('each mission has required fields', () => {
        DEFAULT_BONUS_MISSIONS.forEach(m => {
            expect(m.id).toBeTruthy();
            expect(m.text).toBeTruthy();
            expect(m.rewardMinutes).toBeGreaterThan(0);
            expect(m.icon).toBeTruthy();
            expect(typeof m.multiUse).toBe('boolean');
            expect(Array.isArray(m.assignedTo)).toBe(true);
            expect(typeof m.xpReward).toBe('number');
        });
    });
});

describe('DEFAULT_PENALTIES', () => {
    it('has at least one penalty', () => {
        expect(DEFAULT_PENALTIES.length).toBeGreaterThan(0);
    });

    it('each penalty has required fields', () => {
        DEFAULT_PENALTIES.forEach(p => {
            expect(p.id).toBeTruthy();
            expect(p.text).toBeTruthy();
            expect(p.penaltyMinutes).toBeGreaterThan(0);
            expect(p.icon).toBeTruthy();
            expect(typeof p.hasNextDayConsequence).toBe('boolean');
            expect(typeof p.multiUse).toBe('boolean');
            expect(Array.isArray(p.assignedTo)).toBe(true);
            expect(typeof p.xpPenalty).toBe('number');
        });
    });

    it('all penalties default to 0 XP penalty', () => {
        DEFAULT_PENALTIES.forEach(p => {
            expect(p.xpPenalty).toBe(0);
        });
    });
});

describe('DAY_LABELS', () => {
    it('has 7 days', () => {
        expect(DAY_LABELS).toHaveLength(7);
    });

    it('covers all day numbers 0-6', () => {
        const values = DAY_LABELS.map(d => d.value);
        expect(values).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
});

describe('generateId', () => {
    it('generates unique IDs', () => {
        const ids = new Set(Array.from({ length: 100 }, () => generateId()));
        expect(ids.size).toBe(100);
    });

    it('generates string IDs', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(5);
    });
});

describe('AVATAR_OPTIONS', () => {
    it('has at least 8 options', () => {
        expect(AVATAR_OPTIONS.length).toBeGreaterThanOrEqual(8);
    });
});

describe('ICON_OPTIONS', () => {
    it('has at least 16 options', () => {
        expect(ICON_OPTIONS.length).toBeGreaterThanOrEqual(16);
    });
});
