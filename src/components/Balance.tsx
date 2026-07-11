import React from 'react';
import { useFreighter } from '../context/FreighterContext';
import { Coins, RefreshCw } from 'lucide-react';

export const Balance: React.FC = () => {
  const { pubKey, balance, refreshBalance } = useFreighter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500); // UI feedback
  };

  if (!pubKey) return null;

  return (
    <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Coins size={18} className="text-secondary" />
          <span className="font-geist font-semibold text-sm">Available Balance</span>
        </div>
        <button 
          className={`p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          onClick={handleRefresh}
          title="Refresh Balance"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      {balance === null ? (
        <div className="h-10 bg-surface-container animate-pulse rounded w-32"></div>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="font-geist font-bold text-3xl text-on-surface tracking-tight">{balance}</span>
          <span className="font-geist font-medium text-sm text-on-surface-variant">XLM</span>
        </div>
      )}
    </div>
  );
};
