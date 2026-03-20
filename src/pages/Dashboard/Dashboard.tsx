
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Package, AlertTriangle, Hammer, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const metrics = [
    { title: 'Total Assets', value: '1,204', icon: Package, color: 'text-blue-500' },
    { title: 'Needs Attention', value: '23', icon: AlertTriangle, color: 'text-yellow-500' },
    { title: 'Active Work Orders', value: '45', icon: Hammer, color: 'text-purple-500' },
    { title: 'Completed Today', value: '12', icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
              <div className={`p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 ${metric.color}`}>
                <metric.icon className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Maintenance Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-4 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      HVAC Filter Replacement
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Asset INV-00{i} • Completed by John Doe • 2 hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Conveyor Belt Motor (Type B)
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      Only 1 in stock (Minimum: 3)
                    </p>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                    Order More
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
