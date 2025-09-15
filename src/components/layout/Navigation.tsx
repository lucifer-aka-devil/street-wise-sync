import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Shield, 
  User, 
  LogOut, 
  FileText,
  Settings
} from 'lucide-react';

interface NavigationProps {
  currentView: 'citizen' | 'admin';
  onViewChange: (view: 'citizen' | 'admin') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, profile, signOut, isStaff } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo and Brand - Enhanced */}
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-lg">
                  JH
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    <span className="hidden sm:inline">Government of Jharkhand</span>
                    <span className="sm:hidden">Jharkhand Gov</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 hidden sm:block font-medium">Civic Reporting Portal</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - Enhanced */}
            {user && (
              <div className="hidden md:flex space-x-3">
                <Button
                  variant={currentView === 'citizen' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('citizen')}
                  className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                    currentView === 'citizen' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl' 
                      : 'hover:bg-blue-50 hover:text-blue-600'
                  }`}
                  size="sm"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden lg:inline">Citizen Portal</span>
                  <span className="lg:hidden">Citizen</span>
                </Button>
                
                {isStaff && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('admin')}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      currentView === 'admin' 
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg hover:shadow-xl' 
                        : 'hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                    size="sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">Admin Dashboard</span>
                    <span className="lg:hidden">Admin</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions - Enhanced */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {user ? (
              <>
                {/* User Info - Enhanced */}
                <div className="hidden sm:flex items-center space-x-3 text-sm min-w-0">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate max-w-[120px] md:max-w-none font-medium text-slate-800">
                        {profile?.full_name || user.email}
                      </div>
                      {profile?.role && profile.role !== 'citizen' && (
                        <div className="text-xs text-slate-500 hidden md:block capitalize">
                          {profile.role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile User Icon */}
                <div className="sm:hidden flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Sign Out</span>
                </Button>
              </>
            ) : (
              <div className="text-sm text-slate-600 hidden sm:block bg-slate-50 px-4 py-2 rounded-lg">
                Please sign in to access the platform
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu - Enhanced */}
        {user && (
          <div className="md:hidden border-t border-slate-200 pt-3 pb-3 bg-slate-50/50">
            <div className="flex space-x-3">
              <Button
                variant={currentView === 'citizen' ? 'default' : 'ghost'}
                onClick={() => onViewChange('citizen')}
                className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                  currentView === 'citizen' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-blue-50 hover:text-blue-600'
                }`}
                size="sm"
              >
                <Home className="h-4 w-4" />
                Citizen Portal
              </Button>
              
              {isStaff && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                    currentView === 'admin' 
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md' 
                      : 'hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                  size="sm"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}