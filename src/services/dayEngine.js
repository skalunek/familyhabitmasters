/**
 * Day Engine — event-driven daily game logic for FamilyHabitMasters.
 *
 * Manages daily state: quest completion, bonus missions, penalties,
 * and next-day consequence carry-over.
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
 * Create a new DayLog from templates, carrying over effects from the previous day.
 */
export function createDayLog(date, templates, settings, previousDayLog = null) {
    // Calculate base time, applying next-day consequences
    let adjustedBaseTime = settings.baseTime;
    const carryOverEffects = [];

    if (previousDayLog) {
        // Check penalties that carry over to next day
        for (const penalty of previousDayLog.penalties) {
            if (penalty.carryToNextDay && penalty.nextDayPenalty > 0) {
                adjustedBaseTime -= penalty.nextDayPenalty;
                carryOverEffects.push({
                    text: `Konsekwencja z wczoraj: "${penalty.text}" → −${penalty.nextDayPenalty} min od czasu bazowego`,
                    penaltyMinutes: penalty.nextDayPenalty,
                });
            }
        }
    }

    adjustedBaseTime = Math.max(0, adjustedBaseTime);

    return {
        date,
        baseTime: adjustedBaseTime,
        maxTime: settings.maxTime,
        currentTime: adjustedBaseTime,
        quests: templates.dailyQuests.map(q => ({
            templateId: q.id,
            text: q.text,
            category: q.category,
            penaltyMinutes: q.penaltyMinutes,
            icon: q.icon,
            status: 'pending', // 'pending' | 'done' | 'failed'
        })),
        bonuses: [],
        penalties: [],
        events: carryOverEffects.length > 0
            ? carryOverEffects.map(eff => ({
                id: generateId(),
                timestamp: Date.now(),
                text: eff.text,
                type: 'info',
            }))
            : [],
        carryOverEffects,
    };
}

/**
 * Complete a daily quest (doesn't change time — quests only penalize on failure).
 */
export function completeQuest(dayLog, questIndex) {
    const quest = dayLog.quests[questIndex];
    if (!quest || quest.status !== 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    updatedQuests[questIndex] = { ...quest, status: 'done' };

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `✅ Ukończono: ${quest.text}`,
        type: 'positive',
    };

    return {
        ...dayLog,
        quests: updatedQuests,
        events: [...dayLog.events, event],
    };
}

/**
 * Fail a daily quest — deducts penalty minutes from current time.
 */
export function failQuest(dayLog, questIndex) {
    const quest = dayLog.quests[questIndex];
    if (!quest || quest.status !== 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    updatedQuests[questIndex] = { ...quest, status: 'failed' };

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
export function revertQuest(dayLog, questIndex) {
    const quest = dayLog.quests[questIndex];
    if (!quest || quest.status === 'pending') return dayLog;

    const updatedQuests = [...dayLog.quests];
    let newTime = dayLog.currentTime;

    // If quest was failed, restore the penalty
    if (quest.status === 'failed') {
        newTime = Math.min(dayLog.maxTime, newTime + quest.penaltyMinutes);
    }

    updatedQuests[questIndex] = { ...quest, status: 'pending' };

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
        events: [...dayLog.events, event],
    };
}

/**
 * Complete a bonus mission — adds reward minutes (capped at maxTime).
 * Only parent can add bonuses. Child can withdraw (remove) them.
 */
export function completeBonusMission(dayLog, missionTemplate) {
    const newTime = Math.min(dayLog.maxTime, dayLog.currentTime + missionTemplate.rewardMinutes);

    const bonusEntry = {
        id: generateId(),
        templateId: missionTemplate.id,
        text: missionTemplate.text,
        rewardMinutes: missionTemplate.rewardMinutes,
        completedAt: Date.now(),
    };

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `⭐ Bonus: ${missionTemplate.text} → +${missionTemplate.rewardMinutes} min`,
        type: 'positive',
    };

    return {
        ...dayLog,
        currentTime: newTime,
        bonuses: [...dayLog.bonuses, bonusEntry],
        events: [...dayLog.events, event],
    };
}

/**
 * Withdraw (remove) a bonus mission — child can do this to correct mistakes.
 */
export function withdrawBonus(dayLog, bonusIndex) {
    const bonus = dayLog.bonuses[bonusIndex];
    if (!bonus) return dayLog;

    const newTime = Math.max(0, dayLog.currentTime - bonus.rewardMinutes);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `↩️ Wycofano bonus: ${bonus.text} → −${bonus.rewardMinutes} min`,
        type: 'info',
    };

    const updatedBonuses = dayLog.bonuses.filter((_, i) => i !== bonusIndex);

    return {
        ...dayLog,
        currentTime: newTime,
        bonuses: updatedBonuses,
        events: [...dayLog.events, event],
    };
}

/**
 * Apply a penalty (uchybienie).
 * Anyone can add, but only parent can remove.
 * carryToNextDay: if true, the penalty also affects the next day's base time.
 */
export function applyPenalty(dayLog, penaltyTemplate, carryToNextDay = false) {
    const newTime = Math.max(0, dayLog.currentTime - penaltyTemplate.penaltyMinutes);

    const penaltyEntry = {
        id: generateId(),
        templateId: penaltyTemplate.id,
        text: penaltyTemplate.text,
        penaltyMinutes: penaltyTemplate.penaltyMinutes,
        hasNextDayConsequence: penaltyTemplate.hasNextDayConsequence,
        nextDayPenalty: penaltyTemplate.nextDayPenalty || 0,
        carryToNextDay: carryToNextDay && penaltyTemplate.hasNextDayConsequence,
        appliedAt: Date.now(),
    };

    let eventText = `⚠️ Uchybienie: ${penaltyTemplate.text} → −${penaltyTemplate.penaltyMinutes} min`;
    if (carryToNextDay && penaltyTemplate.hasNextDayConsequence) {
        eventText += ` (+ konsekwencja na jutro: −${penaltyTemplate.nextDayPenalty} min)`;
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
        events: [...dayLog.events, event],
    };
}

/**
 * Remove a penalty — only parent can do this.
 * Restores the deducted time.
 */
export function removePenalty(dayLog, penaltyIndex) {
    const penalty = dayLog.penalties[penaltyIndex];
    if (!penalty) return dayLog;

    const newTime = Math.min(dayLog.maxTime, dayLog.currentTime + penalty.penaltyMinutes);

    const event = {
        id: generateId(),
        timestamp: Date.now(),
        text: `↩️ Usunięto uchybienie: ${penalty.text} → +${penalty.penaltyMinutes} min`,
        type: 'info',
    };

    const updatedPenalties = dayLog.penalties.filter((_, i) => i !== penaltyIndex);

    return {
        ...dayLog,
        currentTime: newTime,
        penalties: updatedPenalties,
        events: [...dayLog.events, event],
    };
}

/**
 * Calculate summary stats for a completed day.
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
        nextDayCarryOvers,
    };
}
