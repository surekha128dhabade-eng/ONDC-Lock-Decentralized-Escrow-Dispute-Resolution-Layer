import React from 'react';

export type StatusType = 'released' | 'disputed' | 'funded' | 'pending' | 'refunded' | 'settled' | 'voting_open';

interface StatusPillProps {
  status: StatusType;
  label?: string;
  children?: React.ReactNode;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label, children }) => {
  let classes = 'rounded-full text-xs font-inter font-semibold px-3 py-1 inline-flex items-center gap-1.5 w-max';
  let defaultLabel = status.replace('_', ' ');

  switch (status) {
    case 'released':
    case 'settled':
      classes += ' bg-secondary-container text-on-secondary-container';
      defaultLabel = status === 'released' ? 'Released' : 'Settled';
      break;
    case 'disputed':
    case 'voting_open':
      classes += ' bg-[#FFB800]/15 text-[#ac7b00] border border-[#FFB800]';
      defaultLabel = status === 'disputed' ? 'Disputed' : 'Voting Open';
      break;
    case 'funded':
      classes += ' bg-inverse-primary/20 text-primary-container';
      defaultLabel = 'Active / Funded';
      break;
    case 'refunded':
      classes += ' bg-error-container text-on-error-container';
      defaultLabel = 'Refunded';
      break;
    case 'pending':
    default:
      classes += ' bg-surface-high text-on-surface-variant';
      defaultLabel = 'Pending';
      break;
  }

  return (
    <span className={classes}>
      {children || label || defaultLabel}
    </span>
  );
};
