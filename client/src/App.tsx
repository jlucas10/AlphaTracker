import { useState } from 'react';

function App() {
    // State to hold form data
    const [formData, setFormData] = useState({
        ticker: '',
        entry_price: '',
        shares: '',
        trade_type: 'LONG',
        setup: 'Breakout'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData) // Send our state to the backend
            });

            if (response.ok) {
                alert("Trade Logged Successfully! 💰");
                setFormData({...formData, ticker: '', entry_price: '', shares: ''}); // Clear form
            } else {
                alert("Failed to log trade.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Log a Trade 📝</h1>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Ticker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Ticker</label>
                        <input
                            name="ticker"
                            value={formData.ticker}
                            onChange={handleChange}
                            placeholder="e.g. NVDA"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Entry Price</label>
                            <input
                                name="entry_price"
                                type="number"
                                value={formData.entry_price}
                                onChange={handleChange}
                                placeholder="150.00"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        {/* Shares */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Shares</label>
                            <input
                                name="shares"
                                type="number"
                                value={formData.shares}
                                onChange={handleChange}
                                placeholder="10"
                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Type & Setup */}
                    <div className="grid grid-cols-2 gap-4">
                        <select name="trade_type" onChange={handleChange} className="bg-slate-900 border border-slate-700 rounded p-2">
                            <option value="LONG">Long 🟢</option>
                            <option value="SHORT">Short 🔴</option>
                        </select>
                        <select name="setup" onChange={handleChange} className="bg-slate-900 border border-slate-700 rounded p-2">
                            <option value="Breakout">Breakout</option>
                            <option value="Reversal">Reversal</option>
                            <option value="Gap Up">Gap Up</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">
                        Log Trade
                    </button>
                </form>
            </div>
        </div>
    );
}

export default App;