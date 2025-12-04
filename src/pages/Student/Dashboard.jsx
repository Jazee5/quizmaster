// src/pages/Dashboard.jsx - Compact Responsive Version
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { BookOpen, Trophy, Award, KeyRound, Search } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { usePreventZoom } from '../../hooks/usePreventZoom'; 

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePreventZoom();
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({ totalScores: 0, avgScore: 0 });
  const [error, setError] = useState('');
  const [quizCode, setQuizCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningQuiz, setJoiningQuiz] = useState(false);

  // Helper function to extract name from email
  const extractNameFromEmail = (email) => {
    if (!email) return 'STUDENT';
    
    // Get the part before @
    const username = email.split('@')[0];
    
    // Remove all numbers from the username
    const nameOnly = username.replace(/[0-9]/g, '');
    
    // or split at a reasonable point if all lowercase
    let formattedName = nameOnly.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // This assumes first name + last name pattern
    if (!formattedName.includes(' ') && formattedName.length > 6) {
      const midPoint = Math.floor(formattedName.length / 2);
      formattedName = formattedName.slice(0, midPoint) + ' ' + formattedName.slice(midPoint);
    }
    
    return formattedName.toUpperCase();
  };

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*, questions(count)')
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;

      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id);

      if (scoresError) throw scoresError;

      const totalScores = scoresData?.length || 0;
      const avgScore =
        totalScores > 0
          ? (
              scoresData.reduce(
                (acc, s) => acc + (s.score / s.total_questions) * 100,
                0
              ) / totalScores
            ).toFixed(1)
          : 0;

      setQuizzes(quizzesData || []);
      setStats({ totalScores, avgScore });
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please try refreshing.');
    }
  };

  const handleJoinQuiz = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoiningQuiz(true);

    if (!quizCode.trim()) {
      setJoinError('Please enter a quiz code');
      setJoiningQuiz(false);
      return;
    }

    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('quiz_code', quizCode.toUpperCase().trim())
        .single();

      if (error || !quiz) {
        setJoinError('Invalid quiz code.');
        setJoiningQuiz(false);
        return;
      }

      navigate(`/take-quiz/${quiz.id}`);
    } catch {
      setJoinError('Failed to join quiz. Try again.');
      setJoiningQuiz(false);
    }
  };

  if (error)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-3xl sm:text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 uppercase tracking-wide">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => {
                setError('');
                fetchDashboardData();
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Navbar />

      <div className="min-h-screen py-4 sm:py-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-3 sm:px-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
          {/* Welcome */}
          <section className="animate-fade-in text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1 drop-shadow-lg break-words">
              WELCOME BACK, {extractNameFromEmail(user?.email)} 👋
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide">
              Ready to Dominate the Leaderboard?
            </p>
          </section>

          {/* Join a Quiz */}
          <section className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 p-3 sm:p-5 shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <KeyRound className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-white uppercase tracking-wide">
                  Join a Quiz
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-semibold">
                  Enter Code to Start
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinQuiz} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="ENTER 6-DIGIT CODE"
                maxLength={6}
                className="flex-1 bg-gray-900/50 border-2 border-cyan-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500 uppercase font-bold tracking-widest text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={joiningQuiz}
                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold py-2 sm:py-3 px-5 sm:px-8 rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm sm:text-base"
              >
                {joiningQuiz ? 'JOINING...' : 'JOIN QUIZ'}
              </button>
            </form>

            {joinError && (
              <p className="text-red-400 text-xs sm:text-sm mt-3 font-semibold bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                ⚠️ {joinError}
              </p>
            )}
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gray-800/50 rounded-2xl border-2 border-green-500/30 p-4 hover:shadow-2xl transition-all">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                Quizzes Taken
              </p>
              <div className="flex justify-between items-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-green-400">
                  {stats.totalScores}
                </p>
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl border-2 border-yellow-500/30 p-4 hover:shadow-2xl transition-all">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                Average Score
              </p>
              <div className="flex justify-between items-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-yellow-400">
                  {stats.avgScore}%
                </p>
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white uppercase tracking-wide drop-shadow-lg">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                to="/browse-quizzes"
                className="bg-gray-800/50 rounded-2xl p-4 border-2 border-blue-500/30 hover:border-blue-400 hover:shadow-2xl transition-all flex items-center gap-3"
              >
                <Search className="w-7 h-7 sm:w-9 sm:h-9 text-blue-400" />
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 uppercase tracking-wide">
                    Browse Quizzes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-semibold">
                    Explore All Quizzes
                  </p>
                </div>
              </Link>

              <Link
                to="/review-quizzes"
                className="bg-gray-800/50 rounded-2xl p-4 border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl transition-all flex items-center gap-3"
              >
                <BookOpen className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-400" />
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-white mb-0.5 uppercase tracking-wide">
                    Review Quizzes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-semibold">
                    Practice Flashcards
                  </p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Dashboard;