import React from 'react';
import { Balance } from '../components/Balance';
import { useSorobanEvents } from '../utils/useSorobanEvents';
import { BlockchainString } from '../components/BlockchainString';
import { Activity } from 'lucide-react';

const FACTORY_ID = import.meta.env.VITE_ESCROW_FACTORY || '';
const REGISTRY_ID = import.meta.env.VITE_PARTICIPANT_REGISTRY || '';

export const Home: React.FC = () => {
  const events = useSorobanEvents([FACTORY_ID, REGISTRY_ID].filter(Boolean));

  return (
    <div className="flex flex-col gap-8">
      {/* Hero section */}
      <div className="p-8 md:p-12 rounded-xl bg-primary-container text-white flex flex-col gap-3 relative overflow-hidden">
        <h2 className="font-geist font-bold text-3xl md:text-4xl tracking-tight leading-tight">
          Decentralized Settlement for ONDC
        </h2>
        <p className="font-inter text-sm md:text-base text-on-primary-container max-w-xl">
          ONDC-Lock provides secure, robust payment escrow, distance verification, and decentralized dispute resolution on the Stellar Network.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Balance />
        
        {/* Live Network Events Card */}
        <div className="bg-surface-lowest border border-outline-variant rounded-lg card-padding flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-3">
            <Activity size={18} className="text-secondary" />
            <h3 className="font-geist font-semibold card-title-size text-on-surface">Live Network Events</h3>
          </div>
          
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <p className="font-inter text-xs text-on-surface-variant italic py-4 text-center">
                Listening for events on Testnet...
              </p>
            ) : (
              events.map((e, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded bg-surface-low border border-outline-variant/20 hover:border-outline-variant/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Contract</span>
                    <BlockchainString value={e.contractId} truncate={true} copyable={true} />
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-geist text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Ledger</span>
                    <span className="font-mono text-xs text-secondary font-medium">{e.ledger}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
