import React from 'react';
import { cn } from '../../lib/utils';
import { AssetStatus, WorkOrderStatus, PriorityLevel } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AssetStatus | WorkOrderStatus | PriorityLevel | 'default';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  let variantStyles = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

  switch (variant) {
    case 'Active':
    case 'Completed':
    case 'Low':
      variantStyles = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      break;
    case 'In Maintenance':
    case 'In Progress':
    case 'Medium':
      variantStyles = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      break;
    case 'Pending Repair':
    case 'On Hold':
    case 'High':
      variantStyles = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      break;
    case 'Retired':
    case 'Cancelled':
    case 'Critical':
      variantStyles = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      break;
    case 'Open':
      variantStyles = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      break;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
