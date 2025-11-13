// src/pages/TeacherLogin.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { LogIn, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        const studentPattern = /^[a-zA-Z]+\d+@gmail\.com$/;
        const isStudent = studentPattern.test(user.email);

        if (isStudent) {
          await supabase.auth.signOut();
          setError('⚠️ Student accounts cannot access teacher portal. Please use student login.');
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
              role: 'teacher',
            },
          ]);
        } else if (existingProfile.role !== 'teacher') {
          await supabase.auth.signOut();
          setError('⚠️ This account is registered as a student. Please use student login.');
          setGoogleLoading(false);
          return;
        }

        navigate('/teacher-dashboard');
      }
    };

    handleSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
        const studentPattern = /^[a-zA-Z]+\d+@gmail\.com$/;
        const isStudent = studentPattern.test(user.email);

        if (isStudent) {
          await supabase.auth.signOut();
          setError('⚠️ Student accounts cannot access teacher portal. Please use student login.');
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
              role: 'teacher',
            },
          ]);
        } else if (existingProfile.role !== 'teacher') {
          await supabase.auth.signOut();
          setError('⚠️ This account is registered as a student. Please use student login.');
          setGoogleLoading(false);
          return;
        }

        navigate('/teacher-dashboard');
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

    const { data, error } = await signIn(email, password, 'teacher');

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/teacher-dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/teacher-login`,
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          animation: 'scanline 8s linear infinite'
        }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-3xl mb-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <Shield className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
          </div>
          
          <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            TEACHER LOGIN
          </h1>
          <p className="text-indigo-300 text-lg font-semibold tracking-wide uppercase">
            Command Center Access
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none"></div>
          
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-indigo-400 rounded-tl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-purple-400 rounded-br-3xl"></div>

          <div className="relative z-10">
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 mb-6 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-indigo-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white relative z-10"></div>
                    <span className="relative z-10 uppercase tracking-wider">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 uppercase tracking-wider">Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-800/80 text-gray-400 font-bold uppercase tracking-wider">Or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-600 rounded-xl font-bold text-white hover:bg-gray-700/50 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="uppercase tracking-wider">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="uppercase tracking-wider">Continue with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/teacher-signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors uppercase tracking-wide">
                  Sign up now
                </Link>
              </p>
              <p className="text-sm text-gray-400">
                Are you a student?{' '}
                <Link to="/login" className="text-purple-400 font-bold hover:text-purple-300 transition-colors uppercase tracking-wide">
                  Student Login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 font-bold uppercase tracking-wider">
          QuizMaster - Teacher Portal 📘
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

export default TeacherLogin;