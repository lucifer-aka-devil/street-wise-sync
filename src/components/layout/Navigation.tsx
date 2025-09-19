import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
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
  const { t } = useLanguage();

  return (
    <nav className="bg-white/90 backdrop-blur-lg shadow-soft border-b border-white/30 sticky top-0 z-50 animate-fade-in">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Brand - Prince's orange theme with enhanced styling */}
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  JH
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent truncate">
                    <span className="hidden sm:inline">Government of Jharkhand</span>
                    <span className="sm:hidden">Jharkhand Gov</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-body hidden sm:block font-medium">{t('nav.portal')}</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - Prince's design with conditional rendering */}
            {user && (
              <div className="hidden md:flex space-x-3">
                {/* Show citizen portal only for non-staff users */}
                {!isStaff && (
                  <Button
                    variant={currentView === 'citizen' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('citizen')}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      currentView === 'citizen' 
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg hover:shadow-xl' 
                        : 'hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    size="sm"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden lg:inline">{t('nav.citizenPortal')}</span>
                    <span className="lg:hidden">{t('nav.citizen')}</span>
                  </Button>
                )}
                
                {/* Only show admin dashboard for staff */}
                {isStaff && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('admin')}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      currentView === 'admin' 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg hover:shadow-xl' 
                        : 'hover:bg-orange-50 hover:text-orange-600'
                    }`}
                    size="sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">{t('nav.adminDashboard')}</span>
                    <span className="lg:hidden">{t('nav.admin')}</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions - Enhanced with main's improvements */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {/* Language Selector */}
            <div className="animate-fade-in">
              <LanguageSelector />
            </div>
            {user ? (
              <>
                {/* User Info - Enhanced */}
                <div className="hidden sm:flex items-center space-x-3 text-sm min-w-0 animate-slide-up">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl px-4 py-2 shadow-soft hover:shadow-medium transition-all duration-300">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate max-w-[120px] md:max-w-none font-semibold text-slate-800">
                        {profile?.full_name || user.email}
                      </div>
                      {profile?.role && profile.role !== 'citizen' && (
                        <div className="text-xs text-slate-500 hidden md:block capitalize font-medium">
                          {profile.role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile User Icon */}
                <div className="sm:hidden flex items-center animate-fade-in">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center shadow-soft">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300 touch-target hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{t('nav.signOut')}</span>
                </Button>
              </>
            ) : (
              <div className="text-sm text-body hidden sm:block bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2 rounded-xl shadow-soft animate-fade-in">
                {t('nav.signInPrompt')}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu - Prince's design with proper conditional rendering */}
        {user && (
          <div className="md:hidden border-t border-slate-200/50 pt-4 pb-4 bg-gradient-to-r from-slate-50/80 to-white/80 backdrop-blur-sm animate-slide-up">
            <div className="flex space-x-3">
              {/* Show citizen portal only for non-staff users */}
              {!isStaff && (
                <Button
                  variant={currentView === 'citizen' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('citizen')}
                  className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                    currentView === 'citizen' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                      : 'hover:bg-orange-50 hover:text-orange-600'
                  }`}
                  size="sm"
                >
                  <Home className="h-4 w-4" />
                  {t('nav.citizenPortal')}
                </Button>
              )}
              
              {/* Only show admin dashboard for staff */}
              {isStaff && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                    currentView === 'admin' 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md' 
                      : 'hover:bg-orange-50 hover:text-orange-600'
                  }`}
                  size="sm"
                >
                  <Shield className="h-4 w-4" />
                  {t('nav.adminDashboard')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}