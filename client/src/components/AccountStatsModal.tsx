import { useMemo } from 'react';

interface Trade {
    pnl: string | number;
    account_id: number;
    trade_category: string;
}

export default function AccountStats({ trades, accountId }: { trades: Trade[], accountId: number }) {
    const stats = useMemo(() => {
        // Filter trades for this specific account
        const accountTrades = trades.filter(t => t.account_id === accountId && t.trade_category === 'DAY_TRADE');

        const totalTrades = accountTrades.length;
        const wins = accountTrades.filter(t => Number(t.pnl) > 0);
        const losses = accountTrades.filter(t => Number(t.pnl) < 0);

        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

        const grossProfit = wins.reduce((sum, t) => sum + Number(t.pnl), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Number(t.pnl), 0));
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "Infinity" : "0.00";

        return {
            totalTrades,
            winRate: winRate.toFixed(1),
            profitFactor,
            netPnL: (grossProfit - grossLoss).toFixed(2),
            avgWin: wins.length > 0 ? (grossProfit / wins.length).toFixed(2) : "0.00"
        };
    }, [trades, accountId]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <StatCard label="Win Rate" value={`${stats.winRate}%`} color="text-blue-600" />
            <StatCard label="Profit Factor" value={stats.profitFactor} color="text-gray-900" />
            <StatCard label="Net P&L" value={`$${stats.netPnL}`} color={Number(stats.netPnL) >= 0 ? "text-green-600" : "text-red-600"} />
            <StatCard label="Avg Winner" value={`$${stats.avgWin}`} color="text-gray-900" />
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    );
}