// src/pages/StudentResultsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { Trophy, BookOpen, Clock, Eye, TrendingUp, Calendar } from 'lucide-react';
import Navbar from '../../components/Navbar';

const StudentResultsPage = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
    totalTime: 0
  });

  // Fetch results function
  const fetchStudentResults = async () => {
    if (!user?.id) return;

    try {
      // Line 27-42 - Update the fetch query
const { data: scoresData, error } = await supabase
  .from('scores')
  .select(`
    *,
    quizzes:quiz_id (
      id,
      title,
      time_limit,
      course:course_id (
        id,
        name,
        subject
      ),
      lesson:lesson_id (
        id,
        name,
        period
      )
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

      if (error) throw error;

      setResults(scoresData || []);

      // Update stats
      if (scoresData && scoresData.length > 0) {
        const scores = scoresData.map(s => (s.score / s.total_questions) * 100);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const totalTime = scoresData.reduce((sum, s) => sum + (s.time_taken || 0), 0);

        setStats({
          totalQuizzes: scoresData.length,
          averageScore: Math.round(avgScore),
          highestScore: Math.round(maxScore),
          totalTime: Math.round(totalTime / 60) // minutes
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setLoading(false);
    }
  };

  // Fetch on mount & setup real-time listener
  useEffect(() => {
    if (!user?.id) return;

    fetchStudentResults();

    // Subscribe to real-time changes for this user
    const subscription = supabase
      .channel('public:scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores', filter: `user_id=eq.${user.id}` },
        () => {
          fetchStudentResults();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Helpers
  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (percentage >= 80) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const getGrade = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 65) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Loading your results...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      <Navbar />
      <div className="relative py-8">
        {/* Glowing orbs */}
        <div className="fixed top-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse pointer-events-none -z-10"></div>
        <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" style={{ animationDelay: '1s' }}></div>
        <div className="fixed top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none -z-10" style={{ animationDelay: '2s' }}></div>

        {/* Scanline effect */}
        <div className="fixed inset-0 pointer-events-none opacity-5 -z-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              MY QUIZ RESULTS 
            </h1>
            <p className="text-gray-300 text-lg font-semibold uppercase tracking-wide">
              Track Your Performance & Review Past Quizzes
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Quizzes Taken */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-blue-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Quizzes Taken</p>
                  <p className="text-4xl font-extrabold text-blue-400">{stats.totalQuizzes}</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-green-500/30 p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Average Score</p>
                  <p className="text-4xl font-extrabold text-green-400">{stats.averageScore}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </div>

            {/* Highest Score */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/30 p-6 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-yellow-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Highest Score</p>
                  <p className="text-4xl font-extrabold text-yellow-400">{stats.highestScore}%</p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wide mb-6">Quiz History</h2>

              {results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/30">
                    <BookOpen className="w-12 h-12 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No quiz results yet</h3>
                  <p className="text-gray-400 mb-6">Take your first quiz to see your results here!</p>
                  <Link to="/dashboard" className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-purple-500/50 uppercase tracking-wider">
                    <BookOpen className="w-5 h-5" />
                    Back to Dashboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => {
                    const percentage = Math.round((result.score / result.total_questions) * 100);
                    const grade = getGrade(result.score, result.total_questions);

                    return (
                      <div
                        key={result.id}
                        className="bg-gray-900/50 border-2 border-indigo-500/30 rounded-2xl p-6 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400/50 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {result.quizzes?.title || 'Quiz'}
                              </h3>

                              {/* Course & Subject Tags */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {result.quizzes?.course?.name && (
                                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                                    {result.quizzes.course.name}
                                  </span>
                                )}
                                {result.quizzes?.course?.subject && (
                                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                                    {result.quizzes.course.subject}
                                  </span>
                                )}
                                {result.quizzes?.lesson?.period && (
                                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold flex items-center gap-1 rounded-full uppercase tracking-wider">
                                    <Calendar className="w-3 h-3" />
                                    {result.quizzes.lesson.period}
                                  </span>
                                )}
                              </div>

                              <p className="text-sm text-gray-400">
                                Completed on {new Date(result.created_at).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            {/* Score Display */}
                            <div className="text-right ml-6">
                              <div className={`px-6 py-3 rounded-xl border-2 ${getScoreColor(result.score, result.total_questions)}`}>
                                <p className="text-3xl font-bold">
                                  {result.score}/{result.total_questions}
                                </p>
                                <p className="text-sm font-semibold">{percentage}%</p>
                              </div>
                              <div className="mt-2">
                                <span className="px-3 py-1 bg-gray-800/50 border border-gray-700/50 text-white text-lg font-bold rounded-lg">
                                  Grade: {grade}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="flex items-center gap-6 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700/50">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{result.total_questions} questions</span>
                            </div>
                            {result.time_taken && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{Math.floor(result.time_taken / 60)} min {result.time_taken % 60} sec</span>
                              </div>
                            )}
                          </div>

                          {/* Action Button */}
                          <Link
                            to={`/quiz-result/${result.quiz_id}`}
                            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/50 text-center uppercase tracking-wider"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Eye className="w-4 h-4" />
                              Review Answers & See Leaderboard
                            </div>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResultsPage;