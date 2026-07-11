import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FreighterProvider } from './context/FreighterContext';
import { Wallet } from './components/Wallet';
import { Home } from './pages/Home';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { RiderDashboard } from './pages/RiderDashboard';
import { ValidatorDashboard } from './pages/ValidatorDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ShieldCheck, ShoppingCart, Truck, Gavel, Home as HomeIcon, Settings, Search, HelpCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import './index.css';

interface NavLinkItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavLinkItem({ to, icon, label }: NavLinkItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-geist font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white/10 text-white rounded-lg'
          : 'text-on-primary-container hover:text-white hover:bg-white/5 rounded-lg'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Navigation() {
  return (
    <nav className="flex flex-col gap-1.5 p-4 w-full">
      <NavLinkItem to="/" icon={<HomeIcon size={18} />} label="Home" />
      <NavLinkItem to="/buyer" icon={<ShoppingCart size={18} />} label="Buyer Dashboard" />
      <NavLinkItem to="/rider" icon={<Truck size={18} />} label="Rider Dashboard" />
      <NavLinkItem to="/validator" icon={<Gavel size={18} />} label="Validator Console" />
      <NavLinkItem to="/how-it-works" icon={<HelpCircle size={18} />} label="How It Works" />
      <NavLinkItem to="/settings" icon={<Settings size={18} />} label="Settings" />
    </nav>
  );
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Bar */}
      <header className="h-16 bg-surface-lowest border-b border-outline-variant px-6 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-secondary" size={28} />
          <span className="font-geist font-bold text-lg text-on-surface tracking-tight">ONDC-Lock</span>
        </div>
        
        {/* Search Pill */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container rounded-full px-4 py-1.5 w-80 border border-transparent focus-within:border-outline transition-all">
          <Search size={16} className="text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search contracts, transactions..."
            className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none w-full"
          />
        </div>

        <Wallet />
      </header>

      {/* Main Content Area: Sidebar + Page */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-[220px] bg-primary-container text-white flex flex-col items-center md:items-start shrink-0 border-r border-outline-variant/10 md:min-h-[calc(100vh-4rem)]">
          {/* Identity block for Validator / User */}
          <div className="w-full p-6 border-b border-white/5 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-geist font-bold text-sm">
                A7
              </div>
              <div className="flex flex-col">
                <span className="font-geist font-semibold text-sm text-white">Arbiter Node-7</span>
                <span className="font-inter text-[10px] text-on-primary-container tracking-wider uppercase font-semibold">Active Staking</span>
              </div>
            </div>
          </div>
          
          <Navigation />
        </aside>

        {/* Dynamic page contents */}
        <main className="flex-1 p-6 md:p-10 max-w-[1280px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/rider" element={<RiderDashboard />} />
            <Route path="/validator" element={<ValidatorDashboard />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-surface-lowest border-t border-outline-variant py-4 px-6 text-center text-xs text-on-surface-variant">
        <p>ONDC-Lock Settlement Layer running on Stellar Testnet | Stitch Design System</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <FreighterProvider>
      <Router>
        <Toaster position="top-right" />
        <Layout />
      </Router>
    </FreighterProvider>
  );
}

export default App;
