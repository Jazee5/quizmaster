// src/pages/Dashboard.jsx - Responsive Version
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { BookOpen, Trophy, Award, KeyRound } from 'lucide-react';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({ totalScores: 0, avgScore: 0 });
  const [error, setError] = useState('');
  const [quizCode, setQuizCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningQuiz, setJoiningQuiz] = useState(false);

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

      <div className="min-h-screen py-8 sm:py-10 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-3 sm:px-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Welcome */}
          <section className="animate-fade-in text-center sm:text-left">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow-lg break-words">
              WELCOME BACK, {user?.user_metadata?.username?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase()} 👋
            </h1>
            <p className="text-gray-300 text-xs sm:text-base md:text-lg font-semibold uppercase tracking-wide">
              Ready to Dominate the Leaderboard?
            </p>
          </section>

          {/* Join a Quiz */}
          <section className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 p-4 sm:p-6 shadow-2xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 mb-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <KeyRound className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white uppercase tracking-wide">
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
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-800/50 rounded-2xl border-2 border-green-500/30 p-5 hover:shadow-2xl transition-all">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">
                Quizzes Taken
              </p>
              <div className="flex justify-between items-center">
                <p className="text-4xl sm:text-5xl font-extrabold text-green-400">
                  {stats.totalScores}
                </p>
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl border-2 border-yellow-500/30 p-5 hover:shadow-2xl transition-all">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-2">
                Average Score
              </p>
              <div className="flex justify-between items-center">
                <p className="text-4xl sm:text-5xl font-extrabold text-yellow-400">
                  {stats.avgScore}%
                </p>
                <Award className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-white uppercase tracking-wide drop-shadow-lg">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Link
                to="/browse-quizzes"
                className="bg-gray-800/50 rounded-2xl p-5 border-2 border-blue-500/30 hover:border-blue-400 hover:shadow-2xl transition-all flex items-center gap-3 sm:gap-4"
              >
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 uppercase tracking-wide">
                    Browse Quizzes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider font-semibold">
                    Find By Course/Subject
                  </p>
                </div>
              </Link>

              <Link
                to="/review-quizzes"
                className="bg-gray-800/50 rounded-2xl p-5 border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-2xl transition-all flex items-center gap-3 sm:gap-4"
              >
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 uppercase tracking-wide">
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
