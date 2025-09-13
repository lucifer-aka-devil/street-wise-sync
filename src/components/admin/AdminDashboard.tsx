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
    
    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Monitor and analyze complaints</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 py-2">Reports</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-2 py-2">Users</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Departments</span>
            <span className="sm:hidden">Dept</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <QuickStats {...stats} />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Status Pie */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Reports by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie 
                          data={statusStats} 
                          dataKey="value" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80}
                          label={(entry) => window.innerWidth > 640 ? entry.name : ''}
                        >
                          {statusStats.map((e, i) => (<Cell key={i} fill={e.color} />))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Bar */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Reports by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* New Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Trend Line */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Complaint Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={trendStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Priority Bar */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Reports by Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={priorityStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Resolution Time */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">Average Resolution Time by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={resolutionStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
                        tick={{ fontSize: 12 }}
                      />
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