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
  assigned_user: {
    user_id: string;
    full_name: string;
    email: string;
  } | null;
}

const MapView: React.FC = () => {
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
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // Fetch reports data
  const fetchReports = useCallback(async () => {
    try {
      // First get all reports
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
        assigned_user: profilesData?.find(profile => profile.user_id === report.assigned_to) || null
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

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  }, [reports, statusFilter, categoryFilter, priorityFilter]);

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

  const getUniquePriorities = () => {
    const priorities = reports
      .map(report => report.priority)
      .filter(Boolean);
    return [...new Set(priorities)];
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
        // For non-report markers, access properties directly from markerData
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
    <div className="h-full flex gap-4">
      {/* Left Half - Map */}
      <Card className="w-1/2 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map View
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)]">
          {/* Search Box */}
          <div className="relative p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={clearSearch}
                >
                  ×
                </Button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-4 right-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="absolute top-full left-4 right-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3">
                <div className="text-sm text-gray-500">Searching...</div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="h-full relative">
            {!isMapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <div ref={mapContainer} className="h-full w-full" />
          </div>

          {/* Map Info */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-md p-2 text-xs text-gray-600 shadow-md">
            <div>Reports with location: {markers.filter(m => m.type === 'report').length}</div>
            <div>Total markers: {markers.length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Right Half - Reports List */}
      <Card className="w-1/2 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Reports ({filteredReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 h-[calc(100%-80px)] flex flex-col">
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {getUniquePriorities().map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No reports found matching the selected filters.
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedReport === report.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleReportSelect(report.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
                      {report.title}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${getStatusColor(report.status)}20`,
                        borderColor: getStatusColor(report.status),
                        color: getStatusColor(report.status)
                      }}
                    >
                      {report.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {report.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {report.categories && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {report.categories.name}
                        </span>
                      )}
                      {report.priority && (
                        <span className={`px-2 py-1 rounded ${
                          report.priority === 'high' ? 'bg-red-100 text-red-700' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {report.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {report.latitude && report.longitude && (
                        <MapPin className="h-3 w-3 text-green-600" />
                      )}
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {report.profiles && (
                    <div className="mt-2 text-xs text-gray-500">
                      By: {report.profiles.full_name}
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

export default MapView;
