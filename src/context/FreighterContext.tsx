import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { Networks } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Info, X, ChevronRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface WalletContextType {
  pubKey: string | null;
  balance: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTx: (xdr: string) => Promise<string>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Initialize the kit globally once
StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
});

export const FreighterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshBalance = async (key: string) => {
    if (!key) return;
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${key}`);
      if (!res.ok) {
        setBalance('0.0000000');
        return;
      }
      const data = await res.json();
      if (data.balances) {
        const native = data.balances.find((b: any) => b.asset_type === 'native');
        if (native) setBalance(native.balance);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      setBalance('0.0000000');
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('wallet_pubkey');
    if (savedKey) {
      setPubKey(savedKey);
      refreshBalance(savedKey);
    }
  }, []);

  const connectWallet = async () => {
    setIsModalOpen(true);
  };

  const connectToWallet = async (walletId: string) => {
    const toastId = toast.loading(`Connecting to ${walletId}...`);
    try {
      StellarWalletsKit.setWallet(walletId);
      const { address } = await StellarWalletsKit.fetchAddress();
      setPubKey(address);
      localStorage.setItem('wallet_pubkey', address);
      await refreshBalance(address);
      setIsModalOpen(false);
      toast.success(`Connected successfully via ${walletId}!`, { id: toastId });
    } catch (e: any) {
      console.error("Wallet connection failed", e);
      toast.error(`Failed to connect: ${e.message || 'Rejected'}`, { id: toastId });
    }
  };

  const disconnectWallet = () => {
    StellarWalletsKit.disconnect().catch(err => console.error("Error disconnecting:", err));
    setPubKey(null);
    setBalance(null);
    localStorage.removeItem('wallet_pubkey');
    toast.success('Wallet disconnected');
  };

  const signTx = async (xdr: string): Promise<string> => {
    if (!pubKey) throw new Error("Wallet not connected");
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
      address: pubKey,
    });
    return signedTxXdr;
  };

  return (
    <WalletContext.Provider value={{ pubKey, balance, connectWallet, disconnectWallet, signTx, refreshBalance: () => refreshBalance(pubKey || '') }}>
      {children}

      {/* Stitch Design System Custom Wallet Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white/90 dark:bg-[#191c1e]/90 backdrop-blur-xl rounded-xl border border-outline-variant w-full max-w-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container text-outline hover:text-on-surface z-50 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Left Panel - Mobile Sync QR Code */}
            <div className="w-full md:w-[280px] bg-primary-container p-8 flex flex-col items-center justify-center text-center shrink-0 border-b md:border-b-0 md:border-r border-outline-variant/10">
              <span className="font-geist font-bold text-white text-lg">Mobile Sync</span>
              <span className="font-mono text-[10px] text-on-primary-container uppercase tracking-widest mt-1 mb-6">SCAN TO CONNECT</span>
              
              {/* QR Code Placeholder with white border */}
              <div className="w-40 h-40 bg-white p-2 rounded-lg border border-outline-variant shadow-md flex items-center justify-center">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://stellar.org" 
                  alt="Wallet Sync QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <span className="font-inter text-[11px] text-on-primary-container mt-6 max-w-[180px]">
                Sync with your Lobstr or xBull mobile app instantly.
              </span>
            </div>

            {/* Right Panel - Wallet Options */}
            <div className="flex-1 p-8 flex flex-col gap-6 justify-between bg-surface-lowest">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-geist font-semibold text-xl text-on-surface">Connect Wallet</h3>
                  <div className="w-2 h-2 rounded-full bg-secondary" title="Testnet Connected" />
                  <span className="font-inter text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">Testnet</span>
                </div>

                {/* Wallet list */}
                <div className="flex flex-col gap-3 mt-2">
                  {/* Option 1: Freighter (Recommended) */}
                  <div 
                    onClick={() => connectToWallet('freighter')}
                    className="flex items-center justify-between p-4 bg-surface-low hover:bg-surface-high border border-outline-variant rounded-lg cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-geist font-bold text-white text-xs">
                        F
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-geist font-semibold text-sm text-on-surface">Freighter Wallet</span>
                          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-semibold uppercase rounded-full px-2 py-0.5 font-geist">
                            RECOMMENDED
                          </span>
                        </div>
                        <span className="font-inter text-xs text-on-surface-variant">Default extension browser wallet</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface transition-colors" />
                  </div>

                  {/* Option 2: Albedo */}
                  <div 
                    onClick={() => connectToWallet('albedo')}
                    className="flex items-center justify-between p-4 bg-surface-low hover:bg-surface-high border border-outline-variant rounded-lg cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-geist font-bold text-white text-xs">
                        A
                      </div>
                      <div className="flex flex-col">
                        <span className="font-geist font-semibold text-sm text-on-surface">Albedo Link</span>
                        <span className="font-inter text-xs text-on-surface-variant">Secure web intent login adapter</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface transition-colors" />
                  </div>

                  {/* Option 3: xBull */}
                  <div 
                    onClick={() => connectToWallet('xbull')}
                    className="flex items-center justify-between p-4 bg-surface-low hover:bg-surface-high border border-outline-variant rounded-lg cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-geist font-bold text-white text-xs">
                        X
                      </div>
                      <div className="flex flex-col">
                        <span className="font-geist font-semibold text-sm text-on-surface">xBull Wallet</span>
                        <span className="font-inter text-xs text-on-surface-variant">Advanced developer wallet extension</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-outline group-hover:text-on-surface transition-colors" />
                  </div>
                </div>

                <a 
                  href="https://developers.stellar.org/docs/tools/wallets" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-geist text-secondary hover:underline mt-2 inline-block"
                >
                  New to Stellar? Setup Wallet Documentation
                </a>
              </div>

              {/* Bottom Info Box + Audited Badge */}
              <div className="flex flex-col gap-4 border-t border-outline-variant/10 pt-4">
                <div className="bg-surface-container rounded-lg p-3 flex gap-2.5">
                  <Info size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                  <span className="font-inter text-[11px] text-on-surface-variant leading-normal">
                    Connecting your wallet allows ONDC-Lock to securely query testnet states and request ledger transaction signatures. Your private keys never leave your device.
                  </span>
                </div>
                
                <div className="flex justify-end">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant bg-surface-low/50 text-[9px] font-mono uppercase tracking-wider font-semibold text-on-surface-variant">
                    <Shield size={10} className="text-secondary" /> Audited by Soroban Labs
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
};

export const useFreighter = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useFreighter must be used within a FreighterProvider');
  }
  return context;
};
