import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import Layout from './components/Layout';
import InvestingDashboard from './pages/InvestingDashboard';
import Accounts from './pages/Accounts';
import TradingJournal from './pages/TradingJournal';

function App() {
    return (
        <BrowserRouter>
            {/* STATE 1: SIGNED OUT (Landing Page - LIGHT THEME) */}
            <SignedOut>
                <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-12 md:p-16 rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center text-center max-w-2xl">
                        <div className="w-16 h-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                            <span className="text-3xl">📈</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                            AlphaTracker
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl max-w-md mb-10 leading-relaxed">
                            The professional trading journal for serious traders. Track your edge, manage your capital, and scale your accounts.
                        </p>
                        <SignInButton mode="modal">
                            <button className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-md transform hover:-translate-y-1">
                                Get Started 🚀
                            </button>
                        </SignInButton>
                        <p className="mt-6 text-sm text-gray-400 font-medium uppercase tracking-widest">
                            Secure Login via Clerk
                        </p>
                    </div>
                </div>
            </SignedOut>

            {/* STATE 2: SIGNED IN (Dashboard with Sidebar) */}
            <SignedIn>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<InvestingDashboard />} />
                        <Route path="accounts" element={<Accounts />} />
                        <Route path="journal" element={<TradingJournal />} />
                    </Route>
                </Routes>
            </SignedIn>
        </BrowserRouter>
    );
}

export default App;