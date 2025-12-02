// src/pages/TeacherLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { LogIn, Mail, Lock, AlertCircle, Shield, ArrowLeftRight } from 'lucide-react';

const TeacherLogin = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Optional: regex for teacher emails (can comment out for testing)
  const teacherEmailPattern = /^teacher\d+@edi\.spc$/;

  const handleProfileUpsert = async (user) => {
    const usernameFromEmail = user.email.split('@')[0];
    const fullNameFromEmail = usernameFromEmail;

    await supabase.from('profiles').upsert(
      [
        {
          id: user.id,
          email: user.email,
          username: usernameFromEmail,
          full_name: fullNameFromEmail,
          role: 'teacher', // always enforce teacher
        },
      ],
      { onConflict: ['id'] }
    );
  };

 const handleUserSession = async (session) => {
  if (!session) return;
  const user = session.user;

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // first login, create teacher profile
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      username: user.email.split('@')[0],
      full_name: user.email.split('@')[0],
      role: 'teacher',
    });
  } else if (profile.role !== 'teacher') {
    await supabase.auth.signOut();
    setError('⚠️ This account is not a teacher.');
    return;
  }

  navigate('/teacher-dashboard'); // force teacher dashboard
};

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => handleUserSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') handleUserSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Replace the handleSubmit function in TeacherLogin.jsx with this:

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  if (!email || !password) {
    setError('Please fill in all fields');
    setLoading(false);
    return;
  }

  try {
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    // If sign in succeeds
    if (signInData?.user && !signInError) {
      await handleProfileUpsert(signInData.user);
      navigate('/teacher-dashboard');
      return;
    }

    // If sign in fails, check if it's because user doesn't exist
    if (signInError) {
      console.log('Sign in error:', signInError.message);

      // Only try to sign up if error indicates invalid credentials
      if (signInError.message.includes('Invalid login credentials')) {
        
        // Try to sign up (this will fail if user exists with wrong password)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: {
              role: 'teacher'
            }
          }
        });

        // If signup succeeds, user was new
        if (signUpData?.user && !signUpError) {
          // Create profile for new teacher
          await supabase.from('profiles').insert({
            id: signUpData.user.id,
            email: signUpData.user.email,
            username: signUpData.user.email.split('@')[0],
            full_name: signUpData.user.email.split('@')[0],
            role: 'teacher',
          });

          navigate('/teacher-dashboard');
          return;
        }

        // If signup fails with "already registered", it means wrong password
        if (signUpError && signUpError.message.includes('User already registered')) {
          setError('❌ Incorrect password. Please try again.');
          setLoading(false);
          return;
        }

        // Other signup errors
        if (signUpError) {
          throw signUpError;
        }
      } else {
        // Other sign in errors (not invalid credentials)
        throw signInError;
      }
    }
  } catch (err) {
    console.error('Teacher login error:', err);
    setError(err.message || 'Failed to sign in. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 sm:w-96 h-48 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-purple-500/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="max-w-sm w-full relative z-10 scale-90">
        {/* Logo/Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-xl mb-1.5 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-xl blur-xl opacity-50"></div>
            <Shield className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold mb-0.5 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            TEACHER LOGIN
          </h1>
          <p className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            Command Center Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400 rounded-br-xl"></div>

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
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-600/50 text-indigo-300 text-xs font-bold py-2 px-4 rounded-lg uppercase tracking-wider hover:scale-105 transition-all border border-indigo-500/30"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    autoComplete="email"
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 group-focus-within:text-indigo-300 transition-colors pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white text-sm font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
          QuizMaster - Teacher Portal 📘
        </p>
      </div>
    </div>
  );
};

export default TeacherLogin;