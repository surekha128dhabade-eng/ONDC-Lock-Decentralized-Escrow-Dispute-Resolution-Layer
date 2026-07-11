import React, { useState } from 'react';
import { useFreighter } from '../context/FreighterContext';
import { invokeContract } from '../utils/soroban';
import { Shield, Package, CheckCircle, Loader2, XCircle } from 'lucide-react';

const CONTRACT_ID = import.meta.env.VITE_ORDER_ESCROW_CONTRACT || '';

type ErrorType = 'wallet' | 'balance' | 'contract' | null;

export const EscrowDashboard: React.FC = () => {
  const { pubKey, signTx } = useFreighter();
  
  const [buyer, setBuyer] = useState('');
  const [seller, setSeller] = useState('');
  const [rider, setRider] = useState('');
  const [otp, setOtp] = useState('');
  const [amount, setAmount] = useState('1000'); // Stroops
  
  const [proofOtp, setProofOtp] = useState('');

  const [status, setStatus] = useState<'idle' | 'building' | 'simulating' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleError = (err: any) => {
    setStatus('error');
    console.error(err);
    
    if (!pubKey) {
      setErrorType('wallet');
      setErrorMsg('Wallet not connected.');
      return;
    }
    
    const msg = err.message || '';
    
    if (msg.includes('Simulation failed')) {
      if (msg.includes('balance') || msg.includes('insufficient')) {
        setErrorType('balance');
        setErrorMsg('Insufficient XLM balance for transaction fees.');
      } else {
        setErrorType('contract');
        setErrorMsg(`Contract reverted: ${msg}`);
      }
    } else {
      setErrorType('contract');
      setErrorMsg(msg || 'An unknown error occurred.');
    }
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      handleError(new Error('Wallet not connected'));
      return;
    }
    
    setStatus('building');
    setErrorType(null);
    setErrorMsg(null);
    setTxHash(null);

    try {
      setStatus('simulating');
      // args: buyer, seller, rider, otp_hash, amount
      const args = [buyer, seller, rider, otp, Number(amount)];
      
      setStatus('signing');
      const result = await invokeContract(CONTRACT_ID, 'initialize', args, pubKey, signTx);
      
      setStatus('success');
      setTxHash(result.hash);
      
    } catch (err) {
      handleError(err);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubKey) {
      handleError(new Error('Wallet not connected'));
      return;
    }

    setStatus('building');
    setErrorType(null);
    setErrorMsg(null);
    setTxHash(null);

    try {
      setStatus('simulating');
      // args: rider, otp
      const args = [pubKey, proofOtp]; // Rider is the one submitting the proof
      
      setStatus('signing');
      const result = await invokeContract(CONTRACT_ID, 'submit_proof', args, pubKey, signTx);
      
      setStatus('success');
      setTxHash(result.hash);
      
    } catch (err) {
      handleError(err);
    }
  };

  if (!CONTRACT_ID) {
    return (
      <div className="alert warning mt-4">
        Contract ID not found in environment variables. Please deploy the contract first.
      </div>
    );
  }

  return (
    <div className="escrow-dashboard glass-panel mt-4">
      <h3 className="section-title">Escrow Management</h3>

      {/* Error Displays */}
      {status === 'error' && errorType === 'wallet' && (
        <div className="alert error mb-4">
          <XCircle size={18} /> <strong>Wallet Error:</strong> {errorMsg}
        </div>
      )}
      {status === 'error' && errorType === 'balance' && (
        <div className="alert warning mb-4">
          <XCircle size={18} /> <strong>Balance Error:</strong> {errorMsg}
        </div>
      )}
      {status === 'error' && errorType === 'contract' && (
        <div className="alert error mb-4">
          <XCircle size={18} /> <strong>Contract Revert:</strong> {errorMsg}
        </div>
      )}
      
      {/* Success Display */}
      {status === 'success' && txHash && (
        <div className="alert success mb-4">
          <CheckCircle size={18} /> 
          <div>
            <strong>Transaction Successful!</strong>
            <p className="text-sm mt-1">
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="explorer-link">
                View on Stellar Expert
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {status !== 'idle' && status !== 'success' && status !== 'error' && (
        <div className="alert mb-4 flex items-center gap-2">
          <Loader2 className="spinner" size={18} />
          <span>Status: {status.charAt(0).toUpperCase() + status.slice(1)}...</span>
        </div>
      )}

      <div className="grid-2col">
        {/* Initialize Escrow Form */}
        <div className="form-card">
          <h4 className="flex items-center gap-2 mb-4"><Shield size={18} className="text-primary"/> Create Escrow</h4>
          <form onSubmit={handleInitialize}>
            <div className="form-group">
              <label>Buyer Address</label>
              <input type="text" value={buyer} onChange={e => setBuyer(e.target.value)} required className="input-field" placeholder="G..." />
            </div>
            <div className="form-group">
              <label>Seller Address</label>
              <input type="text" value={seller} onChange={e => setSeller(e.target.value)} required className="input-field" placeholder="G..." />
            </div>
            <div className="form-group">
              <label>Rider Address</label>
              <input type="text" value={rider} onChange={e => setRider(e.target.value)} required className="input-field" placeholder="G..." />
            </div>
            <div className="form-group">
              <label>OTP (Secret Code)</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required className="input-field" placeholder="e.g. 1234" />
            </div>
            <div className="form-group">
              <label>Amount (Stroops)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={status !== 'idle' && status !== 'success' && status !== 'error'}>
              Initialize Escrow
            </button>
          </form>
        </div>

        {/* Submit Proof Form */}
        <div className="form-card">
          <h4 className="flex items-center gap-2 mb-4"><Package size={18} className="text-primary"/> Submit Delivery Proof</h4>
          <p className="text-sm text-secondary mb-4">You must be logged in as the Rider to submit proof and release payout.</p>
          <form onSubmit={handleSubmitProof}>
            <div className="form-group">
              <label>OTP Provided by Buyer</label>
              <input type="text" value={proofOtp} onChange={e => setProofOtp(e.target.value)} required className="input-field" placeholder="e.g. 1234" />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={status !== 'idle' && status !== 'success' && status !== 'error'}>
              Submit Proof
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
