import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWlzaGNoYW1hcnRoaSIsImEiOiJjbHB1Yjk2djcwajBlMmluenJvdGlucG54In0.1nBG1ilIoMJlD1xJ4mzIoA';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Add custom popup styles
const popupStyles = `
  .mapboxgl-popup {
    max-width: 250px !important;
  }
  .mapboxgl-popup-content {
    padding: 8px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    max-height: 400px !important;
    overflow-y: auto !important;
  }
  .mapboxgl-popup-close-button {
    font-size: 16px !important;
    padding: 4px !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = popupStyles;
  document.head.appendChild(styleSheet);
}

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'submitted':
      return '#3B82F6'; // Blue
    case 'acknowledged':
      return '#F59E0B'; // Amber
    case 'in_progress':
      return '#10B981'; // Emerald
    case 'resolved':
      return '#059669'; // Green
    case 'rejected':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface MarkerData {
  id: string;
  longitude: number;
  latitude: number;
  title: string;
  description: string;
  type?: 'manual' | 'search' | 'report';
  reportData?: Report;
}

interface Report {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  user_id: string;
  category_id: string;
  department_id: string;
  assigned_to: string | null;
  photos: string[] | null;
  categories: {
    id: string;
    name: string;
    color: string;
  } | null;
  departments: {
    id: string;
    name: string;
  } | null;
  profiles: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
}

const CitizenMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // Fetch reports data
  const fetchReports = useCallback(async () => {
    try {
      // Get all reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
        setLoading(false);
        return;
      }

      // Get categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, color');

      // Get departments  
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name');

      // Get profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      // Combine the data
      const enrichedReports = (reportsData || []).map(report => ({
        ...report,
        categories: categoriesData?.find(cat => cat.id === report.category_id) || null,
        departments: departmentsData?.find(dept => dept.id === report.department_id) || null,
        profiles: profilesData?.find(profile => profile.user_id === report.user_id) || null,
      }));

      setReports(enrichedReports as unknown as Report[]);
      setFilteredReports(enrichedReports as unknown as Report[]);
    } catch (error) {
      console.error('Error in fetchReports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.2090, 28.6139],
        zoom: 10
      });

      map.current.on('load', () => {
        setIsMapReady(true);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Convert reports with coordinates to markers
  useEffect(() => {
    if (!reports.length) return;

    const reportMarkers = reports
      .filter(report => report.latitude !== null && report.longitude !== null)
      .map(report => ({
        id: `report-${report.id}`,
        longitude: report.longitude!,
        latitude: report.latitude!,
        title: report.title,
        description: report.description,
        type: 'report' as const,
        reportData: report
      }));

    setMarkers(prev => {
      // Keep manual and search markers, replace report markers
      const nonReportMarkers = prev.filter(marker => marker.type !== 'report');
      return [...nonReportMarkers, ...reportMarkers];
    });
  }, [reports]);

  // Filter reports based on selected filters
  useEffect(() => {
    let filtered = reports;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.categories?.name === categoryFilter);
    }

    setFilteredReports(filtered);
  }, [reports, statusFilter, categoryFilter]);

  // Handle report selection
  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
    const report = reports.find(r => r.id === reportId);
    if (report && report.latitude && report.longitude && map.current) {
      map.current.flyTo({
        center: [report.longitude, report.latitude],
        zoom: 16
      });
    }
  };

  // Get unique values for filters
  const getUniqueCategories = () => {
    const categories = reports
      .map(report => report.categories?.name)
      .filter(Boolean);
    return [...new Set(categories)];
  };

  // Update markers when filtered reports change
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Create markers from filtered reports (only those with coordinates)
    const reportMarkers = filteredReports
      .filter(report => report.latitude && report.longitude)
      .map(report => ({
        id: report.id,
        latitude: report.latitude!,
        longitude: report.longitude!,
        type: 'report' as const,
        reportData: report
      }));

    // Add non-report markers (search and manual markers)
    const nonReportMarkers = markers.filter(marker => marker.type !== 'report');
    const allMarkers = [...reportMarkers, ...nonReportMarkers];

    // Add new markers
    allMarkers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      // Different styling based on marker type
      if (markerData.type === 'report') {
        const report = markerData.reportData;
        const statusColor = getStatusColor(report?.status || 'submitted');
        el.style.backgroundColor = statusColor;
        el.style.width = '28px';
        el.style.height = '28px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 3px 6px rgba(0,0,0,0.4)';
        el.style.cursor = 'pointer';
        el.style.transform = 'scale(1.1)';
      } else if (markerData.type === 'search') {
        el.style.backgroundColor = '#3b82f6';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
      } else {
        el.style.backgroundColor = '#ef4444';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map.current!);

      // Create popup content
      let popupContent = '';
      if (markerData.type === 'report' && markerData.reportData) {
        const report = markerData.reportData;
        const statusColor = getStatusColor(report.status);
        
        // Build images HTML if photos exist
        let imagesHtml = '';
        if (report.photos && report.photos.length > 0) {
          const imagesList = report.photos.map(photo => 
            `<img src="${photo}" alt="Report photo" style="width: 100%; max-width: 180px; height: 80px; object-fit: cover; border-radius: 4px; margin: 2px 0; cursor: pointer; border: 1px solid #e5e7eb;" onclick="window.open('${photo}', '_blank')" />`
          ).join('');
          imagesHtml = `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px;">
              <strong style="font-size: 11px; color: #374151;">Photos:</strong>
              <div style="margin-top: 4px;">
                ${imagesList}
              </div>
            </div>
          `;
        }

        popupContent = `
          <div style="max-width: 220px; font-family: system-ui, -apple-system, sans-serif; font-size: 12px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></div>
              <strong style="font-size: 11px; color: #111827;">${report.status.toUpperCase()}</strong>
            </div>
            
            <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #111827; line-height: 1.2;">${report.title}</h3>
            
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #374151; line-height: 1.3; max-height: 40px; overflow: hidden; text-overflow: ellipsis;">${report.description}</p>
            
            ${imagesHtml}
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 6px; font-size: 10px; color: #6b7280; line-height: 1.2;">
              ${report.categories ? `<div style="margin-bottom: 2px;"><strong>Category:</strong> ${report.categories.name}</div>` : ''}
              ${report.priority ? `<div style="margin-bottom: 2px;"><strong>Priority:</strong> ${report.priority}</div>` : ''}
              <div><strong>Created:</strong> ${new Date(report.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `;
      } else {
        // For non-report markers
        const title = markerData.type === 'search' ? 'Search Result' : 'Custom Location';
        const description = markerData.type === 'search' ? 'Search location' : 'Manual marker';
        
        popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 200px;">
            <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600;">${title}</h3>
            <p style="margin: 0; font-size: 11px; color: #6b7280;">${description}</p>
          </div>
        `;
      }

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        maxWidth: '250px',
        className: 'custom-popup'
      }).setHTML(popupContent);

      marker.setPopup(popup);
      markersRef.current[markerData.id] = marker;
    });
  }, [filteredReports, isMapReady]);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data: SearchResult[] = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 500);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Fly to the searched location
    if (map.current) {
      map.current.flyTo({
        center: [lon, lat],
        zoom: 15
      });
    }
    
    setSearchQuery(result.display_name);
    setShowSearchResults(false);

    const newMarker: MarkerData = {
      id: `search-${result.place_id}`,
      longitude: lon,
      latitude: lat,
      title: result.display_name,
      description: 'Searched location',
      type: 'search'
    };

    setMarkers(prev => {
      const filtered = prev.filter(marker => !marker.id.startsWith('search-'));
      return [...filtered, newMarker];
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Left Half - Map */}
      <Card className="w-full lg:w-1/2 h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">Community Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-100px)] min-h-[400px] sm:min-h-[500px] lg:min-h-0">
          {/* Search Box */}
          <div className="relative p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10 h-11 bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-slate-100 rounded-lg"
                  onClick={clearSearch}
                >
                  ×
                </Button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {result.display_name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute top-full left-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-xl z-50 p-3">
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Searching...
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="h-full min-h-[300px] sm:min-h-[400px] lg:min-h-0 relative">
            {!isMapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Loading community map...</p>
                </div>
              </div>
            )}
            <div ref={mapContainer} className="h-full w-full rounded-lg" />
          </div>

          {/* Map Info */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-slate-600 shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Community reports: {markers.filter(m => m.type === 'report').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Total locations: {markers.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Half - Reports List */}
      <Card className="w-full lg:w-1/2 h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-lg font-semibold">Community Reports ({filteredReports.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[calc(100%-100px)] flex flex-col">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 bg-white/80 border-slate-200 focus:border-blue-500">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 bg-white/80 border-slate-200 focus:border-blue-500">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm">
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-slate-600">Loading community reports...</p>
                </div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <Filter className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium mb-2">No reports found</p>
                <p className="text-sm">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedReport === report.id 
                      ? 'border-blue-500 bg-blue-50/80 shadow-md' 
                      : 'border-slate-200 bg-white/60 hover:bg-white/80'
                  }`}
                  onClick={() => handleReportSelect(report.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-800 truncate flex-1 mr-3 text-sm">
                      {report.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs font-medium px-2 py-1"
                      style={{ 
                        backgroundColor: `${getStatusColor(report.status)}15`,
                        borderColor: getStatusColor(report.status),
                        color: getStatusColor(report.status)
                      }}
                    >
                      {report.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {report.categories && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                          {report.categories.name}
                        </span>
                      )}
                      {report.priority && (
                        <span className={`px-2 py-1 rounded-md font-medium ${
                          report.priority === 'high' ? 'bg-red-100 text-red-700' :
                          report.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      {report.latitude && report.longitude && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-green-600" />
                          <span className="text-green-600 font-medium">Located</span>
                        </div>
                      )}
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {report.profiles && (
                    <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-500">
                      <span className="font-medium">Reported by:</span> {report.profiles.full_name}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenMapView;
