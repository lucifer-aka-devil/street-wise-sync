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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-muted-foreground ml-1">{stat.suffix}</span>}
                </div>
                {stat.trend !== undefined && stat.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(stat.trend)}
                  </div>
                )}
                {stat.badge && (
                  <Badge 
                    variant={stat.badge === 'High' ? 'destructive' : stat.badge === 'Medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

QuickStats.displayName = 'QuickStats';

export default QuickStats;