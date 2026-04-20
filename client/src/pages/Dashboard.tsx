import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
    Maximize2, Minimize2, X, Plus, ImageIcon,
    Trash2, Loader2, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import AccountStatsModal from '../components/AccountStatsModal';

export default function Dashboard() {
    const { id: urlId } = useParams();
    const { user } = useUser();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // UI States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'side' | 'center'>('side');
    const [selectedDayData, setSelectedDayData] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State - Added trade_id to track updates
    const [formData, setFormData] = useState({
        trade_id: null as number | null,
        ticker: '',
        pnl: '',
        size: '',
        trade_type: 'LONG',
        notes: '',
        screenshots: [] as string[],
        rules: [
            { text: "Stuck to Plan", followed: false },
            { text: "Respected Stops", followed: false },
            { text: "No FOMO Entry", followed: false },
            { text: "Max Daily Loss Followed", followed: false }
        ],
        mood: 'Neutral'
    });

    const [accounts, setAccounts] = useState<any[]>([]);
    const [currentAccountId, setCurrentAccountId] = useState<number>(Number(urlId));
    const [trades, setTrades] = useState<any[]>([]);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (user) {
            fetch(`${API_URL}/accounts?user_id=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    setAccounts(data);
                    
                    if (data.length > 0) {
                        // 1. If we have a URL ID, use it. 
                        // 2. If we DON'T (we are on /dashboard), use the first account's ID for data only.
                        const idToLoad = urlId ? Number(urlId) : data[0].account_id;
                        setCurrentAccountId(idToLoad);
                        
                        // IMPORTANT: Removed the navigate() call here.
                        // This allows the URL to remain "/dashboard" 
                    }
                })
                .catch(err => console.error("Error fetching accounts:", err));
        }
    }, [user, urlId, API_URL]);

    const fetchTrades = async () => {
        if (!user || !currentAccountId) return;
        try {
            const res = await fetch(`${API_URL}/trades?user_id=${user.id}&account_id=${currentAccountId}`);
            const data = await res.json();
            setTrades(data);
        } catch (err) {
            console.error("Error fetching trades:", err);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, [user, currentAccountId, API_URL]);

    const currentAccount = accounts.find(a => a.account_id === currentAccountId);

    const { calendarDays, monthlyPnL, stats } = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const accTrades = trades.filter(t => Number(t.account_id) === currentAccountId && t.trade_category === 'DAY_TRADE');
        const winners = accTrades.filter(t => Number(t.pnl) > 0);
        const losers = accTrades.filter(t => Number(t.pnl) < 0);

        const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + Number(t.pnl), 0) / winners.length : 0;
        const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + Number(t.pnl), 0) / losers.length) : 0;

        const dailyData: { [key: number]: { pnl: number, trades: any[] } } = {};
        let mPnL = 0;

        accTrades.forEach(t => {
            const tradeDate = new Date(t.created_at);
            if (tradeDate.getUTCMonth() === month && tradeDate.getUTCFullYear() === year) {
                const date = tradeDate.getUTCDate();
                if (!dailyData[date]) dailyData[date] = { pnl: 0, trades: [] };
                dailyData[date].pnl += Number(t.pnl);
                dailyData[date].trades.push(t);
                mPnL += Number(t.pnl);
            }
        });

        const days = [];
        let weekPnL = 0;
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            const dData = dailyData[i] || { pnl: 0, trades: [] };
            weekPnL += dData.pnl;
            const isSaturday = (days.length % 7) === 6;
            days.push({ day: i, ...dData, isSaturday, weekTotal: isSaturday ? weekPnL : null });
            if (isSaturday) weekPnL = 0;
        }

        return {
            calendarDays: days,
            monthlyPnL: mPnL,
            stats: {
                avgWin: avgWin.toFixed(0),
                avgLoss: avgLoss.toFixed(0),
                winRate: accTrades.length > 0 ? ((winners.length / accTrades.length) * 100).toFixed(1) : "0",
                tradePieData: [
                    { name: 'Wins', value: winners.length, color: '#10b981' },
                    { name: 'Losses', value: losers.length || 0.0001, color: '#ef4444' }
                ]
            }
        };
    }, [trades, currentAccountId, viewDate]);

    const loadDayData = async (dayNum: number) => {
        const year = viewDate.getFullYear();
        const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${dayNum.toString().padStart(2, '0')}`;

        try {
            const journalRes = await fetch(`${API_URL}/journal?user_id=${user?.id}`);
            const journalList = await journalRes.json();
            const dayJournal = journalList.find((j: any) => j.date.substring(0, 10) === dateStr);

            const dayTrade = trades.find(t =>
                t.created_at.substring(0, 10) === dateStr &&
                Number(t.account_id) === currentAccountId
            );

            setFormData({
                trade_id: dayTrade?.trade_id || null,
                ticker: dayTrade?.ticker || '',
                pnl: dayTrade?.pnl || '',
                size: dayTrade?.shares || '',
                trade_type: dayTrade?.trade_type || 'LONG',
                notes: dayJournal?.daily_notes || '',
                mood: dayJournal?.mood || 'Neutral',
                // Change: Split the string back into an array for the gallery
                screenshots: dayJournal?.screenshot_url ? dayJournal.screenshot_url.split(',') : [],
                rules_followed: dayTrade?.setup ? dayTrade.setup.split(", ") : []
            });
        } catch (error) { console.error(error); }
    };

    const toggleRule = (index) => {
        const updatedRules = [...formData.rules];
        updatedRules[index].followed = !updatedRules[index].followed;
        setFormData({ ...formData, rules: updatedRules });
    };

    const handleDayClick = (day: any) => {
        if (!day || day.isSaturday) return;
        setSelectedDayData(day);
        loadDayData(day.day);
        setIsDrawerOpen(true);
    };

    const addRule = () => {
        const newRuleText = prompt("Enter your new trading rule:");
        if (newRuleText) {
            setFormData({
                ...formData,
                rules: [...formData.rules, { text: newRuleText, followed: false }]
            });
        }
    };

    const deleteRule = (index) => {
        setFormData({
            ...formData,
            rules: formData.rules.filter((_, i) => i !== index)
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        // Change: Upload all selected files in parallel
        const uploadPromises = Array.from(files).map(async (file) => {
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', uploadPreset);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: data,
            });
            return res.json();
        });

        try {
            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(r => r.secure_url).filter(url => url);
            setFormData(prev => ({
                ...prev,
                screenshots: [...prev.screenshots, ...newUrls]
            }));
        } catch (err) { console.error(err); }
        finally { setIsUploading(false); }
    };

    const handleSaveAudit = async () => {
        if (!user || !selectedDayData) return;
        setIsSaving(true);
    
        const year = viewDate.getFullYear();
        const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${selectedDayData.day.toString().padStart(2, '0')}`;
        const imageString = formData.screenshots.join(',');
    
        // Calculate which rules were followed for the legacy "setup" string 
        // and keep the full snapshot for the new "rules" logic.
        const rulesFollowedNames = (formData.rules || [])
            .filter(r => r.followed)
            .map(r => r.text)
            .join(", ");
    
        try {
            // 1. Journal Update
            await fetch(`${API_URL}/journal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    date: dateStr,
                    daily_notes: formData.notes,
                    mood: formData.mood,
                    screenshot_url: imageString,
                    // ADD THIS: Send the full rules snapshot to the journal entry
                    rules_snapshot: JSON.stringify(formData.rules) 
                })
            });
    
            // 2. Trade Update Logic
            if (formData.ticker) {
                if (formData.trade_id) {
                    await fetch(`${API_URL}/trades/${formData.trade_id}`, { method: 'DELETE' });
                }
    
                await fetch(`${API_URL}/trades`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id, 
                        account_id: currentAccountId, 
                        ticker: formData.ticker, 
                        pnl: Number(formData.pnl),
                        shares: Number(formData.size) || 1, 
                        trade_type: formData.trade_type, 
                        trade_category: 'DAY_TRADE',
                        asset_type: 'FUTURE', 
                        created_at: dateStr, 
                        trade_screenshot_url: imageString,
                        setup: rulesFollowedNames, // Updated to use the new object structure
                        entry_price: 0, 
                        exit_price: 0
                    })
                });
            }
    
            // 3. REFRESH DATA (This is the line that was crashing)
            await fetchTrades();
            
            setIsDrawerOpen(false);
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 h-screen overflow-y-auto pb-20 scrollbar-hide">

            {/* COMMAND BAR */}
            <div className="sticky top-0 z-30 flex justify-between items-center bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-gray-100 shadow-sm mb-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Account</label>
                        <select
                            value={currentAccountId || ""}
                            onChange={(e) => {
                                const newId = Number(e.target.value);
                                setCurrentAccountId(newId);
                                if (location.pathname.startsWith('/accounts')) {
                                    navigate(`/accounts/${newId}`);
                                }
                            }}
                            className="text-2xl font-bold bg-transparent outline-none cursor-pointer hover:text-blue-600 transition appearance-none"
                        >
                            {accounts.map(acc => (<option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>))}
                        </select>
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100" />
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discipline Score</p><p className="text-xl font-bold text-green-600">94%</p></div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-mono font-bold text-gray-900">${Number(currentAccount?.balance || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available Capital</p>
                </div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-min">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-between min-h-[250px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full">Win Rate %</p>
                    <div className="h-32 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.tradePieData} innerRadius={42} outerRadius={52} paddingAngle={5} dataKey="value" stroke="none" startAngle={90} endAngle={450}>
                                    {stats.tradePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-xl">{stats.winRate}%</div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Trades: {trades.length}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-around min-h-[250px]">
                    <div className="pb-4 border-b border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Win</p>
                        <p className="text-2xl font-bold text-green-600 font-mono">${stats.avgWin}</p>
                    </div>
                    <div className="pt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Loss</p>
                        <p className="text-2xl font-bold text-red-600 font-mono">-${stats.avgLoss}</p>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[250px]">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Equity Curve</p>
                    <div className="flex-1 w-full min-h-[160px]">
                        <AccountStatsModal trades={trades} accountId={currentAccountId} showStats={false} />
                    </div>
                </div>
            </div>

            {/* CALENDAR */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-10 mt-4 flex-grow">
                <div className="p-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-gray-400">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}><ChevronLeft size={20}/></button>
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-900">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}><ChevronRight size={20}/></button>
                    </div>
                    <span className={`text-xs font-bold ${monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>Monthly P/L: ${monthlyPnL.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-7 border-l border-t border-gray-50">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="p-4 border-r border-b border-gray-50 bg-gray-50/30 text-[10px] font-bold text-gray-400 uppercase text-center">{d}</div>))}
                    {calendarDays.map((d, i) => (
                        <div key={i} onClick={() => handleDayClick(d)} className={`h-32 p-3 border-r border-b border-gray-50 transition-all flex flex-col justify-between cursor-pointer ${!d ? 'bg-gray-50/10' : 'hover:bg-gray-50/80 bg-white'}`}>
                            <span className="text-[11px] font-bold text-gray-300">{d?.day}</span>
                            {d && d.pnl !== 0 && !d.isSaturday && (<div className={`text-center py-2 rounded-xl text-[12px] font-bold ${d.pnl > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>${Number(d.pnl).toFixed(0)}</div>)}
                            {d?.isSaturday && (<div className="text-center py-1"><p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Week Total</p><p className={`text-xs font-bold font-mono ${d.weekTotal! >= 0 ? 'text-green-600' : 'text-red-600'}`}>${d.weekTotal!.toFixed(0)}</p></div>)}
                        </div>
                    ))}
                </div>
            </div>

            {/* AUDIT PEEK */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/5 backdrop-blur-md z-40" />
                        <motion.div
                            layout
                            initial={viewMode === 'side' ? { x: '100%' } : { scale: 0.9, opacity: 0 }}
                            animate={viewMode === 'side' ? { x: 0, opacity: 1, right: 0, top: 0, height: '100%', width: '40%', borderRadius: 0 } : { x: '-50%', y: '-50%', left: '50%', top: '50%', width: '70%', height: '85%', opacity: 1, scale: 1, borderRadius: '24px' }}
                            exit={viewMode === 'side' ? { x: '100%' } : { scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bg-white shadow-2xl z-50 p-12 overflow-y-auto border-l border-gray-100 scrollbar-hide"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setViewMode(viewMode === 'side' ? 'center' : 'side')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition">{viewMode === 'side' ? <Maximize2 size={18}/> : <Minimize2 size={18}/>}</button>
                                    <div><h2 className="text-3xl font-bold tracking-tight text-gray-900">Session Audit</h2><p className="text-xs text-gray-400 font-bold uppercase mt-1">{viewDate.toLocaleString('default', { month: 'long' })} {selectedDayData?.day}</p></div>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition"><X /></button>
                            </div>

                            <div className={`grid ${viewMode === 'center' ? 'grid-cols-2 gap-16' : 'grid-cols-1 gap-10'}`}>
                                <div className="space-y-10">
                                    <section className="space-y-4 border-b border-gray-50 pb-10">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Properties</p>
                                        <div className="space-y-2">
                                            {/* TICKER */}
                                            <div className="grid grid-cols-3 items-center group">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ticker</span>
                                                <input 
                                                    value={formData.ticker} 
                                                    onChange={e => setFormData({...formData, ticker: e.target.value.toUpperCase()})} 
                                                    className="col-span-2 p-2 bg-gray-50/50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all font-bold uppercase outline-none" 
                                                    placeholder="Empty"
                                                />
                                            </div>
                                            {/* SIZE */}
                                            <div className="grid grid-cols-3 items-center group">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Size</span>
                                                <input 
                                                    type="number" 
                                                    value={formData.size} 
                                                    onChange={e => setFormData({...formData, size: e.target.value})} 
                                                    className="col-span-2 p-2 bg-gray-50/50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all font-bold outline-none" 
                                                    placeholder="0"
                                                />
                                            </div>
                                            {/* PNL */}
                                            <div className="grid grid-cols-3 items-center group">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Net P&L</span>
                                                <input 
                                                    type="number" 
                                                    value={formData.pnl} 
                                                    onChange={e => setFormData({...formData, pnl: e.target.value})} 
                                                    className="col-span-2 p-2 bg-gray-50/50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all font-mono font-bold outline-none" 
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {/* MOOD */}
                                            <div className="grid grid-cols-3 items-center group">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mood</span>
                                                <select 
                                                    value={formData.mood} 
                                                    onChange={e => setFormData({...formData, mood: e.target.value})} 
                                                    className="col-span-2 p-2 bg-gray-50/50 border border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none font-bold transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="Flow State 🧘‍♂️">Flow State 🧘‍♂️</option>
                                                    <option value="Neutral 😐">Neutral 😐</option>
                                                    <option value="Tilted 😡">Tilted 😡</option>
                                                    <option value="FOMO 🥺">FOMO 🥺</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>
                                    
                                    {/* DISCIPLINE CHECKLIST - Now Dynamic and Snapshotted */}
                                    <section>
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discipline Checklist</p>
                                            
                                            {/* ADD RULE BUTTON */}
                                            <button 
                                                onClick={() => {
                                                    const newRuleText = prompt("Enter your new trading rule:");
                                                    if (newRuleText) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            rules: [...(prev.rules || []), { text: newRuleText, followed: false }]
                                                        }));
                                                    }
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded text-blue-500 transition flex items-center gap-1 group"
                                            >
                                                <Plus size={14}/>
                                                <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Add Rule</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {/* We map through the new object structure: { text, followed } */}
                                            {formData.rules?.map((rule, idx) => (
                                                <div key={idx} className="group relative flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const updatedRules = [...formData.rules];
                                                            updatedRules[idx].followed = !updatedRules[idx].followed;
                                                            setFormData({ ...formData, rules: updatedRules });
                                                        }} 
                                                        className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                                                            rule.followed 
                                                            ? 'bg-green-50 border-green-100 text-green-700 shadow-sm' 
                                                            : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <CheckCircle2 size={16} className={rule.followed ? "text-green-600" : "text-gray-300"} />
                                                        <span className="text-xs font-bold">{rule.text}</span>
                                                    </button>

                                                    {/* DELETE BUTTON - Visible on Hover */}
                                                    <button 
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                rules: prev.rules.filter((_, i) => i !== idx)
                                                            }));
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div> {/* This closes the first column of the grid */}

                                <div className="space-y-10">
                                    {/* GALLERY */}
                                    <section>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Gallery</p>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                            {formData.screenshots.map((url, idx) => (
                                                <div key={idx} className="relative flex-none w-[280px] aspect-video rounded-xl overflow-hidden group border border-gray-100 shadow-sm snap-start">
                                                    <img src={url} className="w-full h-full object-cover" alt="Chart" />
                                                    <button onClick={() => setFormData(f => ({...f, screenshots: f.screenshots.filter((_, i) => i !== idx)}))} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500"><Trash2 size={12}/></button>
                                                </div>
                                            ))}
                                            <label className="flex-none w-[280px] aspect-video border-2 border-dashed border-gray-100 rounded-xl flex flex-col items-center justify-center hover:border-blue-400 transition cursor-pointer bg-gray-50/50 snap-start">
                                                <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                                                {isUploading ? <Loader2 className="animate-spin text-blue-500" size={20}/> : <><ImageIcon className="text-gray-300" size={24}/><span className="text-[9px] font-bold text-gray-400 uppercase mt-2 text-center">Add Session<br/>Screenshots</span></>}
                                            </label>
                                        </div>
                                    </section>

                                    {/* POST-SESSION JOURNAL - Added subtle background and padding */}
                                    <section>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Post-Session Journal</p>
                                        <textarea 
                                            value={formData.notes} 
                                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                                            className="w-full h-40 p-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl text-sm leading-relaxed outline-none resize-none placeholder:text-gray-300 transition-all" 
                                            placeholder="Type thoughts here..."
                                        />
                                    </section>

                                    <button onClick={handleSaveAudit} disabled={isSaving} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isSaving ? "Saving..." : "Complete Daily Audit"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}