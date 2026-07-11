import React, { useState, useEffect } from 'react';
import { useFreighter } from '../context/FreighterContext';
import { invokeContract, queryContract } from '../utils/soroban';
import { BlockchainString } from '../components/BlockchainString';
import { StatusPill } from '../components/StatusPill';
import { AtomicSplitVisualizer } from '../components/AtomicSplitVisualizer';
import { Package, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface EscrowState {
  buyer: string;
  seller: string;
  rider: string;
  otp_hash: string;
  amount: bigint | number;
  is_settled: boolean;
  is_disputed: boolean;
  dest_lat: bigint | number;
  dest_lon: bigint | number;
}

export const RiderDashboard: React.FC = () => {
  const { pubKey, signTx } = useFreighter();
  const [escrowId, setEscrowId] = useState('');
  const [proofOtp, setProofOtp] = useState('');
  const [currentLat, setCurrentLat] = useState('287041010'); // Simulated close GPS
  const [currentLon, setCurrentLon] = useState('771025010');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingState, setIsFetchingState] = useState(false);
  const [fetchedEscrow, setFetchedEscrow] = useState<EscrowState | null>(null);
  const [lookupHistory, setLookupHistory] = useState<string[]>([]);
  const [lastVerifiedTime, setLastVerifiedTime] = useState<string | null>(null);

  // Load lookup history from localStorage
  useEffect(() => {
    if (pubKey) {
      const saved = localStorage.getItem(`rider_history_${pubKey}`);
      if (saved) {
        setLookupHistory(JSON.parse(saved));
      }
    }
  }, [pubKey]);

  const handleFetchEscrow = async (idToFetch: string) => {
    if (!idToFetch.trim()) {
      toast.error('Please enter a valid Escrow ID');
      return;
    }
    
    setIsFetchingState(true);
    const toastId = toast.loading('Querying escrow status...');
    
    try {
      const state = await queryContract(idToFetch, 'get_state');
      setFetchedEscrow(state);
      toast.success('Escrow info fetched successfully', { id: toastId });
      
      // Save to history if not already there
      if (!lookupHistory.includes(idToFetch)) {
        const updatedHistory = [idToFetch, ...lookupHistory];
        setLookupHistory(updatedHistory);
        localStorage.setItem(`rider_history_${pubKey}`, JSON.stringify(updatedHistory));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to fetch escrow: ${err.message || 'Check contract ID'}`, { id: toastId });
      setFetchedEscrow(null);
    } finally {
      setIsFetchingState(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      toast.error('Wallet not connected');
      return;
    }
    if (!escrowId) {
      toast.error('Please select or enter an Escrow ID');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Submitting OTP & GPS Proof...');

    try {
      const args = [
        pubKey, 
        proofOtp,
        Number(currentLat),
        Number(currentLon)
      ]; 
      
      const result = await invokeContract(escrowId, 'submit_proof', args, pubKey, signTx);
      
      toast.success(
        <div>
          Proof Submitted! Funds released.<br/>
          <a href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
            View on Explorer
          </a>
        </div>,
        { id: toastId, duration: 6000 }
      );
      
      setLastVerifiedTime(new Date().toLocaleTimeString() + ' IST');
      // Re-fetch state to update the display
      await handleFetchEscrow(escrowId);
      setProofOtp('');
    } catch (err: any) {
      toast.error(`Transaction failed: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatStroops = (stroops: bigint | number) => {
    const val = Number(stroops) / 10000000;
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  // Split details for Atomic Split Visualization
  const escrowValText = fetchedEscrow ? `${formatStroops(fetchedEscrow.amount)} XLM` : '0.00 XLM';
  const rawAmt = fetchedEscrow ? Number(fetchedEscrow.amount) : 0;
  const splitRecipients = [
    { label: 'Seller (UPI)', amount: formatStroops(Math.floor(rawAmt * 0.95)), currency: 'XLM' },
    { label: 'Logistics (USDC)', amount: formatStroops(Math.floor(rawAmt * 0.025)), currency: 'XLM' },
    { label: 'Protocol Fee (XLM)', amount: formatStroops(Math.floor(rawAmt * 0.025)), currency: 'XLM' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="font-geist font-semibold text-3xl text-on-surface">Rider Dashboard</h2>
          <p className="font-inter text-sm text-on-surface-variant mt-1">Submit delivery proof OTP and location coordinates to verify handover and release funds.</p>
        </div>
        
        {fetchedEscrow && (
          <div className="flex items-center gap-3">
            <span className="font-geist text-sm text-on-surface-variant font-medium">Escrow Status:</span>
            <StatusPill status={fetchedEscrow.is_settled ? 'settled' : fetchedEscrow.is_disputed ? 'disputed' : 'funded'} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Deliver Order Form Card */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-6">
          <h3 className="font-geist font-semibold card-title-size text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <Package size={18} className="text-secondary" /> Deliver Order
          </h3>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-geist font-medium text-xs text-on-surface">Escrow Contract ID</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={escrowId} 
                onChange={e => setEscrowId(e.target.value)} 
                required 
                className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none flex-1" 
                placeholder="C..." 
              />
              <button 
                type="button" 
                className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold px-4 py-2 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={() => handleFetchEscrow(escrowId)}
                disabled={isFetchingState || !escrowId}
              >
                {isFetchingState ? <Loader2 size={12} className="animate-spin" /> : 'Fetch State'}
              </button>
            </div>
          </div>

          {fetchedEscrow && (
            <div className="flex flex-col gap-4">
              {/* GPS Verification Point card */}
              <div className="bg-surface-low border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-secondary" />
                    <span className="font-geist font-semibold text-xs text-on-surface">GPS Verification Point</span>
                  </div>
                  {fetchedEscrow.is_settled && lastVerifiedTime && (
                    <span className="font-inter text-[10px] font-semibold text-secondary">
                      Verified at {lastVerifiedTime}
                    </span>
                  )}
                </div>

                {/* Mock Geofence Visualization */}
                <div className="h-28 bg-surface-container rounded border border-outline-variant/50 relative flex items-center justify-center overflow-hidden">
                  {/* Outer geofence circle */}
                  <div className="w-20 h-20 rounded-full bg-secondary/5 border border-secondary/30 flex items-center justify-center animate-pulse">
                    {/* Inner radius */}
                    <div className="w-10 h-10 rounded-full bg-secondary/15 border border-secondary flex items-center justify-center">
                      <MapPin size={14} className="text-secondary" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 font-mono text-[9px] text-on-surface-variant bg-surface-lowest px-1.5 py-0.5 rounded border border-outline-variant/20">
                    Radius: 50m
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-inter">Accuracy Profile:</span>
                  <span className="font-geist font-semibold text-secondary">Accuracy ±1.4m</span>
                </div>
                
                {/* Accuracy progress bar */}
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[95%]" />
                </div>
                
                <p className="font-inter text-xs text-on-surface-variant">
                  Delivery point matches consumer coordinates within 50m protocol threshold.
                </p>
              </div>

              {/* Atomic Payout Visualization */}
              <div className="flex flex-col gap-2">
                <span className="font-geist font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Atomic Payout Breakdown</span>
                <AtomicSplitVisualizer
                  escrowAmount={escrowValText}
                  splits={splitRecipients}
                  status={fetchedEscrow.is_settled ? 'settled' : 'pending'}
                />
              </div>

              {/* Tx Hash / Explorer bar */}
              <div className="bg-surface-container rounded-lg p-3 flex items-center gap-2.5 border border-outline-variant/20">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shrink-0" />
                <span className="font-inter text-[11px] text-on-surface-variant flex-1 truncate">
                  Escrow Contract state: <BlockchainString value={escrowId} truncate={true} copyable={true} /> verified on Stellar Ledger.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitProof} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-geist font-medium text-xs text-on-surface">OTP Provided by Buyer</label>
              <input 
                type="text" 
                value={proofOtp} 
                onChange={e => setProofOtp(e.target.value)} 
                required 
                className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none" 
                placeholder="e.g. 1234" 
                disabled={!fetchedEscrow || fetchedEscrow.is_settled || fetchedEscrow.is_disputed}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Current Lat (x10^7)</label>
                <input 
                  type="number" 
                  value={currentLat} 
                  onChange={e => setCurrentLat(e.target.value)} 
                  required 
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none" 
                  disabled={!fetchedEscrow || fetchedEscrow.is_settled || fetchedEscrow.is_disputed}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-geist font-medium text-xs text-on-surface">Current Lon (x10^7)</label>
                <input 
                  type="number" 
                  value={currentLon} 
                  onChange={e => setCurrentLon(e.target.value)} 
                  required 
                  className="border border-outline-variant rounded bg-surface-lowest px-4 py-2 text-sm font-mono focus:border-primary focus:outline-none" 
                  disabled={!fetchedEscrow || fetchedEscrow.is_settled || fetchedEscrow.is_disputed}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`rounded font-geist font-semibold px-6 py-3 min-h-[48px] text-sm transition-all mt-4 w-full flex items-center justify-center gap-2 cursor-pointer ${
                fetchedEscrow?.is_settled
                  ? 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
              disabled={isProcessing || !fetchedEscrow || fetchedEscrow.is_settled || fetchedEscrow.is_disputed}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying...
                </>
              ) : fetchedEscrow?.is_settled ? (
                'Handover Completed / Settled'
              ) : (
                'Submit Handover OTP'
              )}
            </button>
          </form>
        </div>

        {/* Lookup History Card */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <h3 className="font-geist font-semibold card-title-size text-on-surface flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <Package size={18} className="text-secondary" /> Lookup History
          </h3>
          
          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {lookupHistory.length === 0 ? (
              <p className="font-inter text-xs text-on-surface-variant italic py-4 text-center">
                No contract lookups performed yet.
              </p>
            ) : (
              lookupHistory.map((histId, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setEscrowId(histId); handleFetchEscrow(histId); }}
                  className="p-3 bg-surface-low border border-outline-variant/30 rounded flex flex-col gap-1 cursor-pointer hover:border-outline transition-colors"
                >
                  <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Escrow Contract ID</span>
                  <BlockchainString value={histId} truncate={false} copyable={false} />
                  <p className="font-inter text-[9px] text-on-surface-variant mt-1">Click to load and verify this escrow</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
