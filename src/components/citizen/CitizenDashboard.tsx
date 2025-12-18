import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
    AlertCircle,
    BarChart3,
    CheckCircle,
    Clock,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Hash,
    Map,
    MapPin,
    Plus,
    Search,
    Settings,
    ThumbsUp,
    User,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CitizenMapView from './MapView';
import ReportForm from './ReportForm';
import TrackReport from './TrackReport';

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
  user_voted?: boolean;
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

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchMyReports();
    fetchCategories();

    // Set up real-time subscription for reports and votes
    const channel = supabase
      .channel('reports-and-votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchReports();
          if (user) fetchMyReports();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_votes'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (name, color),
        report_votes (user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    // Check if user has voted on each report
    const reportsWithVotes = data?.map((report: any) => ({
      ...report,
      user_voted: user ? (Array.isArray(report.report_votes) && report.report_votes.some((vote: any) => vote.user_id === user.id)) : false
    })) || [];

    setReports(reportsWithVotes as Report[]);
    setLoading(false);
  };

  const fetchMyReports = async () => {
    if (!user) return;

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
      return;
    }

    setMyReports((data || []) as Report[]);
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

  const handleVote = async (reportId: string, hasVoted: boolean) => {
    if (!user) {
      toast({
        title: t('citizen.signInToVote'),
        description: t('citizen.signInToVoteDesc'),
        variant: "destructive",
      });
      return;
    }

    // Optimistically update the UI
    setReports(prevReports => 
      prevReports.map(report => {
        if (report.id === reportId) {
          return {
            ...report,
            user_voted: !hasVoted,
            votes_count: hasVoted ? report.votes_count - 1 : report.votes_count + 1
          };
        }
        return report;
      })
    );

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('report_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        toast({
          title: t('citizen.voteRemoved'),
          description: t('citizen.voteRemovedDesc'),
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('report_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
          });

        if (error) throw error;
        
        toast({
          title: t('citizen.voteAdded'),
          description: t('citizen.voteAddedDesc'),
        });
      }

      // Refresh reports to ensure consistency
      setTimeout(() => fetchReports(), 500);
    } catch (error: any) {
      console.error('Error voting:', error);
      
      // Revert optimistic update on error
      setReports(prevReports => 
        prevReports.map(report => {
          if (report.id === reportId) {
            return {
              ...report,
              user_voted: hasVoted,
              votes_count: hasVoted ? report.votes_count + 1 : report.votes_count - 1
            };
          }
          return report;
        })
      );
      
      toast({
        title: t('citizen.voteError'),
        description: error.message || t('citizen.voteErrorDesc'),
        variant: "destructive",
      });
    }
  };

  // Prince's enhanced card design with some main branch elements integrated
  const ReportCard = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const priorityConfig = getPriorityConfig(t);
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <Card className="group bg-gradient-to-br from-white to-orange-50/30 border border-orange-100/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-orange-200/80 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-400"></div>
        
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-bold text-slate-800 leading-tight mb-1 group-hover:text-orange-700 transition-colors">
                {report.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Hash className="h-3 w-3 flex-shrink-0 text-orange-500" />
                <span className="font-mono text-xs break-all">{report.id}</span>
              </CardDescription>
              <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3 w-3 flex-shrink-0 text-orange-500" />
                <span className="truncate">{report.address || t('citizen.locationNotSpecified')}</span>
              </CardDescription>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[report.status].color} shadow-sm`}></div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5 border-orange-200 text-orange-700 bg-orange-50/50">
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
                  className="w-16 h-16 object-cover rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-orange-100"
                  loading="lazy"
                />
              ))}
              {report.photos.length > 2 && (
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-md flex items-center justify-center text-xs text-orange-600 font-bold border border-orange-200">
                  +{report.photos.length - 2}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-orange-100/50">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                <span className="font-medium">{statusConfig[report.status].label}</span>
              </div>
              <span className="text-slate-400">•</span>
              <span>{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(report.id, report.user_voted || false)}
              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 h-7 rounded-full transition-all ${
                report.user_voted 
                  ? 'text-orange-600 hover:text-orange-700 bg-orange-100 hover:bg-orange-200 shadow-sm' 
                  : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'
              }`}
            >
              <ThumbsUp className="h-3 w-3" />
              {report.votes_count}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ReportListItem = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const priorityConfig = getPriorityConfig(t);
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
            {report.title.charAt(0).toUpperCase()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{report.title}</h3>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded break-all">{report.id}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{report.description}</p>
                
                {/* Images */}
                {report.photos && report.photos.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto">
                    {report.photos.slice(0, 3).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Report ${index + 1}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border border-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        loading="lazy"
                        onClick={() => window.open(photo, '_blank')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ))}
                    {report.photos.length > 3 && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-600 font-medium border border-gray-200 flex-shrink-0">
                        +{report.photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:ml-4">
                <div className="text-xs text-gray-500">
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
                <Badge 
                  className={`${statusConfig[report.status].color} text-white text-xs`}
                >
                  {statusConfig[report.status].label}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{report.address || 'Location not specified'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: report.categories?.color }}
                  />
                  <span className="truncate">{report.categories?.name}</span>
                </div>
                
                <Badge 
                  className={`${priorityConfig[report.priority].color} text-white text-xs`}
                >
                  {priorityConfig[report.priority].label}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(report.id, report.user_voted || false)}
                className={`flex items-center gap-1 text-xs self-start sm:self-auto ${
                  report.user_voted 
                    ? 'text-blue-600 hover:text-blue-700' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                {report.votes_count}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || report.categories?.name === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  if (showReportForm) {
    return (
      <div className="container-responsive py-6 animate-fade-in">
        <div className="mb-6 animate-slide-up">
          <Button 
            variant="outline" 
            onClick={() => setShowReportForm(false)} 
            className="hover:scale-105 transition-all duration-200"
            size="sm"
          >
            {t('citizen.backToDashboard')}
          </Button>
        </div>
        <div className="animate-scale-in">
          <ReportForm onSuccess={() => setShowReportForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Hidden on mobile, shown as bottom nav */}
        <div className="hidden lg:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-4 lg:p-6">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1 lg:space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                  activeTab === 'dashboard' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('map')}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                  activeTab === 'map' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Map className="h-4 w-4 lg:h-5 lg:w-5" />
                Map View
              </button>
              
              <button
                onClick={() => setActiveTab('myreports')}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                  activeTab === 'myreports' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
                My Reports
              </button>
              
              <button
                onClick={() => setActiveTab('track')}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                  activeTab === 'track' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Search className="h-4 w-4 lg:h-5 lg:w-5" />
                Track Report
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                  activeTab === 'settings' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-4 w-4 lg:h-5 lg:w-5" />
                Settings
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Heritage Dashboard</h1>
            </div>
          </div>
          
          <nav className="flex space-x-0.5 sm:space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                activeTab === 'map' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Map className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Map</span>
            </button>
            
            <button
              onClick={() => setActiveTab('myreports')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                activeTab === 'myreports' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">My Reports</span>
            </button>
            
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                activeTab === 'track' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Search className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Track</span>
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                activeTab === 'settings' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 p-2 sm:p-3 lg:p-6">
            {/* Header - Hidden on mobile since it's in mobile nav */}
            <div className="hidden lg:block mb-4 lg:mb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Civic Issue Dashboard
              </h1>
              <p className="text-sm lg:text-base text-gray-600">
                View and track all reported civic issues
              </p>
            </div>

            {activeTab === 'dashboard' && (
              <>
                {/* Search and Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-4 mb-3 sm:mb-4 lg:mb-6">
                  <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
                    <div className="w-full">
                      <div className="relative">
                        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                        <Input
                          placeholder="Search complaints, issues, locations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 sm:pl-10 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 mb-1">Ministry</p>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 mb-1">Status</p>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="acknowledged">Acknowledged</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 mb-1">Priority</p>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                          <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <div className="bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs font-medium whitespace-nowrap">
                          {filteredReports.length} Total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reports List */}
                <div className="space-y-2 sm:space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-sm sm:text-base text-slate-700 font-medium">{t('citizen.loading')}</p>
                      </div>
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                      <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No reports found</p>
                      <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <ReportListItem key={report.id} report={report} />
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'map' && (
              <div className="h-[calc(100vh-150px)] sm:h-[calc(100vh-200px)]">
                <CitizenMapView />
              </div>
            )}

            {activeTab === 'myreports' && (
              <>
                {!user ? (
                  <div className="text-center py-12 sm:py-16">
                    <User className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">{t('citizen.signInToView')}</p>
                    <p className="text-sm sm:text-base text-gray-600">Please sign in to view your reports</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-4">
                    {myReports.length === 0 ? (
                      <div className="text-center py-12 sm:py-16">
                        <Plus className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">{t('citizen.noMyReports')}</p>
                        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">{t('citizen.noMyReportsDesc')}</p>
                        <Button 
                          onClick={() => setShowReportForm(true)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                          size="sm"
                        >
                          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {t('citizen.submitFirst')}
                        </Button>
                      </div>
                    ) : (
                      myReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'track' && (
              <TrackReport />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Settings</h2>
                <p className="text-sm sm:text-base text-gray-600">Settings panel coming soon...</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-4 lg:p-6">
            {/* Call to Action */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 lg:p-6 text-white mb-4 lg:mb-6">
              <h3 className="text-base lg:text-lg font-bold mb-2">
                Help Build Better Infrastructure
              </h3>
              <p className="text-xs lg:text-sm mb-3 lg:mb-4 opacity-90">
                Report civic issues and track their resolution in real-time.
              </p>
              <Button 
                onClick={() => setShowReportForm(true)}
                className="w-full bg-white text-orange-600 hover:bg-gray-50 font-semibold text-sm lg:text-base"
              >
                <Plus className="mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                REPORT ISSUE
              </Button>
            </div>

            {/* Legal & Information */}
            <div>
              <h4 className="text-xs lg:text-sm font-semibold text-orange-600 mb-2 lg:mb-3">
                Legal & Information
              </h4>
              <div className="space-y-1 lg:space-y-2">
                <a href="#" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600 hover:text-orange-600">
                  Terms of Service
                  <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3" />
                </a>
                <a href="#" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600 hover:text-orange-600">
                  Privacy Policy
                  <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3" />
                </a>
                <a href="#" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600 hover:text-orange-600">
                  Accessibility
                  <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3" />
                </a>
                <a href="#" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600 hover:text-orange-600">
                  RTI Portal
                  <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Mobile Floating Action Button */}
          <div className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
            <Button 
              onClick={() => setShowReportForm(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="icon"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}