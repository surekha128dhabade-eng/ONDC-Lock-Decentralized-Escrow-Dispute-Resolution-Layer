import React, { useState } from 'react';
import { useFreighter } from '../context/FreighterContext';
import { useTheme } from '../hooks/useTheme';
import { BlockchainString } from '../components/BlockchainString';
import { ShieldAlert, Wallet2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { pubKey, disconnectWallet } = useFreighter();
  const { theme, setTheme, density, setDensity } = useTheme();

  // Settings states persisted to localStorage
  const [language, setLanguage] = useState(() => localStorage.getItem('pref_lang') || 'en');
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('pref_email_alerts') === 'true');
  const [autoVote, setAutoVote] = useState(() => localStorage.getItem('pref_auto_vote') === 'true');
  const [stakingCap, setStakingCap] = useState(() => Number(localStorage.getItem('pref_staking_cap') || '5000'));

  const handleSave = () => {
    localStorage.setItem('pref_lang', language);
    localStorage.setItem('pref_email_alerts', String(emailAlerts));
    localStorage.setItem('pref_auto_vote', String(autoVote));
    localStorage.setItem('pref_staking_cap', String(stakingCap));

    toast.success('Configuration saved successfully!', {
      className: 'bg-secondary-container text-on-secondary-container font-geist font-semibold rounded-lg',
    });
  };

  const handleReset = () => {
    setLanguage('en');
    setEmailAlerts(false);
    setAutoVote(false);
    setStakingCap(5000);
    setTheme('light');
    setDensity('comfortable');
    toast.success('Reset to default settings.');
  };

  // Mock data for settlement efficiency chart
  const chartData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 80 },
    { label: 'Wed', value: 55 },
    { label: 'Thu', value: 90 },
    { label: 'Fri', value: 70 },
    { label: 'Sat', value: 30 },
    { label: 'Sun', value: 40 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-geist font-semibold text-3xl text-on-surface">Protocol Configuration</h2>
        <p className="font-inter text-sm text-on-surface-variant mt-1">Configure your ONDC-Lock environment preferences and node settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left card: Display & Interface */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-6">
          <h3 className="font-geist font-semibold card-title-size text-on-surface border-b border-outline-variant/10 pb-3">Display & Interface</h3>
          
          {/* Dark Mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-geist font-medium text-sm text-on-surface">Dark Mode</span>
              <span className="font-inter text-xs text-on-surface-variant">Switch application color scheme</span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                theme === 'dark' ? 'bg-secondary' : 'bg-surface-container'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interface Density */}
          <div className="flex flex-col gap-2">
            <span className="font-geist font-medium text-sm text-on-surface">Interface Density</span>
            <div className="grid grid-cols-3 bg-surface-container p-1 rounded-md">
              {(['comfortable', 'compact', 'technical'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setDensity(option)}
                  className={`py-1.5 text-xs font-geist font-semibold capitalize rounded transition-all ${
                    density === option
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <span className="font-inter text-xs text-on-surface-variant italic">
              {density === 'technical' && 'Technical mode: Compact margins and reduced structural font sizing applied.'}
            </span>
          </div>

          {/* Primary Language */}
          <div className="flex flex-col gap-2">
            <label className="font-geist font-medium text-sm text-on-surface">Primary Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="border border-outline-variant rounded bg-surface-lowest px-4 py-3 font-inter focus:border-primary focus:outline-none text-sm w-full"
            >
              <option value="en">English (International)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        {/* Right card: Security & Protocols */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-6">
          <h3 className="font-geist font-semibold card-title-size text-on-surface border-b border-outline-variant/10 pb-3">Security & Protocols</h3>

          {/* Connected wallet info */}
          <div className="flex flex-col gap-2">
            <span className="font-geist font-medium text-sm text-on-surface">Connected Wallet</span>
            {pubKey ? (
              <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <Wallet2 className="text-secondary" size={20} />
                  <div className="flex flex-col">
                    <span className="font-geist font-semibold text-xs text-on-surface">Stellar Wallet</span>
                    <BlockchainString value={pubKey} truncate={true} copyable={true} />
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="border border-error bg-transparent text-error hover:bg-error-container/30 px-3 py-1 text-xs rounded font-geist font-semibold transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="p-3 bg-surface-container rounded-lg text-center text-xs text-on-surface-variant">
                No wallet connected. Configure in header.
              </div>
            )}
          </div>

          {/* Email alerts toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-geist font-medium text-sm text-on-surface">Email Alerts</span>
              <span className="font-inter text-xs text-on-surface-variant">Receive on-chain conflict notifications</span>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                emailAlerts ? 'bg-secondary' : 'bg-surface-container'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  emailAlerts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Validator Preferences */}
          <div className="border-t border-outline-variant/10 pt-4 flex flex-col gap-4">
            <span className="font-geist font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Validator Preferences</span>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-geist font-medium text-xs text-on-surface">Auto-Vote on Governance</span>
                <span className="font-inter text-[10px] text-on-surface-variant">Delegate simple voting proposals</span>
              </div>
              <button
                onClick={() => setAutoVote(!autoVote)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  autoVote ? 'bg-secondary' : 'bg-surface-container'
                }`}
              >
                <div
                  className={`w-3.8 h-3.8 rounded-full bg-white transition-transform duration-200 ${
                    autoVote ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-geist">
                <span className="text-on-surface">Staking Cap</span>
                <span className="text-secondary font-semibold">{stakingCap.toLocaleString()} XLM</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="100"
                value={stakingCap}
                onChange={e => setStakingCap(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-mono">
                <span>MIN: 1K</span>
                <span>MAX: 100K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Efficiency Bar Chart */}
      <div className="bg-primary-container rounded-lg p-6 flex flex-col gap-4">
        <div>
          <h3 className="font-geist font-semibold text-white text-lg">Settlement Efficiency</h3>
          <p className="font-inter text-xs text-on-primary-container mt-0.5">Average settlement processing delay in blocks over the last week.</p>
        </div>

        {/* SVG Custom Bar Chart */}
        <div className="w-full h-40 flex items-end gap-3 pt-6 border-b border-white/10 relative">
          {chartData.map((d, index) => {
            const pct = (d.value / 100) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-primary-container text-[10px] font-mono rounded px-2 py-0.5 pointer-events-none shadow z-20">
                  {d.value} blocks
                </div>
                {/* Bar */}
                <div
                  className="w-full bg-[#2be1a1] hover:bg-[#56febc] transition-all rounded-t-sm"
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[10px] text-on-primary-container mt-2 font-mono">{d.label}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-on-primary-container italic text-center">Sample — connect wallet to load real network block data.</p>
      </div>

      {/* Security Notice Card */}
      <div className="bg-error-container/20 border border-error/20 rounded-lg p-4 flex gap-3">
        <ShieldAlert className="text-error shrink-0" size={20} />
        <div className="flex flex-col">
          <span className="font-geist font-semibold text-on-error-container text-sm">Security Notice</span>
          <span className="font-inter text-xs text-on-error-container mt-0.5">
            Always double check recipient address hashes. Transactions executed on Stellar Testnet cannot be reversed once cleared by the consensus pool.
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-4 border-t border-outline-variant/10 pt-4">
        <button
          onClick={handleReset}
          className="border border-primary bg-transparent text-primary hover:bg-surface-container rounded font-geist font-semibold px-6 py-3 min-h-[48px] text-sm transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold px-6 py-3 min-h-[48px] text-sm transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
