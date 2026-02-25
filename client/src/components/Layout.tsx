import { Link, Outlet, useLocation } from 'react-router-dom';
import { UserButton, useUser } from "@clerk/clerk-react";
import { PieChart, BookOpen, LayoutDashboard, Wallet } from 'lucide-react';


export default function Layout() {
    const { user } = useUser();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col md:flex-row">
            {/* SIDEBAR */}
            <aside className="w-full md:w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b border-slate-700">
                    <LayoutDashboard className="text-blue-400" />
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        AlphaTracker
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <PieChart size={20} />
                        <span className="font-bold">Investing</span>
                    </Link>

                    <Link
                        to="/accounts"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/accounts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Wallet size={20} />
                        <span className="font-bold">Accounts</span>
                    </Link>
                    <Link
                        to="/journal"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/journal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <BookOpen size={20} />
                        <span className="font-bold">Trading Journal</span>
                    </Link>
                </nav>

                {/* USER PROFILE (Bottom of Sidebar) */}
                <div className="p-4 border-t border-slate-700 flex items-center gap-3">
                    <UserButton />
                    <span className="text-sm font-bold text-slate-300 truncate">
                        {user?.firstName || 'Trader'}
                    </span>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto">
                <Outlet /> {/* This is where the specific page content loads! */}
            </main>
        </div>
    );
}