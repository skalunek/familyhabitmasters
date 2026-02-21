import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { AVATAR_OPTIONS } from '../data/defaults';
import { Gamepad2, ShieldCheck, Users, ArrowLeft } from 'lucide-react';

function PinPad({ onSubmit, title, subtitle, error }) {
    const [pin, setPin] = useState('');

    const handleKey = (key) => {
        if (key === 'clear') {
            setPin('');
        } else if (key === 'back') {
            setPin(prev => prev.slice(0, -1));
        } else if (pin.length < 4) {
            const newPin = pin + key;
            setPin(newPin);
            if (newPin.length === 4) {
                setTimeout(() => {
                    onSubmit(newPin);
                    setPin('');
                }, 200);
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-lg animate-slide-up">
            <h2>{title}</h2>
            {subtitle && <p className="text-secondary text-sm">{subtitle}</p>}

            <div className="pin-dots">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`pin-dot ${i < pin.length ? (error ? 'error' : 'filled') : ''}`} />
                ))}
            </div>

            {error && <p className="text-danger text-sm animate-fade-in">{error}</p>}

            <div className="pin-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button key={n} className="pin-key" onClick={() => handleKey(String(n))}>{n}</button>
                ))}
                <button className="pin-key" onClick={() => handleKey('clear')}>C</button>
                <button className="pin-key" onClick={() => handleKey('0')}>0</button>
                <button className="pin-key" onClick={() => handleKey('back')}>←</button>
            </div>
        </div>
    );
}

function SetupScreen() {
    const { setupParentPin, addChild } = useApp();
    const [step, setStep] = useState('pin'); // 'pin' | 'confirm' | 'child'
    const [firstPin, setFirstPin] = useState('');
    const [childName, setChildName] = useState('');
    const [childAvatar, setChildAvatar] = useState('🦸');
    const [error, setError] = useState('');

    const handleFirstPin = (pin) => {
        setFirstPin(pin);
        setStep('confirm');
        setError('');
    };

    const handleConfirmPin = async (pin) => {
        if (pin === firstPin) {
            await setupParentPin(pin);
            setStep('child');
            setError('');
        } else {
            setError('PIN-y się nie zgadzają. Spróbuj ponownie.');
            setStep('pin');
            setFirstPin('');
        }
    };

    const handleAddChild = () => {
        if (childName.trim()) {
            addChild(childName.trim(), childAvatar);
            // Setup complete, app will re-render with isSetup=true
        }
    };

    return (
        <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
            <div className="card card-glow w-full" style={{ maxWidth: '400px' }}>
                <div className="flex flex-col items-center gap-md mb-lg">
                    <div className="app-logo-icon" style={{ width: '64px', height: '64px', fontSize: '2rem' }}>🎮</div>
                    <h1 className="app-title" style={{ fontSize: '1.5rem' }}>Mistrzowie Nawyków</h1>
                    <p className="text-secondary text-sm text-center">Witaj! Skonfigurujmy aplikację.</p>
                </div>

                {step === 'pin' && (
                    <PinPad
                        onSubmit={handleFirstPin}
                        title="Ustaw PIN rodzica"
                        subtitle="Wprowadź 4-cyfrowy PIN do panelu rodzica"
                        error={error}
                    />
                )}

                {step === 'confirm' && (
                    <PinPad
                        onSubmit={handleConfirmPin}
                        title="Potwierdź PIN"
                        subtitle="Wprowadź PIN ponownie"
                        error={error}
                    />
                )}

                {step === 'child' && (
                    <div className="flex flex-col gap-md animate-slide-up">
                        <h2 className="text-center">Dodaj pierwsze dziecko</h2>
                        <p className="text-secondary text-sm text-center">Wpisz imię i wybierz avatar</p>

                        <input
                            type="text"
                            className="input input-lg"
                            placeholder="Imię dziecka"
                            value={childName}
                            onChange={(e) => setChildName(e.target.value)}
                            autoFocus
                        />

                        <div className="avatar-grid">
                            {AVATAR_OPTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    className={`avatar-option ${childAvatar === emoji ? 'selected' : ''}`}
                                    onClick={() => setChildAvatar(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary btn-lg btn-full"
                            onClick={handleAddChild}
                            disabled={!childName.trim()}
                        >
                            Rozpocznij przygodę! 🚀
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LoginScreen() {
    const { state, checkPin } = useApp();
    const { loginAsParent, selectChild } = useAuth();
    const [view, setView] = useState('main'); // 'main' | 'pin' | 'children'
    const [pinError, setPinError] = useState('');

    // First-time setup
    if (!state?.isSetup) {
        return <SetupScreen />;
    }

    const handlePinSubmit = async (pin) => {
        const valid = await checkPin(pin);
        if (valid) {
            loginAsParent();
            setPinError('');
        } else {
            setPinError('Nieprawidłowy PIN');
        }
    };

    if (view === 'pin') {
        return (
            <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
                <div className="card card-glow w-full" style={{ maxWidth: '400px' }}>
                    <button className="btn btn-ghost mb-md" onClick={() => { setView('main'); setPinError(''); }}>
                        <ArrowLeft size={16} /> Wróć
                    </button>
                    <PinPad
                        onSubmit={handlePinSubmit}
                        title="🔐 PIN Rodzica"
                        subtitle="Wprowadź 4-cyfrowy PIN"
                        error={pinError}
                    />
                </div>
            </div>
        );
    }

    if (view === 'children') {
        return (
            <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
                <div className="card card-glow w-full" style={{ maxWidth: '400px' }}>
                    <button className="btn btn-ghost mb-md" onClick={() => setView('main')}>
                        <ArrowLeft size={16} /> Wróć
                    </button>
                    <h2 className="text-center mb-lg">👋 Kto gra?</h2>

                    <div className="flex flex-col gap-md">
                        {state.children.length === 0 ? (
                            <div className="text-center text-secondary">
                                <p>Brak profili dzieci.</p>
                                <p className="text-sm">Rodzic musi najpierw dodać dziecko w panelu.</p>
                            </div>
                        ) : (
                            state.children.map(child => (
                                <button
                                    key={child.id}
                                    className="child-card"
                                    onClick={() => selectChild(child.id)}
                                >
                                    <span className="avatar">{child.avatar}</span>
                                    <span className="name">{child.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Main view
    return (
        <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
            <div className="card card-glow w-full" style={{ maxWidth: '400px' }}>
                <div className="flex flex-col items-center gap-lg">
                    <div className="app-logo-icon" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
                        🎮
                    </div>
                    <h1 className="app-title" style={{ fontSize: '1.75rem' }}>Mistrzowie Nawyków</h1>
                    <p className="text-secondary text-center">Zamień obowiązki w ekscytujące misje!</p>

                    <div className="flex flex-col gap-md w-full" style={{ marginTop: 'var(--space-md)' }}>
                        <button
                            className="btn btn-primary btn-lg btn-full"
                            onClick={() => setView('pin')}
                        >
                            <ShieldCheck size={20} />
                            Jestem Rodzicem
                        </button>

                        <button
                            className="btn btn-secondary btn-lg btn-full"
                            onClick={() => setView('children')}
                        >
                            <Users size={20} />
                            Jestem Dzieckiem
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
