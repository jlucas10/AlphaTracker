import { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom'; // NEW

interface Account {
    account_id: number;
    account_name: string;
    account_type: string;
    balance: string;
}

export default function Accounts() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const { user } = useUser();
    const navigate = useNavigate(); // NEW

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState({ account_name: '', account_type: 'CASH', balance: '' });

    useEffect(() => {
        if (user) fetchAccounts();
    }, [user]);

    const fetchAccounts = async () => {
        const res = await fetch(`${API_URL}/accounts?user_id=${user?.id}`);
        const data = await res.json();
        setAccounts(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, user_id: user?.id })
        });
        if (res.ok) {
            setForm({ account_name: '', account_type: 'CASH', balance: '' });
            fetchAccounts();
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
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
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">🏦 Add Account</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input value={form.account_name} onChange={(e) => setForm({...form, account_name: e.target.value})} placeholder="Account Name" className="w-full border rounded p-3" required />
                        <select value={form.account_type} onChange={(e) => setForm({...form, account_type: e.target.value})} className="w-full border rounded p-3">
                            <option value="CASH">Cash</option>
                            <option value="PROP_FIRM">Prop Firm</option>
                        </select>
                        <input type="number" value={form.balance} onChange={(e) => setForm({...form, balance: e.target.value})} placeholder="Balance" className="w-full border rounded p-3" required />
                        <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">Create Account</button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((acc) => (
                        <div key={acc.account_id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg">{acc.account_name}</h3>
                                {/* NEW: Navigate to Deep Dive */}
                                <button
                                    onClick={() => navigate(`/accounts/${acc.account_id}`)}
                                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
                                >
                                    View Performance →
                                </button>
                            </div>
                            <p className="text-2xl font-mono font-bold">${Number(acc.balance).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}