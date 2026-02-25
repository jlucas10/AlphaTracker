import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUser } from "@clerk/clerk-react";

// --- TYPES ---
interface Trade {
    trade_id: number;
    ticker: string;
    entry_price: string;
    shares: number;
    trade_type: string;
    setup: string;
    created_at: string;
    trade_category: string; // New field from DB
}

interface ChartData {
    name: string;
    value: number;
}

const COLORS = ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#818CF8'];

export default function InvestingDashboard() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);

    const [trades, setTrades] = useState<Trade[]>([]);
    const [chartData, setChartData] = useState<ChartData[]>([]);

    const [formData, setFormData] = useState({
        ticker: '',
        entry_price: '',
        shares: '',
        trade_type: 'LONG',
        setup: 'Breakout'
    });

    const fetchPrice = async () => {
        if (!formData.ticker) return;
        setIsLoadingPrice(true);
        try {
            const response = await fetch(`${API_URL}/api/price/${formData.ticker.toUpperCase()}`);
            if (!response.ok) throw new Error("Ticker not found");
            const data = await response.json();

            if (data.price) {
                setFormData(prev => ({ ...prev, entry_price: data.price.toString() }));
            } else {
                alert("Ticker not found");
            }
        } catch (error) {
            console.error("Error fetching price:", error);
            alert("Error fetching price");
        } finally {
            setIsLoadingPrice(false);
        }
    };

    const fetchTrades = async () => {
        if (!user) return;
        try {
            // NOTICE: We now specifically ask for category=INVESTMENT
            const response = await fetch(`${API_URL}/trades?user_id=${user.id}&category=INVESTMENT`);
            const data = await response.json();
            setTrades(data);
            processChartData(data);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const processChartData = (tradeList: Trade[]) => {
        const allocation: { [key: string]: number } = {};
        tradeList.forEach(trade => {
            const value = parseFloat(trade.entry_price) * trade.shares;
            if (allocation[trade.ticker]) {
                allocation[trade.ticker] += value;
            } else {
                allocation[trade.ticker] = value;
            }
        });
        const processed = Object.keys(allocation).map(ticker => ({
            name: ticker,
            value: allocation[ticker]
        }));
        setChartData(processed);
    };

    useEffect(() => {
        if (user) {
            fetchTrades();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/trades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // NOTICE: We tag this trade as an INVESTMENT
                body: JSON.stringify({ ...formData, user_id: user.id, trade_category: 'INVESTMENT' })
            });
            if (response.ok) {
                setFormData({...formData, ticker: '', entry_price: '', shares: ''});
                fetchTrades();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteTrade = async (id: number) => {
        try {
            await fetch(`${API_URL}/trades/${id}`, { method: 'DELETE' });
            const updatedTrades = trades.filter(trade => trade.trade_id !== id);
            setTrades(updatedTrades);
            processChartData(updatedTrades);
        } catch (error) {
            console.error("Error deleting trade:", error);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: FORM */}
                <div className="lg:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-lg">
                    <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                        <span>📝</span> Log Investment
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 uppercase font-bold">Ticker</label>
                            <div className="flex gap-2">
                                <input
                                    name="ticker" value={formData.ticker} onChange={handleChange}
                                    placeholder="NVDA"
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 uppercase focus:border-blue-500 outline-none transition"
                                />
                                <button
                                    type="button"
                                    onClick={fetchPrice}
                                    disabled={isLoadingPrice}
                                    className="bg-blue-600 hover:bg-blue-500 px-4 rounded font-bold text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isLoadingPrice ? "⏳" : "🔍"}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Price</label>
                                <input
                                    name="entry_price" type="number" value={formData.entry_price} onChange={handleChange}
                                    placeholder="150.00" className="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Shares</label>
                                <input
                                    name="shares" type="number" value={formData.shares} onChange={handleChange}
                                    placeholder="10" className="w-full bg-slate-900 border border-slate-600 rounded p-3 focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select name="trade_type" onChange={handleChange} className="bg-slate-900 border border-slate-600 rounded p-3 text-sm">
                                <option value="LONG">Long 🟢</option>
                                <option value="SHORT">Short 🔴</option>
                            </select>
                            <select name="setup" onChange={handleChange} className="bg-slate-900 border border-slate-600 rounded p-3 text-sm">
                                <option value="Breakout">Breakout</option>
                                <option value="Dip Buy">Dip Buy</option>
                                <option value="Value">Value</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold transition shadow-lg shadow-blue-500/20">
                            Add Investment
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: DASHBOARD */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center">
                            <h3 className="text-slate-400 text-sm uppercase font-bold mb-2">Total Investments</h3>
                            <p className="text-5xl font-bold text-white">{trades.length}</p>
                            <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-slate-400 text-xs uppercase">Most Recent</p>
                                <p className="text-xl font-mono text-green-400">
                                    {trades.length > 0 ? trades[0].ticker : "--"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
                            <h3 className="text-slate-400 text-xs uppercase font-bold w-full text-left mb-2">Portfolio Allocation</h3>
                            <div className="w-full h-64">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">Add trades to see chart</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="font-bold text-slate-200">Investment Activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Ticker</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Entry</th>
                                    <th className="p-4">Shares</th>
                                    <th className="p-4">Strategy</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                {trades.map((trade) => (
                                    <tr key={trade.trade_id} className="hover:bg-slate-700/50 transition">
                                        <td className="p-4 font-bold text-white">{trade.ticker}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${trade.trade_type === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {trade.trade_type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-300">${trade.entry_price}</td>
                                        <td className="p-4 font-mono text-slate-300">{trade.shares}</td>
                                        <td className="p-4 text-slate-400">{trade.setup}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deleteTrade(trade.trade_id)} className="text-slate-500 hover:text-red-400 transition p-1 hover:bg-slate-700 rounded" title="Delete">
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
        </div>
    );
}