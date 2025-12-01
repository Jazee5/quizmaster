// src/pages/TeacherLogin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { LogIn, Mail, Lock, AlertCircle, Shield } from 'lucide-react';

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
      // Sign in or create account
      let { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If user doesn't exist, create account
        if (signInError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError) throw signUpError;
          data = signUpData;
        } else {
          throw signInError;
        }
      }

      if (data.user) {
        await handleProfileUpsert(data.user);
        navigate('/teacher-dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative">
      <div className="max-w-sm w-full relative z-10 scale-90">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-xl mb-1.5 shadow-2xl relative">
            <Shield className="w-5 h-5 text-white relative z-10 drop-shadow-lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mb-0.5 bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            TEACHER LOGIN
          </h1>
          <p className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            Command Center Access
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            {error && (
              <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-2.5 py-1.5 rounded-lg flex items-start gap-2 mb-2.5 backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    autoComplete="email"
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-indigo-400 transition-all placeholder-gray-500"
                    placeholder="teacher@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white text-sm rounded-lg py-1.5 pl-9 pr-2.5 focus:outline-none focus:border-indigo-400 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 text-white text-sm font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : <><LogIn className="w-4 h-4" /> Sign In</>}
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
