import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from "@clerk/clerk-react";
import AccountStatsModal from '../components/AccountStatsModal';

export default function AccountDeepDive() {
    const { id } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    const [account, setAccount] = useState<any>(null);
    const [trades, setTrades] = useState<any[]>([]);
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDayTrades, setSelectedDayTrades] = useState<any[] | null>(null);

    useEffect(() => {
        if (user && id) {
            const fetchData = async () => {
                const accRes = await fetch(`${API_URL}/accounts?user_id=${user.id}`);
                const accData = await accRes.json();
                setAccount(accData.find((a: any) => a.account_id === Number(id)));

                const tradeRes = await fetch(`${API_URL}/trades?user_id=${user.id}&account_id=${id}`);
                const tradeData = await tradeRes.json();
                setTrades(tradeData);
            };
            fetchData();
        }
    }, [user, id, API_URL]);

    const { calendarDays, monthlyTotal } = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dailyData: { [key: number]: { pnl: number, trades: any[] } } = {};
        let total = 0;

        trades.forEach(t => {
            const tradeDate = new Date(t.created_at);
            if (
                Number(t.account_id) === Number(id) &&
                t.trade_category === 'DAY_TRADE' &&
                tradeDate.getMonth() === month &&
                tradeDate.getFullYear() === year
            ) {
                const date = tradeDate.getDate();
                if (!dailyData[date]) dailyData[date] = { pnl: 0, trades: [] };

                dailyData[date].pnl += Number(t.pnl);
                dailyData[date].trades.push(t);
                total += Number(t.pnl);
            }
        });

        const days = [];
        let weekPnL = 0;
        let weekTradeCount = 0;

        for (let i = 0; i < firstDay; i++) days.push(null);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayData = dailyData[i] || { pnl: 0, trades: [] };
            weekPnL += dayData.pnl;
            weekTradeCount += dayData.trades.length;

            // Check if it's Saturday (Column 6 in a 0-6 index grid)
            const isSaturday = (days.length % 7) === 6;

            days.push({
                day: i,
                pnl: dayData.pnl,
                trades: dayData.trades,
                isSaturday,
                weekTotal: isSaturday ? weekPnL : null,
                weekCount: isSaturday ? weekTradeCount : null
            });

            if (isSaturday) {
                weekPnL = 0; // Reset for next week
                weekTradeCount = 0;
            }
        }
        return { calendarDays: days, monthlyTotal: total };
    }, [trades, id, viewDate]);

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
        setSelectedDayTrades(null); // Clear drill-down on month change
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <button onClick={() => navigate('/accounts')} className="text-gray-400 hover:text-gray-900 font-bold text-xs uppercase tracking-widest transition">
                ← Back to Portfolio
            </button>

            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">{account?.account_name || "Loading..."}</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Performance Analytics</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-mono font-bold text-gray-900">${Number(account?.balance || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Available Cash</p>
                </div>
            </div>

            <AccountStatsModal trades={trades} accountId={Number(id)} />

            {/* Calendar View */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded font-bold">◀</button>
                        <span className="text-xs font-bold uppercase text-gray-900 tracking-widest">
                            {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded font-bold">▶</button>
                    </div>
                    <span className={`text-xs font-bold ${monthlyTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Monthly P/L: ${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>

                <div className="grid grid-cols-7 border-l border-t border-gray-100">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} className="p-3 border-r border-b border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase text-center">{d}</div>
                    ))}
                    {calendarDays.map((d, i) => (
                        <div key={i} className={`h-32 p-2 border-r border-b border-gray-100 flex flex-col justify-between ${!d ? 'bg-gray-50/30' : 'bg-white'}`}>
                            <span className="text-[10px] font-bold text-gray-300">{d?.day}</span>

                            {/* Daily Profit (Clickable) */}
                            {d && d.pnl !== 0 && !d.isSaturday && (
                                <button
                                    onClick={() => setSelectedDayTrades(d.trades)}
                                    className={`text-center py-1 rounded text-[11px] font-bold transition hover:scale-105 ${d.pnl > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                                >
                                    {d.pnl > 0 ? `+$${d.pnl.toFixed(0)}` : `-$${Math.abs(d.pnl).toFixed(0)}`}
                                    <div className="text-[8px] opacity-60">{d.trades.length} trades</div>
                                </button>
                            )}

                            {/* Saturday Weekly Total */}
                            {d?.isSaturday && (
                                <div className="flex flex-col items-center text-center space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Week Total</span>
                                    <span className={`text-sm font-bold font-mono ${d.weekTotal! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {d.weekTotal! >= 0 ? `+$${d.weekTotal?.toFixed(2)}` : `-$${Math.abs(d.weekTotal!).toFixed(2)}`}
                                    </span>
                                    <span className="text-[8px] text-gray-400">{d.weekCount} trades</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Drill-down View */}
            {selectedDayTrades && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Trades for this day</h3>
                        <button onClick={() => setSelectedDayTrades(null)} className="text-gray-400 hover:text-gray-900 text-xs font-bold">Close ✕</button>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 uppercase text-[10px] font-bold border-b">
                        <tr>
                            <th className="pb-2">Ticker</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Entry</th>
                            <th className="pb-2 text-right">P/L</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {selectedDayTrades.map((t, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                                <td className="py-3 font-bold">{t.ticker}</td>
                                <td className="py-3 text-xs">{t.trade_type}</td>
                                <td className="py-3 font-mono text-gray-500">${t.entry_price}</td>
                                <td className={`py-3 text-right font-bold ${Number(t.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Number(t.pnl) >= 0 ? `+$${t.pnl}` : `-$${Math.abs(Number(t.pnl))}`}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}