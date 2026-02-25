import { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";

interface JournalEntry {
    date: string;
    daily_notes: string;
    mood: string;
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
    created_at: string; // FIX 1: We need the date the trade was made
}

export default function TradingJournal() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();

    // Default to today's date
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [journal, setJournal] = useState<JournalEntry>({ date: selectedDate, daily_notes: '', mood: 'Neutral' });
    const [isSavingJournal, setIsSavingJournal] = useState(false);

    const [dayTrades, setDayTrades] = useState<Trade[]>([]);

    const [tradeForm, setTradeForm] = useState({
        ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout',
        shares: '', entry_price: '', exit_price: '', pnl: ''
    });

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
                setJournal(todaysEntry);
            } else {
                setJournal({ date: selectedDate, daily_notes: '', mood: 'Neutral' });
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
                setTradeForm({ ticker: '', asset_type: 'FUTURE', trade_type: 'LONG', setup: 'Breakout', shares: '', entry_price: '', exit_price: '', pnl: '' });
                fetchDayTrades();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // FIX 2: Filter the trades so we only see the ones that match the selected date!
    const displayedTrades = dayTrades.filter(trade => {
        if (!trade.created_at) return false;
        // The DB sends the date like "2026-02-25T18:31:52.609Z", so we just grab the first 10 characters (YYYY-MM-DD)
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
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[600px]">
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

                    <textarea
                        value={journal.daily_notes}
                        onChange={(e) => setJournal({...journal, daily_notes: e.target.value})}
                        placeholder="Pre-market plan, psychological state, market observations..."
                        className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 resize-none outline-none focus:border-blue-500 transition text-slate-300"
                    />

                    <button
                        onClick={handleJournalSave}
                        disabled={isSavingJournal}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {isSavingJournal ? "Saving..." : "Save Journal Entry"}
                    </button>
                </div>

                <div className="flex flex-col gap-6">
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
                                    <th className="p-3">Size</th>
                                    <th className="p-3">In / Out</th>
                                    <th className="p-3 text-right">P&L</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                {/* FIX 3: Map over displayedTrades instead of dayTrades */}
                                {displayedTrades.map((trade) => (
                                    <tr key={trade.trade_id} className="hover:bg-slate-700/50 transition">
                                        <td className="p-3 font-bold text-white">
                                            {trade.ticker} <span className="text-xs text-slate-500 font-normal">({trade.asset_type})</span>
                                        </td>
                                        <td className="p-3 font-mono text-slate-300">{trade.shares}</td>
                                        <td className="p-3 font-mono text-slate-300">{trade.entry_price} → {trade.exit_price || '-'}</td>
                                        <td className={`p-3 text-right font-bold ${Number(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${trade.pnl || '0.00'}
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