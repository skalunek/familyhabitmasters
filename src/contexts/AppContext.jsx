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
} from '../services/dayEngine';

const AppContext = createContext(null);

/**
 * Create a fresh initial state for first-time setup.
 */
function createInitialState() {
    return {
        parentPinHash: null,
        isSetup: false,
        children: [],
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
            setState(stored);
        } else {
            setState(createInitialState());
        }
        setLoading(false);
    }, []);

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
        const child = { id: generateId(), name, avatar };
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

        // Find previous day log for carry-over
        const sortedDates = Object.keys(childLogs).sort().reverse();
        const previousDayLog = sortedDates.length > 0 ? childLogs[sortedDates[0]] : null;

        const newDayLog = createDayLog(today, state.taskTemplates, state.settings, previousDayLog);

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
        setState(prev => ({
            ...prev,
            dayLogs: {
                ...prev.dayLogs,
                [childId]: {
                    ...(prev.dayLogs?.[childId] || {}),
                    [today]: dayLog,
                },
            },
        }));
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
