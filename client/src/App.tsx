import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import Layout from './components/Layout';
import InvestingDashboard from './pages/InvestingDashboard';
import Accounts from './pages/Accounts';
import TradingJournal from './pages/TradingJournal';
import AccountDeepDive from "./pages/AccountDeepDive.tsx";
import Dashboard from './pages/Dashboard.tsx';

function App() {
    return (
        <BrowserRouter>
            {/* STATE 1: SIGNED OUT (Landing Page - LIGHT THEME) */}
            <SignedOut>
                <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col items-center justify-center p-6">
                    {/* Subtle Background Element */}
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

                    <div className="flex flex-col items-center text-center max-w-sm">
                        <div className="mb-8">
                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm mx-auto">
                                <span className="text-xl">📈</span>
                            </div>
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
                            AlphaTracker
                        </h1>

                        <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                            Master your edge. <br />
                            Scale your capital.
                        </p>

                        <SignInButton mode="modal">
                            <button className="w-full bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-all active:scale-95 shadow-lg shadow-gray-200">
                                Get Started 🚀
                            </button>
                        </SignInButton>

                        <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            Secure Login via Clerk
                        </p>
                    </div>
                </div>
            </SignedOut>

            {/* STATE 2: SIGNED IN (Dashboard with Sidebar) */}
            <SignedIn>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="investing" element={<InvestingDashboard />} />
                        <Route path="accounts" element={<Accounts />} />
                        {/*<Route path="accounts/:id" element={<AccountDeepDive />} />*/}
                        <Route path="journal" element={<TradingJournal />} />
                    </Route>
                </Routes>
            </SignedIn>
        </BrowserRouter>
    );
}

export default App;