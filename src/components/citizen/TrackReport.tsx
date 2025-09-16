import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  Search,
  MapPin,
  Calendar,
  User,
  Eye,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hash,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
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
  profiles: {
    full_name: string;
    email: string;
  };
  departments?: {
    name: string;
  };
  assigned_user?: {
    full_name: string;
  };
}

const getStatusConfig = (t: (key: string) => string) => ({
  submitted: { 
    label: t('status.submitted'), 
    icon: Clock, 
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  acknowledged: { 
    label: t('status.acknowledged'), 
    icon: Eye, 
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  in_progress: { 
    label: t('status.in_progress'), 
    icon: AlertCircle, 
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  resolved: { 
    label: t('status.resolved'), 
    icon: CheckCircle, 
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  rejected: { 
    label: t('status.rejected'), 
    icon: XCircle, 
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
});

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { label: t('priority.low'), color: 'bg-gray-500' },
  medium: { label: t('priority.medium'), color: 'bg-amber-500' },
  high: { label: t('priority.high'), color: 'bg-orange-500' },
  urgent: { label: t('priority.urgent'), color: 'bg-red-500' },
});

const statusOrder = ['submitted', 'acknowledged', 'in_progress', 'resolved'];

export default function TrackReport() {
  const { t } = useLanguage();
  const [reportId, setReportId] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchReport = async () => {
    if (!reportId.trim()) {
      setError('Please enter a report ID');
      return;
    }

    setLoading(true);
    setError('');
    setReport(null);

    try {
      // Clean the input - remove # if present and get the search term
      const cleanId = reportId.trim().replace(/^#/, '').toLowerCase();
      
      let reportData = null;
      let fetchError = null;

      // First, try exact match for full UUID
      if (cleanId.length >= 32 && cleanId.includes('-')) {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', cleanId)
          .single();
        
        reportData = data;
        fetchError = error;
      }
      
      // If no exact match or it's a short ID, try partial match
      if (!reportData) {
        // Use multiple search strategies for better matching
        const searchPromises = [
          // Case-insensitive prefix match
          supabase
            .from('reports')
            .select('*')
            .ilike('id', `${cleanId}%`)
            .limit(1)
            .single(),
          
          // Case-insensitive contains match (in case the short ID is not at the start)
          supabase
            .from('reports')
            .select('*')
            .ilike('id', `%${cleanId}%`)
            .limit(1)
            .single()
        ];

        // Try each search strategy
        for (const searchPromise of searchPromises) {
          try {
            const { data, error } = await searchPromise;
            if (data && !error) {
              reportData = data;
              fetchError = null;
              break;
            }
          } catch (err) {
            // Continue to next search strategy
            continue;
          }
        }
      }

      if (!reportData || fetchError) {
        if (fetchError?.code === 'PGRST116' || !reportData) {
          setError(`Report not found with ID "${reportId}". Please check the ID and try again.`);
        } else {
          setError('Failed to fetch report. Please try again.');
          console.error('Fetch error:', fetchError);
        }
        return;
      }

      // Fetch additional data separately to avoid join issues
      const [categoriesData, profilesData, departmentsData] = await Promise.all([
        reportData.category_id ? 
          supabase.from('categories').select('name, color').eq('id', reportData.category_id).single() : 
          Promise.resolve({ data: null }),
        reportData.user_id ? 
          supabase.from('profiles').select('full_name, email').eq('id', reportData.user_id).single() : 
          Promise.resolve({ data: null }),
        reportData.department_id ? 
          supabase.from('departments').select('name').eq('id', reportData.department_id).single() : 
          Promise.resolve({ data: null })
      ]);

      // Combine the data
      const enrichedReport = {
        ...reportData,
        categories: categoriesData.data,
        profiles: profilesData.data,
        departments: departmentsData.data
      };

      setReport(enrichedReport as unknown as Report);
      toast({
        title: 'Report Found',
        description: `Successfully loaded report: ${reportData.title}`,
      });
    } catch (err: any) {
      console.error('Error searching report:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchReport();
    }
  };

  const StatusTimeline = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const currentStatusIndex = statusOrder.indexOf(report.status);
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
        <div className="space-y-3">
          {statusOrder.map((status, index) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isRejected = report.status === 'rejected' && status !== 'submitted';
            
            return (
              <div key={status} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isRejected ? 'bg-gray-200' : 
                  isCompleted ? config.color : 'bg-gray-200'
                } transition-colors`}>
                  <StatusIcon className={`h-5 w-5 ${
                    isRejected ? 'text-gray-500' : 
                    isCompleted ? 'text-white' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    isRejected ? 'text-gray-500' : 
                    isCurrent ? config.textColor : 
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {config.label}
                  </div>
                  {isCurrent && (
                    <div className="text-sm text-gray-600 mt-1">
                      Current Status • Updated {new Date(report.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {index < statusOrder.length - 1 && !isRejected && (
                  <ArrowRight className={`h-4 w-4 ${
                    isCompleted ? 'text-gray-400' : 'text-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
          
          {report.status === 'rejected' && (
            <div className="flex items-center gap-4 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-600">Rejected</div>
                <div className="text-sm text-red-600 mt-1">
                  Report was rejected • {new Date(report.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ReportDetails = ({ report }: { report: Report }) => {
    const statusConfig = getStatusConfig(t);
    const priorityConfig = getPriorityConfig(t);
    const config = statusConfig[report.status];
    
    return (
      <Card className="overflow-hidden">
        <div className={`h-1 ${config.color}`}></div>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                {report.title}
              </CardTitle>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                <Hash className="h-4 w-4" />
                <span className="font-mono text-xs break-all">#{report.id.substring(0, 8)}</span>
                <span className="text-gray-400">•</span>
                <span className="font-mono text-xs break-all">{report.id}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{report.profiles?.full_name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{report.address || 'No address provided'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`${config.color} text-white`}>
                {config.label}
              </Badge>
              <Badge className={`${priorityConfig[report.priority].color} text-white`}>
                {priorityConfig[report.priority].label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">{report.description}</p>
          </div>

          {report.photos && report.photos.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Photos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {report.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Report photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    loading="lazy"
                    onClick={() => window.open(photo, '_blank')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ThumbsUp className="h-4 w-4" />
              <span>{report.votes_count || 0} votes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="h-4 w-4" />
              <span>{report.views_count || 0} views</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: report.categories?.color || '#gray' }}
              />
              <span>{report.categories?.name || 'Uncategorized'}</span>
            </div>
          </div>

          {(report.departments || report.assigned_user) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Assignment Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {report.departments && (
                  <div>Department: {report.departments.name}</div>
                )}
                {report.assigned_user && (
                  <div>Assigned to: {report.assigned_user.full_name}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Search className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Track Report</h2>
          <p className="text-sm text-gray-600">Enter a report ID to track its current status and progress</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search by Report ID</CardTitle>
          <CardDescription>
            Enter the full report ID or the first 8 characters (e.g., #5f240311 or 5f240311-aaec-48ce-a46e-5314dd9aecc8)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter report ID (e.g., #5f240311 or 5f240311-aaec-48ce-a46e-5314dd9aecc8)"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                onKeyPress={handleKeyPress}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={searchReport} 
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Report
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReportDetails report={report} />
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <StatusTimeline report={report} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Help Section */}
      {!report && !loading && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">How to find your Report ID</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Check your email confirmation after submitting a report</li>
                  <li>• Visit the "My Reports" section to see all your submitted reports</li>
                  <li>• Report IDs can be entered as short codes (e.g., #5f240311) or full UUIDs</li>
                  <li>• Both formats will work: #5f240311 or 5f240311-aaec-48ce-a46e-5314dd9aecc8</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}