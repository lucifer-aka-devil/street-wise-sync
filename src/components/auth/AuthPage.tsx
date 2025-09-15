import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MapPin, Users, AlertTriangle } from 'lucide-react';
import AdminInfo from '@/components/AdminInfo';

export default function AuthPage() {
  const { signIn, signUp, loading } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left side - Branding & Features */}
        <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
          {/* Header Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/logo.png"
                  alt="Jharkhand Government Logo"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Government of Jharkhand
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 font-medium">Civic Reporting Portal</p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto lg:mx-0">
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Official platform for citizens to report civic issues and track their resolution with transparency and efficiency
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-1 gap-6 max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">Location-Based Reporting</h3>
                <p className="text-slate-600 mt-1">Report issues exactly where they occur with precise GPS coordinates</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-green-100 rounded-xl flex-shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">Community Engagement</h3>
                <p className="text-slate-600 mt-1">Vote on issues that matter to you and engage with your community</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-800 text-lg">Real-Time Tracking</h3>
                <p className="text-slate-600 mt-1">Follow your reports from submission to resolution with live updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="space-y-6 order-1 lg:order-2">
          <AdminInfo />
          <Card className="w-full max-w-md mx-auto lg:max-w-lg bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-slate-800">Welcome Back</CardTitle>
              <CardDescription className="text-center text-slate-600 text-base">
                Sign in to your account or create a new one to start reporting civic issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-700 font-medium">Email Address</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-700 font-medium">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isLoading || loading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-slate-700 font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-700 font-medium">Email Address</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        className="h-11 bg-white/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                      disabled={isLoading || loading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
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
