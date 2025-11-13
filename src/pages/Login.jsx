// src/pages/Login.jsx - RESPONSIVE VERSION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        const studentPattern = /^[a-zA-Z]+\d+@gmail\.com$/;
        const isStudent = studentPattern.test(user.email);

        if (!isStudent) {
          await supabase.auth.signOut();
          setError('⚠️ This email is not a student account. Please use teacher login.');
          setGoogleLoading(false);
          return;
        }

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.user_metadata.name || user.email.split('@')[0],
              role: 'student',
            },
          ]);
        } else if (existingProfile.role !== 'student') {
          await supabase.auth.signOut();
          setError('⚠️ This account is registered as a teacher. Please use teacher login.');
          setGoogleLoading(false);
          return;
        }

        navigate('/dashboard');
      }
    };

    handleSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
        const studentPattern = /^[a-zA-Z]+\d+@gmail\.com$/;
        const isStudent = studentPattern.test(user.email);

        if (!isStudent) {
          await supabase.auth.signOut();
          setError('⚠️ This email is not a student account. Please use teacher login.');
          setGoogleLoading(false);
          return;
        }

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || user.user_metadata.name || user.email.split('@')[0],
              role: 'student',
            },
          ]);
        } else if (existingProfile.role !== 'student') {
          await supabase.auth.signOut();
          setError('⚠️ This account is registered as a teacher. Please use teacher login.');
          setGoogleLoading(false);
          return;
        }

        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { data, error } = await signIn(email, password, 'student');

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated Background Elements - Adjusted for mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          animation: 'scanline 8s linear infinite'
        }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Header - Responsive sizing */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-white relative z-10 drop-shadow-lg" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 sm:mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse px-2">
            STUDENT LOGIN
          </h1>
          <p className="text-cyan-300 text-base sm:text-lg font-semibold tracking-wide uppercase px-2">
            Enter the Quiz Arena
          </p>
        </div>

        {/* Login Card - Responsive padding */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
          
          {/* Corner Accents - Responsive sizing */}
          <div className="absolute top-0 left-0 w-12 h-12 sm:w-20 sm:h-20 border-t-2 border-l-2 border-cyan-400 rounded-tl-2xl sm:rounded-tl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-20 sm:h-20 border-b-2 border-r-2 border-pink-400 rounded-br-2xl sm:rounded-br-3xl"></div>

          <div className="relative z-10">
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-start sm:items-center gap-2 mb-4 sm:mb-6 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm font-semibold leading-tight sm:leading-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"  
                    className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white text-sm sm:text-base rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500"
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white text-sm sm:text-base rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-10 sm:pl-12 pr-3 sm:pr-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white text-sm sm:text-base font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 sm:hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white relative z-10"></div>
                    <span className="relative z-10 uppercase tracking-wider">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                    <span className="relative z-10 uppercase tracking-wider">Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 sm:px-4 bg-gray-800/80 text-gray-400 font-bold uppercase tracking-wider">Or</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-600 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold text-white hover:bg-gray-700/50 hover:border-gray-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="uppercase tracking-wider">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="uppercase tracking-wider truncate">Continue with Google</span>
                </>
              )}
            </button>

            {/* Links */}
            <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors uppercase tracking-wide">
                  Sign up now
                </Link>
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                Are you a teacher?{' '}
                <Link to="/teacher-login" className="text-pink-400 font-bold hover:text-pink-300 transition-colors uppercase tracking-wide">
                  Teacher Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 font-bold uppercase tracking-wider px-4">
          QuizMaster - Campus Quiz Platform 🎮
        </p>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default Login;