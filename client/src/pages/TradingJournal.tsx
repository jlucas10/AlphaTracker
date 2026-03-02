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

export default function TradingJournal() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [journal, setJournal] = useState<JournalEntry>({ date: selectedDate, daily_notes: '', mood: 'Neutral', screenshot_url: '' });
    const [isSavingJournal, setIsSavingJournal] = useState(false);
    const [isUploadingJournal, setIsUploadingJournal] = useState(false);

    const [dayTrades, setDayTrades] = useState<Trade[]>([]);

    const [tradeForm, setTradeForm] = useState({
        ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout',
        shares: '', entry_price: '', exit_price: '', pnl: '', trade_screenshot_url: ''
    });
    const [isUploadingTrade, setIsUploadingTrade] = useState(false);

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
                    created_at: selectedDate
                })
            });
            if (res.ok) {
                setTradeForm({ ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout', shares: '', entry_price: '', exit_price: '', pnl: '', trade_screenshot_url: '' });
                fetchDayTrades();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const displayedTrades = dayTrades.filter(trade => {
        if (!trade.created_at) return false;
        return trade.created_at.substring(0, 10) === selectedDate;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    📅 Daily Review
                </h1>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-900 border border-slate-600 text-white rounded-lg p-3 font-bold outline-none focus:border-blue-500 transition cursor-pointer"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* NOTION STYLE JOURNAL */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[750px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-blue-400">📝 Trading Journal</h2>
                        <select
                            value={journal.mood}
                            onChange={(e) => setJournal({...journal, mood: e.target.value})}
                            className="bg-slate-900 border border-slate-600 rounded p-2 text-sm outline-none"
                        >
                            <option value="Flow State 🧘‍♂️">Flow State 🧘‍♂️</option>
                            <option value="Neutral 😐">Neutral 😐</option>
                            <option value="Tilted 😡">Tilted 😡</option>
                            <option value="FOMO 🥺">FOMO 🥺</option>
                        </select>
                    </div>

                    {/* UPDATED: Daily Chart Image Input */}
                    <div className="mb-4 space-y-2">
                        <label className="block text-xs text-slate-400 uppercase font-bold">Daily Chart Image</label>

                        {journal.screenshot_url ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-700 mb-2">
                                <img src={journal.screenshot_url} alt="Daily Recap" className="w-full h-48 object-cover" />
                                <button
                                    onClick={() => setJournal({...journal, screenshot_url: ''})}
                                    className="absolute top-2 right-2 bg-red-600/80 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
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
                                    className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-sm outline-none focus:border-blue-500 text-white"
                                />
                                <span className="text-slate-500 self-center text-sm">or</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'journal')}
                                    disabled={isUploadingJournal}
                                    className="w-28 text-sm text-slate-400 file:py-2 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                                />
                            </div>
                        )}
                        {isUploadingJournal && <span className="text-xs text-blue-400">Uploading... ⏳</span>}
                    </div>

                    <textarea
                        value={journal.daily_notes}
                        onChange={(e) => setJournal({...journal, daily_notes: e.target.value})}
                        placeholder="Pre-market plan, psychological state, market observations..."
                        className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 resize-none outline-none focus:border-blue-500 transition text-slate-300 min-h-[200px]"
                    />

                    <button
                        onClick={handleJournalSave}
                        disabled={isSavingJournal}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20 shrink-0"
                    >
                        {isSavingJournal ? "Saving..." : "Save Journal Entry"}
                    </button>
                </div>

                <div className="flex flex-col gap-6">
                    {/* TRADE EXECUTION FORM */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
                            ⚡ Log Execution
                        </h2>
                        <form onSubmit={handleTradeSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <input name="ticker" value={tradeForm.ticker} onChange={(e) => setTradeForm({...tradeForm, ticker: e.target.value.toUpperCase()})} placeholder="Ticker (NQ)" className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none" required />
                                <select name="asset_type" value={tradeForm.asset_type} onChange={(e) => setTradeForm({...tradeForm, asset_type: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none">
                                    <option value="FUTURE">Future</option>
                                    <option value="OPTION">Option</option>
                                    <option value="STOCK">Stock</option>
                                </select>
                                <select name="trade_type" value={tradeForm.trade_type} onChange={(e) => setTradeForm({...tradeForm, trade_type: e.target.value})} className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none">
                                    <option value="LONG">Long</option>
                                    <option value="SHORT">Short</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                <input type="number" value={tradeForm.shares} onChange={(e) => setTradeForm({...tradeForm, shares: e.target.value})} placeholder="Size/Qty" className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none" required />
                                <input type="number" step="0.01" value={tradeForm.entry_price} onChange={(e) => setTradeForm({...tradeForm, entry_price: e.target.value})} placeholder="Entry" className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none" required />
                                <input type="number" step="0.01" value={tradeForm.exit_price} onChange={(e) => setTradeForm({...tradeForm, exit_price: e.target.value})} placeholder="Exit" className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none" />
                                <input type="number" step="0.01" value={tradeForm.pnl} onChange={(e) => setTradeForm({...tradeForm, pnl: e.target.value})} placeholder="P&L ($)" className="bg-slate-900 border border-slate-600 rounded p-3 text-sm outline-none" />
                            </div>

                            {/* UPDATED: Specific Trade Image Input */}
                            <div className="flex flex-col gap-2 border border-slate-700 bg-slate-900 rounded p-3">
                                <label className="text-xs text-slate-400 font-bold whitespace-nowrap">📸 Setup Chart:</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Paste TradingView Link here..."
                                        value={tradeForm.trade_screenshot_url}
                                        onChange={(e) => setTradeForm({...tradeForm, trade_screenshot_url: e.target.value})}
                                        className="flex-1 bg-slate-800 border border-slate-600 rounded p-2 text-xs outline-none focus:border-blue-500 text-white"
                                    />
                                    <span className="text-slate-500 text-xs">or</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'trade')}
                                        disabled={isUploadingTrade}
                                        className="w-24 text-xs text-slate-400 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer"
                                    />
                                </div>
                                {isUploadingTrade && <span className="text-xs text-blue-400">Uploading... ⏳</span>}
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-500/20">
                                Add Execution
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg flex-1 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-slate-200">Today's Executions</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-3">Asset</th>
                                    <th className="p-3">In / Out</th>
                                    <th className="p-3 text-right">P&L</th>
                                    <th className="p-3 text-center">Chart</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                {displayedTrades.map((trade) => (
                                    <tr key={trade.trade_id} className="hover:bg-slate-700/50 transition">
                                        <td className="p-3 font-bold text-white">
                                            {trade.ticker} <span className="text-xs text-slate-500 font-normal">({trade.asset_type})</span>
                                        </td>
                                        <td className="p-3 font-mono text-slate-300">{trade.entry_price} → {trade.exit_price || '-'}</td>
                                        <td className={`p-3 text-right font-bold ${Number(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${trade.pnl || '0.00'}
                                        </td>
                                        <td className="p-3 text-center">
                                            {trade.trade_screenshot_url ? (
                                                <a href={trade.trade_screenshot_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {displayedTrades.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-slate-500 italic">No trades logged for this date.</td>
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