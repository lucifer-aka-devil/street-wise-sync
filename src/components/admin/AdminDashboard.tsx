import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import ReportManagement from './ReportManagement';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import DepartmentManagement from './DepartmentManagement';
import QuickStats from './QuickStats';

interface DashboardStats {
  totalReports: number;
  submittedReports: number;
  inProgressReports: number;
  resolvedReports: number;
  totalUsers: number;
  avgResolutionTime: number;
}

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export default function AdminDashboard() {
  const { isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    submittedReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    avgResolutionTime: 0,
  });

  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [statusStats, setStatusStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();

    // Set up real-time subscription for dashboard updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch report counts by status
      const { data: reportStats } = await supabase
        .from('reports')
        .select('status, created_at, resolved_at');

      // Fetch user count
      const { data: userStats } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'citizen');

      // Fetch category stats
      const { data: categories } = await supabase
        .from('reports')
        .select(`
          categories (name, color),
          id
        `);

      if (reportStats) {
        const submitted = reportStats.filter(r => r.status === 'submitted').length;
        const acknowledged = reportStats.filter(r => r.status === 'acknowledged').length;
        const inProgress = reportStats.filter(r => r.status === 'in_progress').length;
        const resolved = reportStats.filter(r => r.status === 'resolved').length;
        const rejected = reportStats.filter(r => r.status === 'rejected').length;

        setStats({
          totalReports: reportStats.length,
          submittedReports: submitted,
          inProgressReports: inProgress,
          resolvedReports: resolved,
          totalUsers: userStats?.length || 0,
          avgResolutionTime: calculateAvgResolutionTime(reportStats),
        });

        // Prepare status chart data
        setStatusStats([
          { name: 'Submitted', value: submitted, color: '#3B82F6' },
          { name: 'Acknowledged', value: acknowledged, color: '#F59E0B' },
          { name: 'In Progress', value: inProgress, color: '#10B981' },
          { name: 'Resolved', value: resolved, color: '#059669' },
          { name: 'Rejected', value: rejected, color: '#EF4444' },
        ]);
      }

      // Prepare category chart data
      if (categories) {
        const categoryCount: Record<string, number> = {};
        categories.forEach((report: any) => {
          const categoryName = report.categories?.name || 'Unknown';
          categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
        });

        const categoryData = Object.entries(categoryCount).map(([name, count]) => ({
          name,
          count,
        }));

        setCategoryStats(categoryData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  }, []);

  const calculateAvgResolutionTime = (reports: any[]) => {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolved_at);
    if (resolvedReports.length === 0) return 0;

    const totalTime = resolvedReports.reduce((acc, report) => {
      const created = new Date(report.created_at).getTime();
      const resolved = new Date(report.resolved_at).getTime();
      return acc + (resolved - created);
    }, 0);

    return Math.round(totalTime / resolvedReports.length / (1000 * 60 * 60 * 24)); // Days
  };

  if (!isStaff) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage reports, users, and monitor civic engagement
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              <QuickStats
                totalReports={stats.totalReports}
                submittedReports={stats.submittedReports}
                inProgressReports={stats.inProgressReports}
                resolvedReports={stats.resolvedReports}
                totalUsers={stats.totalUsers}
                avgResolutionTime={stats.avgResolutionTime}
              />

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reports by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportManagement />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <DepartmentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}