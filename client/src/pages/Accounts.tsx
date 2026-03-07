import { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import AccountStatsModal from '../components/AccountStatsModal'; // Ensure path is correct

interface Account {
    account_id: number;
    account_name: string;
    account_type: string;
    balance: string;
}

interface Trade {
    pnl: string | number;
    account_id: number;
    trade_category: string;
}

export default function Accounts() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]); // NEW: Store trades for stats calculation
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null); // NEW: Track expanded stats
    const [form, setForm] = useState({ account_name: '', account_type: 'CASH', balance: '' });

    useEffect(() => {
        if (user) {
            fetchAccounts();
            fetchTrades(); // NEW
        }
    }, [user]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${API_URL}/accounts?user_id=${user?.id}`);
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    const fetchTrades = async () => {
        try {
            const res = await fetch(`${API_URL}/trades?user_id=${user?.id}`);
            const data = await res.json();
            setTrades(data);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, user_id: user.id })
            });
            if (res.ok) {
                setForm({ account_name: '', account_type: 'CASH', balance: '' });
                fetchAccounts();
            }
        } catch (error) {
            console.error("Error creating account:", error);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const inputStyle = "w-full bg-white border border-gray-300 rounded p-3 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition text-gray-900";

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Top Stat Banner */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Accounts</h1>
                    <p className="text-gray-500">Manage your capital across brokerages and prop firms.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-400 uppercase mb-1">Total Capital</p>
                    <p className="text-5xl font-mono text-gray-900 font-bold tracking-tight">
                        ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to Add Account */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                        🏦 Add Account
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Account Name</label>
                            <input
                                value={form.account_name}
                                onChange={(e) => setForm({...form, account_name: e.target.value})}
                                placeholder="e.g. Apex 50k Eval"
                                className={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Account Type</label>
                            <select
                                value={form.account_type}
                                onChange={(e) => setForm({...form, account_type: e.target.value})}
                                className={inputStyle}
                            >
                                <option value="CASH">Cash (Personal)</option>
                                <option value="MARGIN">Margin (Personal)</option>
                                <option value="PROP_FIRM">Prop Firm / Funded</option>
                                <option value="CRYPTO">Crypto Wallet</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Starting Balance ($)</label>
                            <input
                                type="number" step="0.01"
                                value={form.balance}
                                onChange={(e) => setForm({...form, balance: e.target.value})}
                                placeholder="50000.00"
                                className={`${inputStyle} font-mono`}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition shadow-sm">
                            Create Account
                        </button>
                    </form>
                </div>

                {/* List of Accounts */}
                <div className="lg:col-span-2 grid grid-cols-1 gap-4 auto-rows-max">
                    {accounts.map((acc) => (
                        <div key={acc.account_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{acc.account_name}</h3>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block uppercase">
                                        {acc.account_type.replace('_', ' ')}
                                    </span>
                                </div>
                                {/* NEW: Toggle Button */}
                                <button
                                    onClick={() => setSelectedAccountId(selectedAccountId === acc.account_id ? null : acc.account_id)}
                                    className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest transition"
                                >
                                    {selectedAccountId === acc.account_id ? "[ Close Stats ]" : "[ View Stats ]"}
                                </button>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1 uppercase font-bold text-[10px] tracking-wider">Current Balance</p>
                                    <p className="text-3xl font-mono text-gray-900 font-bold">
                                        ${Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* NEW: Stats Modal Integration */}
                            {selectedAccountId === acc.account_id && (
                                <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <AccountStatsModal trades={trades} accountId={acc.account_id} />
                                </div>
                            )}
                        </div>
                    ))}

                    {accounts.length === 0 && (
                        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                            <p className="text-gray-500 text-lg font-medium">No accounts added yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Add your first brokerage or prop firm account to track your capital.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}