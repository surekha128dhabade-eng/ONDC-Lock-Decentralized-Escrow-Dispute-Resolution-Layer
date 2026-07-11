import React, { useState, useEffect } from 'react';
import { useFreighter } from '../context/FreighterContext';
import { invokeContract } from '../utils/soroban';
import { BlockchainString } from '../components/BlockchainString';
import { Shield, Loader2, List } from 'lucide-react';
import toast from 'react-hot-toast';

const FACTORY_ID = import.meta.env.VITE_ESCROW_FACTORY || '';

export const BuyerDashboard: React.FC = () => {
  const { pubKey, signTx } = useFreighter();
  const [seller, setSeller] = useState('');
  const [rider, setRider] = useState('');
  const [otp, setOtp] = useState('');
  const [amount, setAmount] = useState('10000000'); // 1 XLM default
  const [destLat, setDestLat] = useState('287041000'); // Example: Delhi
  const [destLon, setDestLon] = useState('771025000');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [myEscrows, setMyEscrows] = useState<string[]>([]);

  useEffect(() => {
    if (pubKey) {
      const saved = localStorage.getItem(`escrows_${pubKey}`);
      if (saved) {
        setMyEscrows(JSON.parse(saved));
      }
    }
  }, [pubKey]);

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      toast.error('Wallet not connected');
      return;
    }
    
    setIsProcessing(true);
    const toastId = toast.loading('Deploying Order Escrow...');

    try {
      const salt = new Uint8Array(32);
      crypto.getRandomValues(salt);
      
      const args = [
        pubKey, // buyer
        seller,
        rider,
        otp,
        Number(amount),
        Number(destLat),
        Number(destLon),
        salt
      ];
      
      const result = await invokeContract(FACTORY_ID, 'create_escrow', args, pubKey, signTx);
      
      // result.returnValue should contain the new escrow address
      if (result.returnValue) {
        const newEscrows = [result.returnValue, ...myEscrows];
        setMyEscrows(newEscrows);
        localStorage.setItem(`escrows_${pubKey}`, JSON.stringify(newEscrows));
      }
      
      toast.success(
        <div>
          Escrow created!<br/>
          <span className="text-xs font-mono">{result.returnValue}</span><br/>
          <a href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
            View on Explorer
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );
      
      // Clear form
      setSeller('');
      setRider('');
      setOtp('');
    } catch (err: any) {
      toast.error(`Transaction failed: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-geist font-semibold text-3xl text-on-surface">Buyer Dashboard</h2>
        <p className="font-inter text-sm text-on-surface-variant mt-1">Deploy a new escrow instance and fund it securely for ONDC deliveries.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Create Escrow Card */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-6">
          <h3 className="font-geist font-semibold card-title-size text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <Shield size={18} className="text-secondary" /> Create Order Escrow
          </h3>
          
          <form onSubmit={handleCreateEscrow} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Seller Address</label>
                <input
                  type="text"
                  value={seller}
                  onChange={e => setSeller(e.target.value)}
                  required
                  placeholder="G..."
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-inter focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Rider Address</label>
                <input
                  type="text"
                  value={rider}
                  onChange={e => setRider(e.target.value)}
                  required
                  placeholder="G..."
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-inter focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Delivery OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  placeholder="e.g. 1234"
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Amount (Stroops)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Destination Lat (x10^7)</label>
                <input
                  type="number"
                  value={destLat}
                  onChange={e => setDestLat(e.target.value)}
                  required
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Destination Lon (x10^7)</label>
                <input
                  type="number"
                  value={destLon}
                  onChange={e => setDestLon(e.target.value)}
                  required
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold px-6 py-3 min-h-[48px] text-sm transition-all mt-4 w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Deploying...
                </>
              ) : (
                'Deploy & Initialize Escrow'
              )}
            </button>
          </form>
        </div>

        {/* My Active Escrows Card */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <h3 className="font-geist font-semibold card-title-size text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <List size={18} className="text-secondary" /> My Active Escrows
          </h3>
          
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {myEscrows.length === 0 ? (
              <p className="font-inter text-xs text-on-surface-variant italic py-4 text-center">
                No active escrows deployed yet.
              </p>
            ) : (
              myEscrows.map((escrowId, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-surface-low border border-outline-variant/30 rounded flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Escrow Contract ID</span>
                  </div>
                  <BlockchainString value={escrowId} truncate={false} copyable={true} />
                  <p className="font-inter text-[10px] text-on-surface-variant mt-1">
                    Share this ID with the Rider for proof submission and GPS check.
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
