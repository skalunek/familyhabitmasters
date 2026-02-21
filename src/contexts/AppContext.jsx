import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadState, saveState, hashPin, verifyPin } from '../services/storage';
import {
    DEFAULT_SETTINGS,
    DEFAULT_DAILY_QUESTS,
    DEFAULT_BONUS_MISSIONS,
    DEFAULT_PENALTIES,
    generateId,
} from '../data/defaults';
import {
    getTodayStr,
    createDayLog,
    compactOldLogs,
} from '../services/dayEngine';

const AppContext = createContext(null);

/**
 * Create a fresh initial state for first-time setup.
 */
function createInitialState() {
    return {
        parentPinHash: null,
        isSetup: false,
        children: [],  // each: { id, name, avatar, xp: 0 }
        taskTemplates: {
            dailyQuests: DEFAULT_DAILY_QUESTS,
            bonusMissions: DEFAULT_BONUS_MISSIONS,
            penalties: DEFAULT_PENALTIES,
        },
        dayLogs: {},
        settings: { ...DEFAULT_SETTINGS },
    };
}

export function AppProvider({ children: reactChildren }) {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load state from localStorage on mount
    useEffect(() => {
        const stored = loadState();
        if (stored) {
            // Migrate: ensure settings have new fields
            const settings = {
                ...DEFAULT_SETTINGS,
                ...stored.settings,
            };
            setState({ ...stored, settings });
        } else {
            setState(createInitialState());
        }
        setLoading(false);
    }, []);

    // Compact old logs on mount (after state is loaded)
    useEffect(() => {
        if (!state || loading) return;
        const dayLogs = state.dayLogs;
        if (!dayLogs) return;

        let hasChanges = false;
        const compactedLogs = {};

        for (const [childId, childLogs] of Object.entries(dayLogs)) {
            const compacted = compactOldLogs(childLogs, 14);
            compactedLogs[childId] = compacted;
            // Check if anything actually changed
            if (Object.keys(compacted).some(date => compacted[date] !== childLogs[date])) {
                hasChanges = true;
            }
        }

        if (hasChanges) {
            setState(prev => ({
                ...prev,
                dayLogs: compactedLogs,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]); // Only run once after load

    // Persist state to localStorage on every change
    useEffect(() => {
        if (state && !loading) {
            saveState(state);
        }
    }, [state, loading]);

    // ─── Setup ───
    const setupParentPin = useCallback(async (pin) => {
        const pinHash = await hashPin(pin);
        setState(prev => ({
            ...prev,
            parentPinHash: pinHash,
            isSetup: true,
        }));
    }, []);

    const checkPin = useCallback(async (pin) => {
        if (!state?.parentPinHash) return false;
        return await verifyPin(pin, state.parentPinHash);
    }, [state?.parentPinHash]);

    // ─── Children CRUD ───
    const addChild = useCallback((name, avatar) => {
        const child = { id: generateId(), name, avatar, xp: 0 };
        setState(prev => ({
            ...prev,
            children: [...prev.children, child],
        }));
        return child;
    }, []);

    const updateChild = useCallback((childId, updates) => {
        setState(prev => ({
            ...prev,
            children: prev.children.map(c =>
                c.id === childId ? { ...c, ...updates } : c
            ),
        }));
    }, []);

    const removeChild = useCallback((childId) => {
        setState(prev => {
            const newDayLogs = { ...prev.dayLogs };
            delete newDayLogs[childId];
            return {
                ...prev,
                children: prev.children.filter(c => c.id !== childId),
                dayLogs: newDayLogs,
            };
        });
    }, []);

    // ─── Task Templates CRUD ───
    const updateTaskTemplates = useCallback((templateType, templates) => {
        setState(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [templateType]: templates,
            },
        }));
    }, []);

    const addTaskTemplate = useCallback((templateType, template) => {
        setState(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [templateType]: [...prev.taskTemplates[templateType], { ...template, id: generateId() }],
            },
        }));
    }, []);

    const removeTaskTemplate = useCallback((templateType, templateId) => {
        setState(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [templateType]: prev.taskTemplates[templateType].filter(t => t.id !== templateId),
            },
        }));
    }, []);

    const updateTaskTemplate = useCallback((templateType, templateId, updates) => {
        setState(prev => ({
            ...prev,
            taskTemplates: {
                ...prev.taskTemplates,
                [templateType]: prev.taskTemplates[templateType].map(t =>
                    t.id === templateId ? { ...t, ...updates } : t
                ),
            },
        }));
    }, []);

    // ─── Settings ───
    const updateSettings = useCallback((updates) => {
        setState(prev => ({
            ...prev,
            settings: { ...prev.settings, ...updates },
        }));
    }, []);

    // ─── Day Logs ───
    const getDayLog = useCallback((childId) => {
        const today = getTodayStr();
        const childLogs = state?.dayLogs?.[childId] || {};
        return childLogs[today] || null;
    }, [state?.dayLogs]);

    const getOrCreateDayLog = useCallback((childId) => {
        const today = getTodayStr();
        const childLogs = state?.dayLogs?.[childId] || {};

        if (childLogs[today]) {
            return childLogs[today];
        }

        // Find previous day log for carry-over (most recent)
        const sortedDates = Object.keys(childLogs).sort().reverse();
        const previousDayLog = sortedDates.length > 0 ? childLogs[sortedDates[0]] : null;

        // createDayLog handles the isYesterday check internally
        const newDayLog = createDayLog(today, state.taskTemplates, state.settings, childId, previousDayLog);

        setState(prev => ({
            ...prev,
            dayLogs: {
                ...prev.dayLogs,
                [childId]: {
                    ...(prev.dayLogs?.[childId] || {}),
                    [today]: newDayLog,
                },
            },
        }));

        return newDayLog;
    }, [state?.dayLogs, state?.taskTemplates, state?.settings]);

    const updateDayLog = useCallback((childId, dayLog) => {
        const today = getTodayStr();
        setState(prev => {
            // Calculate XP delta from the dayLog change
            const prevDayLog = prev.dayLogs?.[childId]?.[today];
            const prevXp = prevDayLog?.xpEarned || 0;
            const newXp = dayLog.xpEarned || 0;
            const xpDelta = newXp - prevXp;

            // Update child's total XP
            const updatedChildren = xpDelta !== 0
                ? prev.children.map(c =>
                    c.id === childId
                        ? { ...c, xp: Math.max(0, (c.xp || 0) + xpDelta) }
                        : c
                )
                : prev.children;

            return {
                ...prev,
                children: updatedChildren,
                dayLogs: {
                    ...prev.dayLogs,
                    [childId]: {
                        ...(prev.dayLogs?.[childId] || {}),
                        [today]: dayLog,
                    },
                },
            };
        });
    }, []);

    // ─── Import/Export ───
    const importState = useCallback((newState) => {
        setState(newState);
    }, []);

    const value = {
        state,
        loading,
        // Setup
        setupParentPin,
        checkPin,
        // Children
        addChild,
        updateChild,
        removeChild,
        // Templates
        updateTaskTemplates,
        addTaskTemplate,
        removeTaskTemplate,
        updateTaskTemplate,
        // Settings
        updateSettings,
        // Day logs
        getDayLog,
        getOrCreateDayLog,
        updateDayLog,
        // Import
        importState,
    };

    return (
        <AppContext.Provider value={value}>
            {reactChildren}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
