// src/pages/Login.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Zap, ArrowLeftRight } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const studentEmailPattern = /^(?=.*\d)[a-zA-Z0-9._]+@gmail\.com$/;

  useEffect(() => {
    const handleUserSession = async (session) => {
      if (!session) return;

      const user = session.user;

      if (!studentEmailPattern.test(user.email)) {
        await supabase.auth.signOut();
        setError('⚠️ This email is not a student account. Please use teacher login.');
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        await supabase.from('profiles').insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name || user.user_metadata.name || user.email.split('@')[0],
          role: 'student',
        }]);
      } else if (existingProfile.role !== 'student') {
        await supabase.auth.signOut();
        setError('⚠️ This account is registered as a teacher. Please use teacher login.');
        return;
      }

      navigate('/dashboard');
    };

    supabase.auth.getSession().then(({ data: { session } }) => handleUserSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') handleUserSession(session);
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

    if (!studentEmailPattern.test(email.toLowerCase())) {
      setError('Invalid student email format. Use letters/numbers/dots/underscores with @gmail.com, at least 1 number.');
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.toLowerCase();

      // Step 1: Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // If sign in is successful, navigate to dashboard
      if (signInData?.user && !signInError) {
        navigate('/dashboard');
        return;
      }

      // Step 2: If sign in fails, try to sign up (might be a new user)
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              role: 'student'
            }
          }
        });

        // Check if signup was successful
        if (signUpData?.user && !signUpError) {
          // Check if this is a truly new user or existing user
          // signUpData.user.identities will be empty array if user already exists
          if (signUpData.user.identities && signUpData.user.identities.length === 0) {
            // User already exists - wrong password
            setError('❌ Incorrect password. Please try again.');
            setLoading(false);
            return;
          }

          // This is a new user - create profile
          try {
            await supabase.from('profiles').insert({
              id: signUpData.user.id,
              email: signUpData.user.email,
              full_name: signUpData.user.email.split('@')[0],
              role: 'student',
            });
          } catch (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - profile will be created by useEffect
          }

          navigate('/dashboard');
          return;
        }

        // If signup also failed, show appropriate error
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('❌ Incorrect password. Please try again.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-pink-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-sm w-full relative z-10 scale-90">
        {/* Logo/Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-xl mb-1.5 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-xl blur-xl opacity-50"></div>
            <Zap className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold mb-0.5 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            STUDENT LOGIN
          </h1>
          <p className="text-cyan-300 text-xs font-semibold tracking-wide uppercase">
            Enter the Quiz Arena
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-pink-400 rounded-br-xl"></div>

          <div className="relative z-10">
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-2.5 py-1.5 rounded-lg flex items-start gap-2 mb-2.5 backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold leading-tight">{error}</span>
              </div>
            )}

            {/* SIMPLE TOGGLE BUTTON */}
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/teacher-login')}
                className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 text-cyan-300 text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider hover:scale-105 transition-all border border-cyan-500/30"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Campus Email Input */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase tracking-wide">
                  Campus Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-2.5 top-1/3 transform -translate-y-1/2 w-3.5 h-3.5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    autoComplete="username"
                    className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500"
                    placeholder="SPC@gmail.com"
                    required
                  />
                  <div className="mt-1 text-xs text-gray-400 ml-1">
                    Must be a <span className="text-cyan-400 font-semibold">Student SPC Gmail</span>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-cyan-400 group-focus-within:text-cyan-300 transition-colors pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white text-sm font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white relative z-10"></div>
                    <span className="relative z-10 uppercase tracking-wider text-sm">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 uppercase tracking-wider text-sm">Sign In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-2 font-bold uppercase tracking-wider">
          QuizMaster - Campus Quiz Platform 🎮
        </p>
      </div>
    </div>
  );
};

export default Login;