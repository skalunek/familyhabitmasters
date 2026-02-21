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
    generateId,
} from '../data/defaults';

describe('DEFAULT_SETTINGS', () => {
    it('has required fields', () => {
        expect(DEFAULT_SETTINGS.baseTime).toBeGreaterThan(0);
        expect(DEFAULT_SETTINGS.maxTime).toBeGreaterThan(DEFAULT_SETTINGS.baseTime);
        expect(DEFAULT_SETTINGS.timeStep).toBeGreaterThan(0);
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
        });
    });

    it('has quests in known categories', () => {
        const categories = Object.keys(CATEGORY_LABELS);
        DEFAULT_DAILY_QUESTS.forEach(q => {
            expect(categories).toContain(q.category);
        });
    });

    it('includes a boss category quest', () => {
        const bossQuests = DEFAULT_DAILY_QUESTS.filter(q => q.category === 'boss');
        expect(bossQuests.length).toBeGreaterThan(0);
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
        });
    });
});

describe('generateId', () => {
    it('generates unique IDs', () => {
        const id1 = generateId();
        const id2 = generateId();
        expect(id1).not.toBe(id2);
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
