import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface QuickStatsProps {
  totalReports: number;
  submittedReports: number;
  inProgressReports: number;
  resolvedReports: number;
  totalUsers: number;
  avgResolutionTime: number;
  previousData?: {
    totalReports: number;
    resolvedReports: number;
  };
}

const QuickStats = memo(({ 
  totalReports,
  submittedReports,
  inProgressReports, 
  resolvedReports,
  totalUsers,
  avgResolutionTime,
  previousData
}: QuickStatsProps) => {
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
  const pendingReports = submittedReports + inProgressReports;
  
  const reportsTrend = previousData 
    ? totalReports - previousData.totalReports
    : 0;
    
  const resolutionTrend = previousData 
    ? resolvedReports - previousData.resolvedReports 
    : 0;

  const stats = [
    {
      title: 'Total Reports',
      value: totalReports,
      icon: FileText,
      trend: reportsTrend,
      color: 'text-primary'
    },
    {
      title: 'Pending Reports',
      value: pendingReports,
      icon: Clock,
      color: pendingReports > 10 ? 'text-orange-600' : 'text-yellow-600',
      badge: pendingReports > 10 ? 'High' : pendingReports > 5 ? 'Medium' : 'Low'
    },
    {
      title: 'Resolved Reports',
      value: resolvedReports,
      icon: CheckCircle,
      trend: resolutionTrend,
      color: 'text-green-600'
    },
    {
      title: 'Active Citizens',
      value: totalUsers,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Avg Resolution Time',
      value: avgResolutionTime,
      icon: AlertTriangle,
      suffix: 'days',
      color: avgResolutionTime > 7 ? 'text-red-600' : 'text-green-600'
    },
    {
      title: 'Resolution Rate',
      value: resolutionRate,
      icon: TrendingUp,
      suffix: '%',
      color: resolutionRate > 80 ? 'text-green-600' : resolutionRate > 60 ? 'text-yellow-600' : 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Total Reports</CardTitle>
          <div className="p-2 bg-blue-500 rounded-lg">
            <FileText className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800 mb-2">{totalReports}</div>
          <div className="flex items-center gap-1">
            <div className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +{reportsTrend}
            </div>
            <p className="text-xs text-slate-600">from last month</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Pending Reports</CardTitle>
          <div className="p-2 bg-orange-500 rounded-lg">
            <Clock className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800 mb-2">{pendingReports}</div>
          <Badge 
            className={`${
              pendingReports > 10 
                ? "bg-red-100 text-red-700 hover:bg-red-200" 
                : "bg-green-100 text-green-700 hover:bg-green-200"
            } font-medium`}
          >
            {pendingReports > 10 ? "High Priority" : "Normal Level"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Resolved Reports</CardTitle>
          <div className="p-2 bg-green-500 rounded-lg">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800 mb-2">{resolvedReports}</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: `${totalReports > 0 
                    ? Math.round((resolvedReports / totalReports) * 100)
                    : 0}%` 
                }}
              />
            </div>
            <p className="text-xs font-medium text-slate-600">
              {totalReports > 0 
                ? Math.round((resolvedReports / totalReports) * 100)
                : 0}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">Active Users</CardTitle>
          <div className="p-2 bg-purple-500 rounded-lg">
            <Users className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800 mb-2">{totalUsers}</div>
          <div className="flex items-center gap-1">
            <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              +0
            </div>
            <p className="text-xs text-slate-600">new this month</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

export default QuickStats;