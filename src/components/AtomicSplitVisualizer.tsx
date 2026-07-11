import React from 'react';

interface SplitRecipient {
  label: string;
  amount: string;
  currency: string;
}

interface AtomicSplitVisualizerProps {
  escrowAmount: string;
  splits: SplitRecipient[];
  status: 'pending' | 'settled';
}

export const AtomicSplitVisualizer: React.FC<AtomicSplitVisualizerProps> = ({
  escrowAmount,
  splits,
  status,
}) => {
  const isSettled = status === 'settled';

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-surface-lowest border border-outline-variant rounded-lg w-full relative overflow-hidden">
      {/* Center Escrow Node */}
      <div className="flex flex-col items-center justify-center z-10">
        <div className="w-20 h-20 rounded-xl bg-primary-container border border-outline-variant flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] text-on-primary-container font-mono tracking-wider uppercase">Escrow</span>
          <span className="font-geist font-bold text-white text-sm mt-1">{escrowAmount}</span>
        </div>
      </div>

      {/* SVG Connecting Lines */}
      <div className="hidden md:block absolute left-[80px] right-[240px] top-0 bottom-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="none">
          {/* Top Line to Seller */}
          <path
            d="M 10,60 Q 100,20 190,20"
            fill="none"
            stroke={isSettled ? '#006c4a' : '#c5c6ce'}
            strokeWidth="2"
            strokeDasharray={isSettled ? '0' : '5,5'}
            className={isSettled ? '' : 'animate-draw'}
            style={{ transition: 'stroke 0.5s ease' }}
          />
          {/* Middle Line to Logistics */}
          <path
            d="M 10,60 H 190"
            fill="none"
            stroke={isSettled ? '#006c4a' : '#c5c6ce'}
            strokeWidth="2"
            strokeDasharray={isSettled ? '0' : '5,5'}
            className={isSettled ? '' : 'animate-draw'}
            style={{ transition: 'stroke 0.5s ease' }}
          />
          {/* Bottom Line to Platform/Protocol */}
          <path
            d="M 10,60 Q 100,100 190,100"
            fill="none"
            stroke={isSettled ? '#006c4a' : '#c5c6ce'}
            strokeWidth="2"
            strokeDasharray={isSettled ? '0' : '5,5'}
            className={isSettled ? '' : 'animate-draw'}
            style={{ transition: 'stroke 0.5s ease' }}
          />
        </svg>
      </div>

      {/* Recipients List */}
      <div className="flex flex-col gap-3 w-full md:w-56 z-10">
        {splits.map((split, index) => (
          <div
            key={index}
            className={`border rounded-lg px-4 py-3 flex items-center justify-between bg-surface-lowest transition-all duration-300 ${
              isSettled ? 'border-secondary' : 'border-outline-variant'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider">{split.label}</span>
              <span className="font-geist font-semibold text-on-surface text-sm mt-0.5">
                {split.amount} {split.currency}
              </span>
            </div>
            <div
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                isSettled ? 'bg-secondary' : 'bg-outline-variant'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
