import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Filter,
  Search,
  Settings,
  BarChart3,
  ExternalLink,
  Hash,
  FileText,
  Calendar,
  User
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  address: string;
  photos: string[];
  votes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  categories: {
    name: string;
    color: string;
  };
}

const getStatusConfig = (t: (key: string) => string) => ({
  submitted: { label: t('status.submitted'), icon: Clock, color: 'bg-orange-500' },
  acknowledged: { label: t('status.acknowledged'), icon: Eye, color: 'bg-yellow-500' },
  in_progress: { label: t('status.in_progress'), icon: AlertCircle, color: 'bg-amber-500' },
  resolved: { label: t('status.resolved'), icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: t('status.rejected'), icon: XCircle, color: 'bg-red-500' },
});

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { label: t('priority.low'), color: 'bg-gray-500' },
  medium: { label: t('priority.medium'), color: 'bg-amber-500' },
  high: { label: t('priority.high'), color: 'bg-orange-500' },
  urgent: { label: t('priority.urgent'), color: 'bg-red-500' },
});

export default function MyReports() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMyReports();
      fetchCategories();

      // Set up real-time subscription for user's reports
      const channel = supabase
        .channel('my-reports-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchMyReports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchMyReports = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (name, color)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your reports',
        variant: "destructive",
      });
      return;
    }

    setMyReports((data || []) as Report[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const MyReportCard = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const priorityConfig = getPriorityConfig(t);
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <Card className="group bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
        
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-bold text-slate-800 leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                {report.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Hash className="h-3 w-3 flex-shrink-0 text-blue-500" />
                <span className="font-mono text-xs break-all">{report.id}</span>
              </CardDescription>
              <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3 w-3 flex-shrink-0 text-blue-500" />
                <span className="truncate">{report.address || 'Location not specified'}</span>
              </CardDescription>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[report.status].color} shadow-sm`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-blue-200 text-blue-700 bg-blue-50/50">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: report.categories?.color }}
              />
              <span className="font-medium">{report.categories?.name}</span>
            </Badge>
            <Badge 
              className={`${priorityConfig[report.priority].color} text-white text-xs px-2 py-0.5 shadow-sm`}
            >
              {priorityConfig[report.priority].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 space-y-3">
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{report.description}</p>
          
          {report.photos && report.photos.length > 0 && (
            <div className="flex gap-1.5 overflow-hidden">
              {report.photos.slice(0, 2).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Report ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-blue-100"
                  loading="lazy"
                  onClick={() => window.open(photo, '_blank')}
                />
              ))}
              {report.photos.length > 2 && (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md flex items-center justify-center text-xs text-blue-600 font-bold border border-blue-200">
                  +{report.photos.length - 2}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-blue-100/50">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                <span className="font-medium">{statusConfig[report.status].label}</span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{report.views_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>👍</span>
                <span>{report.votes_count}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Filter reports based on search and filters
  const filteredReports = myReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || report.categories?.name === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700 mb-2">Sign in required</p>
          <p className="text-gray-600">Please sign in to view your reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Reports</h2>
          <p className="text-sm text-gray-600">Track and manage your submitted reports</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search your reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1">Category</p>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap">
                {filteredReports.length} Reports
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-700 font-medium">Loading your reports...</p>
            </div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16">
            {myReports.length === 0 ? (
              <>
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-700 mb-2">No reports yet</p>
                <p className="text-gray-600">You haven't submitted any reports yet. Start by reporting an issue!</p>
              </>
            ) : (
              <>
                <Filter className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-700 mb-2">No reports match your filters</p>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <MyReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
