import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { ChevronLeft, Download, Trophy, Medal, Award } from 'lucide-react';
import Navbar from '../../components/Navbar';

const QuizResultsDetail = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score');

  useEffect(() => {
    fetchQuizResults();
  }, [quizId]);

  const fetchQuizResults = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('user_id', user.id) // Ensure teacher owns this quiz
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Fetch all attempts/scores for this quiz
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select(`
          *,
          profiles:user_id (username, full_name, email)
        `)
        .eq('quiz_id', quizId)
        .order('score', { ascending: false });

      if (scoresError) throw scoresError;
      setAttempts(scoresData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quiz results:', error);
      setLoading(false);
    }
  };

  const sortAttempts = (attempts) => {
    const sorted = [...attempts];
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => (b.score / b.total_questions) - (a.score / a.total_questions));
      case 'name':
        return sorted.sort((a, b) => {
          const aName = a.profiles?.username || a.profiles?.full_name || '';
          const bName = b.profiles?.username || b.profiles?.full_name || '';
          return aName.localeCompare(bName);
        });
      case 'date':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      default:
        return sorted;
    }
  };

  const exportToCSV = () => {
    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Percentage', 'Completed At'];
    const sortedAttempts = sortAttempts(attempts);
    
    const rows = sortedAttempts.map((attempt, index) => [
      index + 1,
      attempt.profiles?.username || attempt.profiles?.full_name || 'Anonymous',
      attempt.profiles?.email || 'N/A',
      `${attempt.score}/${attempt.total_questions}`,
      `${Math.round((attempt.score / attempt.total_questions) * 100)}%`,
      new Date(attempt.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz?.title.replace(/\s+/g, '_')}_results.csv`;
    a.click();
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{rank}</span>;
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'bg-green-100 text-green-700 border-green-300';
    if (percentage >= 80) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      </>
    );
  }

  if (!quiz) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-600">Quiz not found</p>
            <Link to="/teacher-dashboard" className="btn-primary mt-4 inline-block">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  const stats = {
    totalAttempts: attempts.length,
    avgScore: attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / attempts.length)
      : 0,
    highScore: attempts.length > 0
      ? Math.max(...attempts.map(a => (a.score / a.total_questions) * 100))
      : 0,
    lowScore: attempts.length > 0
      ? Math.min(...attempts.map(a => (a.score / a.total_questions) * 100))
      : 0,
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/teacher-dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                    {quiz.course}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                    {quiz.subject}
                  </span>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
            </div>
            <div className="card border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-purple-600">{stats.avgScore}%</p>
            </div>
            <div className="card border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Highest Score</p>
              <p className="text-3xl font-bold text-green-600">{Math.round(stats.highScore)}%</p>
            </div>
            <div className="card border-l-4 border-red-500">
              <p className="text-sm text-gray-600 mb-1">Lowest Score</p>
              <p className="text-3xl font-bold text-red-600">{Math.round(stats.lowScore)}%</p>
            </div>
          </div>

          {/* Sort Options */}
          <div className="card mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Sort by:</span>
              <button
                onClick={() => setSortBy('score')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sortBy === 'score' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Score (High to Low)
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sortBy === 'name' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Student Name
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sortBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Date (Recent First)
              </button>
            </div>
          </div>

          {/* Results Table */}
          {attempts.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-xl text-gray-600 mb-2">No attempts yet</p>
              <p className="text-gray-500">Students haven't taken this quiz yet.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Student</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Score</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Percentage</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortAttempts(attempts).map((attempt, index) => {
                      const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                      return (
                        <tr key={attempt.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {attempt.profiles?.username || attempt.profiles?.full_name || 'Anonymous'}
                              </p>
                              <p className="text-sm text-gray-500">{attempt.profiles?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-4 py-2 rounded-lg font-bold border-2 ${getScoreColor(attempt.score, attempt.total_questions)}`}>
                              {attempt.score}/{attempt.total_questions}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xl font-bold text-gray-900">{percentage}%</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">
                              {new Date(attempt.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizResultsDetail;