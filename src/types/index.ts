export type AssetStatus = 'Active' | 'In Maintenance' | 'Retired' | 'Pending Repair';
export type WorkOrderStatus = 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  location: string;
  quantity: number;
  status: AssetStatus;
  lastMaintained?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assignedTo: string;
  priority: PriorityLevel;
  status: WorkOrderStatus;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
}
