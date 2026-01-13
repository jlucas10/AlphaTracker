import { useState, useEffect } from 'react';

// Define the shape of a Trade object for TypeScript
interface Trade {
    trade_id: number;
    ticker: string;
    entry_price: string;
    shares: number;
    trade_type: string;
    setup: string;
    created_at: string;
}

function App() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [formData, setFormData] = useState({
        ticker: '',
        entry_price: '',
        shares: '',
        trade_type: 'LONG',
        setup: 'Breakout'
    });

    // Fetch trades when the app loads
    const fetchTrades = async () => {
        try {
            const response = await fetch('http://localhost:5001/trades');
            const data = await response.json();
            setTrades(data);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData({...formData, ticker: '', entry_price: '', shares: ''}); // Clear form
                fetchTrades(); // <--- RE-FETCH THE LIST INSTANTLY
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTrade = async (id:number) => {
        try {
            await fetch(`http://localhost:5001/trades/${id}`, {
                method: 'DELETE'
            });
            // Remove it from the list instantly without refreshing
            setTrades(trades.filter(trade => trade.trade_id !== id));
        } catch (error) {
            console.error("Error deleting trade:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* LEFT COLUMN: THE FORM */}
                <div className="md:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                    <h2 className="text-xl font-bold mb-4 text-blue-400">Log New Trade</h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            name="ticker" value={formData.ticker} onChange={handleChange}
                            placeholder="Ticker (e.g. NVDA)"
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 uppercase"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                name="entry_price" type="number" value={formData.entry_price} onChange={handleChange}
                                placeholder="Price" className="bg-slate-900 border border-slate-600 rounded p-2"
                            />
                            <input
                                name="shares" type="number" value={formData.shares} onChange={handleChange}
                                placeholder="Shares" className="bg-slate-900 border border-slate-600 rounded p-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select name="trade_type" onChange={handleChange} className="bg-slate-900 border border-slate-600 rounded p-2">
                                <option value="LONG">Long 🟢</option>
                                <option value="SHORT">Short 🔴</option>
                            </select>
                            <select name="setup" onChange={handleChange} className="bg-slate-900 border border-slate-600 rounded p-2">
                                <option value="Breakout">Breakout</option>
                                <option value="Gap Up">Gap Up</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold">
                            Add Trade
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: THE DASHBOARD */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats Card */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-slate-400 text-sm uppercase font-bold">Total Trades</h3>
                            <p className="text-3xl font-bold">{trades.length}</p>
                        </div>
                        <div>
                            <h3 className="text-slate-400 text-sm uppercase font-bold">Recent Ticker</h3>
                            <p className="text-3xl font-bold text-green-400">
                                {trades.length > 0 ? trades[0].ticker : "--"}
                            </p>
                        </div>
                    </div>

                    {/* Trade History Table */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900 text-slate-400">
                            <tr>
                                <th className="p-4">Ticker</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Entry</th>
                                <th className="p-4">Shares</th>
                                <th className="p-4">Setup</th>
                                <th className="p-4">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {trades.map((trade) => (
                                <tr key={trade.trade_id} className="border-t border-slate-700 hover:bg-slate-750">
                                    <td className="p-4 font-bold">{trade.ticker}</td>
                                    <td className={`p-4 ${trade.trade_type === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.trade_type}
                                    </td>
                                    <td className="p-4">${trade.entry_price}</td>
                                    <td className="p-4">{trade.shares}</td>
                                    <td className="p-4 text-slate-400 text-sm">{trade.setup}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => deleteTrade(trade.trade_id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition"
                                            title="Delete Trade"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default App;