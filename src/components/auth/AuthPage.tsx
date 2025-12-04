import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Loader2, MapPin, Users } from 'lucide-react';
import { useState } from 'react';

export default function AuthPage() {
  const { signIn, signUp, loading } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left side - Branding & Features */}
        <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Header Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Jharkhand Government Logo"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Ministry of Jal Shakti
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 font-medium">Civic Reporting Portal</p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto lg:mx-0">
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                {t('auth.subtitle')}
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-1 gap-6 max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">{t('auth.locationTitle')}</h3>
                <p className="text-slate-600 mt-1">{t('auth.locationDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">{t('auth.communityTitle')}</h3>
                <p className="text-slate-600 mt-1">{t('auth.communityDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">{t('auth.trackingTitle')}</h3>
                <p className="text-slate-600 mt-1">{t('auth.trackingDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="space-y-6 order-1 lg:order-2">
          <Card className="w-full max-w-md mx-auto lg:max-w-lg bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-slate-800">{t('auth.welcome')}</CardTitle>
              <CardDescription className="text-center text-slate-600 text-base">
                {t('auth.welcomeDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    {t('auth.signIn')}
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    {t('auth.signUp')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-700 font-medium">{t('auth.email')}</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-700 font-medium">{t('auth.password')}</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isLoading || loading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('auth.signingIn')}
                        </>
                      ) : (
                        t('auth.signInButton')
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-slate-700 font-medium">{t('auth.fullName')}</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder={t('auth.fullNamePlaceholder')}
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-700 font-medium">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium">{t('auth.password')}</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="h-11 bg-white/50 border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isLoading || loading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('auth.creatingAccount')}
                        </>
                      ) : (
                        t('auth.signUpButton')
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
