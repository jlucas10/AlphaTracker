import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import Layout from './components/Layout';
import InvestingDashboard from './pages/InvestingDashboard';
import TradingJournal from './pages/TradingJournal';
import Accounts from './pages/Accounts';

function App() {
    return (
        <BrowserRouter>
            {/* STATE 1: SIGNED OUT (Landing Page) */}
            <SignedOut>
                <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center space-y-6 text-center p-4">
                    <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        AlphaTracker
                    </h1>
                    <p className="text-slate-400 text-xl max-w-md">
                        The professional trading journal for serious traders. Track your edge.
                    </p>
                    <SignInButton mode="modal">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg shadow-blue-500/20 transform hover:scale-105">
                            Get Started 🚀
                        </button>
                    </SignInButton>
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