import { Link, Outlet, useLocation } from 'react-router-dom';
import { UserButton, useUser } from "@clerk/clerk-react";
import { PieChart, BookOpen, LayoutDashboard, Wallet } from 'lucide-react';

export default function Layout() {
    const { user } = useUser();
    const location = useLocation();

    return (
        // Added h-screen and overflow-hidden to keep the sidebar static
        <div className="h-screen bg-gray-50 text-gray-900 font-sans flex flex-col md:flex-row overflow-hidden">

            {/* SIDEBAR - Fixed width and height */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-6 flex items-center gap-3 border-b border-gray-200">
                    <LayoutDashboard className="text-gray-900" />
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                        AlphaTracker
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link
                        to="/"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <PieChart size={20} />
                        <span className="font-bold">Investing</span>
                    </Link>
                    <Link
                        to="/accounts"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname.startsWith('/accounts') ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <Wallet size={20} />
                        <span className="font-bold">Accounts</span>
                    </Link>
                    <Link
                        to="/journal"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${location.pathname === '/journal' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <BookOpen size={20} />
                        <span className="font-bold">Trading Journal</span>
                    </Link>
                </nav>

                {/* USER PROFILE */}
                <div className="p-4 border-t border-gray-200 flex items-center gap-3">
                    <UserButton />
                    <span className="text-sm font-bold text-gray-700 truncate">
                        {user?.firstName || 'Trader'}
                    </span>
                </div>
            </aside>

            {/* MAIN CONTENT AREA - Scrollable */}
            <main className="flex-1 h-full overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
}