import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import TermsOfService from '@/components/legal/TermsOfService';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';

const Login: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white">
      <Card className="w-full max-w-md mx-auto shadow-xl border-none bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold">Sign in to your account</CardTitle>
          <CardDescription className="text-base">
            Access your clinic dashboard to manage patients and appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <Button 
            variant="outline" 
            className="w-full h-12 relative group overflow-hidden border-2 hover:border-blue-500 transition-all duration-300" 
            onClick={signInWithGoogle}
          >
            <div className="absolute left-0 top-0 bottom-0 w-14 bg-white flex items-center justify-center border-r group-hover:border-blue-500 transition-all duration-300">
              <svg className="h-6 w-6" viewBox="0 0 48 48">
                <g>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </g>
              </svg>
            </div>
            <span className="text-base font-medium ml-6">Continue with Google</span>
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground pt-2 pb-6">
          <p>
            By signing in, you agree to our <TermsOfService /> and <PrivacyPolicy />
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 