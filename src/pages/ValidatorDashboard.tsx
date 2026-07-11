import React, { useState, useEffect } from 'react';
import { useFreighter } from '../context/FreighterContext';
import { invokeContract, queryContract } from '../utils/soroban';
import { BlockchainString } from '../components/BlockchainString';
import { StatusPill } from '../components/StatusPill';
import { Gavel, Loader2, ShieldCheck, ShieldAlert, ShieldX, Clock, Folder, Terminal, Image, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VALIDATOR_REGISTRY = import.meta.env.VITE_VALIDATOR_REGISTRY || '';
const DISPUTE_REGISTRY = import.meta.env.VITE_DISPUTE_REGISTRY || '';

export const ValidatorDashboard: React.FC = () => {
  const { pubKey, signTx } = useFreighter();
  const [stakeAmount, setStakeAmount] = useState('500000000'); // 50 XLM in stroops
  
  const [disputeId, setDisputeId] = useState('1'); // Default case ID 1
  const [voteForBuyer, setVoteForBuyer] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<'console' | 'case'>('console');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  // Timer logic for Case Detail countdown
  const [timeLeft, setTimeLeft] = useState('02h 14m 57s');
  useEffect(() => {
    const timer = setInterval(() => {
      const hours = 2;
      const now = new Date();
      const mins = 59 - now.getMinutes();
      const secs = 59 - now.getSeconds();
      setTimeLeft(`0${hours}h ${mins < 10 ? '0' + mins : mins}m ${secs < 10 ? '0' + secs : secs}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkValidatorStatus = async () => {
    if (!pubKey) return;
    setCheckingStatus(true);
    try {
      const eligible = await queryContract(VALIDATOR_REGISTRY, 'is_eligible_validator', [pubKey]);
      setIsEligible(eligible);
    } catch (err) {
      console.error("Error checking validator status:", err);
      setIsEligible(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (pubKey) {
      checkValidatorStatus();
    } else {
      setIsEligible(null);
    }
  }, [pubKey]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      toast.error('Wallet not connected');
      return;
    }
    
    setIsRegistering(true);
    const toastId = toast.loading('Registering as Validator...');

    try {
      const args = [pubKey, Number(stakeAmount)];
      const result = await invokeContract(VALIDATOR_REGISTRY, 'register_validator', args, pubKey, signTx);
      
      toast.success(
        <div>
          Registered & Staked!<br/>
          <a href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
            View on Explorer
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );
      await checkValidatorStatus();
    } catch (err: any) {
      toast.error(`Registration failed: ${err.message}`, { id: toastId });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      toast.error('Wallet not connected');
      return;
    }
    if (voteForBuyer === null) {
      toast.error('Please select a vote option');
      return;
    }
    
    setIsVoting(true);
    const toastId = toast.loading('Casting vote on-chain...');

    try {
      const args = [pubKey, Number(disputeId), voteForBuyer];
      const result = await invokeContract(DISPUTE_REGISTRY, 'cast_vote', args, pubKey, signTx);
      
      toast.success(
        <div>
          Vote Cast Successfully!<br/>
          <a href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">
            View on Explorer
          </a>
        </div>,
        { id: toastId, duration: 5000 }
      );
    } catch (err: any) {
      toast.error(`Voting failed: ${err.message}`, { id: toastId });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top dashboard header with registry status */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-outline-variant/10 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="font-geist font-semibold text-3xl text-on-surface">Validator Hub</h2>
          <div className="flex bg-surface-container p-1 rounded-md">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-1.5 text-xs font-geist font-semibold rounded ${
                activeTab === 'console' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Console
            </button>
            <button
              onClick={() => setActiveTab('case')}
              className={`px-4 py-1.5 text-xs font-geist font-semibold rounded ${
                activeTab === 'case' ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Case Detail
            </button>
          </div>
        </div>

        {pubKey && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">Registry Status:</span>
            {checkingStatus ? (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <Loader2 size={12} className="animate-spin" /> Checking...
              </span>
            ) : isEligible === true ? (
              <StatusPill status="settled">
                <ShieldCheck size={14} /> Eligible Validator
              </StatusPill>
            ) : isEligible === false ? (
              <StatusPill status="refunded">
                <ShieldAlert size={14} /> Inactive / Low Stake
              </StatusPill>
            ) : (
              <StatusPill status="pending">
                <ShieldX size={14} /> Unregistered
              </StatusPill>
            )}
          </div>
        )}
      </div>

      {activeTab === 'console' ? (
        /* ================= TAB 1: VALIDATOR CONSOLE ================= */
        <div className="flex flex-col gap-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat 1: Reputation */}
            <div className="bg-surface-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-geist font-medium text-on-surface-variant">Reputation Score</span>
                <ShieldCheck className="text-secondary" size={18} />
              </div>
              <span className="font-geist font-bold text-4xl text-on-surface">98/100</span>
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                <div className="h-full bg-secondary w-[98%]" />
              </div>
            </div>

            {/* Stat 2: Disputes Resolved */}
            <div className="bg-surface-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-geist font-medium text-on-surface-variant">Disputes Resolved</span>
                <Gavel className="text-on-surface" size={18} />
              </div>
              <span className="font-geist font-bold text-4xl text-on-surface">43</span>
              <span className="font-inter text-xs text-secondary font-medium">+12 resolved YTD</span>
            </div>

            {/* Stat 3: Stake Locked */}
            <div className="bg-surface-lowest border border-outline-variant rounded-lg p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-geist font-medium text-on-surface-variant">Stake Locked</span>
                <Lock className="text-on-surface" size={18} />
              </div>
              <span className="font-geist font-bold text-4xl text-on-surface">500 XLM</span>
              <span className="font-inter text-xs text-on-surface-variant font-medium">Estimated Yield: 4.2% APY</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Active Queue Section (Left 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h3 className="font-geist font-semibold text-2xl text-on-surface">Active Dispute Queue</h3>
              
              {/* High Urgency Case (Level 3 elevation) */}
              <div className="bg-surface-lowest border-2 border-[#FFB800] rounded-lg p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-on-surface-variant uppercase font-semibold">Case #ONDC-401</span>
                  <StatusPill status="voting_open" label="High Urgency" />
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h4 className="font-geist font-semibold text-base text-on-surface">GPS Dispute: Non-delivery Claim</h4>
                    <p className="font-inter text-xs text-on-surface-variant">Rider claims handover OTP was entered, buyer claims package was never brought to location.</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Stake reward</span>
                    <span className="font-geist font-bold text-lg text-on-surface">45.00 XLM</span>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => { setDisputeId('1'); setActiveTab('case'); }}
                    className="border border-primary bg-transparent text-primary hover:bg-surface-container rounded font-geist font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
                  >
                    Review Case & Evidence
                  </button>
                </div>
              </div>

              {/* Standard Case */}
              <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-on-surface-variant uppercase font-semibold">Case #ONDC-398</span>
                  <StatusPill status="pending" label="Normal" />
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h4 className="font-geist font-semibold text-base text-on-surface">UPI Handover Discrepancy</h4>
                    <p className="font-inter text-xs text-on-surface-variant">Payment split error on protocol layer due to routing delay.</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Stake reward</span>
                    <span className="font-geist font-bold text-lg text-on-surface">15.00 XLM</span>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => toast.error('This dispute is awaiting evidence submission.')}
                    className="border border-outline bg-transparent text-outline rounded font-geist font-semibold px-4 py-2 text-xs cursor-not-allowed opacity-50"
                    disabled
                  >
                    Awaiting Evidence
                  </button>
                </div>
              </div>
            </div>

            {/* Right Rail cards */}
            <div className="flex flex-col gap-6">
              {/* Reward History Chart Card */}
              <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                <div>
                  <h4 className="font-geist font-semibold text-base text-on-surface">Reward History</h4>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-geist font-bold text-2xl text-secondary">182.5 XLM</span>
                    <span className="text-[10px] text-on-surface-variant font-geist uppercase font-semibold">YTD Earnings</span>
                  </div>
                </div>

                {/* SVG AreaChart mock */}
                <div className="h-28 w-full bg-surface-low rounded border border-outline-variant/30 relative flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#56febc" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#56febc" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,45 Q 20,35 40,25 T 80,10 T 100,5 L 100,50 L 0,50 Z"
                      fill="url(#chartGrad)"
                    />
                    <path
                      d="M 0,45 Q 20,35 40,25 T 80,10 T 100,5"
                      fill="none"
                      stroke="#006c4a"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="absolute bottom-1 right-2 text-[8px] font-mono text-on-surface-variant">Last 30 Days</span>
                </div>
              </div>

              {/* Slashing Notice Card */}
              <div className="bg-primary-container rounded-lg p-5 text-white flex flex-col gap-3">
                <div className="flex items-center gap-2 text-secondary-container">
                  <ShieldAlert size={16} />
                  <span className="font-geist font-semibold text-xs uppercase tracking-wider">Reputation & Slashing</span>
                </div>
                <p className="font-inter text-xs text-on-primary-container">
                  Arbiter nodes must maintain 50+ reputation. Voting against consensus or failing SLAs will slash stakes.
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 text-[11px] text-on-primary-container">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                    <span>Consensus match: +2 Reputation</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-on-primary-container">
                    <div className="w-1.5 h-1.5 rounded-full bg-error" />
                    <span>Consensus violation: -25 Stake slash</span>
                  </div>
                </div>
              </div>

              {/* Registration / Staking console for testing */}
              {!isEligible && (
                <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                  <h4 className="font-geist font-semibold text-sm text-on-surface">Become a Validator</h4>
                  <p className="font-inter text-xs text-on-surface-variant">Become an Arbiter by locking minimum 50 XLM stake on-chain.</p>
                  <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-on-surface-variant font-geist font-semibold uppercase">Stake (Stroops)</label>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={e => setStakeAmount(e.target.value)}
                        className="border border-outline-variant rounded bg-surface-lowest px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold py-2 text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isRegistering ? <Loader2 size={12} className="animate-spin" /> : 'Register & Lock Stake'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Bottom settlement mechanism visualization */}
          <div className="bg-surface-lowest border border-outline-variant rounded-xl p-8 flex flex-col gap-6 items-center">
            <h3 className="font-geist font-semibold text-xl text-on-surface text-center">Settlement Mechanism</h3>
            <p className="font-inter text-sm text-on-surface-variant text-center max-w-xl">
              Consensus votes resolve disputed escrows by executing a conditional payout split on-chain.
            </p>
            <div className="w-full max-w-2xl bg-surface-low rounded-lg p-6 border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="w-20 h-20 rounded-xl bg-primary-container flex flex-col items-center justify-center text-center">
                <span className="text-[9px] text-on-primary-container font-mono tracking-wider uppercase">Escrow</span>
                <span className="font-geist font-bold text-white text-xs mt-1">Splitter</span>
              </div>
              
              <div className="hidden md:block flex-1 max-w-[200px] h-12">
                <svg className="w-full h-full" viewBox="0 0 100 40">
                  <path d="M 0,20 Q 50,5 100,5" fill="none" stroke="#006c4a" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 0,20 H 100" fill="none" stroke="#006c4a" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 0,20 Q 50,35 100,35" fill="none" stroke="#006c4a" strokeWidth="1.5" strokeDasharray="3,3" />
                </svg>
              </div>

              <div className="flex flex-col gap-2 w-48 text-xs font-geist">
                <div className="flex justify-between p-2 bg-surface-lowest border border-secondary rounded">
                  <span>Seller (Release)</span>
                  <span className="font-semibold text-secondary">95.0%</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-lowest border border-secondary rounded">
                  <span>Logistics Pool</span>
                  <span className="font-semibold text-secondary">2.5%</span>
                </div>
                <div className="flex justify-between p-2 bg-surface-lowest border border-secondary rounded">
                  <span>Protocol Pool</span>
                  <span className="font-semibold text-secondary">2.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= TAB 2: DISPUTE CASE DETAIL ================= */
        <div className="flex flex-col gap-6">
          {/* Header row with Case ID, timer countdown */}
          <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="font-geist font-bold text-2xl text-on-surface">Case #ONDC-401</span>
              <StatusPill status="voting_open" />
            </div>
            
            <div className="flex items-center gap-2 text-on-surface">
              <Clock size={16} className="text-secondary" />
              <span className="font-inter text-xs text-on-surface-variant">Time Remaining:</span>
              <span className="font-mono text-lg font-bold text-on-surface">{timeLeft}</span>
            </div>
          </div>

          {/* Grid: Case Details & Cast Vote Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Evidence Locker (Level 3 Urgency border) */}
            <div className="lg:col-span-2 bg-surface-lowest border-2 border-[#FFB800] rounded-lg p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                <h3 className="font-geist font-semibold card-title-size text-on-surface flex items-center gap-2">
                  <Folder size={18} className="text-[#ac7b00]" /> Evidence Locker
                </h3>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  TX Ref: 7c4cf4a...9f399
                </span>
              </div>

              {/* Sub-cards row: GPS logs (left) + Claim detail (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GPS Terminal */}
                <div className="bg-surface-low border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-geist font-medium">
                    <Terminal size={14} /> GPS Ledger Logs
                  </div>
                  <div className="bg-[#0e1b34] text-secondary-container font-mono text-[11px] p-3 rounded flex flex-col gap-1 min-h-[100px]">
                    <span>$ query --escrow-gps</span>
                    <span className="text-white/60">[LOG] Dest: 28.7041, 77.1025</span>
                    <span className="text-white/60">[LOG] Handover Lat: 28.7041010</span>
                    <span className="text-white/60">[LOG] Handover Lon: 77.1025010</span>
                    <span className="text-secondary-container font-semibold mt-1">Status: Within 5m of Geofence</span>
                  </div>
                  <div className="flex flex-col gap-1 text-[11px] text-on-surface-variant font-inter mt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-secondary" />
                      <span>Route timeline verified</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-secondary" />
                      <span>Dwell threshold passed</span>
                    </div>
                  </div>
                </div>

                {/* Buyer's Claim */}
                <div className="bg-surface-low border border-outline-variant rounded-lg p-4 flex flex-col justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Claim Type</span>
                    <span className="font-geist font-bold text-error text-sm uppercase">Non-Delivery</span>
                  </div>
                  <p className="font-inter text-xs text-on-surface italic my-2">
                    "I stayed home all afternoon. The rider marked it delivered without showing up. Payout must be refunded."
                  </p>
                  <div className="flex flex-col gap-1 border-t border-outline-variant/10 pt-2">
                    <span className="font-geist text-[9px] text-on-surface-variant font-semibold uppercase">Disputed Contract</span>
                    <BlockchainString value={DISPUTE_REGISTRY} truncate={true} copyable={true} />
                  </div>
                </div>
              </div>

              {/* Photo Evidence Gallery */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-on-surface font-geist font-semibold">
                  <Image size={16} /> Photo Evidence Gallery
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* Photo 1 */}
                  <div className="h-20 bg-surface-low border border-outline-variant rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=150&auto=format&fit=crop")' }} />
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white font-mono text-[8px] px-1 rounded">14:02:11</span>
                  </div>
                  {/* Photo 2 */}
                  <div className="h-20 bg-surface-low border border-outline-variant rounded-lg overflow-hidden relative flex items-center justify-center">
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop")' }} />
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white font-mono text-[8px] px-1 rounded">14:03:04</span>
                  </div>
                  {/* Empty Upload Slot */}
                  <div className="h-20 border border-dashed border-outline-variant hover:border-outline rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-low/50">
                    <span className="text-[10px] text-on-surface-variant font-geist font-semibold">+ Add photo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Rail: Validator Pool & Vote Casting Panel */}
            <div className="flex flex-col gap-6">
              {/* Validator Pool Votes */}
              <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                <h4 className="font-geist font-semibold text-sm text-on-surface border-b border-outline-variant/10 pb-2">
                  Validator Pool Status
                </h4>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-geist">Release to Seller</span>
                  <span className="font-mono text-secondary font-semibold">2 / 3 Votes (66%)</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[66%]" />
                </div>

                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="font-geist">Refund Buyer</span>
                  <span className="font-mono text-error font-semibold">1 / 3 Votes (33%)</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-error w-[33%]" />
                </div>

                <div className="bg-surface-container rounded-lg p-3 text-[10px] text-on-surface-variant font-inter mt-1 leading-relaxed">
                  Consensus Rule: Disputes are finalized when 3 concurrent votes align on a release or refund state.
                </div>
              </div>

              {/* Cast Your Vote Panel */}
              <div className="bg-surface-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-4">
                <h4 className="font-geist font-semibold text-sm text-on-surface border-b border-outline-variant/10 pb-2">
                  Cast Your Vote
                </h4>
                <p className="font-inter text-xs text-on-surface-variant">Review coordinates and timestamps above. Cast your node vote below.</p>
                
                <div className="flex flex-col gap-2">
                  {/* Option 1: Release */}
                  <div 
                    onClick={() => setVoteForBuyer(false)}
                    className={`border rounded-lg p-3 cursor-pointer flex justify-between items-center transition-all ${
                      voteForBuyer === false
                        ? 'border-2 border-secondary bg-surface-low'
                        : 'border-outline-variant hover:border-outline'
                    }`}
                  >
                    <span className="font-geist text-xs font-semibold text-on-surface">Release to Seller</span>
                    {voteForBuyer === false && <CheckCircle2 size={16} className="text-secondary" />}
                  </div>

                  {/* Option 2: Refund */}
                  <div 
                    onClick={() => setVoteForBuyer(true)}
                    className={`border rounded-lg p-3 cursor-pointer flex justify-between items-center transition-all ${
                      voteForBuyer === true
                        ? 'border-2 border-error bg-surface-low'
                        : 'border-outline-variant hover:border-outline'
                    }`}
                  >
                    <span className="font-geist text-xs font-semibold text-on-surface">Refund Buyer</span>
                    {voteForBuyer === true && <CheckCircle2 size={16} className="text-error" />}
                  </div>
                </div>

                <form onSubmit={handleVote} className="flex flex-col gap-3 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-on-surface-variant font-geist font-semibold uppercase">Active Dispute ID</label>
                    <input
                      type="number"
                      value={disputeId}
                      onChange={e => setDisputeId(e.target.value)}
                      className="border border-outline-variant rounded bg-surface-lowest px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVoting || !isEligible || voteForBuyer === null}
                    className="bg-primary text-white hover:bg-primary/90 rounded font-geist font-semibold py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {isVoting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Casting Vote...
                      </>
                    ) : (
                      'Confirm On-Chain Vote'
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 text-[9px] text-on-surface-variant font-inter mt-1 leading-normal">
                    <Lock size={10} />
                    <span>Transaction requires Ledger consensus key signature.</span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
