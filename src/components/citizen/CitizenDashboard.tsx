import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Filter,
  Map,
  User
} from 'lucide-react';
import ReportForm from './ReportForm';
import CitizenMapView from './MapView';

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
  submitted: { label: t('status.submitted'), icon: Clock, color: 'bg-blue-500' },
  acknowledged: { label: t('status.acknowledged'), icon: Eye, color: 'bg-yellow-500' },
  in_progress: { label: t('status.in_progress'), icon: AlertCircle, color: 'bg-orange-500' },
  resolved: { label: t('status.resolved'), icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: t('status.rejected'), icon: XCircle, color: 'bg-red-500' },
});

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { label: t('priority.low'), color: 'bg-gray-500' },
  medium: { label: t('priority.medium'), color: 'bg-blue-500' },
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
  const [activeTab, setActiveTab] = useState('all');
  const [showMapView, setShowMapView] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchMyReports();

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

  const ReportCard = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const priorityConfig = getPriorityConfig(t);
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <Card className="card-interactive rounded-2xl overflow-hidden shadow-medium hover:shadow-large border-0 transition-all duration-300 hover:scale-[1.02] bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4 bg-gradient-to-r from-white/50 to-slate-50/50">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 leading-tight line-clamp-2">{report.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">{report.address || t('citizen.locationNotSpecified')}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full ${statusConfig[report.status].color} shadow-sm animate-pulse`}></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white/80 hover:bg-white transition-colors">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ backgroundColor: report.categories?.color }}
                />
                <span className="font-medium">{report.categories?.name}</span>
              </Badge>
              <Badge 
                className={`${priorityConfig[report.priority].color} text-white text-xs font-semibold px-3 py-1.5 shadow-sm hover:shadow-md transition-all`}
              >
                {priorityConfig[report.priority].label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-5">
          <p className="text-sm text-body line-clamp-3 leading-relaxed">{report.description}</p>
          
          {report.photos && report.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {report.photos.slice(0, 3).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Report photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
                  loading="lazy"
                />
              ))}
              {report.photos.length > 3 && (
                <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-600 font-semibold hover:from-slate-200 hover:to-slate-300 transition-colors cursor-pointer">
                  +{report.photos.length - 3} more
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <StatusIcon className="h-4 w-4 text-slate-600" />
                <span className="font-medium">{statusConfig[report.status].label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-600" />
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(report.id, report.user_voted || false)}
              className={`flex items-center gap-2 text-sm font-semibold transition-all duration-300 touch-target hover:scale-105 rounded-xl px-4 py-2 ${
                report.user_voted 
                  ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-sm' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm hover:shadow-md'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="font-bold">{report.votes_count}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 animate-fade-in">
      <div className="container-responsive py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12 animate-slide-up">
          <div className="min-w-0 flex-1">
            <h1 className="text-responsive-lg font-bold text-heading mb-3">
              {t('citizen.title')}
            </h1>
            <p className="text-responsive-sm text-body max-w-2xl">
              {t('citizen.subtitle')}
            </p>
          </div>
          <Button 
            onClick={() => setShowReportForm(true)}
            className="w-full sm:w-auto btn-primary touch-target hover:scale-105 shadow-glow"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            <span className="sm:hidden">{t('citizen.reportIssue')}</span>
            <span className="hidden sm:inline">{t('citizen.newReport')}</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-slide-up">
          <TabsList className="grid w-full grid-cols-3 max-w-lg bg-white/80 backdrop-blur-sm border border-white/30 shadow-soft rounded-xl">
            <TabsTrigger 
              value="all" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
            >
              {t('citizen.allReports')}
            </TabsTrigger>
            <TabsTrigger 
              value="mine" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
            >
              {t('citizen.myReports')}
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex items-center gap-1 rounded-lg transition-all duration-200"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">{t('citizen.mapView')}</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-8 space-y-6 animate-fade-in">
            <div className="grid-responsive">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <div className="text-center animate-pulse">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                    <p className="text-body text-lg">{t('citizen.loading')}</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="col-span-full text-center py-20 animate-scale-in">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Filter className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 mb-3">{t('citizen.noReports')}</p>
                  <p className="text-body max-w-md mx-auto">{t('citizen.noReportsDesc')}</p>
                </div>
              ) : (
                reports.map((report, index) => (
                  <div key={report.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ReportCard report={report} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-8 space-y-6 animate-fade-in">
            {!user ? (
              <div className="card-elevated rounded-2xl">
                <div className="pt-12 pb-8 text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                  <p className="text-body text-xl font-medium">{t('citizen.signInToView')}</p>
                </div>
              </div>
            ) : (
              <div className="grid-responsive">
                {myReports.length === 0 ? (
                  <div className="col-span-full text-center py-20 animate-scale-in">
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <Plus className="h-12 w-12 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700 mb-3">{t('citizen.noMyReports')}</p>
                    <p className="text-body mb-8 max-w-md mx-auto">{t('citizen.noMyReportsDesc')}</p>
                    <Button 
                      className="btn-success touch-target hover:scale-105 shadow-glow-green" 
                      onClick={() => setShowReportForm(true)}
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {t('citizen.submitFirst')}
                    </Button>
                  </div>
                ) : (
                  myReports.map((report, index) => (
                    <div key={report.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <ReportCard report={report} />
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-8 animate-fade-in">
            <div className="h-[500px] sm:h-[600px] lg:h-[700px] rounded-2xl overflow-hidden shadow-large">
              <CitizenMapView />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}