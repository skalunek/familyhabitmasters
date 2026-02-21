import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
    completeQuest,
    failQuest,
    revertQuest,
    completeBonusMission,
    withdrawBonus,
    applyPenalty,
    calculateDaySummary,
} from '../services/dayEngine';
import { CATEGORY_LABELS } from '../data/defaults';
import {
    Clock,
    CheckCircle2,
    XCircle,
    MinusCircle,
    PlusCircle,
    Sparkles,
    Swords,
    Trophy,
    LogOut,
    AlertTriangle,
    Undo2,
    Home,
} from 'lucide-react';

export default function ChildDashboard() {
    const { state, getDayLog, getOrCreateDayLog, updateDayLog } = useApp();
    const { currentChildId, logout } = useAuth();

    const child = state.children.find(c => c.id === currentChildId);
    const dayLog = getDayLog(currentChildId);

    // Initialize the day log via effect to avoid setState during render
    useEffect(() => {
        if (currentChildId && !dayLog) {
            getOrCreateDayLog(currentChildId);
        }
    }, [currentChildId, dayLog, getOrCreateDayLog]);

    const summary = useMemo(() => dayLog ? calculateDaySummary(dayLog) : null, [dayLog]);

    if (!child || !dayLog) return null;

    const progressPercent = (dayLog.currentTime / dayLog.maxTime) * 100;
    const timeClass = dayLog.currentTime > state.settings.baseTime
        ? 'time-good'
        : dayLog.currentTime < state.settings.baseTime
            ? 'time-low'
            : 'time-normal';
    const fillClass = dayLog.currentTime > state.settings.baseTime
        ? 'fill-good'
        : dayLog.currentTime < state.settings.baseTime
            ? 'fill-low'
            : 'fill-normal';

    // Group quests by category
    const questsByCategory = {};
    dayLog.quests.forEach((quest, index) => {
        const cat = quest.category || 'other';
        if (!questsByCategory[cat]) questsByCategory[cat] = [];
        questsByCategory[cat].push({ ...quest, index });
    });

    const sortedCategories = Object.keys(questsByCategory).sort((a, b) => {
        return (CATEGORY_LABELS[a]?.order ?? 99) - (CATEGORY_LABELS[b]?.order ?? 99);
    });

    const handleCompleteQuest = (questIndex) => {
        const updated = completeQuest(dayLog, questIndex);
        updateDayLog(currentChildId, updated);
    };

    const handleFailQuest = (questIndex) => {
        const updated = failQuest(dayLog, questIndex);
        updateDayLog(currentChildId, updated);
    };

    const handleRevertQuest = (questIndex) => {
        const updated = revertQuest(dayLog, questIndex);
        updateDayLog(currentChildId, updated);
    };

    const handleBonus = (mission) => {
        const updated = completeBonusMission(dayLog, mission);
        updateDayLog(currentChildId, updated);
    };

    const handleWithdrawBonus = (index) => {
        const updated = withdrawBonus(dayLog, index);
        updateDayLog(currentChildId, updated);
    };

    const handlePenalty = (penalty) => {
        const carryToNextDay = penalty.hasNextDayConsequence;
        const updated = applyPenalty(dayLog, penalty, carryToNextDay);
        updateDayLog(currentChildId, updated);
    };

    return (
        <div className="app-container">
            {/* Header */}
            <div className="app-header">
                <div className="app-logo">
                    <span style={{ fontSize: '2rem' }}>{child.avatar}</span>
                    <div>
                        <div className="app-title">{child.name}</div>
                        <div className="text-muted text-xs">Misje na dziś</div>
                    </div>
                </div>
                <button className="btn btn-icon" onClick={logout} title="Wyloguj">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Carry-over banner */}
            {dayLog.carryOverEffects.length > 0 && (
                <div className="carry-over-banner animate-fade-in">
                    <div className="flex items-center gap-sm mb-sm">
                        <AlertTriangle size={18} className="text-warning" />
                        <strong className="text-warning text-sm">Konsekwencje z wczoraj</strong>
                    </div>
                    {dayLog.carryOverEffects.map((effect, i) => (
                        <p key={i} className="text-sm text-secondary">{effect.text}</p>
                    ))}
                </div>
            )}

            {/* Time Display */}
            <div className="card card-glow text-center mb-md animate-slide-up">
                <div className="text-xs text-muted font-semibold" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Dostępny Czas Zwycięzcy
                </div>
                <div className="flex items-center justify-center gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                    <Clock size={36} className={timeClass === 'time-good' ? 'text-success' : timeClass === 'time-low' ? 'text-danger' : 'text-info'} />
                    <span className={`time-display ${timeClass}`}>{dayLog.currentTime}</span>
                    <span className="time-unit">min</span>
                </div>
                <div className="progress-bar">
                    <div
                        className={`progress-fill ${fillClass}`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-muted" style={{ marginTop: '4px' }}>
                    <span>0</span>
                    <span>Baza: {dayLog.baseTime}</span>
                    <span>Max: {dayLog.maxTime}</span>
                </div>
            </div>

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
                                    key={quest.index}
                                    className={`quest-item ${quest.status === 'done' ? 'quest-done' : quest.status === 'failed' ? 'quest-failed' : ''}`}
                                >
                                    <span className="quest-icon">{quest.icon}</span>
                                    <span className={`quest-text ${quest.status !== 'pending' ? 'completed' : ''}`}>
                                        {quest.text}
                                        {quest.hasNextDayConsequence && <span title="Skutek na jutro" style={{ marginLeft: '4px' }}>⚡</span>}
                                    </span>

                                    {quest.status === 'pending' && (
                                        <div className="quest-actions">
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleCompleteQuest(quest.index)}
                                                title="Ukończone"
                                                style={{ color: 'var(--color-success)' }}
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleFailQuest(quest.index)}
                                                title={`Niewykonane (−${quest.penaltyMinutes} min)`}
                                                style={{ color: 'var(--color-danger)' }}
                                            >
                                                <XCircle size={20} />
                                            </button>
                                        </div>
                                    )}

                                    {quest.status === 'done' && (
                                        <div className="quest-actions">
                                            <CheckCircle2 size={20} className="text-info" />
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleRevertQuest(quest.index)}
                                                title="Cofnij"
                                                style={{ opacity: 0.5 }}
                                            >
                                                <Undo2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {quest.status === 'failed' && (
                                        <div className="quest-actions">
                                            <AlertTriangle size={20} className="text-danger" />
                                            <button
                                                className="btn btn-icon"
                                                onClick={() => handleRevertQuest(quest.index)}
                                                title="Cofnij"
                                                style={{ opacity: 0.5 }}
                                            >
                                                <Undo2 size={16} />
                                            </button>
                                        </div>
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
                    {state.taskTemplates.bonusMissions.map(mission => {
                        const alreadyUsed = !mission.multiUse && dayLog.bonuses.some(b => b.templateId === mission.id);
                        return (
                            <button
                                key={mission.id}
                                className="mission-card bonus"
                                onClick={() => handleBonus(mission)}
                                disabled={dayLog.currentTime >= dayLog.maxTime || alreadyUsed}
                            >
                                <div className="flex items-center gap-sm">
                                    <span className="quest-icon">{mission.icon}</span>
                                    <span className="font-medium text-sm">{mission.text}</span>
                                    {alreadyUsed && <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>✓ użyto</span>}
                                </div>
                                <div className="flex items-center gap-xs">
                                    <span className="mission-value text-success">+{mission.rewardMinutes}</span>
                                    <PlusCircle size={18} className="text-success" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Earned bonuses today — child can withdraw */}
                {dayLog.bonuses.length > 0 && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <div className="text-xs text-muted font-semibold mb-sm">Zdobyte dziś (kliknij aby wycofać):</div>
                        <div className="flex flex-wrap gap-xs">
                            {dayLog.bonuses.map((bonus, i) => (
                                <button
                                    key={bonus.id}
                                    className="event-tag positive"
                                    onClick={() => handleWithdrawBonus(i)}
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

            {/* Penalties (uchybienia) — child can add */}
            <div className="card card-danger-top mb-md animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="section-header">
                    <Swords size={22} className="text-danger" />
                    <h3>Utrata Czasu</h3>
                </div>
                <p className="text-muted text-xs mb-md">Unikaj pułapek! Kliknij jeśli doszło do uchybienia.</p>

                <div className="flex flex-col gap-sm">
                    {state.taskTemplates.penalties.map(penalty => {
                        const alreadyUsed = !penalty.multiUse && dayLog.penalties.some(p => p.templateId === penalty.id);
                        return (
                            <button
                                key={penalty.id}
                                className="mission-card penalty"
                                onClick={() => handlePenalty(penalty)}
                                disabled={dayLog.currentTime <= 0 || alreadyUsed}
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
                            {dayLog.penalties.map((penalty) => (
                                <span key={penalty.id} className="event-tag negative">
                                    −{penalty.penaltyMinutes} {penalty.text}
                                    {penalty.carryToNextDay && ' ⚡'}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Event Log */}
            {dayLog.events.length > 0 && (
                <div className="card mb-md animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="section-header">
                        <Trophy size={20} className="text-warning" />
                        <h3>Historia Zdarzeń</h3>
                    </div>
                    <div className="flex flex-wrap gap-xs">
                        {[...dayLog.events].reverse().slice(0, 15).map(event => (
                            <span key={event.id} className={`event-tag ${event.type}`}>
                                {event.text}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Day Summary */}
            {summary && (
                <div className="card mb-md" style={{ borderColor: 'var(--color-warning-border)' }}>
                    <div className="section-header">
                        <Trophy size={20} className="text-warning" />
                        <h3>Podsumowanie</h3>
                    </div>
                    <div className="flex flex-wrap gap-md text-sm">
                        <div>
                            <span className="text-muted">Questy: </span>
                            <strong className="text-success">{summary.completedQuests}</strong>
                            <span className="text-muted"> / </span>
                            <span>{summary.totalQuests}</span>
                            {summary.failedQuests > 0 && (
                                <span className="text-danger"> ({summary.failedQuests} ✗)</span>
                            )}
                        </div>
                        <div>
                            <span className="text-muted">Bonusy: </span>
                            <strong className="text-success">+{summary.totalBonusMinutes} min</strong>
                        </div>
                        <div>
                            <span className="text-muted">Kary: </span>
                            <strong className="text-danger">−{summary.totalPenaltyMinutes + summary.questPenaltyMinutes} min</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
