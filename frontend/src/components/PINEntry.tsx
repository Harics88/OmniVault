import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Use relative URLs for API calls (works in all environments)
const API_BASE = '/api';

interface PINEntryProps {
    mode: 'setup' | 'verify';
    onSuccess: () => void;
    onCancel?: () => void;
}

const PINEntry: React.FC<PINEntryProps> = ({ mode, onSuccess, onCancel }) => {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinTip, setPinTip] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm' | 'tip'>('enter');
    const [fetchedTip, setFetchedTip] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const isSubmitting = useRef(false);

    // Fetch tip in verify mode
    useEffect(() => {
        if (mode === 'verify') {
            const fetchStatus = async () => {
                try {
                    const response = await fetch(`${API_BASE}/vault/pin/status`);
                    const data = await response.json();
                    if (data.tip) {
                        setFetchedTip(data.tip);
                    }
                } catch (err) {
                    console.error('Failed to fetch PIN tip:', err);
                }
            };
            fetchStatus();
        }
    }, [mode]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (loading || isSubmitting.current || step === 'tip') return;

            // Handle digits 0-9
            if (/^[0-9]$/.test(e.key)) {
                handleNumberClick(parseInt(e.key));
            }
            // Handle backspace
            else if (e.key === 'Backspace') {
                handleBackspace();
            }
            // Handle escape
            else if (e.key === 'Escape') {
                if (onCancel) {
                    onCancel();
                } else {
                    navigate('/');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loading, step, mode, pin, confirmPin, onCancel]);

    const handleNumberClick = (num: number) => {
        if (loading) return;

        if (mode === 'setup' && step === 'confirm') {
            if (confirmPin.length < 4) {
                setConfirmPin(prev => prev + num);
            }
        } else {
            if (pin.length < 4) {
                setPin(prev => prev + num);
            }
        }
    };

    const handleBackspace = () => {
        if (loading) return;

        if (mode === 'setup' && step === 'confirm') {
            setConfirmPin(prev => prev.slice(0, -1));
        } else {
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleClear = () => {
        if (loading) return;

        setPin('');
        setConfirmPin('');
        setPinTip('');
        setError('');
        setStep('enter');
        isSubmitting.current = false;
    };

    const handleSubmit = async () => {
        if (isSubmitting.current || loading) {
            return;
        }

        isSubmitting.current = true;
        setError('');
        setLoading(true);

        try {
            if (mode === 'setup') {
                if (step === 'enter') {
                    setStep('confirm');
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                } else if (step === 'confirm') {
                    if (pin !== confirmPin) {
                        setError('PINs do not match');
                        setConfirmPin('');
                        setLoading(false);
                        isSubmitting.current = false;
                        return;
                    }
                    setStep('tip');
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                } else {
                    // Setup PIN with tip
                    const response = await fetch(`${API_BASE}/vault/pin/setup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin, tip: pinTip }),
                    });

                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.detail || 'Failed to setup PIN');
                    }

                    setLoading(false);
                    onSuccess();
                }
            } else {
                // Verify PIN
                const response = await fetch(`${API_BASE}/vault/pin/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin }),
                });

                const data = await response.json();

                if (!data.valid) {
                    setError('Invalid PIN');
                    setPin('');
                    setLoading(false);
                    isSubmitting.current = false;
                    return;
                }

                setLoading(false);
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            setPin('');
            setConfirmPin('');
            setStep('enter');
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    // Auto-submit when 4 digits entered
    useEffect(() => {
        if (isSubmitting.current || loading || step === 'tip') return;

        if (mode === 'setup' && step === 'enter' && pin.length === 4) {
            handleSubmit();
            return;
        }

        if (mode === 'setup' && step === 'confirm' && confirmPin.length === 4) {
            handleSubmit();
            return;
        }

        if (mode === 'verify' && pin.length === 4) {
            handleSubmit();
            return;
        }
    }, [pin, confirmPin, step, mode, loading]);

    const currentPinDigits = mode === 'setup' && step === 'confirm' ? confirmPin : pin;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'setup'
                            ? step === 'enter'
                                ? 'Set Your PIN'
                                : step === 'confirm'
                                    ? 'Confirm Your PIN'
                                    : 'Add a PIN Tip'
                            : 'Enter Your PIN'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {mode === 'setup'
                            ? step === 'enter'
                                ? 'Choose a 4-digit PIN to protect your vault'
                                : step === 'confirm'
                                    ? 'Re-enter your PIN to confirm'
                                    : 'Mandatory: add a hint to help you remember your PIN'
                            : fetchedTip
                                ? `Hint: ${fetchedTip}`
                                : 'Enter your 4-digit PIN to access the vault'}
                    </p>
                </div>

                {step === 'tip' ? (
                    <div className="mb-6">
                        <textarea
                            value={pinTip}
                            onChange={(e) => setPinTip(e.target.value)}
                            placeholder="e.g. My lucky number, My graduation year..."
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all resize-none h-24 mb-4"
                            autoFocus
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !pinTip.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Complete Setup'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* PIN Display */}
                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${i < currentPinDigits.length
                                        ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110'
                                        : 'border-gray-600'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-6 text-center text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Number Pad */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num)}
                                    disabled={loading || currentPinDigits.length >= 4}
                                    className="bg-gray-700/50 hover:bg-gray-600 text-white text-2xl font-semibold rounded-xl h-14 transition-all active:scale-95 disabled:opacity-30 border border-gray-600/30"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleClear}
                                disabled={loading}
                                className="bg-gray-700/30 hover:bg-gray-600/50 text-gray-400 rounded-xl h-14 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider border border-gray-600/20"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => handleNumberClick(0)}
                                disabled={loading || currentPinDigits.length >= 4}
                                className="bg-gray-700/50 hover:bg-gray-600 text-white text-2xl font-semibold rounded-xl h-14 transition-all active:scale-95 disabled:opacity-30 border border-gray-600/30"
                            >
                                0
                            </button>
                            <button
                                onClick={handleBackspace}
                                disabled={loading || currentPinDigits.length === 0}
                                className="bg-gray-700/30 hover:bg-gray-600/50 text-gray-400 rounded-xl h-14 transition-all active:scale-95 border border-gray-600/20"
                            >
                                ⌫
                            </button>
                        </div>
                    </>
                )}

                {/* Navigation Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            if (step === 'tip') {
                                setStep('confirm');
                                setConfirmPin('');
                                return;
                            }
                            if (onCancel) {
                                onCancel();
                            } else {
                                navigate('/');
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-transparent hover:bg-gray-700/50 text-gray-400 hover:text-white py-2.5 rounded-lg transition-all text-sm font-medium"
                    >
                        {step === 'tip' ? 'Go Back' : 'Cancel'}
                    </button>

                    {/* Loading Indicator */}
                    {loading && step !== 'tip' && (
                        <div className="text-center text-gray-500 mt-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <p className="text-[10px] mt-1 font-medium tracking-widest uppercase">Securing</p>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default PINEntry;
