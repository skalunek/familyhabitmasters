/**
 * Tests for dayEngine.js — core game logic.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    getTodayStr,
    isYesterday,
    isOfflineDay,
    createDayLog,
    completeQuest,
    failQuest,
    revertQuest,
    completeBonusMission,
    withdrawBonus,
    applyPenalty,
    removePenalty,
    calculateDaySummary,
    compactDayLog,
    compactOldLogs,
    computeLevel,
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

describe('isYesterday', () => {
    it('returns true when dateA is exactly 1 day before dateB', () => {
        expect(isYesterday('2025-01-14', '2025-01-15')).toBe(true);
    });

    it('returns false for same day', () => {
        expect(isYesterday('2025-01-15', '2025-01-15')).toBe(false);
    });

    it('returns false when gap is >1 day', () => {
        expect(isYesterday('2025-01-13', '2025-01-15')).toBe(false);
    });

    it('handles month boundaries', () => {
        expect(isYesterday('2025-01-31', '2025-02-01')).toBe(true);
        expect(isYesterday('2025-01-30', '2025-02-01')).toBe(false);
    });
});

describe('isOfflineDay', () => {
    it('returns false with empty schedule', () => {
        expect(isOfflineDay('2025-01-15', DEFAULT_SETTINGS)).toBe(false);
    });

    it('returns true when day matches schedule', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3] }; // Wednesday
        // 2025-01-15 is a Wednesday
        expect(isOfflineDay('2025-01-15', settings)).toBe(true);
    });

    it('override takes precedence over schedule', () => {
        const settings = {
            ...DEFAULT_SETTINGS,
            offlineDaysSchedule: [3],
            offlineDaysOverride: { '2025-01-15': false },
        };
        expect(isOfflineDay('2025-01-15', settings)).toBe(false);
    });

    it('override can enable offline on a normally online day', () => {
        const settings = {
            ...DEFAULT_SETTINGS,
            offlineDaysSchedule: [],
            offlineDaysOverride: { '2025-01-16': true },
        };
        expect(isOfflineDay('2025-01-16', settings)).toBe(true);
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

    it('creates quests with unique IDs', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.quests.length).toBeGreaterThan(0);
        const ids = log.quests.map(q => q.id);
        expect(new Set(ids).size).toBe(ids.length); // all unique
        expect(log.quests[0].status).toBe('pending');
    });

    it('initializes XP fields', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.xpEarned).toBe(0);
        expect(log.isOfflineDay).toBe(false);
        expect(log.xpMultiplier).toBe(1);
    });

    it('filters quests by childId when assignedTo is set', () => {
        const customTemplates = {
            ...templates,
            dailyQuests: [
                { id: 'q1', text: 'All', category: 'morning', penaltyMinutes: 10, icon: '📋', hasNextDayConsequence: false, nextDayPenalty: 0, assignedTo: ['all'] },
                { id: 'q2', text: 'ChildA', category: 'morning', penaltyMinutes: 10, icon: '📋', hasNextDayConsequence: false, nextDayPenalty: 0, assignedTo: ['child-a'] },
                { id: 'q3', text: 'ChildB', category: 'morning', penaltyMinutes: 10, icon: '📋', hasNextDayConsequence: false, nextDayPenalty: 0, assignedTo: ['child-b'] },
            ],
        };
        const log = createDayLog('2025-01-15', customTemplates, DEFAULT_SETTINGS, 'child-a');
        expect(log.quests).toHaveLength(2); // q1 (all) + q2 (child-a)
        expect(log.quests.map(q => q.templateId)).toEqual(['q1', 'q2']);
    });

    it('carries over penalty consequences ONLY from yesterday', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        prevLog.penalties.push({
            id: 'p1', text: 'Test', penaltyMinutes: 10,
            carryToNextDay: true, nextDayPenalty: 15,
        });

        // From yesterday → carries over
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, null, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime - 15);
        expect(log.carryOverEffects).toHaveLength(1);
    });

    it('does NOT carry over from 2+ days ago', () => {
        const prevLog = createDayLog('2025-01-13', templates, DEFAULT_SETTINGS);
        prevLog.penalties.push({
            id: 'p1', text: 'Test', penaltyMinutes: 10,
            carryToNextDay: true, nextDayPenalty: 15,
        });

        // 2 days gap → NO carry-over
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, null, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime); // unchanged
        expect(log.carryOverEffects).toHaveLength(0);
    });

    it('carries over bonus consequences from yesterday', () => {
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        prevLog.bonuses.push({
            id: 'b1', text: 'Test', rewardMinutes: 10,
            hasNextDayConsequence: true, nextDayBonus: 5,
        });

        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS, null, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime + 5);
    });

    it('marks offline days correctly', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3] };
        const log = createDayLog('2025-01-15', templates, settings); // Wednesday
        expect(log.isOfflineDay).toBe(true);
        expect(log.xpMultiplier).toBe(2);
    });

    it('does NOT apply carry-over to time on offline days', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3] }; // Wed
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS); // Tue non-offline
        prevLog.penalties.push({
            id: 'p1', text: 'Test', penaltyMinutes: 10,
            carryToNextDay: true, nextDayPenalty: 15,
        });

        // Wed = offline: carry-over should NOT reduce base time
        const log = createDayLog('2025-01-15', templates, settings, null, prevLog);
        expect(log.baseTime).toBe(DEFAULT_SETTINGS.baseTime); // unchanged!
        expect(log.isOfflineDay).toBe(true);
        expect(log.deferredCarryOvers).toHaveLength(1);
        expect(log.deferredCarryOvers[0].penaltyMinutes).toBe(15);
    });

    it('chains deferred carry-overs through consecutive offline days', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3, 4] }; // Wed, Thu
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS); // Tue
        prevLog.penalties.push({
            id: 'p1', text: 'Test', penaltyMinutes: 10,
            carryToNextDay: true, nextDayPenalty: 15,
        });

        // Wed (offline): deferred
        const wedLog = createDayLog('2025-01-15', templates, settings, null, prevLog);
        expect(wedLog.deferredCarryOvers).toHaveLength(1);

        // Thu (also offline): still deferred, chained from Wed
        const thuLog = createDayLog('2025-01-16', templates, settings, null, wedLog);
        expect(thuLog.deferredCarryOvers).toHaveLength(1);
        expect(thuLog.baseTime).toBe(DEFAULT_SETTINGS.baseTime); // still unchanged

        // Fri (non-offline): deferred carry-overs finally applied
        const friLog = createDayLog('2025-01-17', templates, DEFAULT_SETTINGS, null, thuLog);
        expect(friLog.deferredCarryOvers).toHaveLength(0);
        expect(friLog.baseTime).toBe(DEFAULT_SETTINGS.baseTime - 15); // applied!
    });

    it('initializes deferredCarryOvers as empty on non-offline days', () => {
        const log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        expect(log.deferredCarryOvers).toEqual([]);
    });

    it('offline day events show deferred notice', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3] };
        const prevLog = createDayLog('2025-01-14', templates, DEFAULT_SETTINGS);
        prevLog.penalties.push({
            id: 'p1', text: 'Kara', penaltyMinutes: 10,
            carryToNextDay: true, nextDayPenalty: 15,
        });

        const log = createDayLog('2025-01-15', templates, settings, null, prevLog);
        expect(log.events[0].text).toContain('przesunięte na następny dzień z ekranami');
    });
});

describe('Quest operations (ID-based)', () => {
    let dayLog;

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('completeQuest marks quest as done by ID', () => {
        const questId = dayLog.quests[0].id;
        const updated = completeQuest(dayLog, questId);
        expect(updated.quests[0].status).toBe('done');
        expect(updated.events).toHaveLength(1);
    });

    it('completeQuest adds XP', () => {
        const questId = dayLog.quests[0].id;
        const xpReward = dayLog.quests[0].xpReward || 0;
        const updated = completeQuest(dayLog, questId);
        expect(updated.xpEarned).toBe(xpReward);
    });

    it('completeQuest ignores non-pending quest', () => {
        const questId = dayLog.quests[0].id;
        const step1 = completeQuest(dayLog, questId);
        const step2 = completeQuest(step1, questId);
        expect(step2).toBe(step1); // unchanged
    });

    it('completeQuest ignores unknown ID', () => {
        const result = completeQuest(dayLog, 'nonexistent');
        expect(result).toBe(dayLog);
    });

    it('failQuest deducts time by ID', () => {
        const questId = dayLog.quests[0].id;
        const updated = failQuest(dayLog, questId);
        expect(updated.quests[0].status).toBe('failed');
        expect(updated.currentTime).toBe(dayLog.currentTime - dayLog.quests[0].penaltyMinutes);
    });

    it('failQuest clamps to 0', () => {
        dayLog.currentTime = 3;
        const questId = dayLog.quests[0].id;
        const updated = failQuest(dayLog, questId);
        expect(updated.currentTime).toBe(0);
    });

    it('revertQuest restores pending from failed', () => {
        const questId = dayLog.quests[0].id;
        const failed = failQuest(dayLog, questId);
        const reverted = revertQuest(failed, questId);
        expect(reverted.quests[0].status).toBe('pending');
        expect(reverted.currentTime).toBe(dayLog.currentTime);
    });

    it('revertQuest restores pending from done and removes XP', () => {
        const questId = dayLog.quests[0].id;
        const completed = completeQuest(dayLog, questId);
        const xpBefore = completed.xpEarned;
        const reverted = revertQuest(completed, questId);
        expect(reverted.quests[0].status).toBe('pending');
        expect(reverted.xpEarned).toBe(0);
    });
});

describe('Bonus operations (ID-based)', () => {
    let dayLog;
    const bonusTemplate = DEFAULT_BONUS_MISSIONS[0];

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('completeBonusMission adds bonus and time', () => {
        const updated = completeBonusMission(dayLog, bonusTemplate);
        expect(updated.bonuses).toHaveLength(1);
        expect(updated.currentTime).toBe(dayLog.currentTime + bonusTemplate.rewardMinutes);
    });

    it('completeBonusMission caps at maxTime', () => {
        dayLog.currentTime = DEFAULT_SETTINGS.maxTime - 2;
        const updated = completeBonusMission(dayLog, bonusTemplate);
        expect(updated.currentTime).toBe(DEFAULT_SETTINGS.maxTime);
    });

    it('withdrawBonus removes bonus by ID', () => {
        const withBonus = completeBonusMission(dayLog, bonusTemplate);
        const bonusId = withBonus.bonuses[0].id;
        const withdrawn = withdrawBonus(withBonus, bonusId);
        expect(withdrawn.bonuses).toHaveLength(0);
        expect(withdrawn.currentTime).toBe(dayLog.currentTime);
    });

    it('withdrawBonus ignores unknown ID', () => {
        const withBonus = completeBonusMission(dayLog, bonusTemplate);
        const result = withdrawBonus(withBonus, 'nonexistent');
        expect(result).toBe(withBonus);
    });
});

describe('Penalty operations (ID-based)', () => {
    let dayLog;
    const penaltyTemplate = DEFAULT_PENALTIES[0];

    beforeEach(() => {
        dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
    });

    it('applyPenalty deducts time', () => {
        const updated = applyPenalty(dayLog, penaltyTemplate, false);
        expect(updated.penalties).toHaveLength(1);
        expect(updated.currentTime).toBe(dayLog.currentTime - penaltyTemplate.penaltyMinutes);
    });

    it('removePenalty restores time by ID', () => {
        const withPenalty = applyPenalty(dayLog, penaltyTemplate, false);
        const penaltyId = withPenalty.penalties[0].id;
        const removed = removePenalty(withPenalty, penaltyId);
        expect(removed.penalties).toHaveLength(0);
        expect(removed.currentTime).toBe(dayLog.currentTime);
    });

    it('removePenalty ignores unknown ID', () => {
        const withPenalty = applyPenalty(dayLog, penaltyTemplate, false);
        const result = removePenalty(withPenalty, 'nonexistent');
        expect(result).toBe(withPenalty);
    });
});

describe('XP with offline multiplier', () => {
    it('doubles XP on offline day', () => {
        const settings = { ...DEFAULT_SETTINGS, offlineDaysSchedule: [3] };
        const log = createDayLog('2025-01-15', templates, settings); // Wed
        expect(log.xpMultiplier).toBe(2);

        const questId = log.quests[0].id;
        const xpReward = log.quests[0].xpReward || 0;
        const updated = completeQuest(log, questId);
        expect(updated.xpEarned).toBe(xpReward * 2);
    });
});

describe('compactDayLog', () => {
    it('produces a compact object with stats', () => {
        let log = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        log = completeQuest(log, log.quests[0].id);
        log = failQuest(log, log.quests[1].id);
        log = completeBonusMission(log, DEFAULT_BONUS_MISSIONS[0]);

        const compact = compactDayLog(log);
        expect(compact.isCompacted).toBe(true);
        expect(compact.date).toBe('2025-01-15');
        expect(compact.questsCompleted).toBe(1);
        expect(compact.questsFailed).toBe(1);
        expect(compact.totalQuests).toBe(log.quests.length);
        expect(compact.bonusesEarned).toBe(1);
        expect(compact).not.toHaveProperty('events');
        expect(compact).not.toHaveProperty('quests');
    });
});

describe('compactOldLogs', () => {
    it('compacts logs older than retention period', () => {
        const childLogs = {
            '2020-01-01': createDayLog('2020-01-01', templates, DEFAULT_SETTINGS),
            [getTodayStr()]: createDayLog(getTodayStr(), templates, DEFAULT_SETTINGS),
        };

        const result = compactOldLogs(childLogs, 14);
        expect(result['2020-01-01'].isCompacted).toBe(true);
        expect(result[getTodayStr()].isCompacted).toBeUndefined();
    });

    it('preserves already compacted logs', () => {
        const childLogs = {
            '2020-01-01': { date: '2020-01-01', isCompacted: true, totalQuests: 5 },
        };
        const result = compactOldLogs(childLogs, 14);
        expect(result['2020-01-01']).toBe(childLogs['2020-01-01']);
    });
});

describe('computeLevel', () => {
    const thresholds = [
        { level: 1, xp: 500, reward: '🍦 Lody' },
        { level: 2, xp: 1500, reward: '📖 Książka' },
        { level: 3, xp: 3000, reward: '🎮 Gra' },
    ];

    it('returns level 0 for 0 XP', () => {
        const info = computeLevel(0, thresholds);
        expect(info.level).toBe(0);
        expect(info.nextLevelXp).toBe(500);
    });

    it('returns correct level at threshold', () => {
        const info = computeLevel(500, thresholds);
        expect(info.level).toBe(1);
        expect(info.currentReward).toBe('🍦 Lody');
    });

    it('returns correct level between thresholds', () => {
        const info = computeLevel(1000, thresholds);
        expect(info.level).toBe(1);
        expect(info.nextLevelXp).toBe(1500);
        expect(info.progress).toBeCloseTo(0.5);
    });

    it('returns max level when past all thresholds', () => {
        const info = computeLevel(5000, thresholds);
        expect(info.level).toBe(3);
        expect(info.progress).toBe(1);
    });
});

describe('calculateDaySummary', () => {
    it('calculates correct summary with XP', () => {
        let dayLog = createDayLog('2025-01-15', templates, DEFAULT_SETTINGS);
        dayLog = completeQuest(dayLog, dayLog.quests[0].id);
        dayLog = completeQuest(dayLog, dayLog.quests[1].id);
        dayLog = failQuest(dayLog, dayLog.quests[2].id);
        dayLog = completeBonusMission(dayLog, DEFAULT_BONUS_MISSIONS[0]);
        dayLog = applyPenalty(dayLog, DEFAULT_PENALTIES[0], false);

        const summary = calculateDaySummary(dayLog);
        expect(summary.completedQuests).toBe(2);
        expect(summary.failedQuests).toBe(1);
        expect(summary.totalQuests).toBe(dayLog.quests.length);
        expect(summary.totalBonusMinutes).toBe(DEFAULT_BONUS_MISSIONS[0].rewardMinutes);
        expect(summary.totalPenaltyMinutes).toBe(DEFAULT_PENALTIES[0].penaltyMinutes);
        expect(summary.xpEarned).toBeGreaterThanOrEqual(0);
    });
});
