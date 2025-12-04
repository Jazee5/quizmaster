// QuizResultsManager.jsx - Updated for New Schema (Part 1)
import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Calendar, Download, ChevronDown, ChevronUp, BookOpen, Filter, X } from 'lucide-react';
import { supabase } from '../../config/supabaseClient';

async function fetchQuizzes() {
  try {
    // Fetch all quizzes with lesson, course, and department info
    const { data: quizzes, error: quizError } = await supabase
      .from("quizzes")
      .select(`
        id, 
        title, 
        created_at,
        lesson_id,
        lessons (
          id,
          lesson_name,
          period,
          course_id,
          courses (
            id,
            course_name,
            subject,
            department_id,
            departments (
              id,
              name
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (quizError) {
      console.error("Error fetching quizzes:", quizError);
      return [];
    }

    // Fetch all scores/attempts
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("*")
      .order('created_at', { ascending: false });

    if (scoresError) {
      console.error("Error fetching scores:", scoresError);
      return [];
    }

    // Get unique user IDs from scores
    const userIds = [...new Set(scores.map(s => s.user_id))];

    // Fetch profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, username, email")
      .in('id', userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Combine quizzes with their attempts and user info
    const combinedData = quizzes.map((quiz) => {
      const quizAttempts = scores.filter((s) => s.quiz_id === quiz.id);
      
      // Map attempts with user profiles
      const attemptsWithProfiles = quizAttempts.map(attempt => {
        const profile = profiles?.find(p => p.id === attempt.user_id);
        return {
          ...attempt,
          student_name: profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'Anonymous',
          student_email: profile?.email || 'N/A',
          total: attempt.total_questions,
          completed_at: attempt.created_at,
          time_taken: 'N/A', // You can calculate this if you have start/end times
        };
      });

      return {
        ...quiz,
        subject: quiz.lessons?.courses?.subject || 'N/A',
        course: quiz.lessons?.courses?.course_name || 'N/A',
        lesson: quiz.lessons?.lesson_name || 'N/A',
        department: quiz.lessons?.courses?.departments?.name || 'N/A',
        attempts: attemptsWithProfiles,
      };
    });

    return combinedData;
  } catch (error) {
    console.error("Error in fetchQuizzes:", error);
    return [];
  }
}

const QuizResultsManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'name', 'date'
  
  // Filter states
  const [courseFilter, setCourseFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchQuizzes();
      setQuizzes(data);
      setFilteredQuizzes(data);
      
      // Extract unique departments and courses
      const uniqueDepartments = [...new Set(data.map(q => q.department).filter(Boolean))];
      const uniqueCourses = [...new Set(data.map(q => q.course).filter(Boolean))];
      setDepartments(uniqueDepartments);
      setCourses(uniqueCourses);
      
      setLoading(false);
    };
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...quizzes];

    if (departmentFilter) {
      filtered = filtered.filter(q => q.department === departmentFilter);
    }

    if (courseFilter) {
      filtered = filtered.filter(q => q.course === courseFilter);
    }

    setFilteredQuizzes(filtered);
  }, [departmentFilter, courseFilter, quizzes]);

  const clearFilters = () => {
    setDepartmentFilter('');
    setCourseFilter('');
  };

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
    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Percentage', 'Completed At', 'Course', 'Lesson', 'Department'];
    const sortedAttempts = sortAttempts(quiz.attempts);
    
    const rows = sortedAttempts.map((attempt, index) => [
      index + 1,
      attempt.student_name,
      attempt.student_email,
      `${attempt.score}/${attempt.total}`,
      `${Math.round((attempt.score / attempt.total) * 100)}%`,
      new Date(attempt.completed_at).toLocaleString(),
      quiz.course,
      quiz.lesson,
      quiz.department
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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

  const calculateOverallStats = () => {
    const totalQuizzes = filteredQuizzes.length;
    const totalAttempts = filteredQuizzes.reduce((sum, q) => sum + (q.attempts?.length || 0), 0);
    
    let totalPercentage = 0;
    let quizzesWithAttempts = 0;
    
    filteredQuizzes.forEach(q => {
      if (q.attempts && q.attempts.length > 0) {
        const avgPercentage = q.attempts.reduce((sum, a) => sum + (a.score / a.total) * 100, 0) / q.attempts.length;
        totalPercentage += avgPercentage;
        quizzesWithAttempts++;
      }
    });
    
    const avgPerformance = quizzesWithAttempts > 0 ? Math.round(totalPercentage / quizzesWithAttempts) : 0;
    
    return { totalQuizzes, totalAttempts, avgPerformance };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-bold uppercase tracking-wider">Loading Quiz Data...</p>
        </div>
      </div>
    );
  }

  const stats = calculateOverallStats();
  // QuizResultsManager.jsx - Part 2 (Continuation - JSX Return)

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5 -z-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg uppercase tracking-wide">
            Quiz Results Management
          </h1>
          <p className="text-gray-300 text-lg font-semibold uppercase tracking-wide">
            Track Student Performance & View Analytics
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-indigo-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-bold uppercase tracking-wider">Filters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all uppercase font-semibold"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all uppercase font-semibold"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>

            {(departmentFilter || courseFilter) && (
              <button
                onClick={clearFilters}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Total Quizzes</p>
                <p className="text-4xl font-extrabold text-blue-400">{stats.totalQuizzes}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-green-500/30 p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Total Attempts</p>
                <p className="text-4xl font-extrabold text-green-400">{stats.totalAttempts}</p>
              </div>
              <Users className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Avg Performance</p>
                <p className="text-4xl font-extrabold text-purple-400">{stats.avgPerformance}%</p>
              </div>
              <Trophy className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="space-y-4">
          {filteredQuizzes.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                {departmentFilter || courseFilter ? 'No Quizzes Match Filters' : 'No Quizzes Yet'}
              </h3>
              <p className="text-gray-400 uppercase tracking-wider">
                {departmentFilter || courseFilter ? 'Try adjusting your filters' : 'Create your first quiz to see results here'}
              </p>
            </div>
          ) : (
            filteredQuizzes.map((quiz) => {
              const stats = calculateQuizStats(quiz);
              const isExpanded = expandedQuiz === quiz.id;

              return (
                <div
                  key={quiz.id}
                  className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 overflow-hidden hover:border-indigo-400/50 transition-all"
                >
                  {/* Quiz Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-700/30 transition-all"
                    onClick={() => toggleQuizExpand(quiz.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-2">
                          {quiz.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 text-xs rounded-full font-bold uppercase">
                            {quiz.department}
                          </span>
                          <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 text-xs rounded-full font-bold uppercase">
                            {quiz.course}
                          </span>
                          <span className="bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 text-xs rounded-full font-bold uppercase">
                            {quiz.lesson}
                          </span>
                          {quiz.subject && (
                            <span className="bg-pink-500/20 border border-pink-500/30 text-pink-300 px-3 py-1 text-xs rounded-full font-bold uppercase">
                              {quiz.subject}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Created: {new Date(quiz.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </button>
                    </div>

                    {/* Quiz Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Attempts</p>
                        <p className="text-2xl font-bold text-white">{stats.totalAttempts}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Avg Score</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.avgScore}%</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">High Score</p>
                        <p className="text-2xl font-bold text-green-400">{stats.highScore}%</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Low Score</p>
                        <p className="text-2xl font-bold text-red-400">{stats.lowScore}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - Student Results */}
                  {isExpanded && (
                    <div className="border-t-2 border-indigo-500/30 p-6 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wide">
                          Student Results ({quiz.attempts.length})
                        </h4>
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 uppercase font-semibold"
                          >
                            <option value="score">Sort by Score</option>
                            <option value="name">Sort by Name</option>
                            <option value="date">Sort by Date</option>
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToCSV(quiz);
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all uppercase text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Export CSV
                          </button>
                        </div>
                      </div>

                      {quiz.attempts.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                          <p className="uppercase tracking-wider">No attempts yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600">
                              <tr>
                                <th className="px-4 py-3 text-left text-white font-bold uppercase tracking-wider text-sm">Rank</th>
                                <th className="px-4 py-3 text-left text-white font-bold uppercase tracking-wider text-sm">Student</th>
                                <th className="px-4 py-3 text-left text-white font-bold uppercase tracking-wider text-sm">Email</th>
                                <th className="px-4 py-3 text-center text-white font-bold uppercase tracking-wider text-sm">Score</th>
                                <th className="px-4 py-3 text-center text-white font-bold uppercase tracking-wider text-sm">Percentage</th>
                                <th className="px-4 py-3 text-left text-white font-bold uppercase tracking-wider text-sm">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                              {sortAttempts(quiz.attempts).map((attempt, index) => {
                                const percentage = Math.round((attempt.score / attempt.total) * 100);
                                return (
                                  <tr key={attempt.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                      <div className="flex items-center">
                                        {getRankIcon(index + 1)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-white font-semibold">
                                      {attempt.student_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                      {attempt.student_email}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className="text-white font-bold">
                                        {attempt.score}/{attempt.total}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(attempt.score, attempt.total)}`}>
                                        {percentage}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                      {new Date(attempt.completed_at).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsManager;