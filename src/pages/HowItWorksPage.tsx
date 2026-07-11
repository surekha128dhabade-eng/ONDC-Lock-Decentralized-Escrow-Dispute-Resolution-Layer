import React from 'react';
import { HelpCircle, Shield, Truck, Gavel, ArrowRight, Info } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-geist font-semibold text-3xl text-on-surface">How It Works & User Guide</h2>
        <p className="font-inter text-sm text-on-surface-variant mt-1">Learn about ONDC-Lock's decentralized escrow architecture and step-by-step transaction flow.</p>
      </div>

      {/* Core Concept Banner */}
      <div className="bg-primary-container rounded-lg p-6 text-white flex flex-col gap-3">
        <div className="flex items-center gap-2 text-secondary-container">
          <Shield size={20} />
          <h3 className="font-geist font-semibold text-base uppercase tracking-wider">The Decentralized Settlement Layer</h3>
        </div>
        <p className="font-inter text-sm text-on-primary-container leading-relaxed">
          ONDC-Lock solves ONDC's payment settlement problems (like cash-on-delivery risks, delayed seller payouts, and rider trust issues) by implementing **dynamic sandboxed escrows on Stellar Testnet**. Each delivery order gets its own automated contract that releases funds instantly when delivery is mathematically proven on-chain.
        </p>
      </div>

      {/* Interactive Flow Visualizer */}
      <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-6">
        <h3 className="font-geist font-semibold card-title-size text-on-surface border-b border-outline-variant/10 pb-3 flex items-center gap-2">
          <HelpCircle size={18} className="text-secondary" /> Payout Lifecycle Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center p-4 bg-surface-low border border-outline-variant/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-geist font-bold text-sm">1</div>
            <span className="font-geist font-semibold text-sm text-on-surface mt-3">Deploy & Fund</span>
            <span className="font-inter text-[11px] text-on-surface-variant mt-1">Buyer locks order XLM via Factory</span>
          </div>

          <div className="hidden md:flex justify-center text-outline"><ArrowRight size={20} /></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center p-4 bg-surface-low border border-outline-variant/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-geist font-bold text-sm">2</div>
            <span className="font-geist font-semibold text-sm text-on-surface mt-3">Handover & Proof</span>
            <span className="font-inter text-[11px] text-on-surface-variant mt-1">Rider submits OTP & GPS coordinates</span>
          </div>

          <div className="hidden md:flex justify-center text-outline"><ArrowRight size={20} /></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center p-4 bg-surface-low border border-outline-variant/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-geist font-bold text-sm">3</div>
            <span className="font-geist font-semibold text-sm text-on-surface mt-3">GPS Check</span>
            <span className="font-inter text-[11px] text-on-surface-variant mt-1">On-chain Haversine verifies &lt;50m geofence</span>
          </div>

          <div className="hidden md:flex justify-center text-outline"><ArrowRight size={20} /></div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center p-4 bg-secondary-container text-on-secondary-container border border-secondary/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-geist font-bold text-sm">✓</div>
            <span className="font-geist font-bold text-sm mt-3">Atomic Split</span>
            <span className="font-inter text-[11px] mt-1">Payout released to Seller, Logistics, Fees</span>
          </div>
        </div>
      </div>

      {/* Role-based User Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buyer Guide */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <div className="flex items-center gap-2 text-secondary">
            <Shield size={18} />
            <h4 className="font-geist font-semibold text-sm">Buyer Guide</h4>
          </div>
          <ul className="flex flex-col gap-2.5 text-xs text-on-surface-variant font-inter list-none">
            <li className="flex gap-2">
              <span className="text-secondary font-bold">1.</span>
              <span>Connect your Freighter/Albedo wallet on Stellar Testnet.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">2.</span>
              <span>Enter the Seller address, Rider address, and your order amount in Stroops (1 XLM = 10,000,000 Stroops).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">3.</span>
              <span>Set your Delivery Coordinates and enter a 4-digit OTP. Keep this OTP secure and share it with the Rider *only* upon physical handover.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">4.</span>
              <span>Click **Deploy & Initialize Escrow** to lock the funds. Copy the generated Contract ID to share with the Rider.</span>
            </li>
          </ul>
        </div>

        {/* Rider Guide */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <div className="flex items-center gap-2 text-secondary">
            <Truck size={18} />
            <h4 className="font-geist font-semibold text-sm">Rider Guide</h4>
          </div>
          <ul className="flex flex-col gap-2.5 text-xs text-on-surface-variant font-inter list-none">
            <li className="flex gap-2">
              <span className="text-secondary font-bold">1.</span>
              <span>Input the **Escrow Contract ID** shared by the Buyer and click **Fetch State** to check details.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">2.</span>
              <span>Arrive at the delivery location and ask the Buyer for the Handover OTP.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">3.</span>
              <span>Input the OTP and your current GPS coordinates ( Delhi standard coordinates are pre-filled close to target Delhi destination).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">4.</span>
              <span>Click **Submit Handover OTP**. The contract runs a GPS check. If it matches, funds are split atomically on-chain.</span>
            </li>
          </ul>
        </div>

        {/* Validator Guide */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <div className="flex items-center gap-2 text-secondary">
            <Gavel size={18} />
            <h4 className="font-geist font-semibold text-sm">Validator Guide</h4>
          </div>
          <ul className="flex flex-col gap-2.5 text-xs text-on-surface-variant font-inter list-none">
            <li className="flex gap-2">
              <span className="text-secondary font-bold">1.</span>
              <span>Stake testnet XLM via the **Validator Dashboard** to become an active Arbiter node.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">2.</span>
              <span>Go to the **Dispute Active Queue** to find disputed escrows (where delivery Handover failed or was coordinates out-of-tolerance).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">3.</span>
              <span>Review the **Evidence Locker** containing GPS coordinates ledger logs, buyer's claim text, and photo gallery uploads.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary font-bold">4.</span>
              <span>Select "Release to Seller" or "Refund Buyer" and click **Confirm On-Chain Vote**. 3 aligning votes resolves the dispute.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Security Info notice */}
      <div className="bg-surface-lowest border border-outline-variant rounded-lg p-4 flex gap-3">
        <Info className="text-on-surface-variant shrink-0" size={20} />
        <div className="flex flex-col">
          <span className="font-geist font-semibold text-sm text-on-surface">Stellar Ledger Guarantees</span>
          <span className="font-inter text-xs text-on-surface-variant mt-0.5">
            Since every transaction is finalized directly on the decentralized Stellar Testnet ledger, payment execution is fully trustless. Your locked XLM is either released to the participants automatically when coordinates verify, or refunded securely by consensus validators.
          </span>
        </div>
      </div>
    </div>
  );
};
