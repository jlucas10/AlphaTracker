import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useUser } from "@clerk/clerk-react";

interface Trade {
    trade_id: number;
    ticker: string;
    entry_price: string;
    shares: number;
    trade_type: string;
    setup: string;
    created_at: string;
    trade_category: string;
}

interface ChartData {
    name: string;
    value: number;
}

// Slightly muted, professional colors for the light theme chart
const COLORS = ['#111827', '#4B5563', '#9CA3AF', '#3B82F6', '#10B981'];

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

    const inputStyle = "w-full bg-white border border-gray-300 rounded p-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition text-gray-900";

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: FORM */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                        <span>📝</span> Log Investment
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Ticker</label>
                            <div className="flex gap-2">
                                <input
                                    name="ticker" value={formData.ticker} onChange={handleChange}
                                    placeholder="NVDA"
                                    className={`${inputStyle} uppercase`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={fetchPrice}
                                    disabled={isLoadingPrice}
                                    className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900 px-4 rounded font-bold text-sm transition disabled:opacity-50"
                                >
                                    {isLoadingPrice ? "⏳" : "🔍"}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Price</label>
                                <input
                                    name="entry_price" type="number" step="0.01" value={formData.entry_price} onChange={handleChange}
                                    placeholder="150.00" className={inputStyle} required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Shares</label>
                                <input
                                    name="shares" type="number" step="0.01" value={formData.shares} onChange={handleChange}
                                    placeholder="10" className={inputStyle} required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select name="trade_type" onChange={handleChange} className={inputStyle}>
                                <option value="LONG">Long 🟢</option>
                                <option value="SHORT">Short 🔴</option>
                            </select>
                            <select name="setup" onChange={handleChange} className={inputStyle}>
                                <option value="Breakout">Breakout</option>
                                <option value="Dip Buy">Dip Buy</option>
                                <option value="Value">Value</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg font-bold transition shadow-sm">
                            Add Investment
                        </button>
                    </form>
                </div>

                {/* RIGHT COLUMN: DASHBOARD */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                            <h3 className="text-gray-400 text-sm uppercase font-bold mb-2">Total Investments</h3>
                            <p className="text-5xl font-bold text-gray-900 tracking-tight">{trades.length}</p>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-gray-400 text-xs uppercase mb-1">Most Recent</p>
                                <p className="text-xl font-mono text-gray-900 font-medium">
                                    {trades.length > 0 ? trades[0].ticker : "--"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                            <h3 className="text-gray-400 text-xs uppercase font-bold w-full text-left mb-2 pl-2">Portfolio Allocation</h3>
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
                                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
                                                itemStyle={{ color: '#111827', fontWeight: 'bold' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">Add trades to see chart</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-bold text-gray-900">Investment Activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white text-gray-500 uppercase text-xs border-b border-gray-200">
                                <tr>
                                    <th className="p-4">Ticker</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Entry</th>
                                    <th className="p-4">Shares</th>
                                    <th className="p-4">Strategy</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {trades.map((trade) => (
                                    <tr key={trade.trade_id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-bold text-gray-900">{trade.ticker}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${trade.trade_type === 'LONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {trade.trade_type}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-gray-600">${trade.entry_price}</td>
                                        <td className="p-4 font-mono text-gray-600">{trade.shares}</td>
                                        <td className="p-4 text-gray-500">{trade.setup}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deleteTrade(trade.trade_id)} className="text-gray-400 hover:text-red-500 transition p-1 hover:bg-red-50 rounded" title="Delete">
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