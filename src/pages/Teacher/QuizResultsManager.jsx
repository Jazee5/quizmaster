import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

async function fetchQuizzes() {
  // Fetch all quizzes
  const { data: quizzes, error: quizError } = await supabase
    .from("quizzes")
    .select("id, title, subject, course, created_at");

  if (quizError) {
    console.error("Error fetching quizzes:", quizError);
    return [];
  }

  // Fetch all attempts from the correct 'scores' table
  const { data: attempts, error: attemptError } = await supabase
    .from("scores")
    .select("*, quiz_id, user_id");

  if (attemptError) {
    console.error("Error fetching scores:", attemptError);
    return [];
  }

  // Combine quizzes and attempts
  const combinedData = quizzes.map((quiz) => ({
    ...quiz,
    attempts: attempts.filter((a) => a.quiz_id === quiz.id),
  }));

  return combinedData;
}


const QuizResultsManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'name', 'date'

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchQuizzes();
      setQuizzes(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleQuizExpand = (quizId) => {
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
    setSelectedQuiz(quizId === expandedQuiz ? null : quizzes.find(q => q.id === quizId));
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
    if (percentage >= 60) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const sortAttempts = (attempts) => {
    const sorted = [...attempts];
    switch (sortBy) {
      case 'score':
        return sorted.sort((a, b) => (b.score / b.total) - (a.score / a.total));
      case 'name':
        return sorted.sort((a, b) => a.student_name.localeCompare(b.student_name));
      case 'date':
        return sorted.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
      default:
        return sorted;
    }
  };

  const exportToCSV = (quiz) => {
    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Percentage', 'Time Taken (min)', 'Completed At'];
    const sortedAttempts = sortAttempts(quiz.attempts);
    
    const rows = sortedAttempts.map((attempt, index) => [
      index + 1,
      attempt.student_name,
      attempt.student_email,
      `${attempt.score}/${attempt.total}`,
      `${Math.round((attempt.score / attempt.total) * 100)}%`,
      attempt.time_taken,
      new Date(attempt.completed_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.replace(/\s+/g, '_')}_results.csv`;
    a.click();
  };

  const calculateQuizStats = (quiz) => {
    if (!quiz.attempts || quiz.attempts.length === 0) return { avgScore: 0, highScore: 0, lowScore: 0, totalAttempts: 0 };
    
    const scores = quiz.attempts.map(a => (a.score / a.total) * 100);
    return {
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highScore: Math.round(Math.max(...scores)),
      lowScore: Math.round(Math.min(...scores)),
      totalAttempts: quiz.attempts.length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-700">Loading quiz data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Quiz Results Management
        </h1>
        <p className="text-gray-600 text-lg">Track student performance and view detailed analytics</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Quizzes</p>
              <p className="text-3xl font-bold text-gray-900">{quizzes.length}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">
                {quizzes.reduce((sum, q) => sum + (q.attempts?.length || 0), 0)}
              </p>
            </div>
            <Users className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Performance</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(
                  quizzes.reduce((sum, q) => {
                    const avg = q.attempts?.reduce((s, a) => s + (a.score / a.total) * 100, 0) / (q.attempts?.length || 1);
                    return sum + avg;
                  }, 0) / quizzes.length
                )}%
              </p>
            </div>
            <Trophy className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quiz List */}
      {/* (Rest of your existing UI code remains unchanged) */}
    </div>
  );
};

export default QuizResultsManager;
