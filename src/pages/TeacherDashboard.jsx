// TeacherDashboard.jsx - Dark Gaming Theme
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import {
  PlusCircle,
  BookOpen,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Hash,
  Copy,
  CheckCircle,
  Clock,
  Eye,
  X,
  Trophy,
  Filter,
  Download,
  Shield
} from 'lucide-react';
import Navbar from '../components/Navbar';

const TeacherDashboard = () => {
  const { user,  loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [stats, setStats] = useState({ totalQuizzes: 0, totalAttempts: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [showAllResultsModal, setShowAllResultsModal] = useState(false);
  const [allResults, setAllResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [resultsCourseFilter, setResultsCourseFilter] = useState('');
  const [resultsSubjectFilter, setResultsSubjectFilter] = useState('');

useEffect(() => {
  if (user?.id) {
    fetchTeacherData(); 
  }
}, [user]);

  useEffect(() => {
    filterQuizzes();
  }, [selectedCourseFilter, selectedSubjectFilter, quizzes]);
  
  useEffect(() => {
    filterResults();
  }, [resultsCourseFilter, resultsSubjectFilter, allResults]);

  const fetchTeacherData = async () => {
    try {
      
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          subject,
          course,
          time_limit,
          created_at,
          quiz_code,
          questions(count),
          scores (
            id,
            user_id,
            score,
            total_questions,
            created_at,
            profiles!scores_user_id_fkey(full_name, username)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quizzesError) throw quizzesError;

      if (!quizzesData || quizzesData.length === 0) {
        setStats({ totalQuizzes: 0, totalAttempts: 0 });
        setQuizzes([]);
        setFilteredQuizzes([]);
        setLoading(false);
        return;
      }

      const quizzesWithAttempts = quizzesData.map((quiz) => ({
        ...quiz,
        total_attempts: quiz.scores?.length || 0
      }));

      const totalAttempts = quizzesWithAttempts.reduce(
        (acc, quiz) => acc + (quiz.total_attempts || 0),
        0
      );

      setStats({
        totalQuizzes: quizzesWithAttempts.length,
        totalAttempts
      });

      setQuizzes(quizzesWithAttempts);
      setFilteredQuizzes(quizzesWithAttempts);

      const uniqueCourses = [...new Set(quizzesWithAttempts.map(q => q.course).filter(Boolean))];
      const uniqueSubjects = [...new Set(quizzesWithAttempts.map(q => q.subject).filter(Boolean))];
      setCourses(uniqueCourses);
      setSubjects(uniqueSubjects);

    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } 
  };

  const filterQuizzes = () => {
    let filtered = [...quizzes];

    if (selectedCourseFilter) {
      filtered = filtered.filter(quiz => quiz.course === selectedCourseFilter);
    }

    if (selectedSubjectFilter) {
      filtered = filtered.filter(quiz => quiz.subject === selectedSubjectFilter);
    }

    setFilteredQuizzes(filtered);
  };

  const filterResults = () => {
    let filtered = [...allResults];

    if (resultsCourseFilter) {
      filtered = filtered.filter(result => result.quiz_course === resultsCourseFilter);
    }

    if (resultsSubjectFilter) {
      filtered = filtered.filter(result => result.quiz_subject === resultsSubjectFilter);
    }

    setFilteredResults(filtered);
  };

  const clearQuizFilters = () => {
    setSelectedCourseFilter('');
    setSelectedSubjectFilter('');
  };

  const clearResultsFilters = () => {
    setResultsCourseFilter('');
    setResultsSubjectFilter('');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      setStats({ ...stats, totalQuizzes: stats.totalQuizzes - 1 });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  const copyQuizCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleViewResults = async (quiz) => {
    setSelectedQuiz(quiz);
    setShowResultsModal(true);

    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('score', { ascending: false });

      if (scoresError) throw scoresError;

      if (scoresData && scoresData.length > 0) {
        const userIds = scoresData.map(s => s.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles error:', profilesError);
        }

        const mappedResults = scoresData.map(score => {
          const profile = profilesData?.find(p => p.id === score.user_id);
          
          const display_name = profile?.full_name
            || profile?.username
            || profile?.email?.split('@')[0]
            || 'Anonymous';

          return {
            ...score,
            profiles: profile,
            display_name
          };
        });

        setQuizResults(mappedResults);
      } else {
        setQuizResults([]);
      }
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  };

  const handleViewAllResults = async () => {
    setShowAllResultsModal(true);
    
    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from('scores')
        .select('*')
        .in('quiz_id', quizzes.map(q => q.id))
        .order('created_at', { ascending: false });

      if (scoresError) throw scoresError;

      if (scoresData && scoresData.length > 0) {
        const userIds = [...new Set(scoresData.map(s => s.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles error:', profilesError);
        }

        const quizIds = [...new Set(scoresData.map(s => s.quiz_id))];
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, title, course, subject')
          .in('id', quizIds);

        if (quizzesError) {
          console.error('Quizzes error:', quizzesError);
        }

        const mappedResults = scoresData.map(score => {
          const profile = profilesData?.find(p => p.id === score.user_id);
          const quiz = quizzesData?.find(q => q.id === score.quiz_id);

          const display_name = profile?.full_name 
            || profile?.username 
            || profile?.email?.split('@')[0] 
            || 'Anonymous';

          return {
            ...score,
            profiles: profile,
            quizzes: quiz,
            display_name,
            quiz_title: quiz?.title || 'Unknown Quiz',
            quiz_course: quiz?.course || '',
            quiz_subject: quiz?.subject || ''
          };
        });

        setAllResults(mappedResults);
        setFilteredResults(mappedResults);
      } else {
        setAllResults([]);
        setFilteredResults([]);
      }
    } catch (error) {
      console.error('Error fetching all results:', error);
    }
  };

  const exportResultsToCSV = () => {
    const headers = ['Student Name', 'Quiz Title', 'Course', 'Subject', 'Score', 'Percentage', 'Date'];
    
    const rows = filteredResults.map(result => [
      result.display_name,
      result.quiz_title,
      result.quiz_course,
      result.quiz_subject,
      `${result.score}/${result.total_questions}`,
      `${Math.round((result.score / result.total_questions) * 100)}%`,
      new Date(result.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_quiz_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const closeModal = () => {
    setShowResultsModal(false);
    setSelectedQuiz(null);
    setQuizResults([]);
  };

  const closeAllResultsModal = () => {
    setShowAllResultsModal(false);
    setAllResults([]);
    setFilteredResults([]);
    clearResultsFilters();
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Welcome Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              WELCOME, Professor {user.user_metadata?.full_name || user.email?.split('@')[0].toUpperCase()}! 
            </h1>
            <p className="text-gray-300 text-lg font-semibold uppercase tracking-wide">
              Manage Quizzes & Track Performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-blue-500/30 p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-blue-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">My Quizzes</p>
                  <p className="text-4xl font-extrabold text-blue-400">{stats.totalQuizzes}</p>
                </div>
                <BookOpen className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-green-500/30 p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Total Attempts</p>
                  <p className="text-4xl font-extrabold text-green-400">{stats.totalAttempts}</p>
                </div>
                <Users className="w-10 h-10 text-green-400" />
              </div>
            </div>

            <Link
              to="/create-quiz"
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group relative overflow-hidden transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-purple-400/30 rounded-tl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-pink-400/30 rounded-br-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Create New</p>
                  <p className="text-lg font-bold text-purple-400 group-hover:text-purple-300">Add Quiz</p>
                </div>
                <PlusCircle className="w-10 h-10 text-purple-400" />
              </div>
            </Link>

            <button
              onClick={handleViewAllResults}
              className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-orange-500/30 p-6 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 group text-left relative overflow-hidden transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-orange-400/30 rounded-tr-2xl"></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1 font-bold uppercase tracking-wider">Results Overview</p>
                  <p className="text-lg font-bold text-orange-400 group-hover:text-orange-300">All Scores</p>
                </div>
                <BarChart3 className="w-10 h-10 text-orange-400" />
              </div>
            </button>
          </div>

{/* My Quizzes with Filters */}
<div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 p-4 sm:p-6 shadow-2xl mb-8 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>

  <div className="relative z-10">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide">My Quizzes</h2>
      <Filter className="w-6 h-6 text-indigo-400" />
    </div>

    {/* Filters */}
    <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <select
          value={selectedCourseFilter}
          onChange={(e) => setSelectedCourseFilter(e.target.value)}
          className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all uppercase font-semibold text-sm sm:text-base"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>

        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all uppercase font-semibold text-sm sm:text-base"
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>

        {(selectedCourseFilter || selectedSubjectFilter) && (
          <button
            onClick={clearQuizFilters}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>

    {/* No Quizzes */}
    {filteredQuizzes.length === 0 ? (
      <div className="text-center py-12 sm:py-16">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl shadow-blue-500/50">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 uppercase tracking-wide">
          {selectedCourseFilter || selectedSubjectFilter ? 'No Quizzes Match Filters' : 'No Quizzes Yet'}
        </h3>
        <p className="text-gray-400 mb-4 sm:mb-6 uppercase tracking-wider text-sm sm:text-base">
          {selectedCourseFilter || selectedSubjectFilter ? 'Try Adjusting Filters' : 'Create Your First Quiz!'}
        </p>
        {!selectedCourseFilter && !selectedSubjectFilter && (
          <Link to="/create-quiz" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl hover:shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base">
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Create Quiz
          </Link>
        )}
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredQuizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-gray-900/50 border-2 border-indigo-500/30 rounded-2xl p-4 sm:p-5 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400/50 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
                <div>
                  <h3 className="font-bold text-white text-lg sm:text-base uppercase tracking-wide">{quiz.title}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Hash className="w-4 h-4 text-blue-400" />
                    <span className="font-mono text-xs sm:text-sm text-blue-300 font-bold tracking-wider">{quiz.quiz_code}</span>
                    <button onClick={() => copyQuizCode(quiz.quiz_code)}>
                      {copiedCode === quiz.quiz_code ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-blue-400 hover:text-blue-300 transition-colors" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2 py-1 text-xs rounded-full font-bold uppercase tracking-wide">{quiz.course}</span>
                    <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-1 text-xs rounded-full font-bold uppercase tracking-wide">{quiz.subject}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/edit-quiz/${quiz.id}`}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm text-gray-400 mb-3 bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-700/50 gap-2 sm:gap-0">
                <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  {quiz.questions?.[0]?.count || 0} questions
                </div>
                <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Users className="w-4 h-4 text-green-400" />
                  {quiz.total_attempts || 0} attempts
                </div>
                <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  {quiz.time_limit} mins
                </div>
              </div>

              <button
                onClick={() => handleViewResults(quiz)}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
              >
                <Eye className="w-4 h-4" /> View Results
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
          </div>
      </div>

      {/* Single Quiz Results Modal */}
      {showResultsModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto border-2 border-indigo-500/30">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wide">{selectedQuiz.title}</h2>
              <p className="text-gray-400 uppercase tracking-wider">{selectedQuiz.subject}</p>
            </div>

            {quizResults.length === 0 ? (
              <p className="text-center text-gray-400 italic">No student attempts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-700">
                  <thead className="bg-gradient-to-r from-indigo-600 to-blue-600">
                    <tr>
                      <th className="py-3 px-4 text-left text-white font-bold uppercase tracking-wider">Score</th>
                      <th className="py-3 px-4 text-left text-white font-bold uppercase tracking-wider">Accuracy</th>
                      <th className="py-3 px-4 text-left text-white font-bold uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/50">
                    {quizResults.map((res) => {
                      const accuracy = Math.round((res.score / res.total_questions) * 100);
                      return (
                        <tr key={res.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                          <td className="py-2 px-4 font-bold text-cyan-300 uppercase tracking-wide">
                            {res.display_name
                              .split(' ')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')}
                          </td>
                          <td className="py-2 px-4 text-white font-bold">
                            {res.score}/{res.total_questions}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`px-3 py-1 rounded-lg font-bold ${
                              accuracy >= 90 ? 'bg-green-500/20 text-green-400' :
                              accuracy >= 80 ? 'bg-blue-500/20 text-blue-400' :
                              accuracy >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {accuracy}%
                            </span>
                          </td>
                          <td className="py-2 px-4 text-sm text-gray-400">
                            {new Date(res.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Results Modal */}
{showAllResultsModal && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-full sm:max-w-5xl p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto border-2 border-orange-500/30">
      <button
        onClick={closeAllResultsModal}
        className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 hover:bg-red-500/20 rounded-lg transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wide">All Quiz Results</h2>
            <p className="text-gray-400 uppercase tracking-wider text-sm sm:text-base">View & Filter All Attempts</p>
          </div>
          <button
            onClick={exportResultsToCSV}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="p-2 sm:p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            <select
              value={resultsCourseFilter}
              onChange={(e) => setResultsCourseFilter(e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-orange-500/30 text-white rounded-xl py-2 sm:py-3 px-2 sm:px-4 focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/20 transition-all uppercase font-semibold text-sm sm:text-base"
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>

            <select
              value={resultsSubjectFilter}
              onChange={(e) => setResultsSubjectFilter(e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-orange-500/30 text-white rounded-xl py-2 sm:py-3 px-2 sm:px-4 focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/20 transition-all uppercase font-semibold text-sm sm:text-base"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            {(resultsCourseFilter || resultsSubjectFilter) && (
              <button
                onClick={clearResultsFilters}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 sm:py-3 px-3 sm:px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <p className="text-center text-gray-400 italic py-6 sm:py-8 text-sm sm:text-base">
          {resultsCourseFilter || resultsSubjectFilter ? 'No results match your filters.' : 'No student attempts yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-2 border-gray-700 text-xs sm:text-sm">
            <thead className="bg-gradient-to-r from-orange-600 to-red-600">
              <tr>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-white font-bold uppercase tracking-wider">Student</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-white font-bold uppercase tracking-wider">Quiz</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-white font-bold uppercase tracking-wider">Course</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-white font-bold uppercase tracking-wider">Subject</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-center text-white font-bold uppercase tracking-wider">Score</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-center text-white font-bold uppercase tracking-wider">%</th>
                <th className="py-2 px-3 sm:py-3 sm:px-4 text-left text-white font-bold uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/50">
              {filteredResults.map((result) => {
                const accuracy = Math.round((result.score / result.total_questions) * 100);
                return (
                  <tr key={result.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <td className="py-1 px-2 sm:py-2 sm:px-4 font-bold text-cyan-300 uppercase tracking-wide">{result.display_name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-white font-semibold">{result.quiz_title}</td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4">
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs rounded-full font-bold uppercase">{result.quiz_course}</span>
                    </td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs rounded-full font-bold uppercase">{result.quiz_subject}</span>
                    </td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-center font-bold text-white">{result.score}/{result.total_questions}</td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg font-bold text-xs sm:text-sm ${
                        accuracy >= 90 ? 'bg-green-500/20 text-green-400' :
                        accuracy >= 80 ? 'bg-blue-500/20 text-blue-400' :
                        accuracy >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{accuracy}%</span>
                    </td>
                    <td className="py-1 px-2 sm:py-2 sm:px-4 text-gray-400 text-xs sm:text-sm">{new Date(result.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}

    </>
  );
};

export default TeacherDashboard;