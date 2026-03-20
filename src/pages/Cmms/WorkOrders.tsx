import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { mockWorkOrders } from '../../services/mockData';
import { Plus, Filter, FileText } from 'lucide-react';

export function WorkOrders() {
  const [orders] = useState(mockWorkOrders);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Work Orders
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and manage preventive and corrective maintenance tasks.
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-10 px-4 py-2 text-gray-700 dark:text-gray-300">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
            <Plus className="mr-2 h-4 w-4" /> New Work Order
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Asset ID</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Due Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono text-xs text-blue-600 dark:text-blue-400">
                    {order.id}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={order.title}>
                    {order.title}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                    {order.assetId}
                  </TableCell>
                  <TableCell>{order.assignedTo}</TableCell>
                  <TableCell>
                    <Badge variant={order.priority}>{order.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.dueDate}
                  </TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500">
                      <FileText className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
