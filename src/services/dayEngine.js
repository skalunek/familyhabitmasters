/**
 * Day Engine — event-driven daily game logic for FamilyHabitMasters.
 *
 * Manages daily state: quest completion, bonus missions, penalties,
 * next-day consequence carry-over, XP tracking, and offline days.
 */

import { generateId } from '../data/defaults';

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Check if dateA is exactly the day before dateB (both YYYY-MM-DD strings).
 */
export function isYesterday(dateA, dateB) {
    const a = new Date(dateA + 'T00:00:00');
    const b = new Date(dateB + 'T00:00:00');
    const diffMs = b.getTime() - a.getTime();
    return diffMs === 86400000; // exactly 1 day
}

/**
 * Check if a date is an offline (no-screen) day.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {object} settings - must have offlineDaysSchedule and offlineDaysOverride
 */
export function isOfflineDay(dateStr, settings) {
    // Check override first (explicit on/off for specific dates)
    if (settings.offlineDaysOverride && settings.offlineDaysOverride[dateStr] !== undefined) {
        return !!settings.offlineDaysOverride[dateStr];
    }
    // Check weekly schedule (0=Sunday, 1=Monday, ..., 6=Saturday)
    if (settings.offlineDaysSchedule && settings.offlineDaysSchedule.length > 0) {
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
        return settings.offlineDaysSchedule.includes(dayOfWeek);
    }
    return false;
}

/**
 * Create a new DayLog from templates, carrying over effects from the previous day.
 * @param {string} date - YYYY-MM-DD
 * @param {object} templates - task templates
 * @param {object} settings - app settings
 * @param {string} childId - ID of the child (for assignedTo filtering)
 * @param {object|null} previousDayLog - previous day's log (carry-over source)
 */
export function createDayLog(date, templates, settings, childId = null, previousDayLog = null) {
    let adjustedBaseTime = settings.baseTime;
    const carryOverEffects = [];

    // Only carry over if previous log is from exactly yesterday
    if (previousDayLog && isYesterday(previousDayLog.date, date)) {
        // Penalties that carry over
        if (previousDayLog.penalties) {
            for (const penalty of previousDayLog.penalties) {
                if (penalty.carryToNextDay && penalty.nextDayPenalty > 0) {
                    carryOverEffects.push({
                        text: `Konsekwencja z wczoraj (uchybienie): "${penalty.text}" → −${penalty.nextDayPenalty} min`,
                        penaltyMinutes: penalty.nextDayPenalty,
                    });
                }
            }
        }

        // Failed quests that carry over
        if (previousDayLog.quests) {
            for (const quest of previousDayLog.quests) {
                if (quest.status === 'failed' && quest.hasNextDayConsequence && quest.nextDayPenalty > 0) {
                    carryOverEffects.push({
                        text: `Konsekwencja z wczoraj (quest): "${quest.text}" → −${quest.nextDayPenalty} min`,
                        penaltyMinutes: quest.nextDayPenalty,
                    });
                }
            }
        }

        // Bonuses that grant next-day extra time
        if (previousDayLog.bonuses) {
            for (const bonus of previousDayLog.bonuses) {
                if (bonus.hasNextDayConsequence && bonus.nextDayBonus > 0) {
                    carryOverEffects.push({
                        text: `Bonus z wczoraj: "${bonus.text}" → +${bonus.nextDayBonus} min`,
                        penaltyMinutes: -bonus.nextDayBonus,
                    });
                }
            }
        }

        // Deferred carry-overs from previous offline day(s)
        if (previousDayLog.deferredCarryOvers && previousDayLog.deferredCarryOvers.length > 0) {
            for (const deferred of previousDayLog.deferredCarryOvers) {
                carryOverEffects.push({
                    ...deferred,
                    text: deferred.text.replace(/z wczoraj/g, 'z poprzednich dni'),
                });
            }
        }
    }

    // Check offline day
    const offline = isOfflineDay(date, settings);
    const xpMultiplier = offline ? (settings.xpMultiplierOffline || 2) : 1;

    // On offline days: don't apply carry-over time effects, defer them to the next day
    if (!offline) {
        for (const eff of carryOverEffects) {
            adjustedBaseTime -= eff.penaltyMinutes;
        }
    }

    adjustedBaseTime = Math.max(0, Math.min(settings.maxTime, adjustedBaseTime));

    // Filter templates by child assignment
    const filterForChild = (list) => {
        if (!childId) return list;
        return list.filter(t => {
            if (!t.assignedTo || t.assignedTo.length === 0) return true;
            return t.assignedTo.includes('all') || t.assignedTo.includes(childId);
        });
    };

    const filteredQuests = filterForChild(templates.dailyQuests);

    return {
        date,
        baseTime: adjustedBaseTime,
        maxTime: settings.maxTime,
        currentTime: adjustedBaseTime,
        isOfflineDay: offline,
        xpMultiplier,
        xpEarned: 0,
        // On offline days, defer carry-overs so they apply on the next non-offline day
        deferredCarryOvers: offline ? carryOverEffects : [],
        quests: filteredQuests.map(q => ({
            id: generateId(), // unique instance ID
            templateId: q.id,
            text: q.text,
            category: q.category,
            penaltyMinutes: q.penaltyMinutes,
            icon: q.icon,
            hasNextDayConsequence: q.hasNextDayConsequence || false,
            nextDayPenalty: q.nextDayPenalty || 0,
            xpReward: q.xpReward || 0,
            status: 'pending', // 'pending' | 'done' | 'failed'
        })),
        bonuses: [],
        penalties: [],
        events: carryOverEffects.length > 0
            ? carryOverEffects.map(eff => ({
                id: generateId(),
                timestamp: Date.now(),
                text: offline
                    ? `⏭️ ${eff.text} (przesunięte na następny dzień z ekranami)`
                    : eff.text,
                type: 'info',
            }))
            : [],
        carryOverEffects,
    };
}

// ─── Quest Operations (ID-based) ───

/**
 * Complete a daily quest — doesn't change time, only marks as done.
 */
export function completeQuest(dayLog, questId) {
    const questIdx = dayLog.quests.findIndex(q => q.id === questId);
    if (questIdx === -1) return dayLog;
    const quest = dayLog.quests[questIdx];
    if (quest.status !== 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    updatedQuests[questIdx] = { ...quest, status: 'done' };

    const xpGain = (quest.xpReward || 0) * (dayLog.xpMultiplier || 1);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `✅ Ukończono: ${quest.text}${xpGain > 0 ? ` (+${xpGain} XP)` : ''}`,
        type: 'positive',
    };

    return {
        ...dayLog,
        quests: updatedQuests,
        xpEarned: (dayLog.xpEarned || 0) + xpGain,
        events: [...dayLog.events, event],
    };
}

/**
 * Fail a daily quest — deducts penalty minutes.
 */
export function failQuest(dayLog, questId) {
    const questIdx = dayLog.quests.findIndex(q => q.id === questId);
    if (questIdx === -1) return dayLog;
    const quest = dayLog.quests[questIdx];
    if (quest.status !== 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    updatedQuests[questIdx] = { ...quest, status: 'failed' };

    const newTime = Math.max(0, dayLog.currentTime - quest.penaltyMinutes);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `❌ Niewykonane: ${quest.text} → −${quest.penaltyMinutes} min`,
        type: 'negative',
    };

    return {
        ...dayLog,
        quests: updatedQuests,
        currentTime: newTime,
        events: [...dayLog.events, event],
    };
}

/**
 * Revert a quest back to pending state.
 */
export function revertQuest(dayLog, questId) {
    const questIdx = dayLog.quests.findIndex(q => q.id === questId);
    if (questIdx === -1) return dayLog;
    const quest = dayLog.quests[questIdx];
    if (quest.status === 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    let newTime = dayLog.currentTime;
    let xpDelta = 0;

    if (quest.status === 'failed') {
        newTime = Math.min(dayLog.maxTime, newTime + quest.penaltyMinutes);
    }
    if (quest.status === 'done') {
        xpDelta = -((quest.xpReward || 0) * (dayLog.xpMultiplier || 1));
    }

    updatedQuests[questIdx] = { ...quest, status: 'pending' };

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `↩️ Cofnięto: ${quest.text}`,
        type: 'info',
    };

    return {
        ...dayLog,
        quests: updatedQuests,
        currentTime: newTime,
        xpEarned: (dayLog.xpEarned || 0) + xpDelta,
        events: [...dayLog.events, event],
    };
}

// ─── Bonus Operations (ID-based) ───

/**
 * Complete a bonus mission — adds reward minutes (capped at maxTime).
 */
export function completeBonusMission(dayLog, missionTemplate) {
    const newTime = Math.min(dayLog.maxTime, dayLog.currentTime + missionTemplate.rewardMinutes);
    const xpGain = (missionTemplate.xpReward || 0) * (dayLog.xpMultiplier || 1);

    const bonusEntry = {
        id: generateId(),
        templateId: missionTemplate.id,
        text: missionTemplate.text,
        rewardMinutes: missionTemplate.rewardMinutes,
        hasNextDayConsequence: missionTemplate.hasNextDayConsequence || false,
        nextDayBonus: missionTemplate.nextDayBonus || 0,
        xpReward: missionTemplate.xpReward || 0,
        completedAt: Date.now(),
    };

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `⭐ Bonus: ${missionTemplate.text} → +${missionTemplate.rewardMinutes} min${xpGain > 0 ? ` (+${xpGain} XP)` : ''}`,
        type: 'positive',
    };

    return {
        ...dayLog,
        currentTime: newTime,
        bonuses: [...dayLog.bonuses, bonusEntry],
        xpEarned: (dayLog.xpEarned || 0) + xpGain,
        events: [...dayLog.events, event],
    };
}

/**
 * Withdraw a bonus mission by ID.
 */
export function withdrawBonus(dayLog, bonusId) {
    const bonus = dayLog.bonuses.find(b => b.id === bonusId);
    if (!bonus) return dayLog;

    const newTime = Math.max(0, dayLog.currentTime - bonus.rewardMinutes);
    const xpLoss = (bonus.xpReward || 0) * (dayLog.xpMultiplier || 1);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `↩️ Wycofano bonus: ${bonus.text} → −${bonus.rewardMinutes} min`,
        type: 'info',
    };

    return {
        ...dayLog,
        currentTime: newTime,
        bonuses: dayLog.bonuses.filter(b => b.id !== bonusId),
        xpEarned: (dayLog.xpEarned || 0) - xpLoss,
        events: [...dayLog.events, event],
    };
}

// ─── Penalty Operations (ID-based) ───

/**
 * Apply a penalty (uchybienie).
 */
export function applyPenalty(dayLog, penaltyTemplate, carryToNextDay = false) {
    const newTime = Math.max(0, dayLog.currentTime - penaltyTemplate.penaltyMinutes);
    const xpLoss = (penaltyTemplate.xpPenalty || 0) * (dayLog.xpMultiplier || 1);

    const penaltyEntry = {
        id: generateId(),
        templateId: penaltyTemplate.id,
        text: penaltyTemplate.text,
        penaltyMinutes: penaltyTemplate.penaltyMinutes,
        hasNextDayConsequence: penaltyTemplate.hasNextDayConsequence,
        nextDayPenalty: penaltyTemplate.nextDayPenalty || 0,
        carryToNextDay: carryToNextDay && penaltyTemplate.hasNextDayConsequence,
        xpPenalty: penaltyTemplate.xpPenalty || 0,
        appliedAt: Date.now(),
    };

    let eventText = `⚠️ Uchybienie: ${penaltyTemplate.text} → −${penaltyTemplate.penaltyMinutes} min`;
    if (carryToNextDay && penaltyTemplate.hasNextDayConsequence) {
        eventText += ` (+ konsekwencja na jutro: −${penaltyTemplate.nextDayPenalty} min)`;
    }
    if (xpLoss > 0) {
        eventText += ` (−${xpLoss} XP)`;
    }

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: eventText,
        type: 'negative',
    };

    return {
        ...dayLog,
        currentTime: newTime,
        penalties: [...dayLog.penalties, penaltyEntry],
        xpEarned: (dayLog.xpEarned || 0) - xpLoss,
        events: [...dayLog.events, event],
    };
}

/**
 * Remove a penalty by ID — only parent can do this.
 */
export function removePenalty(dayLog, penaltyId) {
    const penalty = dayLog.penalties.find(p => p.id === penaltyId);
    if (!penalty) return dayLog;

    const newTime = Math.min(dayLog.maxTime, dayLog.currentTime + penalty.penaltyMinutes);
    const xpRestore = (penalty.xpPenalty || 0) * (dayLog.xpMultiplier || 1);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `↩️ Usunięto uchybienie: ${penalty.text} → +${penalty.penaltyMinutes} min`,
        type: 'info',
    };

    return {
        ...dayLog,
        currentTime: newTime,
        penalties: dayLog.penalties.filter(p => p.id !== penaltyId),
        xpEarned: (dayLog.xpEarned || 0) + xpRestore,
        events: [...dayLog.events, event],
    };
}

// ─── Summary & Compaction ───

/**
 * Calculate summary stats for a day.
 */
export function calculateDaySummary(dayLog) {
    const completedQuests = dayLog.quests.filter(q => q.status === 'done').length;
    const failedQuests = dayLog.quests.filter(q => q.status === 'failed').length;
    const totalQuests = dayLog.quests.length;
    const totalBonusMinutes = dayLog.bonuses.reduce((sum, b) => sum + b.rewardMinutes, 0);
    const totalPenaltyMinutes = dayLog.penalties.reduce((sum, p) => sum + p.penaltyMinutes, 0);
    const questPenaltyMinutes = dayLog.quests
        .filter(q => q.status === 'failed')
        .reduce((sum, q) => sum + q.penaltyMinutes, 0);
    const nextDayCarryOvers = dayLog.penalties.filter(p => p.carryToNextDay);

    return {
        completedQuests,
        failedQuests,
        totalQuests,
        totalBonusMinutes,
        totalPenaltyMinutes,
        questPenaltyMinutes,
        finalTime: dayLog.currentTime,
        baseTime: dayLog.baseTime,
        maxTime: dayLog.maxTime,
        xpEarned: dayLog.xpEarned || 0,
        nextDayCarryOvers,
    };
}

/**
 * Compact a day log for long-term storage (remove events and full lists,
 * keep only statistical summary). Used for logs older than 14 days.
 */
export function compactDayLog(dayLog) {
    const summary = calculateDaySummary(dayLog);
    return {
        date: dayLog.date,
        isCompacted: true,
        baseTime: dayLog.baseTime,
        finalTime: dayLog.currentTime,
        maxTime: dayLog.maxTime,
        xpEarned: dayLog.xpEarned || 0,
        isOfflineDay: dayLog.isOfflineDay || false,
        questsCompleted: summary.completedQuests,
        questsFailed: summary.failedQuests,
        totalQuests: summary.totalQuests,
        bonusesEarned: dayLog.bonuses.length,
        totalBonusMinutes: summary.totalBonusMinutes,
        penaltiesTaken: dayLog.penalties.length,
        totalPenaltyMinutes: summary.totalPenaltyMinutes,
    };
}

/**
 * Compact all day logs older than `retentionDays` for a given child.
 * Returns a new childLogs object with old logs replaced by compacted versions.
 */
export function compactOldLogs(childLogs, retentionDays = 14) {
    const today = new Date(getTodayStr() + 'T00:00:00');
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = {};
    for (const [dateStr, log] of Object.entries(childLogs)) {
        if (log.isCompacted) {
            result[dateStr] = log; // already compacted
            continue;
        }
        const logDate = new Date(dateStr + 'T00:00:00');
        if (logDate < cutoff) {
            result[dateStr] = compactDayLog(log);
        } else {
            result[dateStr] = log;
        }
    }
    return result;
}

/**
 * Compute the child's current level from total XP and level thresholds.
 * @returns {{ level: number, currentXp: number, nextLevelXp: number, reward: string|null }}
 */
export function computeLevel(totalXp, levelThresholds = []) {
    if (!levelThresholds.length) {
        return { level: 0, currentXp: totalXp, nextLevelXp: 0, reward: null, progress: 0 };
    }

    let level = 0;
    let reward = null;
    let prevThreshold = 0;

    for (const threshold of levelThresholds) {
        if (totalXp >= threshold.xp) {
            level = threshold.level;
            reward = threshold.reward;
            prevThreshold = threshold.xp;
        } else {
            break;
        }
    }

    const nextThreshold = levelThresholds.find(t => t.xp > totalXp);
    const nextLevelXp = nextThreshold ? nextThreshold.xp : prevThreshold;
    const progress = nextThreshold
        ? (totalXp - prevThreshold) / (nextThreshold.xp - prevThreshold)
        : 1;

    return {
        level,
        currentXp: totalXp,
        nextLevelXp,
        nextReward: nextThreshold?.reward || null,
        currentReward: reward,
        progress: Math.min(1, Math.max(0, progress)),
    };
}
