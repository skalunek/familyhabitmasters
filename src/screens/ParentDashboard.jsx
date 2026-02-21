import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import {
    removePenalty,
    completeBonusMission,
    applyPenalty,
    computeLevel,
    isOfflineDay,
} from '../services/dayEngine';
import {
    AVATAR_OPTIONS,
    CATEGORY_LABELS,
    ICON_OPTIONS,
    DAY_LABELS,
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
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Star,
    Calendar,
} from 'lucide-react';

// ─── Emoji Picker ───

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

// ─── Child Selector for assignedTo ───

function ChildSelector({ value = ['all'], onChange, children }) {
    const isAll = value.includes('all') || value.length === 0;

    const toggleAll = () => {
        onChange(isAll ? [] : ['all']);
    };

    const toggleChild = (childId) => {
        let newValue = isAll
            ? children.map(c => c.id).filter(id => id !== childId) // switching from ALL to specific
            : value.includes(childId)
                ? value.filter(id => id !== childId)
                : [...value, childId];

        // If all children selected, switch to 'all'
        if (newValue.length === children.length) {
            newValue = ['all'];
        }
        onChange(newValue);
    };

    return (
        <div>
            <label className="text-xs text-muted mb-xs" style={{ display: 'block' }}>Przypisane do</label>
            <div className="flex flex-wrap gap-xs">
                <button
                    type="button"
                    className={`btn btn-sm ${isAll ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={toggleAll}
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                    Wszyscy
                </button>
                {children.map(child => {
                    const isSelected = isAll || value.includes(child.id);
                    return (
                        <button
                            key={child.id}
                            type="button"
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => toggleChild(child.id)}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                            {child.avatar} {child.name}
                        </button>
                    );
                })}
            </div>
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
        if (window.confirm(`Usunąć "${childName}"? Wszystkie dane zostaną utracone.`)) {
            removeChild(childId);
        }
    };

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <h3>Profile Dzieci</h3>
            <div className="flex flex-col gap-sm">
                {state.children.map(child => {
                    const levelInfo = computeLevel(child.xp || 0, state.settings.levelThresholds || []);
                    return (
                        <div key={child.id} className="edit-list-item">
                            {editingId === child.id ? (
                                <>
                                    <EmojiPicker value={editAvatar} onChange={setEditAvatar} options={AVATAR_OPTIONS} />
                                    <input type="text" className="input flex-1" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                                    <button className="btn btn-icon" onClick={handleSaveEdit} style={{ color: 'var(--color-success)' }}><Save size={16} /></button>
                                    <button className="btn btn-icon" onClick={() => setEditingId(null)}><X size={16} /></button>
                                </>
                            ) : (
                                <>
                                    <span className="quest-icon">{child.avatar}</span>
                                    <div className="flex-1">
                                        <span className="font-medium">{child.name}</span>
                                        <div className="text-xs text-muted">Lvl {levelInfo.level} · {child.xp || 0} XP</div>
                                    </div>
                                    <button className="btn btn-icon" onClick={() => startEdit(child)}><Edit3 size={16} /></button>
                                    <button className="btn btn-icon" onClick={() => handleRemove(child.id, child.name)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <h4 className="mb-sm">Dodaj dziecko</h4>
                <div className="flex gap-sm items-center mb-sm">
                    <EmojiPicker value={newAvatar} onChange={setNewAvatar} options={AVATAR_OPTIONS} />
                    <input type="text" className="input flex-1" placeholder="Imię dziecka" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
                    <button className="btn btn-primary" onClick={handleAdd} disabled={!newName.trim()}><Plus size={16} /> Dodaj</button>
                </div>
            </div>
        </div>
    );
}

// ─── Generic Editable Template List ───

function EditableTemplateList({ templateType, label, fields }) {
    const { state, addTaskTemplate, removeTaskTemplate, updateTaskTemplate, updateTaskTemplates } = useApp();
    const items = state.taskTemplates[templateType];
    const [adding, setAdding] = useState(false);
    const [newItem, setNewItem] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [editItem, setEditItem] = useState({});

    const handleAdd = () => {
        if (!newItem.text?.trim()) return;
        const item = { ...newItem, text: newItem.text.trim() };
        if (!item.assignedTo) item.assignedTo = ['all'];
        addTaskTemplate(templateType, item);
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
                    <EmojiPicker value={itemState[field.name] || '📋'} onChange={(emoji) => setItemState(prev => ({ ...prev, [field.name]: emoji }))} />
                </div>
            );
        }
        if (field.type === 'select') {
            return (
                <div key={field.name}>
                    <label className="text-xs text-muted mb-xs" style={{ display: 'block' }}>{field.label}</label>
                    <select className="input" value={itemState[field.name] || field.defaultValue || ''} onChange={(e) => setItemState(prev => ({ ...prev, [field.name]: e.target.value }))}>
                        {field.options.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                </div>
            );
        }
        if (field.type === 'checkbox') {
            return (
                <label key={field.name} className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
                    <input type="checkbox" checked={itemState[field.name] || false} onChange={(e) => setItemState(prev => ({ ...prev, [field.name]: e.target.checked }))} />
                    <span className="text-sm">{field.label}</span>
                </label>
            );
        }
        if (field.type === 'childSelector') {
            return (
                <ChildSelector
                    key={field.name}
                    value={itemState[field.name] || ['all']}
                    onChange={(val) => setItemState(prev => ({ ...prev, [field.name]: val }))}
                    children={state.children}
                />
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
                <button className="btn btn-ghost" onClick={() => { setAdding(!adding); setNewItem({}); }}><Plus size={16} /> Dodaj</button>
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
                                    <button className="btn btn-icon" onClick={handleSaveEdit} style={{ color: 'var(--color-success)' }}><Save size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-xs" style={{ marginRight: '4px' }}>
                                    <button className="btn btn-icon" onClick={() => moveItem(idx, -1)} disabled={idx === 0} style={{ padding: '2px', opacity: idx === 0 ? 0.3 : 1 }} title="Przesuń wyżej"><ChevronUp size={14} /></button>
                                    <button className="btn btn-icon" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} style={{ padding: '2px', opacity: idx === items.length - 1 ? 0.3 : 1 }} title="Przesuń niżej"><ChevronDown size={14} /></button>
                                </div>
                                <span className="quest-icon">{item.icon || '📋'}</span>
                                <div className="flex-1">
                                    <span className="font-medium text-sm">{item.text}</span>
                                    <div className="text-xs text-muted">
                                        {item.rewardMinutes && <span className="text-success">+{item.rewardMinutes} min</span>}
                                        {item.penaltyMinutes && <span className="text-danger">−{item.penaltyMinutes} min</span>}
                                        {item.category && <span> · {CATEGORY_LABELS[item.category]?.label || item.category}</span>}
                                        {(item.xpReward || 0) > 0 && <span className="text-warning"> · +{item.xpReward} XP</span>}
                                        {(item.xpPenalty || 0) > 0 && <span className="text-danger"> · −{item.xpPenalty} XP</span>}
                                        {item.hasNextDayConsequence && (
                                            <span className="text-warning">
                                                {' '}· ⚡ jutro: {item.nextDayPenalty ? `−${item.nextDayPenalty}` : item.nextDayBonus ? `+${item.nextDayBonus}` : ''} min
                                            </span>
                                        )}
                                        {item.multiUse !== undefined && (
                                            <span> · {item.multiUse ? '🔁' : '1x'}</span>
                                        )}
                                        {item.assignedTo && !item.assignedTo.includes('all') && (
                                            <span> · 👤 {item.assignedTo.length} dziec{item.assignedTo.length === 1 ? 'ko' : 'i'}</span>
                                        )}
                                    </div>
                                </div>
                                <button className="btn btn-icon" onClick={() => startEdit(item)}><Edit3 size={16} /></button>
                                <button className="btn btn-icon" onClick={() => { if (window.confirm('Usunąć?')) removeTaskTemplate(templateType, item.id); }} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
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
                    name: 'category', label: 'Kategoria', type: 'select', defaultValue: 'morning', options: [
                        { value: 'morning', label: '☀️ Poranny' }, { value: 'afternoon', label: '🏫 Popołudniowy' },
                        { value: 'evening', label: '🧹 Wieczorny' }, { value: 'boss', label: '🏰 Finał Dnia' },
                    ]
                },
                { name: 'penaltyMinutes', label: 'Kara za niewykonanie (minuty)', placeholder: '10', type: 'number' },
                { name: 'xpReward', label: 'XP za wykonanie', placeholder: '100', type: 'number' },
                { name: 'hasNextDayConsequence', label: 'Skutek przeniesiony na następny dzień', type: 'checkbox' },
                { name: 'nextDayPenalty', label: 'Obniżenie czasu bazowego jutro (minuty)', placeholder: '10', type: 'number' },
                { name: 'assignedTo', label: 'Przypisane do', type: 'childSelector' },
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
                { name: 'xpReward', label: 'XP za wykonanie', placeholder: '150', type: 'number' },
                { name: 'multiUse', label: 'Można użyć wiele razy na dobę', type: 'checkbox' },
                { name: 'hasNextDayConsequence', label: 'Bonus przeniesiony na następny dzień', type: 'checkbox' },
                { name: 'nextDayBonus', label: 'Dodatkowy czas bazowy jutro (minuty)', placeholder: '10', type: 'number' },
                { name: 'assignedTo', label: 'Przypisane do', type: 'childSelector' },
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
                { name: 'xpPenalty', label: 'Utrata XP (opcjonalnie)', placeholder: '0', type: 'number' },
                { name: 'multiUse', label: 'Można użyć wiele razy na dobę', type: 'checkbox' },
                { name: 'hasNextDayConsequence', label: 'Konsekwencja na następny dzień', type: 'checkbox' },
                { name: 'nextDayPenalty', label: 'Obniżenie czasu bazowego jutro (minuty)', placeholder: '10', type: 'number' },
                { name: 'assignedTo', label: 'Przypisane do', type: 'childSelector' },
            ]}
        />
    );
}

// ─── Levels Tab ───

function LevelsTab() {
    const { state, updateSettings } = useApp();
    const thresholds = state.settings.levelThresholds || [];
    const [editing, setEditing] = useState(null);
    const [editXp, setEditXp] = useState(0);
    const [editReward, setEditReward] = useState('');
    const [newXp, setNewXp] = useState('');
    const [newReward, setNewReward] = useState('');

    const handleAdd = () => {
        if (!newXp || !newReward.trim()) return;
        const updated = [...thresholds, { level: thresholds.length + 1, xp: Number(newXp), reward: newReward.trim() }]
            .sort((a, b) => a.xp - b.xp)
            .map((t, i) => ({ ...t, level: i + 1 }));
        updateSettings({ levelThresholds: updated });
        setNewXp('');
        setNewReward('');
    };

    const handleRemove = (idx) => {
        const updated = thresholds.filter((_, i) => i !== idx).map((t, i) => ({ ...t, level: i + 1 }));
        updateSettings({ levelThresholds: updated });
    };

    const handleSaveEdit = (idx) => {
        const updated = [...thresholds];
        updated[idx] = { ...updated[idx], xp: Number(editXp), reward: editReward.trim() };
        const sorted = updated.sort((a, b) => a.xp - b.xp).map((t, i) => ({ ...t, level: i + 1 }));
        updateSettings({ levelThresholds: sorted });
        setEditing(null);
    };

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <h3>⭐ Progi Leveli i Nagrody</h3>
            <p className="text-muted text-xs">Ustal ile XP potrzeba na każdy poziom i jaką nagrodę dziecko zdobędzie.</p>

            <div className="flex flex-col gap-sm">
                {thresholds.map((t, i) => (
                    <div key={i} className="edit-list-item">
                        {editing === i ? (
                            <>
                                <input type="number" className="input" style={{ width: '80px' }} value={editXp} onChange={e => setEditXp(e.target.value)} />
                                <input type="text" className="input flex-1" value={editReward} onChange={e => setEditReward(e.target.value)} />
                                <button className="btn btn-icon" onClick={() => handleSaveEdit(i)} style={{ color: 'var(--color-success)' }}><Save size={16} /></button>
                                <button className="btn btn-icon" onClick={() => setEditing(null)}><X size={16} /></button>
                            </>
                        ) : (
                            <>
                                <span className="font-bold text-warning" style={{ minWidth: '50px' }}>Lvl {t.level}</span>
                                <span className="text-sm text-muted" style={{ minWidth: '70px' }}>{t.xp} XP</span>
                                <span className="flex-1 font-medium text-sm">{t.reward}</span>
                                <button className="btn btn-icon" onClick={() => { setEditing(i); setEditXp(t.xp); setEditReward(t.reward); }}><Edit3 size={16} /></button>
                                <button className="btn btn-icon" onClick={() => handleRemove(i)} style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <h4 className="mb-sm">Dodaj próg</h4>
                <div className="flex gap-sm items-center">
                    <input type="number" className="input" style={{ width: '100px' }} placeholder="XP" value={newXp} onChange={e => setNewXp(e.target.value)} />
                    <input type="text" className="input flex-1" placeholder="Nagroda (np. 🍦 Lody)" value={newReward} onChange={e => setNewReward(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
                    <button className="btn btn-primary" onClick={handleAdd} disabled={!newXp || !newReward.trim()}><Plus size={16} /></button>
                </div>
            </div>

            {/* XP multiplier for offline days */}
            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <h4 className="mb-sm">Mnożnik XP w dni bez ekranów</h4>
                <div className="flex gap-sm items-center">
                    <span className="text-sm">×</span>
                    <input
                        type="number"
                        className="input"
                        style={{ width: '80px' }}
                        value={state.settings.xpMultiplierOffline || 2}
                        onChange={e => updateSettings({ xpMultiplierOffline: Number(e.target.value) })}
                        min={1}
                        max={5}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Offline Days Calendar ───

const MONTH_NAMES = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const CAL_DAY_HEADERS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

function OfflineDaysCalendar({ schedule, overrides, onToggleDate }) {
    const [viewDate, setViewDate] = useState(new Date());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Monday-based offset (0=Mon, 6=Sun)
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

    const formatDate = (day) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const todayStr = new Date().toISOString().slice(0, 10);

    const getStatus = (day) => {
        if (!day) return null;
        const dateStr = formatDate(day);
        const hasOverride = overrides[dateStr] !== undefined;
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
        const inSchedule = schedule.includes(dayOfWeek);
        const isOff = hasOverride ? !!overrides[dateStr] : inSchedule;
        return { dateStr, isOff, inSchedule, hasOverride, isToday: dateStr === todayStr };
    };

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    return (
        <div>
            <div className="flex items-center justify-between mb-sm">
                <button className="btn btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
                <strong className="text-sm">{MONTH_NAMES[month]} {year}</strong>
                <button className="btn btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                {CAL_DAY_HEADERS.map(d => (
                    <div key={d} className="text-xs text-muted font-semibold" style={{ padding: '4px 0' }}>{d}</div>
                ))}
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const status = getStatus(day);
                    const isPast = status.dateStr < todayStr;
                    return (
                        <button
                            key={i}
                            className={`btn btn-sm ${status.isOff ? (status.hasOverride ? 'btn-warning' : 'btn-primary') : 'btn-ghost'}`}
                            onClick={() => onToggleDate(status.dateStr)}
                            disabled={isPast && !status.isToday}
                            title={
                                status.isOff
                                    ? (status.inSchedule && !status.hasOverride ? 'Z harmonogramu' : 'Wyjątek ręczny')
                                    : 'Kliknij aby ustawić offline'
                            }
                            style={{
                                padding: '4px 0', minWidth: 0, fontSize: '0.8rem',
                                opacity: isPast && !status.isToday ? 0.4 : 1,
                                position: 'relative',
                                border: status.isToday ? '2px solid var(--color-info)' : undefined,
                            }}
                        >
                            {day}
                            {status.inSchedule && !status.hasOverride && status.isOff && (
                                <span style={{
                                    position: 'absolute', bottom: '1px', left: '50%', transform: 'translateX(-50%)',
                                    width: '4px', height: '4px', borderRadius: '50%',
                                    background: 'var(--color-info)',
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex gap-sm items-center mt-sm" style={{ fontSize: '0.7rem' }}>
                <span className="flex items-center gap-xs">
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-primary)', display: 'inline-block' }} />
                    Z harmonogramu
                </span>
                <span className="flex items-center gap-xs">
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--color-warning)', display: 'inline-block' }} />
                    Wyjątek ręczny
                </span>
            </div>
        </div>
    );
}

// ─── Settings Tab ───

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

    // Offline days schedule
    const schedule = state.settings.offlineDaysSchedule || [];
    const toggleDay = (dayNum) => {
        const newSchedule = schedule.includes(dayNum)
            ? schedule.filter(d => d !== dayNum)
            : [...schedule, dayNum].sort();
        updateSettings({ offlineDaysSchedule: newSchedule });
    };

    // Override today
    const todayStr = new Date().toISOString().slice(0, 10);
    const overrides = state.settings.offlineDaysOverride || {};
    const toggleTodayOffline = () => {
        const newOverrides = { ...overrides };
        if (newOverrides[todayStr]) {
            delete newOverrides[todayStr];
        } else {
            newOverrides[todayStr] = true;
        }
        updateSettings({ offlineDaysOverride: newOverrides });
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
                    <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Zapisz ustawienia</button>
                </div>
            </div>

            <h3>📅 Dni bez ekranów</h3>
            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <p className="text-muted text-xs mb-sm">Zaznacz stałe dni tygodnia bez dostępu do ekranów. W te dni dzieci zbierają XP z mnożnikiem.</p>
                <div className="flex flex-wrap gap-sm mb-md">
                    {DAY_LABELS.map(day => (
                        <button
                            key={day.value}
                            className={`btn btn-sm ${schedule.includes(day.value) ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => toggleDay(day.value)}
                            style={{ minWidth: '44px' }}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-sm mb-md">
                    <button
                        className={`btn btn-sm ${overrides[todayStr] ? 'btn-warning' : 'btn-secondary'}`}
                        onClick={toggleTodayOffline}
                    >
                        <Calendar size={14} /> {overrides[todayStr] ? '✓ Dziś = offline' : 'Włącz offline na dziś'}
                    </button>
                </div>
            </div>

            <h3>📆 Kalendarz wyjątków</h3>
            <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <p className="text-muted text-xs mb-sm">Kliknij w datę aby zaplanować dodatkowy dzień bez ekranów (wyjątek ręczny). Niebieskie z kropką = z harmonogramu tygodniowego.</p>
                <OfflineDaysCalendar
                    schedule={schedule}
                    overrides={overrides}
                    onToggleDate={(dateStr) => {
                        const newOverrides = { ...overrides };
                        if (newOverrides[dateStr]) {
                            delete newOverrides[dateStr];
                        } else {
                            newOverrides[dateStr] = true;
                        }
                        updateSettings({ offlineDaysOverride: newOverrides });
                    }}
                />
            </div>

            <h3>Kopia Zapasowa</h3>
            <div className="flex gap-sm">
                <button className="btn btn-secondary flex-1" onClick={handleExport}><Download size={16} /> Eksportuj dane</button>
                <button className="btn btn-secondary flex-1" onClick={handleImport}><Upload size={16} /> Importuj dane</button>
            </div>
        </div>
    );
}

// ─── Child Preview Tab ───

function ChildPreviewTab() {
    const { state, getOrCreateDayLog, updateDayLog } = useApp();
    const [selectedChildId, setSelectedChildId] = useState(state.children[0]?.id || null);

    const child = state.children.find(c => c.id === selectedChildId);
    const dayLog = selectedChildId ? getOrCreateDayLog(selectedChildId) : null;

    const handleRemovePenalty = (penaltyId) => {
        if (!dayLog || !selectedChildId) return;
        const updated = removePenalty(dayLog, penaltyId);
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
        return <div className="text-center text-secondary animate-fade-in"><p>Dodaj dzieci w zakładce "Dzieci"</p></div>;
    }

    return (
        <div className="flex flex-col gap-md animate-fade-in">
            <h3>Podgląd Dnia Dziecka</h3>
            <div className="flex gap-sm flex-wrap">
                {state.children.map(c => (
                    <button key={c.id} className={`btn ${selectedChildId === c.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedChildId(c.id)}>
                        {c.avatar} {c.name}
                    </button>
                ))}
            </div>

            {child && dayLog && (
                <>
                    <div className="card" style={{ background: 'var(--bg-primary)' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-muted text-sm">Aktualny czas:</span>
                            <span className="font-bold text-lg">{dayLog.currentTime} / {dayLog.maxTime} min</span>
                        </div>
                        <div className="flex items-center justify-between" style={{ marginTop: '4px' }}>
                            <span className="text-muted text-sm">XP dziś:</span>
                            <span className="font-bold text-warning">+{dayLog.xpEarned || 0} XP {dayLog.isOfflineDay ? `(×${dayLog.xpMultiplier})` : ''}</span>
                        </div>
                        <div className="flex items-center justify-between" style={{ marginTop: '4px' }}>
                            <span className="text-muted text-sm">Łącznie XP:</span>
                            <span className="font-bold text-sm">{child.xp || 0} XP (Lvl {computeLevel(child.xp || 0, state.settings.levelThresholds || []).level})</span>
                        </div>
                    </div>

                    {dayLog.carryOverEffects && dayLog.carryOverEffects.length > 0 && (
                        <div className="carry-over-banner">
                            <div className="flex items-center gap-sm mb-sm">
                                <AlertTriangle size={16} className="text-warning" />
                                <strong className="text-warning text-sm">Konsekwencje z wczoraj</strong>
                            </div>
                            {dayLog.carryOverEffects.map((eff, i) => (<p key={i} className="text-sm text-secondary">{eff.text}</p>))}
                        </div>
                    )}

                    <div className="card card-success-top">
                        <h4 className="mb-sm text-success flex items-center gap-sm"><Sparkles size={18} /> Dodaj bonus</h4>
                        <div className="flex flex-wrap gap-xs">
                            {state.taskTemplates.bonusMissions
                                .filter(m => !m.assignedTo || m.assignedTo.includes('all') || m.assignedTo.includes(selectedChildId))
                                .map(mission => (
                                    <button key={mission.id} className="btn btn-success text-sm" onClick={() => handleAddBonus(mission)} disabled={dayLog.currentTime >= dayLog.maxTime}>
                                        {mission.icon} {mission.text} (+{mission.rewardMinutes}) {mission.hasNextDayConsequence && ' ⚡'}
                                    </button>
                                ))}
                        </div>
                    </div>

                    <div className="card card-danger-top">
                        <h4 className="mb-sm text-danger flex items-center gap-sm"><Swords size={18} /> Dodaj uchybienie</h4>
                        <div className="flex flex-wrap gap-xs">
                            {state.taskTemplates.penalties
                                .filter(p => !p.assignedTo || p.assignedTo.includes('all') || p.assignedTo.includes(selectedChildId))
                                .map(penalty => (
                                    <button key={penalty.id} className="btn btn-danger text-sm" onClick={() => handleApplyPenalty(penalty)} disabled={dayLog.currentTime <= 0}>
                                        {penalty.icon} {penalty.text} (−{penalty.penaltyMinutes}) {penalty.hasNextDayConsequence && ' ⚡'}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {dayLog.penalties.length > 0 && (
                        <div className="card">
                            <h4 className="mb-sm">Uchybienia dziś (kliknij aby usunąć)</h4>
                            <div className="flex flex-wrap gap-xs">
                                {dayLog.penalties.map(penalty => (
                                    <button key={penalty.id} className="event-tag negative" onClick={() => handleRemovePenalty(penalty.id)} style={{ cursor: 'pointer' }}>
                                        ❌ −{penalty.penaltyMinutes} {penalty.text} {penalty.carryToNextDay && ' ⚡'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {dayLog.events.length > 0 && (
                        <div className="card">
                            <h4 className="mb-sm">Ostatnie zdarzenia</h4>
                            <div className="flex flex-wrap gap-xs">
                                {[...dayLog.events].reverse().slice(0, 10).map(event => (
                                    <span key={event.id} className={`event-tag ${event.type}`}>{event.text}</span>
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
    { id: 'levels', label: 'Levele', icon: Star },
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
            case 'levels': return <LevelsTab />;
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
                <button className="btn btn-icon" onClick={logout} title="Wyloguj"><LogOut size={20} /></button>
            </div>

            <div className="card mb-md" style={{ padding: 'var(--space-xs)', overflowX: 'auto' }}>
                <div className="tab-bar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} className={`tab-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <Icon size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="card">{renderTab()}</div>
        </div>
    );
}
