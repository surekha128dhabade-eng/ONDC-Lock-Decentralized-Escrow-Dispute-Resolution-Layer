import React from 'react';
import { useFreighter } from '../context/FreighterContext';
import { BlockchainString } from './BlockchainString';
import { Wallet as WalletIcon, LogOut } from 'lucide-react';

export const Wallet: React.FC = () => {
  const { pubKey, connectWallet, disconnectWallet } = useFreighter();

  return (
    <div className="flex items-center gap-2">
      {pubKey ? (
        <div className="flex items-center gap-3 bg-surface-container rounded-lg px-4 py-2 border border-outline-variant/30">
          <BlockchainString value={pubKey} truncate={true} copyable={true} />
          <button 
            className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-all cursor-pointer" 
            onClick={disconnectWallet} 
            title="Disconnect"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button 
          className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold px-5 py-2.5 flex items-center gap-2 cursor-pointer text-sm shadow-sm transition-all" 
          onClick={connectWallet}
        >
          <WalletIcon size={16} />
          <span>Connect Wallet</span>
        </button>
      )}
    </div>
  );
};
