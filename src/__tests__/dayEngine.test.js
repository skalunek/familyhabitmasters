/**
 * Tests for dayEngine.js — core game logic.
 */
import { describe, it, expect } from 'vitest';
import {
    getTodayStr,
    createDayLog,
    completeQuest,
    failQuest,
    revertQuest,
    completeBonusMission,
    withdrawBonus,
    applyPenalty,
    removePenalty,
    calculateDaySummary,
} from '../services/dayEngine';
import {
    DEFAULT_SETTINGS,
    DEFAULT_DAILY_QUESTS,
    DEFAULT_BONUS_MISSIONS,
    DEFAULT_PENALTIES,
} from '../data/defaults';

const templates = {
    dailyQuests: DEFAULT_DAILY_QUESTS,
    bonusMissions: DEFAULT_BONUS_MISSIONS,
    penalties: DEFAULT_PENALTIES,
};

describe('getTodayStr', () => {
    it('returns a YYYY-MM-DD formatted string', () => {
        const today = getTodayStr();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('createDayLog', () => {
    it('creates a day log with correct base time', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.date).toBe('2025-01-15');
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime);
        expect(log.currentTime).toBe(DEFAULT_SETTINGS.baseTime);
        expect(log.maxTime).toBe(DEFAULT_SETTINGS.maxTime);
    });

    it('creates quests from templates', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.quests).toHaveLength(DEFAULT_DAILY_QUESTS.length);
        expect(log.quests[0].status).toBe('pending');
        expect(log.quests[0].text).toBe(DEFAULT_DAILY_QUESTS[0].text);
    });

    it('starts with empty bonuses, penalties, and events', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.bonuses).toHaveLength(0);
        expect(log.penalties).toHaveLength(0);
        expect(log.events).toHaveLength(0);
    });

    it('carries over penalty consequences from previous day', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        // Manually add a penalty with carry-over
        prevLog.penalties.push({
            id: 'test-penalty',
            text: 'Test penalty',
            penaltyMinutes: 10,
            carryToNextDay: true,
            nextDayPenalty: 15,
        });

        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime - 15);
        expect(log.carryOverEffects).toHaveLength(1);
        expect(log.carryOverEffects[0].penaltyMinutes).toBe(15);
    });

    it('carries over failed quest consequences from previous day', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        // Mark a quest with carry-over as failed
        const questIdx = prevLog.quests.findIndex(q => q.hasNextDayConsequence);
        if (questIdx >= 0) {
            prevLog.quests[questIdx].status = 'failed';
            const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, prevLog);
            expect(log.baseTime).toBeLessThan(DEFAULT_SETTINGS.baseTime);
        }
    });

    it('carries over bonus consequences from previous day', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        prevLog.bonuses.push({
            id: 'test-bonus',
            text: 'Test bonus',
            rewardMinutes: 10,
            hasNextDayConsequence: true,
            nextDayBonus: 5,
        });

        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime + 5);
    });

    it('clamps adjusted base time to valid range', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        // Add many penalties to push below 0
        for (let i = 0; i < 10; i++) {
            prevLog.penalties.push({
                id: `pen-${i}`,
                text: `Penalty ${i}`,
                penaltyMinutes: 10,
                carryToNextDay: true,
                nextDayPenalty: 20,
            });
        }

        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, prevLog);
        expect(log.baseTime).toBeGreaterThanOrEqual(0);
    });
});

describe('Quest operations', () => {
    let dayLog;

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('completeQuest marks quest as done', () => {
        const updated = completeQuest(dayLog, 0);
        expect(updated.quests[0].status).toBe('done');
        expect(updated.currentTime).toBe(dayLog.currentTime); // no time change
        expect(updated.events).toHaveLength(1);
        expect(updated.events[0].type).toBe('positive');
    });

    it('completeQuest does not change already completed quest', () => {
        const step1 = completeQuest(dayLog, 0);
        const step2 = completeQuest(step1, 0);
        expect(step2).toBe(step1); // reference equality
    });

    it('failQuest marks quest as failed and deducts time', () => {
        const updated = failQuest(dayLog, 0);
        expect(updated.quests[0].status).toBe('failed');
        expect(updated.currentTime).toBe(dayLog.currentTime - dayLog.quests[0].penaltyMinutes);
        expect(updated.events).toHaveLength(1);
        expect(updated.events[0].type).toBe('negative');
    });

    it('failQuest time does not go below 0', () => {
        dayLog.currentTime = 3;
        const quest = dayLog.quests[0];
        expect(quest.penaltyMinutes).toBeGreaterThan(3);
        const updated = failQuest(dayLog, 0);
        expect(updated.currentTime).toBe(0);
    });

    it('revertQuest restores pending status and time for failed quest', () => {
        const failed = failQuest(dayLog, 0);
        const reverted = revertQuest(failed, 0);
        expect(reverted.quests[0].status).toBe('pending');
        expect(reverted.currentTime).toBe(dayLog.currentTime);
    });

    it('revertQuest restores pending status for completed quest (no time change)', () => {
        const completed = completeQuest(dayLog, 0);
        const reverted = revertQuest(completed, 0);
        expect(reverted.quests[0].status).toBe('pending');
        expect(reverted.currentTime).toBe(dayLog.currentTime);
    });
});

describe('Bonus operations', () => {
    let dayLog;
    const bonusTemplate = DEFAULT_BONUS_MISSIONS[0];

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('completeBonusMission adds bonus and time', () => {
        const updated = completeBonusMission(dayLog, bonusTemplate);
        expect(updated.bonuses).toHaveLength(1);
        expect(updated.currentTime).toBe(dayLog.currentTime + bonusTemplate.rewardMinutes);
        expect(updated.events).toHaveLength(1);
        expect(updated.events[0].type).toBe('positive');
    });

    it('completeBonusMission caps at maxTime', () => {
        dayLog.currentTime = DEFAULT_SETTINGS.maxTime - 2;
        const updated = completeBonusMission(dayLog, bonusTemplate);
        expect(updated.currentTime).toBe(DEFAULT_SETTINGS.maxTime);
    });

    it('withdrawBonus removes bonus and deducts time', () => {
        const withBonus = completeBonusMission(dayLog, bonusTemplate);
        const withdrawn = withdrawBonus(withBonus, 0);
        expect(withdrawn.bonuses).toHaveLength(0);
        expect(withdrawn.currentTime).toBe(dayLog.currentTime);
        expect(withdrawn.events).toHaveLength(2); // add + withdraw
    });
});

describe('Penalty operations', () => {
    let dayLog;
    const penaltyTemplate = DEFAULT_PENALTIES[0];

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('applyPenalty deducts time and records penalty', () => {
        const updated = applyPenalty(dayLog, penaltyTemplate, false);
        expect(updated.penalties).toHaveLength(1);
        expect(updated.currentTime).toBe(dayLog.currentTime - penaltyTemplate.penaltyMinutes);
        expect(updated.events).toHaveLength(1);
        expect(updated.events[0].type).toBe('negative');
    });

    it('applyPenalty with carryToNextDay flag', () => {
        const penaltyWithCarry = { ...DEFAULT_PENALTIES[2] }; // Uwaga w dzienniku, hasNextDay=true
        const updated = applyPenalty(dayLog, penaltyWithCarry, true);
        expect(updated.penalties[0].carryToNextDay).toBe(true);
    });

    it('removePenalty restores time and removes penalty', () => {
        const withPenalty = applyPenalty(dayLog, penaltyTemplate, false);
        const removed = removePenalty(withPenalty, 0);
        expect(removed.penalties).toHaveLength(0);
        expect(removed.currentTime).toBe(dayLog.currentTime);
    });
});

describe('calculateDaySummary', () => {
    it('calculates correct summary', () => {
        let dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        dayLog = completeQuest(dayLog, 0);
        dayLog = completeQuest(dayLog, 1);
        dayLog = failQuest(dayLog, 2);
        dayLog = completeBonusMission(dayLog, DEFAULT_BONUS_MISSIONS[0]);
        dayLog = applyPenalty(dayLog, DEFAULT_PENALTIES[0], false);

        const summary = calculateDaySummary(dayLog);
        expect(summary.completedQuests).toBe(2);
        expect(summary.failedQuests).toBe(1);
        expect(summary.totalQuests).toBe(DEFAULT_DAILY_QUESTS.length);
        expect(summary.totalBonusMinutes).toBe(DEFAULT_BONUS_MISSIONS[0].rewardMinutes);
        expect(summary.totalPenaltyMinutes).toBe(DEFAULT_PENALTIES[0].penaltyMinutes);
    });
});
