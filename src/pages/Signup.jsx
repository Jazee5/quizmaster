// src/pages/Signup.jsx - COMPLETE FIXED VERSION
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '../config/supabaseClient';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await signUp(
        formData.email, 
        formData.password, 
        formData.username,
        'student'
      );

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: formData.email,
            full_name: formData.username,
            role: 'student',
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        setError('Account created but role assignment failed. Please contact support.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-green-500/30 text-center shadow-2xl relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-4 shadow-lg animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            ACCOUNT CREATED!
          </h2>
          <p className="text-gray-300 mb-4">
            Please check your email to verify your account. Redirecting to login...
          </p>
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500/20 border-t-green-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl mb-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
            <Sparkles className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
          </div>
          
          <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            JOIN QUIZMASTER
          </h1>
          <p className="text-purple-300 text-lg font-semibold tracking-wide uppercase">
            Create Your Student Account
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-cyan-500/5 pointer-events-none"></div>
          
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-purple-400 rounded-tl-3xl"></div>
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-400 rounded-br-3xl"></div>

          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border-2 border-red-500 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all placeholder-gray-500"
                    placeholder="johndoe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all placeholder-gray-500"
                    placeholder="student@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white relative z-10"></div>
                    <span className="relative z-10 uppercase tracking-wider">Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 uppercase tracking-wider">Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-400 font-bold hover:text-purple-300 transition-colors uppercase tracking-wide">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-gray-400">
                Are you a teacher?{' '}
                <Link to="/teacher-signup" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors uppercase tracking-wide">
                  Teacher Signup
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 font-bold uppercase tracking-wider">
          QuizMaster - Campus Quiz Platform 🎓
        </p>
      </div>
    </div>
  );
};

export default Signup;