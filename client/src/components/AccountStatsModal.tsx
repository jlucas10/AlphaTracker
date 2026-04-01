import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Trade {
    pnl: string | number;
    account_id: number;
    trade_category: string;
    created_at: string;
}

export default function AccountStatsModal({ trades, accountId }: { trades: Trade[], accountId: number }) {
    const { stats, chartData } = useMemo(() => {
        // 1. Filter for specific account and day trades (Added strict ID check)
        const accountTrades = trades
            .filter(t => Number(t.account_id) === Number(accountId) && t.trade_category === 'DAY_TRADE')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        let cumulativePnL = 0;
        const history = accountTrades.map((t, index) => {
            cumulativePnL += Number(t.pnl);
            return {
                tradeNum: index + 1,
                displayDate: new Date(t.created_at).toLocaleDateString(),
                pnl: cumulativePnL
            };
        });

        // 2. Performance Math
        const wins = accountTrades.filter(t => Number(t.pnl) > 0);
        const losses = accountTrades.filter(t => Number(t.pnl) < 0);
        const totalPnL = accountTrades.reduce((sum, t) => sum + Number(t.pnl), 0);

        const winRate = accountTrades.length > 0 ? (wins.length / accountTrades.length) * 100 : 0;
        const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl), 0));
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "1.00";

        return {
            stats: {
                winRate: winRate.toFixed(1),
                profitFactor,
                totalPnL: totalPnL.toFixed(2),
                tradeCount: accountTrades.length
            },
            chartData: history
        };
    }, [trades, accountId]);

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Win Rate" value={`${stats.winRate}%`} />
                <StatBox label="Profit Factor" value={stats.profitFactor} />
                <StatBox label="Total P&L" value={`$${stats.totalPnL}`} isPnL />
                <StatBox label="Trades" value={stats.tradeCount.toString()} />
            </div>

            {/* Equity Curve Chart */}
            <div className="h-64 w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-4 tracking-widest">Equity Curve (Cumulative P&L)</p>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="tradeNum" hide />
                        <YAxis
                            fontSize={10}
                            tickFormatter={(value) => `$${value}`}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => `Trade #${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="pnl"
                            stroke="#111827"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPnL)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function StatBox({ label, value, isPnL = false }: { label: string, value: string, isPnL?: boolean }) {
    const pnlColor = isPnL ? (value.startsWith('$-') ? 'text-red-600' : 'text-green-600') : 'text-gray-900';
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-tighter">{label}</p>
            <p className={`text-lg font-bold ${pnlColor}`}>{value}</p>
        </div>
    );
}