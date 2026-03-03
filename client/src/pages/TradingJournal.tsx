import { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";

interface JournalEntry {
    date: string;
    daily_notes: string;
    mood: string;
    screenshot_url?: string;
}

interface Trade {
    trade_id: number;
    account_id?: number;
    ticker: string;
    entry_price: string;
    exit_price: string;
    pnl: string;
    asset_type: string;
    setup: string;
    trade_type: string;
    shares: number;
    created_at: string;
    trade_screenshot_url?: string;
}

interface Account {
    account_id: number;
    account_name: string;
}

export default function TradingJournal() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [journal, setJournal] = useState<JournalEntry>({ date: selectedDate, daily_notes: '', mood: 'Neutral', screenshot_url: '' });
    const [isSavingJournal, setIsSavingJournal] = useState(false);
    const [isUploadingJournal, setIsUploadingJournal] = useState(false);

    const [dayTrades, setDayTrades] = useState<Trade[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [tradeForm, setTradeForm] = useState({
        account_id: '',
        ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout',
        shares: '', entry_price: '', exit_price: '', pnl: '', trade_screenshot_url: ''
    });
    const [isUploadingTrade, setIsUploadingTrade] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchAccounts = async () => {
            try {
                const res = await fetch(`${API_URL}/accounts?user_id=${user.id}`);
                const data = await res.json();
                setAccounts(data);
                if (data.length > 0) {
                    setTradeForm(prev => ({ ...prev, account_id: data[0].account_id.toString() }));
                }
            } catch (error) {
                console.error("Error fetching accounts:", error);
            }
        };
        fetchAccounts();
    }, [user, API_URL]);

    useEffect(() => {
        if (!user) return;
        fetchJournalData();
        fetchDayTrades();
    }, [user, selectedDate]);

    const fetchJournalData = async () => {
        try {
            const res = await fetch(`${API_URL}/journal?user_id=${user?.id}`);
            const data: JournalEntry[] = await res.json();

            const todaysEntry = data.find(entry => entry.date.substring(0, 10) === selectedDate);
            if (todaysEntry) {
                setJournal({ ...todaysEntry, screenshot_url: todaysEntry.screenshot_url || '' });
            } else {
                setJournal({ date: selectedDate, daily_notes: '', mood: 'Neutral', screenshot_url: '' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDayTrades = async () => {
        try {
            const res = await fetch(`${API_URL}/trades?user_id=${user?.id}&category=DAY_TRADE`);
            const data: Trade[] = await res.json();
            setDayTrades(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'journal' | 'trade') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            alert("Cloudinary credentials are missing in your .env file!");
            return;
        }

        target === 'journal' ? setIsUploadingJournal(true) : setIsUploadingTrade(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (data.secure_url) {
                if (target === 'journal') {
                    setJournal(prev => ({ ...prev, screenshot_url: data.secure_url }));
                } else {
                    setTradeForm(prev => ({ ...prev, trade_screenshot_url: data.secure_url }));
                }
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image.");
        } finally {
            target === 'journal' ? setIsUploadingJournal(false) : setIsUploadingTrade(false);
        }
    };

    const handleJournalSave = async () => {
        if (!user) return;
        setIsSavingJournal(true);
        try {
            await fetch(`${API_URL}/journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...journal, user_id: user.id, date: selectedDate })
            });
            alert("Journal Saved! ✅");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSavingJournal(false);
        }
    };

    const handleTradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/trades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...tradeForm,
                    user_id: user.id,
                    trade_category: 'DAY_TRADE',
                    created_at: selectedDate,
                    account_id: tradeForm.account_id ? parseInt(tradeForm.account_id) : null
                })
            });
            if (res.ok) {
                setTradeForm(prev => ({
                    ...prev, ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout', shares: '', entry_price: '', exit_price: '', pnl: '', trade_screenshot_url: ''
                }));
                fetchDayTrades();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTrade = async (id: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trade? This will reverse the P&L from your account.");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${API_URL}/trades/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDayTrades(prev => prev.filter(trade => trade.trade_id !== id));
            }
        } catch (error) {
            console.error("Error deleting trade:", error);
        }
    };

    const displayedTrades = dayTrades.filter(trade => {
        if (!trade.created_at) return false;
        return trade.created_at.substring(0, 10) === selectedDate;
    });

    // Helper class for standardized inputs
    const inputStyle = "bg-white border border-gray-300 rounded p-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition text-gray-900";

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    📅 Daily Review
                </h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 rounded-lg p-3 font-bold outline-none focus:border-gray-900 transition cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* NOTION STYLE JOURNAL */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[750px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">📝 Trading Journal</h2>
                        <select
                            value={journal.mood}
                            onChange={(e) => setJournal({...journal, mood: e.target.value})}
                            className="bg-white border border-gray-300 rounded p-2 text-sm outline-none focus:border-gray-900 text-gray-900"
                        >
                            <option value="Flow State 🧘‍♂️">Flow State 🧘‍♂️</option>
                            <option value="Neutral 😐">Neutral 😐</option>
                            <option value="Tilted 😡">Tilted 😡</option>
                            <option value="FOMO 🥺">FOMO 🥺</option>
                        </select>
                    </div>

                    <div className="mb-4 space-y-2">
                        <label className="block text-xs text-gray-500 uppercase font-bold">Daily Chart Image</label>

                        {journal.screenshot_url ? (
                            <div className="relative group rounded-lg overflow-hidden border border-gray-200 mb-2">
                                <img src={journal.screenshot_url} alt="Daily Recap" className="w-full h-48 object-cover" />
                                <button
                                    onClick={() => setJournal({...journal, screenshot_url: ''})}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition shadow"
                                >
                                    🗑️ Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Paste TradingView Link here..."
                                    value={journal.screenshot_url}
                                    onChange={(e) => setJournal({...journal, screenshot_url: e.target.value})}
                                    className={`flex-1 ${inputStyle} p-2`}
                                />
                                <span className="text-gray-400 self-center text-sm">or</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'journal')}
                                    disabled={isUploadingJournal}
                                    className="w-28 text-sm text-gray-500 file:py-2 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                                />
                            </div>
                        )}
                        {isUploadingJournal && <span className="text-xs text-gray-500">Uploading... ⏳</span>}
                    </div>

                    <textarea
                        value={journal.daily_notes}
                        onChange={(e) => setJournal({...journal, daily_notes: e.target.value})}
                        placeholder="Pre-market plan, psychological state, market observations..."
                        className="flex-1 w-full bg-white border border-gray-300 rounded-lg p-4 resize-none outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition text-gray-700 min-h-[200px]"
                    />

                    <button
                        onClick={handleJournalSave}
                        disabled={isSavingJournal}
                        className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 shadow-sm shrink-0"
                    >
                        {isSavingJournal ? "Saving..." : "Save Journal Entry"}
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {/* TRADE EXECUTION FORM */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                            ⚡ Log Execution
                        </h2>
                        <form onSubmit={handleTradeSubmit} className="space-y-4">
                            <div>
                                <select
                                    value={tradeForm.account_id}
                                    onChange={(e) => setTradeForm({...tradeForm, account_id: e.target.value})}
                                    className={`w-full ${inputStyle}`}
                                >
                                    <option value="">-- No Account Linked --</option>
                                    {accounts.map(acc => (
                                        <option key={acc.account_id} value={acc.account_id}>
                                            🏦 {acc.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <input name="ticker" value={tradeForm.ticker} onChange={(e) => setTradeForm({...tradeForm, ticker: e.target.value.toUpperCase()})} placeholder="Ticker (NQ)" className={inputStyle} required />
                                <select name="asset_type" value={tradeForm.asset_type} onChange={(e) => setTradeForm({...tradeForm, asset_type: e.target.value})} className={inputStyle}>
                                    <option value="FUTURE">Future</option>
                                    <option value="OPTION">Option</option>
                                    <option value="STOCK">Stock</option>
                                </select>
                                <select name="trade_type" value={tradeForm.trade_type} onChange={(e) => setTradeForm({...tradeForm, trade_type: e.target.value})} className={inputStyle}>
                                    <option value="LONG">Long</option>
                                    <option value="SHORT">Short</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                <input type="number" value={tradeForm.shares} onChange={(e) => setTradeForm({...tradeForm, shares: e.target.value})} placeholder="Size/Qty" className={inputStyle} required />
                                <input type="number" step="0.01" value={tradeForm.entry_price} onChange={(e) => setTradeForm({...tradeForm, entry_price: e.target.value})} placeholder="Entry" className={inputStyle} required />
                                <input type="number" step="0.01" value={tradeForm.exit_price} onChange={(e) => setTradeForm({...tradeForm, exit_price: e.target.value})} placeholder="Exit" className={inputStyle} />
                                <input type="number" step="0.01" value={tradeForm.pnl} onChange={(e) => setTradeForm({...tradeForm, pnl: e.target.value})} placeholder="P&L ($)" className={inputStyle} />
                            </div>

                            <div className="flex flex-col gap-2 border border-gray-200 bg-gray-50 rounded p-3">
                                <label className="text-xs text-gray-500 font-bold whitespace-nowrap">📸 Setup Chart:</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Paste TradingView Link here..."
                                        value={tradeForm.trade_screenshot_url}
                                        onChange={(e) => setTradeForm({...tradeForm, trade_screenshot_url: e.target.value})}
                                        className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs outline-none focus:border-gray-900 text-gray-900"
                                    />
                                    <span className="text-gray-400 text-xs">or</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'trade')}
                                        disabled={isUploadingTrade}
                                        className="w-24 text-xs text-gray-500 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
                                    />
                                </div>
                                {isUploadingTrade && <span className="text-xs text-gray-500">Uploading... ⏳</span>}
                            </div>

                            <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition shadow-sm">
                                Add Execution
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Today's Executions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-gray-500 uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-3">Asset</th>
                                    <th className="p-3">Account</th>
                                    <th className="p-3">In / Out</th>
                                    <th className="p-3 text-right">P&L</th>
                                    <th className="p-3 text-center">Chart</th>
                                    <th className="p-3 text-center">Act</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {displayedTrades.map((trade) => {
                                    const linkedAccount = accounts.find(a => a.account_id === trade.account_id);
                                    return (
                                        <tr key={trade.trade_id} className="hover:bg-gray-50 transition">
                                            <td className="p-3 font-bold text-gray-900">
                                                {trade.ticker} <span className="text-xs text-gray-500 font-normal">({trade.asset_type})</span>
                                            </td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {linkedAccount ? linkedAccount.account_name : '-'}
                                            </td>
                                            <td className="p-3 font-mono text-gray-700">{trade.entry_price} → {trade.exit_price || '-'}</td>
                                            <td className={`p-3 text-right font-bold ${Number(trade.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${trade.pnl || '0.00'}
                                            </td>
                                            <td className="p-3 text-center">
                                                {trade.trade_screenshot_url ? (
                                                    <a href={trade.trade_screenshot_url} target="_blank" rel="noopener noreferrer" className="text-gray-900 underline hover:text-gray-600">
                                                        View
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => deleteTrade(trade.trade_id)}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                    title="Delete Trade"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {displayedTrades.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-gray-400 italic">No trades logged for this date.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}