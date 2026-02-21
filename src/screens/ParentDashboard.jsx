import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
    removePenalty,
    completeBonusMission,
    applyPenalty,
} from '../services/dayEngine';
import {
    AVATAR_OPTIONS,
    CATEGORY_LABELS,
    ICON_OPTIONS,
    generateId,
} from '../data/defaults';
import { exportData, importData } from '../services/storage';
import {
    LogOut,
    Users,
    ListChecks,
    Sparkles,
    Swords,
    Settings,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Download,
    Upload,
    Eye,
    ChevronUp,
    ChevronDown,
    AlertTriangle,
} from 'lucide-react';

// ─── Emoji Picker Component ───

function EmojiPicker({ value, onChange, options }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                className="avatar-option"
                onClick={() => setOpen(!open)}
                style={{ fontSize: '1.5rem', padding: 'var(--space-sm)', minWidth: '44px', minHeight: '44px' }}
            >
                {value || '📋'}
            </button>
            {open && (
                <div
                    className="animate-fade-in"
                    style={{
                        position: 'absolute', zIndex: 50, top: '100%', left: 0,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)', padding: 'var(--space-sm)',
                        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px',
                        minWidth: '240px', boxShadow: 'var(--shadow-xl)',
                    }}
                >
                    {(options || ICON_OPTIONS).map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            className={`avatar-option ${value === emoji ? 'selected' : ''}`}
                            style={{ fontSize: '1.25rem', padding: '6px' }}
                            onClick={() => { onChange(emoji); setOpen(false); }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab Components ───

function ChildrenTab() {
    const { state, addChild, updateChild, removeChild } = useApp();
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('🦸');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [showAvatars, setShowAvatars] = useState(false);

    const handleAdd = () => {
        if (newName.trim()) {
            addChild(newName.trim(), newAvatar);
            setNewName('');
            setNewAvatar('🦸');
        }
    };

    const startEdit = (child) => {
        setEditingId(child.id);
        setEditName(child.name);
        setEditAvatar(child.avatar);
    };

    const handleSaveEdit = () => {
        if (editName.trim()) {
            updateChild(editingId, { name: editName.trim(), avatar: editAvatar });
            setEditingId(null);
        }
    };

    const handleRemove = (childId, childName) => {
        if (window.confirm(`Czy na pewno chcesz usunąć profil "${childName}"? Wszystkie dane zostaną utracone.`)) {
            removeChild(childId);
        }
    };

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <h3>Profile Dzieci</h3>

            <div className="flex flex-col gap-sm">
                {state.children.map(child => (
                    <div key={child.id} className="edit-list-item">
                        {editingId === child.id ? (
                            <>
                                <EmojiPicker value={editAvatar} onChange={setEditAvatar} options={AVATAR_OPTIONS} />
                                <input
                                    type="text"
                                    className="input flex-1"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                />
                                <button className="btn btn-icon" onClick={handleSaveEdit} style={{ color: 'var(--color-success)' }}>
                                    <Save size={16} />
                                </button>
                                <button className="btn btn-icon" onClick={() => setEditingId(null)}>
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <span className="quest-icon">{child.avatar}</span>
                                <span className="flex-1 font-medium">{child.name}</span>
                                <button className="btn btn-icon" onClick={() => startEdit(child)}>
                                    <Edit3 size={16} />
                                </button>
                                <button className="btn btn-icon" onClick={() => handleRemove(child.id, child.name)} style={{ color: 'var(--color-danger)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <h4 className="mb-sm">Dodaj dziecko</h4>
                <div className="flex gap-sm items-center mb-sm">
                    <EmojiPicker value={newAvatar} onChange={setNewAvatar} options={AVATAR_OPTIONS} />
                    <input
                        type="text"
                        className="input flex-1"
                        placeholder="Imię dziecka"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button className="btn btn-primary" onClick={handleAdd} disabled={!newName.trim()}>
                        <Plus size={16} /> Dodaj
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Generic Editable Template List with Emoji Selector & Reordering ───

function EditableTemplateList({ templateType, label, fields }) {
    const { state, addTaskTemplate, removeTaskTemplate, updateTaskTemplate, updateTaskTemplates } = useApp();
    const items = state.taskTemplates[templateType];
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});

    const handleAdd = () => {
        if (!newItem.text?.trim()) return;
        addTaskTemplate(templateType, { ...newItem, text: newItem.text.trim() });
        setNewItem({});
        setAdding(false);
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditItem({ ...item });
    };

    const handleSaveEdit = () => {
        updateTaskTemplate(templateType, editingId, editItem);
        setEditingId(null);
        setEditItem({});
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;
        const reordered = [...items];
        const [moved] = reordered.splice(index, 1);
        reordered.splice(newIndex, 0, moved);
        updateTaskTemplates(templateType, reordered);
    };

    const renderField = (field, itemState, setItemState) => {
        if (field.type === 'icon') {
            return (
                <div key={field.name}>
                    <label className="text-xs text-muted mb-xs" style={{ display: 'block' }}>{field.label}</label>
                    <EmojiPicker
                        value={itemState[field.name] || '📋'}
                        onChange={(emoji) => setItemState(prev => ({ ...prev, [field.name]: emoji }))}
                    />
                </div>
            );
        }
        if (field.type === 'select') {
            return (
                <div key={field.name}>
                    <label className="text-xs text-muted mb-xs" style={{ display: 'block' }}>{field.label}</label>
                    <select
                        className="input"
                        value={itemState[field.name] || field.defaultValue || ''}
                        onChange={(e) => setItemState(prev => ({ ...prev, [field.name]: e.target.value }))}
                    >
                        {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );
        }
        if (field.type === 'checkbox') {
            return (
                <label key={field.name} className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
                    <input
                        type="checkbox"
                        checked={itemState[field.name] || false}
                        onChange={(e) => setItemState(prev => ({ ...prev, [field.name]: e.target.checked }))}
                    />
                    <span className="text-sm">{field.label}</span>
                </label>
            );
        }
        return (
            <div key={field.name}>
                <label className="text-xs text-muted mb-xs" style={{ display: 'block' }}>{field.label}</label>
                <input
                    type={field.type || 'text'}
                    className="input"
                    placeholder={field.placeholder}
                    value={itemState[field.name] || ''}
                    onChange={(e) => setItemState(prev => ({
                        ...prev,
                        [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <div className="flex items-center justify-between">
                <h3>{label}</h3>
                <button className="btn btn-ghost" onClick={() => { setAdding(!adding); setNewItem({}); }}>
                    <Plus size={16} /> Dodaj
                </button>
            </div>

            {adding && (
                <div className="card animate-slide-up" style={{ background: 'var(--bg-primary)' }}>
                    {fields.map(f => renderField(f, newItem, setNewItem))}
                    <div className="flex gap-sm justify-end" style={{ marginTop: 'var(--space-sm)' }}>
                        <button className="btn btn-secondary" onClick={() => setAdding(false)}>Anuluj</button>
                        <button className="btn btn-primary" onClick={handleAdd} disabled={!newItem.text?.trim()}>Zapisz</button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-sm">
                {items.map((item, idx) => (
                    <div key={item.id} className="edit-list-item">
                        {editingId === item.id ? (
                            <div className="flex flex-col gap-sm w-full">
                                {fields.map(f => renderField(f, editItem, setEditItem))}
                                <div className="flex gap-sm justify-end">
                                    <button className="btn btn-icon" onClick={() => setEditingId(null)}><X size={16} /></button>
                                    <button className="btn btn-icon" onClick={handleSaveEdit} style={{ color: 'var(--color-success)' }}>
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Reorder buttons */}
                                <div className="flex flex-col gap-xs" style={{ marginRight: '4px' }}>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => moveItem(idx, -1)}
                                        disabled={idx === 0}
                                        style={{ padding: '2px', opacity: idx === 0 ? 0.3 : 1 }}
                                        title="Przesuń wyżej"
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => moveItem(idx, 1)}
                                        disabled={idx === items.length - 1}
                                        style={{ padding: '2px', opacity: idx === items.length - 1 ? 0.3 : 1 }}
                                        title="Przesuń niżej"
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                                <span className="quest-icon">{item.icon || '📋'}</span>
                                <div className="flex-1">
                                    <span className="font-medium text-sm">{item.text}</span>
                                    <div className="text-xs text-muted">
                                        {item.rewardMinutes && <span className="text-success">+{item.rewardMinutes} min</span>}
                                        {item.penaltyMinutes && <span className="text-danger">−{item.penaltyMinutes} min</span>}
                                        {item.category && <span> · {CATEGORY_LABELS[item.category]?.label || item.category}</span>}
                                        {item.hasNextDayConsequence && (
                                            <span className="text-warning">
                                                {' '}· ⚡ jutro: {item.nextDayPenalty ? `−${item.nextDayPenalty}` : item.nextDayBonus ? `+${item.nextDayBonus}` : ''} min
                                            </span>
                                        )}
                                        {item.multiUse !== undefined && (
                                            <span> · {item.multiUse ? '🔁 wielokrotne' : '1x jednorazowe'}</span>
                                        )}
                                    </div>
                                </div>
                                <button className="btn btn-icon" onClick={() => startEdit(item)}>
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    className="btn btn-icon"
                                    onClick={() => { if (window.confirm('Usunąć?')) removeTaskTemplate(templateType, item.id); }}
                                    style={{ color: 'var(--color-danger)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function QuestsTab() {
    return (
        <EditableTemplateList
            templateType="dailyQuests"
            label="Codzienne Questy"
            fields={[
                { name: 'text', label: 'Nazwa questa', placeholder: 'Np. Pościelenie łóżka', type: 'text' },
                { name: 'icon', label: 'Ikona', type: 'icon' },
                {
                    name: 'category', label: 'Kategoria', type: 'select', defaultValue: 'morning',
                    options: [
                        { value: 'morning', label: '☀️ Poranny' },
                        { value: 'afternoon', label: '🏫 Popołudniowy' },
                        { value: 'evening', label: '🧹 Wieczorny' },
                        { value: 'boss', label: '🏰 Finał Dnia' },
                    ],
                },
                { name: 'penaltyMinutes', label: 'Kara za niewykonanie (minuty)', placeholder: '10', type: 'number' },
                { name: 'hasNextDayConsequence', label: 'Skutek przeniesiony na następny dzień', type: 'checkbox' },
                { name: 'nextDayPenalty', label: 'Obniżenie czasu bazowego jutro (minuty)', placeholder: '10', type: 'number' },
            ]}
        />
    );
}

function BonusTab() {
    return (
        <EditableTemplateList
            templateType="bonusMissions"
            label="Misje Dodatkowe"
            fields={[
                { name: 'text', label: 'Nazwa misji', placeholder: 'Np. Odkurzanie pokoju', type: 'text' },
                { name: 'icon', label: 'Ikona', type: 'icon' },
                { name: 'rewardMinutes', label: 'Nagroda (minuty)', placeholder: '10', type: 'number' },
                { name: 'multiUse', label: 'Można użyć wiele razy na dobę', type: 'checkbox' },
                { name: 'hasNextDayConsequence', label: 'Bonus przeniesiony na następny dzień', type: 'checkbox' },
                { name: 'nextDayBonus', label: 'Dodatkowy czas bazowy jutro (minuty)', placeholder: '10', type: 'number' },
            ]}
        />
    );
}

function PenaltiesTab() {
    return (
        <EditableTemplateList
            templateType="penalties"
            label="Uchybienia"
            fields={[
                { name: 'text', label: 'Nazwa uchybienia', placeholder: 'Np. Kłótnia z rodzeństwem', type: 'text' },
                { name: 'icon', label: 'Ikona', type: 'icon' },
                { name: 'penaltyMinutes', label: 'Kara (minuty)', placeholder: '10', type: 'number' },
                { name: 'multiUse', label: 'Można użyć wiele razy na dobę', type: 'checkbox' },
                { name: 'hasNextDayConsequence', label: 'Konsekwencja na następny dzień', type: 'checkbox' },
                { name: 'nextDayPenalty', label: 'Obniżenie czasu bazowego jutro (minuty)', placeholder: '10', type: 'number' },
            ]}
        />
    );
}

function SettingsTab() {
    const { state, updateSettings, importState } = useApp();
    const [baseTime, setBaseTime] = useState(state.settings.baseTime);
    const [maxTime, setMaxTime] = useState(state.settings.maxTime);
    const [timeStep, setTimeStep] = useState(state.settings.timeStep);

    const handleSave = () => {
        updateSettings({ baseTime, maxTime, timeStep });
    };

    const handleExport = () => {
        exportData(state);
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const data = await importData(e.target.files[0]);
                if (data && data.isSetup) {
                    importState(data);
                    alert('Dane zaimportowane pomyślnie!');
                } else {
                    alert('Nieprawidłowy plik kopii zapasowej.');
                }
            } catch (err) {
                alert('Błąd: ' + err.message);
            }
        };
        input.click();
    };

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            <h3>Ustawienia Gry</h3>

            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <div className="flex flex-col gap-md">
                    <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Czas bazowy (minuty)</label>
                        <input type="number" className="input" value={baseTime} onChange={(e) => setBaseTime(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Czas maksymalny (minuty)</label>
                        <input type="number" className="input" value={maxTime} onChange={(e) => setMaxTime(Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Krok czasowy (minuty)</label>
                        <input type="number" className="input" value={timeStep} onChange={(e) => setTimeStep(Number(e.target.value))} />
                    </div>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={16} /> Zapisz ustawienia
                    </button>
                </div>
            </div>

            <h3>Kopia Zapasowa</h3>
            <div className="flex gap-sm">
                <button className="btn btn-secondary flex-1" onClick={handleExport}>
                    <Download size={16} /> Eksportuj dane
                </button>
                <button className="btn btn-secondary flex-1" onClick={handleImport}>
                    <Upload size={16} /> Importuj dane
                </button>
            </div>
        </div>
    );
}

function ChildPreviewTab() {
    const { state, getOrCreateDayLog, updateDayLog } = useApp();
    const [selectedChildId, setSelectedChildId] = useState(state.children[0]?.id || null);

    const child = state.children.find(c => c.id === selectedChildId);
    const dayLog = selectedChildId ? getOrCreateDayLog(selectedChildId) : null;

    const handleRemovePenalty = (penaltyIndex) => {
        if (!dayLog || !selectedChildId) return;
        const updated = removePenalty(dayLog, penaltyIndex);
        updateDayLog(selectedChildId, updated);
    };

    const handleAddBonus = (mission) => {
        if (!dayLog || !selectedChildId) return;
        const updated = completeBonusMission(dayLog, mission);
        updateDayLog(selectedChildId, updated);
    };

    const handleApplyPenalty = (penalty) => {
        if (!dayLog || !selectedChildId) return;
        const carryToNextDay = penalty.hasNextDayConsequence;
        const updated = applyPenalty(dayLog, penalty, carryToNextDay);
        updateDayLog(selectedChildId, updated);
    };

    if (state.children.length === 0) {
        return (
            <div className="text-center text-secondary animate-fade-in">
                <p>Dodaj najpierw dzieci w zakładce "Dzieci"</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <div className="flex items-center justify-between">
                <h3>Podgląd Dnia Dziecka</h3>
            </div>

            <div className="flex gap-sm flex-wrap">
                {state.children.map(c => (
                    <button
                        key={c.id}
                        className={`btn ${selectedChildId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setSelectedChildId(c.id)}
                    >
                        {c.avatar} {c.name}
                    </button>
                ))}
            </div>

            {child && dayLog && (
                <>
                    {/* Time overview */}
                    <div className="card" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-muted text-sm">Aktualny czas:</span>
                            <span className="font-bold text-lg">
                                {dayLog.currentTime} / {dayLog.maxTime} min
                            </span>
                        </div>
                    </div>

                    {/* Carry-over info */}
                    {dayLog.carryOverEffects && dayLog.carryOverEffects.length > 0 && (
                        <div className="carry-over-banner">
                            <div className="flex items-center gap-sm mb-sm">
                                <AlertTriangle size={16} className="text-warning" />
                                <strong className="text-warning text-sm">Konsekwencje z wczoraj</strong>
                            </div>
                            {dayLog.carryOverEffects.map((eff, i) => (
                                <p key={i} className="text-sm text-secondary">{eff.text}</p>
                            ))}
                        </div>
                    )}

                    {/* Parent can add bonuses */}
                    <div className="card card-success-top">
                        <h4 className="mb-sm text-success flex items-center gap-sm">
                            <Sparkles size={18} /> Dodaj bonus (rodzic)
                        </h4>
                        <div className="flex flex-wrap gap-xs">
                            {state.taskTemplates.bonusMissions.map(mission => (
                                <button
                                    key={mission.id}
                                    className="btn btn-success text-sm"
                                    onClick={() => handleAddBonus(mission)}
                                    disabled={dayLog.currentTime >= dayLog.maxTime}
                                >
                                    {mission.icon} {mission.text} (+{mission.rewardMinutes})
                                    {mission.hasNextDayConsequence && ' ⚡'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Parent can apply penalties */}
                    <div className="card card-danger-top">
                        <h4 className="mb-sm text-danger flex items-center gap-sm">
                            <Swords size={18} /> Dodaj uchybienie (rodzic)
                        </h4>
                        <div className="flex flex-wrap gap-xs">
                            {state.taskTemplates.penalties.map(penalty => (
                                <button
                                    key={penalty.id}
                                    className="btn btn-danger text-sm"
                                    onClick={() => handleApplyPenalty(penalty)}
                                    disabled={dayLog.currentTime <= 0}
                                >
                                    {penalty.icon} {penalty.text} (−{penalty.penaltyMinutes})
                                    {penalty.hasNextDayConsequence && ' ⚡'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Remove penalties — parent only */}
                    {dayLog.penalties.length > 0 && (
                        <div className="card">
                            <h4 className="mb-sm">Uchybienia dziś (kliknij aby usunąć)</h4>
                            <div className="flex flex-wrap gap-xs">
                                {dayLog.penalties.map((penalty, i) => (
                                    <button
                                        key={penalty.id}
                                        className="event-tag negative"
                                        onClick={() => handleRemovePenalty(i)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        ❌ −{penalty.penaltyMinutes} {penalty.text}
                                        {penalty.carryToNextDay && ' ⚡'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Event log */}
                    {dayLog.events.length > 0 && (
                        <div className="card">
                            <h4 className="mb-sm">Ostatnie zdarzenia</h4>
                            <div className="flex flex-wrap gap-xs">
                                {[...dayLog.events].reverse().slice(0, 10).map(event => (
                                    <span key={event.id} className={`event-tag ${event.type}`}>
                                        {event.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── Main Parent Dashboard ───

const TABS = [
    { id: 'preview', label: 'Podgląd', icon: Eye },
    { id: 'children', label: 'Dzieci', icon: Users },
    { id: 'quests', label: 'Questy', icon: ListChecks },
    { id: 'bonuses', label: 'Bonusy', icon: Sparkles },
    { id: 'penalties', label: 'Uchybienia', icon: Swords },
    { id: 'settings', label: 'Ustawienia', icon: Settings },
];

export default function ParentDashboard() {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('preview');

    const renderTab = () => {
        switch (activeTab) {
            case 'children': return <ChildrenTab />;
            case 'quests': return <QuestsTab />;
            case 'bonuses': return <BonusTab />;
            case 'penalties': return <PenaltiesTab />;
            case 'preview': return <ChildPreviewTab />;
            case 'settings': return <SettingsTab />;
            default: return null;
        }
    };

    return (
        <div className="app-container">
            <div className="app-header">
                <div className="app-logo">
                    <div className="app-logo-icon">🎮</div>
                    <div>
                        <div className="app-title">Panel Rodzica</div>
                        <div className="text-muted text-xs">Konfiguracja i podgląd</div>
                    </div>
                </div>
                <button className="btn btn-icon" onClick={logout} title="Wyloguj">
                    <LogOut size={20} />
                </button>
            </div>

            <div className="card mb-md" style={{ padding: 'var(--space-xs)' }}>
                <div className="tab-bar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="card">
                {renderTab()}
            </div>
        </div>
    );
}
