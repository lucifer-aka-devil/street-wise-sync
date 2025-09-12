import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import QuickStats from './QuickStats';
import ReportManagement from './ReportManagement';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import DepartmentManagement from './DepartmentManagement';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts';

export default function AdminDashboard() {
  const { isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    submittedReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    avgResolutionTime: 0,
  });

  const [statusStats, setStatusStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [priorityStats, setPriorityStats] = useState<any[]>([]);
  const [resolutionStats, setResolutionStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchDashboardStats();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data: reports } = await supabase.from('reports').select('status, created_at, resolved_at, priority, categories (name)');
      const { data: userStats } = await supabase.from('profiles').select('id').eq('role', 'citizen');

      if (!reports) return;

      const submitted = reports.filter(r => r.status === 'submitted').length;
      const acknowledged = reports.filter(r => r.status === 'acknowledged').length;
      const inProgress = reports.filter(r => r.status === 'in_progress').length;
      const resolved = reports.filter(r => r.status === 'resolved').length;
      const rejected = reports.filter(r => r.status === 'rejected').length;

      setStats({
        totalReports: reports.length,
        submittedReports: submitted,
        inProgressReports: inProgress,
        resolvedReports: resolved,
        totalUsers: userStats?.length || 0,
        avgResolutionTime: calculateAvgResolutionTime(reports),
      });

      setStatusStats([
        { name: 'Submitted', value: submitted, color: '#3B82F6' },
        { name: 'Acknowledged', value: acknowledged, color: '#F59E0B' },
        { name: 'In Progress', value: inProgress, color: '#10B981' },
        { name: 'Resolved', value: resolved, color: '#059669' },
        { name: 'Rejected', value: rejected, color: '#EF4444' },
      ]);

      // Reports by category
      const categoryCount: Record<string, number> = {};
      reports.forEach(r => {
        const categoryName = r.categories?.name || 'Unknown';
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      });
      setCategoryStats(Object.entries(categoryCount).map(([name, count]) => ({ name, count })));

      // Reports trend over time (daily)
      const dailyCount: Record<string, number> = {};
      reports.forEach(r => {
        const day = new Date(r.created_at).toLocaleDateString();
        dailyCount[day] = (dailyCount[day] || 0) + 1;
      });
      setTrendStats(Object.entries(dailyCount).map(([date, count]) => ({ date, count })));

      // Reports by priority
      const priorityCount: Record<string, number> = {};
      reports.forEach(r => {
        const priority = r.priority || 'Unspecified';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
      setPriorityStats(Object.entries(priorityCount).map(([priority, count]) => ({ priority, count })));

      // Avg resolution time by category
      const resolutionData: Record<string, number[]> = {};
      reports.forEach(r => {
        if (r.status === 'resolved' && r.resolved_at) {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at).getTime();
          const days = (resolved - created) / (1000 * 60 * 60 * 24);
          const cat = r.categories?.name || 'Unknown';
          if (!resolutionData[cat]) resolutionData[cat] = [];
          resolutionData[cat].push(days);
        }
      });
      setResolutionStats(
        Object.entries(resolutionData).map(([cat, times]) => ({
          category: cat,
          avgDays: times.reduce((a, b) => a + b, 0) / times.length,
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  }, []);

  const calculateAvgResolutionTime = (reports: any[]) => {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolved_at);
    if (resolvedReports.length === 0) return 0;
    const totalTime = resolvedReports.reduce((acc, r) => {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.resolved_at).getTime();
      return acc + (resolved - created);
    }, 0);
    return Math.round(totalTime / resolvedReports.length / (1000 * 60 * 60 * 24));
  };

  if (!isStaff) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Monitor and analyze complaints</p>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <QuickStats {...stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Pie */}
                <Card>
                  <CardHeader><CardTitle>Reports by Status</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={statusStats} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                          {statusStats.map((e, i) => (<Cell key={i} fill={e.color} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Bar */}
                <Card>
                  <CardHeader><CardTitle>Reports by Category</CardTitle></CardHeader>
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

              {/* New Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Line */}
                <Card>
                  <CardHeader><CardTitle>Complaint Trend Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10B981" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Priority Bar */}
                <Card>
                  <CardHeader><CardTitle>Reports by Priority</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={priorityStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Resolution Time */}
              <Card>
                <CardHeader><CardTitle>Average Resolution Time by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={resolutionStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="avgDays" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports"><ReportManagement /></TabsContent>
        <TabsContent value="users"><UserManagement /></TabsContent>
        <TabsContent value="categories"><CategoryManagement /></TabsContent>
        <TabsContent value="departments"><DepartmentManagement /></TabsContent>
      </Tabs>
    </div>
  );
}