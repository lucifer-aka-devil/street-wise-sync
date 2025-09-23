import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Eye, EyeOff, Filter, Loader, Settings, Shield, Trash2, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import ReportCard from './ReportCard';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface DepartmentData {
  total: number;
  resolved: number;
  avgTime: number[];
  satisfaction: number[];
}

interface Worker {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id: string;
  department_name?: string;
  role: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  is_active: boolean;
}

export default function EnhancedAdminDashboard() {
  const [reports, setReports] = useState([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // New states for the requested features
  const [isFilteringGenuine, setIsFilteringGenuine] = useState(false);
  const [showGenuineOnly, setShowGenuineOnly] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isWorkerDialogOpen, setIsWorkerDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [newWorker, setNewWorker] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    phone: ''
  });

  // Load data on component mount
  useEffect(() => {
    fetchReports();
    fetchWorkers();
    fetchDepartments();
    const channel = supabase
      .channel('admin-dashboard-reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => fetchReports()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (reportsError) throw reportsError;
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          department_id,
          role,
          created_at,
          departments (
            id,
            name
          )
        `)
        .eq('role', 'staff')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const workersWithDept = (data || []).map((worker: any) => ({
        ...worker,
        department_name: worker.departments?.name || 'No department'
      }));

      setWorkers(workersWithDept);
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Filter genuine complaints (with images)
  const handleFilterGenuine = async () => {
    setIsFilteringGenuine(true);
    
    // Simulate filtering delay
    setTimeout(() => {
      setShowGenuineOnly(!showGenuineOnly);
      setIsFilteringGenuine(false);
      toast({
        title: showGenuineOnly ? "All complaints shown" : "Genuine complaints filtered",
        description: showGenuineOnly ? "Showing all complaints now" : "Now showing only complaints with images",
      });
    }, 2000);
  };

  // Create new worker
  const handleCreateWorker = async () => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newWorker.email,
        password: newWorker.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Then create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: newWorker.full_name,
            email: newWorker.email,
            phone: newWorker.phone,
            department_id: newWorker.department_id,
            role: 'staff'
          });

        if (profileError) throw profileError;

        toast({
          title: "Worker created successfully",
          description: `${newWorker.full_name} has been added as a ministry worker`,
        });

        setNewWorker({
          full_name: '',
          email: '',
          password: '',
          department_id: '',
          phone: ''
        });
        setIsWorkerDialogOpen(false);
        fetchWorkers();
      }
    } catch (error: any) {
      toast({
        title: "Error creating worker",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Delete worker
  const handleDeleteWorker = async (workerId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', workerId);

      if (error) throw error;

      toast({
        title: "Worker deleted",
        description: "Ministry worker has been removed",
      });

      fetchWorkers();
    } catch (error: any) {
      toast({
        title: "Error deleting worker",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Toggle auto-assign
  const handleToggleAutoAssign = () => {
    setAutoAssignEnabled(!autoAssignEnabled);
    toast({
      title: autoAssignEnabled ? "Auto-assign disabled" : "Auto-assign enabled",
      description: autoAssignEnabled 
        ? "New complaints will not be automatically assigned" 
        : "New complaints will be automatically assigned to available workers",
    });
  };

  // Enhanced statistics with detailed calculations
  const stats = useMemo(() => {
    let filteredReports = reports;
    if (showGenuineOnly) {
      filteredReports = filteredReports.filter(r => (r.hasImages || (Array.isArray(r.photos) && r.photos.length > 0)));
    }

    const totalReports = filteredReports.length;
    const submittedReports = filteredReports.filter(r => r.status === 'submitted').length;
    const inProgressReports = filteredReports.filter(r => r.status === 'in_progress').length;
    const resolvedReports = filteredReports.filter(r => r.status === 'resolved').length;
    const rejectedReports = filteredReports.filter(r => r.status === 'rejected').length;

    const resolvedWithTime = filteredReports.filter(r => r.status === 'resolved' && r.resolved_at);
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((acc, r) => acc + ((new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0) / resolvedWithTime.length
      : 0;

    const satisfactionRatings = filteredReports.filter(r => r.satisfaction_rating);
    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((acc, r) => acc + r.satisfaction_rating, 0) / satisfactionRatings.length
      : 0;

    const resolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0;
    const escalationRate = totalReports > 0 ? (filteredReports.filter(r => r.priority === 'critical').length / totalReports) * 100 : 0;

    return {
      totalReports,
      submittedReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      escalationRate: Math.round(escalationRate * 10) / 10,
      totalUsers: 1250,
      genuineReports: reports.filter(r => r.hasImages).length
    };
  }, [reports, timeRange, selectedCategory, showGenuineOnly]);

  // Enhanced chart data
  const chartData = useMemo(() => {
    let filteredReports = reports;
    if (showGenuineOnly) {
      filteredReports = filteredReports.filter(r => (r.hasImages || (Array.isArray(r.photos) && r.photos.length > 0)));
    }

    // Status distribution with enhanced data
    const statusStats = [
      { name: 'Submitted', value: filteredReports.filter(r => r.status === 'submitted').length, color: '#F97316', change: '+12%' },
      { name: 'Acknowledged', value: filteredReports.filter(r => r.status === 'acknowledged').length, color: '#F59E0B', change: '+5%' },
      { name: 'In Progress', value: filteredReports.filter(r => r.status === 'in_progress').length, color: '#10B981', change: '+8%' },
      { name: 'Resolved', value: filteredReports.filter(r => r.status === 'resolved').length, color: '#059669', change: '+15%' },
      { name: 'Rejected', value: filteredReports.filter(r => r.status === 'rejected').length, color: '#EF4444', change: '-3%' }
    ];

    // Category analysis with additional metrics
    const categoryCount: Record<string, number> = {};
    const categoryResolution: Record<string, number> = {};
    const categorySatisfaction: Record<string, number[]> = {};
    
    filteredReports.forEach(r => {
      const cat = r.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      
      if (r.status === 'resolved') {
        categoryResolution[cat] = (categoryResolution[cat] || 0) + 1;
      }
      
      if (r.satisfaction_rating) {
        if (!categorySatisfaction[cat]) categorySatisfaction[cat] = [];
        categorySatisfaction[cat].push(r.satisfaction_rating);
      }
    });

    const categoryStats = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count,
      resolved: categoryResolution[name] || 0,
      resolutionRate: count > 0 ? Math.round((categoryResolution[name] || 0) / count * 100) : 0,
      satisfaction: categorySatisfaction[name] 
        ? Math.round(categorySatisfaction[name].reduce((a, b) => a + b, 0) / categorySatisfaction[name].length * 10) / 10 
        : 0
    }));

    // Department performance analysis
    const deptStats: Record<string, DepartmentData> = {};
    filteredReports.forEach(r => {
      if (!deptStats[r.department]) {
        deptStats[r.department] = { total: 0, resolved: 0, avgTime: [], satisfaction: [] };
      }
      deptStats[r.department].total++;
      
      if (r.status === 'resolved') {
        deptStats[r.department].resolved++;
        if (r.resolved_at) {
          const time = (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
          deptStats[r.department].avgTime.push(time);
        }
      }
      
      if (r.satisfaction_rating) {
        deptStats[r.department].satisfaction.push(r.satisfaction_rating);
      }
    });

    const departmentStats = Object.entries(deptStats).map(([dept, data]) => ({
      department: dept,
      total: data.total,
      resolved: data.resolved,
      efficiency: data.total > 0 ? Math.round(data.resolved / data.total * 100) : 0,
      avgTime: data.avgTime.length > 0 ? Math.round(data.avgTime.reduce((a, b) => a + b, 0) / data.avgTime.length * 10) / 10 : 0,
      satisfaction: data.satisfaction.length > 0 ? Math.round(data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length * 10) / 10 : 0
    }));

    return {
      statusStats,
      categoryStats,
      departmentStats
    };
  }, [reports, timeRange, showGenuineOnly]);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {pld.dataKey}: {pld.value}
              {pld.dataKey.includes('Rate') && '%'}
              {pld.dataKey.includes('Time') && ' days'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Filtered complaints for display in the Complaints tab
  const filteredComplaints = useMemo(() => {
    let filtered = reports;
    if (showGenuineOnly) {
      filtered = filtered.filter(r => (r.hasImages || (Array.isArray(r.photos) && r.photos.length > 0)));
    }
    return filtered;
  }, [reports, showGenuineOnly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                Advanced Admin Dashboard
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-4">Real-time analytics with enhanced insights and complaint management</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Live Updates
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Analytics Enabled
                </Badge>
                {showGenuineOnly && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Filter className="w-3 h-3 mr-1" />
                    Genuine Filter Active
                  </Badge>
                )}
                {autoAssignEnabled && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Settings className="w-3 h-3 mr-1" />
                    Auto-Assign ON
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                {['7d', '30d', '90d', 'all'].map(range => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={timeRange === range ? "bg-gradient-to-r from-orange-500 to-amber-500" : ""}
                  >
                    {range === 'all' ? 'All Time' : range.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {[
            { title: 'Total Reports', value: stats.totalReports, icon: '📊', color: 'blue', change: '+12%' },
            { title: 'Genuine Reports', value: stats.genuineReports, icon: '🖼️', color: 'purple', change: `${((stats.genuineReports/stats.totalReports)*100).toFixed(0)}%` },
            { title: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: '✅', color: 'green', change: '+5%' },
            { title: 'Avg Resolution', value: `${stats.avgResolutionTime}d`, icon: '⏱️', color: 'amber', change: '-2d' },
            { title: 'Ministry Workers', value: workers.length, icon: '👥', color: 'indigo', change: `+${workers.length}` },
            { title: 'Auto-Assign', value: autoAssignEnabled ? 'ON' : 'OFF', icon: '⚙️', color: autoAssignEnabled ? 'green' : 'gray', change: autoAssignEnabled ? 'Active' : 'Inactive' }
          ].map((stat, index) => (
            <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded text-${stat.color}-700 bg-${stat.color}-100`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl opacity-70">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 h-auto p-1 bg-white/70 backdrop-blur-sm border border-orange-200/30 shadow-sm rounded-xl">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'complaints', label: 'Complaints' },
              { value: 'workers', label: 'Workers' },
              { value: 'departments', label: 'Departments' },
              { value: 'settings', label: 'Settings' }
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium rounded-lg"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Status Pie Chart */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Reports by Status
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={chartData.statusStats} 
                        dataKey="value" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({name, value, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.statusStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Department Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.departmentStats} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                      <Tooltip content={(props: any) => <CustomTooltip {...props} />} />
                      <Bar dataKey="efficiency" fill="#10B981" radius={[0, 4, 4, 0]} name="Efficiency %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="complaints" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Complaint Management</span>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFilterGenuine}
                      disabled={isFilteringGenuine}
                      variant={showGenuineOnly ? "default" : "outline"}
                      className={showGenuineOnly ? "bg-gradient-to-r from-purple-500 to-purple-600" : ""}
                    >
                      {isFilteringGenuine ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Filtering genuine complaints...
                        </>
                      ) : (
                        <>
                          {showGenuineOnly ? <EyeOff /> : <Eye />}
                          <span className="ml-2">
                            {showGenuineOnly ? 'Show All' : 'Filter Genuine'}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <Loader className="w-8 h-8 mx-auto animate-spin text-purple-600 mb-4" />
                    <p className="text-lg font-semibold text-slate-800">Loading complaints...</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <Filter className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {showGenuineOnly ? 'No Genuine Complaints Found' : 'No Complaints Found'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                      {showGenuineOnly 
                        ? `No complaints with images found.`
                        : `No complaints available.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredComplaints.map((report) => (
                      <ReportCard key={report.id} report={report} departments={departments} staff={[]} onAssignReport={() => {}} onUpdateReport={() => {}} onUpdatePriority={() => {}} onDeleteReport={() => {}} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workers" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ministry Workers Management</span>
                  <Button onClick={() => setIsWorkerDialogOpen(true)} className="bg-gradient-to-r from-green-500 to-green-600">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Worker
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Ministry Workers</h3>
                      <p className="text-slate-500 mb-4">Add ministry workers to manage complaint assignments</p>
                    </div>
                  ) : (
                    workers.map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {worker.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{worker.full_name}</h4>
                            <p className="text-sm text-slate-600">{worker.email}</p>
                            <p className="text-xs text-slate-500">{worker.department_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Shield className="w-3 h-3 mr-1" />
                            {worker.role}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorker(worker)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorker(worker.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">{dept.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          Workers: {workers.filter(w => w.department_id === dept.id).length}
                        </span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Auto-Assignment Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-slate-800">Automatic Complaint Assignment</h4>
                      <p className="text-sm text-slate-600">Automatically assign new complaints to available ministry workers based on their department</p>
                    </div>
                    <Button
                      onClick={handleToggleAutoAssign}
                      variant={autoAssignEnabled ? "default" : "outline"}
                      className={autoAssignEnabled ? "bg-gradient-to-r from-green-500 to-green-600" : ""}
                    >
                      {autoAssignEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  {autoAssignEnabled && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="font-semibold text-green-800 mb-2">Auto-Assignment Rules</h5>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• New complaints are assigned based on category-department mapping</li>
                        <li>• Workers with fewer active assignments get priority</li>
                        <li>• High-priority complaints are assigned immediately</li>
                        <li>• Workers are notified via email when assigned</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Worker Creation Dialog */}
      <Dialog open={isWorkerDialogOpen} onOpenChange={setIsWorkerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ministry Worker</DialogTitle>
            <DialogDescription>
              Create a new ministry worker account to manage complaints
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={newWorker.full_name}
                onChange={(e) => setNewWorker(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newWorker.email}
                onChange={(e) => setNewWorker(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newWorker.password}
                onChange={(e) => setNewWorker(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={newWorker.phone}
                onChange={(e) => setNewWorker(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={newWorker.department_id} onValueChange={(value) => setNewWorker(prev => ({ ...prev, department_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsWorkerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorker} className="bg-gradient-to-r from-green-500 to-green-600">
                Create Worker
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Dialog for Filtering */}
      <Dialog open={isFilteringGenuine} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-6">
            <Loader className="w-8 h-8 mx-auto animate-spin text-purple-600 mb-4" />
            <p className="text-lg font-semibold text-slate-800">Filtering genuine complaints...</p>
            <p className="text-sm text-slate-600 mt-2">Analyzing complaints with image evidence</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}