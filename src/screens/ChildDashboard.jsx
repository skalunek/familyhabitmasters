import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
    completeQuest,
    failQuest,
    revertQuest,
    completeBonusMission,
    withdrawBonus,
    applyPenalty,
    computeLevel,
    isOfflineDay,
} from '../services/dayEngine';
import { CATEGORY_LABELS } from '../data/defaults';
import {
    LogOut,
    Home,
    Sparkles,
    Swords,
    PlusCircle,
    MinusCircle,
    AlertTriangle,
    Lock,
    Star,
    Zap,
} from 'lucide-react';

export default function ChildDashboard() {
    const { state, getOrCreateDayLog, updateDayLog } = useApp();
    const { currentChildId, logout } = useAuth();

    const [dayLog, setDayLog] = useState(null);

    // Look up the full child object from state
    const selectedChild = state?.children?.find(c => c.id === currentChildId) || null;

    useEffect(() => {
        if (currentChildId) {
            const log = getOrCreateDayLog(currentChildId);
            setDayLog(log);
        }
    }, [currentChildId, getOrCreateDayLog]);

    // ─── Dynamic offline day detection ───
    // When parent toggles offline for today AFTER the day log was created,
    // sync the dayLog's offline status with current settings.
    useEffect(() => {
        if (!dayLog || !selectedChild) return;
        const currentlyOffline = isOfflineDay(dayLog.date, state.settings);
        if (currentlyOffline === dayLog.isOfflineDay) return;

        const newMultiplier = currentlyOffline
            ? (state.settings.xpMultiplierOffline || 2) : 1;

        const updated = { ...dayLog, isOfflineDay: currentlyOffline, xpMultiplier: newMultiplier };

        if (currentlyOffline && !dayLog.isOfflineDay) {
            // Switching TO offline: undo carry-over time effects and defer them
            const totalCarryOverMinutes = (dayLog.carryOverEffects || [])
                .reduce((sum, e) => sum + e.penaltyMinutes, 0);
            if (totalCarryOverMinutes !== 0) {
                const restoredBase = Math.max(0, Math.min(
                    state.settings.maxTime, dayLog.baseTime + totalCarryOverMinutes));
                const delta = restoredBase - dayLog.baseTime;
                updated.baseTime = restoredBase;
                updated.currentTime = Math.max(0, Math.min(
                    state.settings.maxTime, dayLog.currentTime + delta));
            }
            updated.deferredCarryOvers = dayLog.carryOverEffects || [];
        } else if (!currentlyOffline && dayLog.isOfflineDay) {
            // Switching FROM offline: apply deferred carry-overs to time
            const deferred = dayLog.deferredCarryOvers || [];
            let timeDelta = 0;
            for (const eff of deferred) { timeDelta -= eff.penaltyMinutes; }
            if (timeDelta !== 0) {
                updated.baseTime = Math.max(0, Math.min(
                    state.settings.maxTime, dayLog.baseTime + timeDelta));
                const delta = updated.baseTime - dayLog.baseTime;
                updated.currentTime = Math.max(0, Math.min(
                    state.settings.maxTime, dayLog.currentTime + delta));
            }
            updated.deferredCarryOvers = [];
        }

        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    }, [dayLog?.isOfflineDay, dayLog?.date, state.settings.offlineDaysSchedule, state.settings.offlineDaysOverride]);

    if (!selectedChild || !dayLog) {
        return <div className="text-center text-secondary">Ładowanie...</div>;
    }

    const child = selectedChild;

    // ─── Time Gating: check if morning + afternoon quests are all resolved ───
    const gatingQuests = dayLog.quests.filter(q =>
        q.category === 'morning' || q.category === 'afternoon'
    );
    const isTimeUnlocked = gatingQuests.length === 0 ||
        gatingQuests.every(q => q.status !== 'pending');

    // ─── XP & Level ───
    const levelInfo = computeLevel(child.xp || 0, state.settings.levelThresholds || []);

    // ─── Handlers ───
    const handleCompleteQuest = (questId) => {
        const updated = completeQuest(dayLog, questId);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    const handleFailQuest = (questId) => {
        const updated = failQuest(dayLog, questId);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    const handleRevertQuest = (questId) => {
        const updated = revertQuest(dayLog, questId);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    const handleBonus = (mission) => {
        const updated = completeBonusMission(dayLog, mission);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    const handleWithdrawBonus = (bonusId) => {
        const updated = withdrawBonus(dayLog, bonusId);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    const handlePenalty = (penalty) => {
        const carryToNextDay = penalty.hasNextDayConsequence;
        const updated = applyPenalty(dayLog, penalty, carryToNextDay);
        setDayLog(updated);
        updateDayLog(selectedChild.id, updated);
    };

    // ─── Quest grouping ───
    const questsByCategory = {};
    dayLog.quests.forEach(quest => {
        const cat = quest.category || 'other';
        if (!questsByCategory[cat]) questsByCategory[cat] = [];
        questsByCategory[cat].push(quest);
    });

    const sortedCategories = Object.keys(questsByCategory).sort((a, b) => {
        return (CATEGORY_LABELS[a]?.order ?? 99) - (CATEGORY_LABELS[b]?.order ?? 99);
    });

    // ─── Time display ───
    const timePercent = dayLog.maxTime > 0
        ? Math.round((dayLog.currentTime / dayLog.maxTime) * 100)
        : 0;
    const timeColor = timePercent > 50 ? 'var(--color-success)' :
        timePercent > 25 ? 'var(--color-warning)' : 'var(--color-danger)';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return (
        <div className="app-container">
            {/* Header */}
            <div className="app-header">
                <div className="app-logo">
                    <div className="app-logo-icon">{child.avatar}</div>
                    <div>
                        <div className="app-title">{child.name}</div>
                        <div className="text-muted text-xs">{timeStr} · {dayLog.date}</div>
                    </div>
                </div>
                <button className="btn btn-icon" onClick={logout} title="Wyloguj">
                    <LogOut size={20} />
                </button>
            </div>

            {/* XP Bar */}
            <div className="card mb-md animate-slide-up" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                <div className="flex items-center gap-sm">
                    <Star size={18} className="text-warning" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-xs">
                            <span className="text-xs font-bold">
                                Lvl {levelInfo.level}
                                {levelInfo.currentReward && <span className="text-muted"> · {levelInfo.currentReward}</span>}
                            </span>
                            <span className="text-xs text-muted">{child.xp || 0} XP</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${levelInfo.progress * 100}%` }}
                            />
                        </div>
                        {levelInfo.nextReward && (
                            <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                                Następna nagroda: {levelInfo.nextReward} ({levelInfo.nextLevelXp} XP)
                            </div>
                        )}
                    </div>
                    {dayLog.isOfflineDay && (
                        <span className="badge-offline" title="Dzień bez ekranów — XP ×2!">
                            <Zap size={14} /> ×{dayLog.xpMultiplier}
                        </span>
                    )}
                </div>
            </div>

            {/* Day's XP earned */}
            {(dayLog.xpEarned || 0) > 0 && (
                <div className="text-center text-xs text-success mb-sm animate-fade-in">
                    Dziś zdobyto: +{dayLog.xpEarned} XP
                    {dayLog.isOfflineDay && ` (×${dayLog.xpMultiplier} mnożnik!)`}
                </div>
            )}

            {/* Time Circle */}
            {!dayLog.isOfflineDay && (
                <div className="text-center mb-md animate-slide-up">
                    <div
                        className="time-circle"
                        style={{
                            borderColor: isTimeUnlocked ? timeColor : 'var(--text-muted)',
                            filter: isTimeUnlocked ? 'none' : 'grayscale(1)',
                            position: 'relative',
                        }}
                    >
                        {!isTimeUnlocked && (
                            <div style={{
                                position: 'absolute', top: '-8px', right: '-8px',
                                background: 'var(--bg-secondary)', borderRadius: '50%',
                                padding: '4px',
                            }}>
                                <Lock size={16} className="text-warning" />
                            </div>
                        )}
                        <div className="time-value" style={{ color: isTimeUnlocked ? timeColor : 'var(--text-muted)' }}>
                            {dayLog.currentTime}
                        </div>
                        <div className="time-label">minut</div>
                        <div className="time-sub">z {dayLog.maxTime}</div>
                    </div>
                    {!isTimeUnlocked && (
                        <p className="text-warning text-xs mt-sm animate-fade-in" style={{ fontStyle: 'italic' }}>
                            🔒 Zamknij poranne i popołudniowe misje, aby odblokować czas!
                        </p>
                    )}
                </div>
            )}

            {/* Offline day banner — replaces time counter */}
            {dayLog.isOfflineDay && (
                <div className="card mb-md animate-slide-up" style={{
                    background: 'linear-gradient(135deg, var(--accent-purple-rgb, rgba(139,92,246,0.15)), var(--accent-blue-rgb, rgba(59,130,246,0.15)))',
                    border: '1px solid var(--color-info)',
                    textAlign: 'center',
                    padding: 'var(--space-lg)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌟</div>
                    <h3 className="text-info mb-xs">Dzień bez ekranów!</h3>
                    <p className="text-sm text-secondary">Wykonuj zadania i zbieraj XP z mnożnikiem ×{dayLog.xpMultiplier}!</p>
                    <div className="text-xs text-muted" style={{ marginTop: '8px', opacity: 0.8 }}>
                        Licznik czasu wyłączony — dziś zbierasz tylko doświadczenie ⭐
                    </div>
                </div>
            )}

            {/* Carry-over info */}
            {dayLog.carryOverEffects && dayLog.carryOverEffects.length > 0 && (
                <div className="carry-over-banner mb-md animate-slide-up">
                    <div className="flex items-center gap-sm mb-sm">
                        <AlertTriangle size={16} className="text-warning" />
                        <strong className="text-warning text-sm">
                            {dayLog.isOfflineDay ? 'Konsekwencje przesunięte na kolejny dzień' : 'Konsekwencje z wczoraj'}
                        </strong>
                    </div>
                    {dayLog.carryOverEffects.map((eff, i) => (
                        <p key={i} className="text-sm text-secondary">{eff.text}</p>
                    ))}
                    {dayLog.isOfflineDay && (
                        <p className="text-xs text-muted" style={{ marginTop: '4px', fontStyle: 'italic' }}>
                            ⏭️ Dzień bez ekranów — kary czasowe zostaną przeniesione na następny dzień z ekranami.
                        </p>
                    )}
                </div>
            )}

            {/* Daily Quests */}
            <div className="card card-accent-top mb-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="section-header">
                    <Home size={22} className="text-info" />
                    <h3>Codzienne Misje</h3>
                </div>
                <p className="text-muted text-xs mb-md">Ukończ misje, aby utrzymać bazowy czas. Zawalone = utrata minut!</p>

                {sortedCategories.map(cat => (
                    <div key={cat}>
                        <div className="category-label">{CATEGORY_LABELS[cat]?.label || cat}</div>
                        <div className="flex flex-col gap-sm">
                            {questsByCategory[cat].map(quest => (
                                <div
                                    key={quest.id}
                                    className={`quest-item ${quest.status === 'done' ? 'quest-done' : quest.status === 'failed' ? 'quest-failed' : ''}`}
                                >
                                    <span className="quest-icon">{quest.icon}</span>
                                    <span className={`quest-text ${quest.status !== 'pending' ? 'completed' : ''}`}>
                                        {quest.text}
                                        {quest.hasNextDayConsequence && <span title="Skutek na jutro" style={{ marginLeft: '4px' }}>⚡</span>}
                                        {quest.xpReward > 0 && <span className="text-xs text-muted" style={{ marginLeft: '4px' }}>+{quest.xpReward * (dayLog.xpMultiplier || 1)} XP</span>}
                                    </span>

                                    {quest.status === 'pending' && (
                                        <div className="quest-actions">
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleCompleteQuest(quest.id)}
                                                title="Ukończone"
                                                style={{ color: 'var(--color-success)' }}
                                            >
                                                <PlusCircle size={22} />
                                            </button>
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleFailQuest(quest.id)}
                                                title="Niewykonane"
                                                style={{ color: 'var(--color-danger)' }}
                                            >
                                                <MinusCircle size={22} />
                                            </button>
                                        </div>
                                    )}

                                    {quest.status !== 'pending' && (
                                        <button
                                            className="btn btn-icon text-xs"
                                            onClick={() => handleRevertQuest(quest.id)}
                                            title="Cofnij"
                                            style={{ opacity: 0.6 }}
                                        >
                                            ↩️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bonus Missions */}
            <div className="card card-success-top mb-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="section-header">
                    <Sparkles size={22} className="text-success" />
                    <h3>Zdobądź Czas</h3>
                </div>
                <p className="text-muted text-xs mb-md">Wykonaj zadania dodatkowe i zdobądź minuty!</p>

                <div className="flex flex-col gap-sm">
                    {state.taskTemplates.bonusMissions
                        .filter(m => {
                            if (!m.assignedTo || m.assignedTo.length === 0) return true;
                            return m.assignedTo.includes('all') || m.assignedTo.includes(selectedChild.id);
                        })
                        .map(mission => {
                            const alreadyUsed = !mission.multiUse && dayLog.bonuses.some(b => b.templateId === mission.id);
                            return (
                                <button
                                    key={mission.id}
                                    className="mission-card bonus"
                                    onClick={() => handleBonus(mission)}
                                    disabled={(!dayLog.isOfflineDay && dayLog.currentTime >= dayLog.maxTime) || alreadyUsed}
                                >
                                    <div className="flex items-center gap-sm">
                                        <span className="quest-icon">{mission.icon}</span>
                                        <span className="font-medium text-sm">{mission.text}</span>
                                        {alreadyUsed && <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>✓ użyto</span>}
                                    </div>
                                    <div className="flex items-center gap-xs">
                                        {!dayLog.isOfflineDay && (
                                            <span className="mission-value text-success">+{mission.rewardMinutes}</span>
                                        )}
                                        {(mission.xpReward || 0) > 0 && (
                                            <span className="text-xs text-warning">+{(mission.xpReward || 0) * (dayLog.xpMultiplier || 1)} XP</span>
                                        )}
                                        <PlusCircle size={18} className="text-success" />
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Earned bonuses today */}
                {dayLog.bonuses.length > 0 && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <div className="text-xs text-muted font-semibold mb-sm">Zdobyte dziś (kliknij aby wycofać):</div>
                        <div className="flex flex-wrap gap-xs">
                            {dayLog.bonuses.map(bonus => (
                                <button
                                    key={bonus.id}
                                    className="event-tag positive"
                                    onClick={() => handleWithdrawBonus(bonus.id)}
                                    title="Kliknij aby wycofać"
                                    style={{ cursor: 'pointer' }}
                                >
                                    +{bonus.rewardMinutes} {bonus.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Penalties */}
            <div className="card card-danger-top mb-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="section-header">
                    <Swords size={22} className="text-danger" />
                    <h3>Utrata Czasu</h3>
                </div>
                <p className="text-muted text-xs mb-md">Unikaj pułapek! Kliknij jeśli doszło do uchybienia.</p>

                <div className="flex flex-col gap-sm">
                    {state.taskTemplates.penalties
                        .filter(p => {
                            if (!p.assignedTo || p.assignedTo.length === 0) return true;
                            return p.assignedTo.includes('all') || p.assignedTo.includes(selectedChild.id);
                        })
                        .map(penalty => {
                            const alreadyUsed = !penalty.multiUse && dayLog.penalties.some(p => p.templateId === penalty.id);
                            return (
                                <button
                                    key={penalty.id}
                                    className="mission-card penalty"
                                    onClick={() => handlePenalty(penalty)}
                                    disabled={(dayLog.currentTime <= 0 && !dayLog.isOfflineDay) || alreadyUsed}
                                >
                                    <div className="flex items-center gap-sm">
                                        <span className="quest-icon">{penalty.icon}</span>
                                        <span className="font-medium text-sm text-left">{penalty.text}</span>
                                        {alreadyUsed && <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>✓ użyto</span>}
                                    </div>
                                    <div className="flex items-center gap-xs flex-shrink-0">
                                        <span className="mission-value text-danger">−{penalty.penaltyMinutes}</span>
                                        {penalty.hasNextDayConsequence && (
                                            <AlertTriangle size={14} className="text-warning" title="Konsekwencja na jutro" />
                                        )}
                                        <MinusCircle size={18} className="text-danger" />
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Applied penalties — child CANNOT remove (parent only) */}
                {dayLog.penalties.length > 0 && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <div className="text-xs text-muted font-semibold mb-sm">Uchybienia dziś:</div>
                        <div className="flex flex-wrap gap-xs">
                            {dayLog.penalties.map(penalty => (
                                <span key={penalty.id} className="event-tag negative">
                                    −{penalty.penaltyMinutes} {penalty.text}
                                    {penalty.carryToNextDay && ' ⚡'}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Events */}
            {dayLog.events.length > 0 && (
                <div className="card mb-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <h4 className="mb-sm">📜 Dziennik Przygód</h4>
                    <div className="flex flex-wrap gap-xs">
                        {[...dayLog.events].reverse().slice(0, 10).map(event => (
                            <span key={event.id} className={`event-tag ${event.type}`}>
                                {event.text}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
