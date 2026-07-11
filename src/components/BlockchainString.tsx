import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface BlockchainStringProps {
  value: string;
  truncate?: boolean;
  copyable?: boolean;
}

export const BlockchainString: React.FC<BlockchainStringProps> = ({
  value,
  truncate = true,
  copyable = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const displayValue = truncate
    ? `${value.slice(0, 4)}...${value.slice(-4)}`
    : value;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 font-mono group relative">
      <span className="select-all" title={value}>{displayValue}</span>
      {copyable && (
        <span className="relative inline-flex items-center">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 outline-none"
            title="Copy to clipboard"
          >
            {copied ? <Check size={14} className="text-secondary" /> : <Copy size={14} />}
          </button>
          {copied && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-primary-container text-white text-[10px] rounded pointer-events-none whitespace-nowrap z-50 font-geist">
              Copied!
            </span>
          )}
        </span>
      )}
    </span>
  );
};
