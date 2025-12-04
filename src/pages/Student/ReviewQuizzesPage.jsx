// ReviewQuizzesPage.jsx - Updated for new database structure
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { BookOpen, Play, Filter, Search, X } from 'lucide-react';
import Navbar from '../../components/Navbar';

const ReviewQuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchQuizzesForReview();
    }
  }, [user]);

  useEffect(() => {
    filterQuizzes();
  }, [searchTerm, selectedCourse, selectedSubject, quizzes]);

  const fetchQuizzesForReview = async () => {
    try {
      // First, get all quiz scores for the current user
      const { data: scores, error: scoresError } = await supabase
        .from('scores')
        .select('quiz_id')
        .eq('user_id', user.id);

      if (scoresError) throw scoresError;

      // Get unique quiz IDs that the user has attempted
      const attemptedQuizIds = [...new Set(scores?.map(s => s.quiz_id) || [])];

      if (attemptedQuizIds.length === 0) {
        setQuizzes([]);
        setLoading(false);
        return;
      }

      // Fetch only the quizzes that have been attempted with course and lesson details
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          created_at,
          questions(count),
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
        `)
        .in('id', attemptedQuizIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);

      // Extract unique courses and subjects from the nested data
      const uniqueCourses = [...new Set(data.map(q => q.course?.name).filter(Boolean))];
      const uniqueSubjects = [...new Set(data.map(q => q.course?.subject).filter(Boolean))];

      setCourses(uniqueCourses);
      setSubjects(uniqueSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes for review:', error);
      setLoading(false);
    }
  };

  const filterQuizzes = () => {
    let filtered = [...quizzes];

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.course?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.course?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(quiz => quiz.course?.name === selectedCourse);
    }

    if (selectedSubject) {
      filtered = filtered.filter(quiz => quiz.course?.subject === selectedSubject);
    }

    setFilteredQuizzes(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedSubject('');
  };

  const handleStartReview = (quizId) => {
    navigate(`/flashcard-review/${quizId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Loading quizzes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 bg-gradient-to-b from-gray-900 via-black to-gray-900 text-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-500 to-pink-500 bg-clip-text text-transparent mb-3">
              Review Quizzes ⚡
            </h1>
            <p className="text-gray-400 text-lg">Test your knowledge with flashcards</p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 mb-10 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-300">Filters</h2>
              {(selectedCourse || selectedSubject) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search by title/course/subject */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quizzes..."
                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-lg py-2 pl-10 pr-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              {/* Course Filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>

              {/* Subject Filter */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quiz Cards */}
          {filteredQuizzes.length === 0 ? (
            <div className="bg-gray-800/50 border border-gray-700 text-center py-16 rounded-2xl shadow-lg">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-700/30 to-pink-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-200 mb-2">No quizzes found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedCourse || selectedSubject
                  ? 'Try adjusting your filters'
                  : 'No quizzes available for review yet'}
              </p>
              {(searchTerm || selectedCourse || selectedSubject) && (
                <button onClick={clearFilters} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition-all duration-300">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-purple-300 mb-3">{quiz.title}</h3>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {quiz.course?.name && (
                        <span className="px-3 py-1 bg-blue-900/50 text-blue-300 text-xs font-semibold rounded-full border border-blue-700/50">
                          {quiz.course.name}
                        </span>
                      )}
                      {quiz.course?.subject && (
                        <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-xs font-semibold rounded-full border border-purple-700/50">
                          {quiz.course.subject}
                        </span>
                      )}
                      {quiz.lesson?.period && (
                        <span className="px-3 py-1 bg-green-900/50 text-green-300 text-xs font-semibold rounded-full border border-green-700/50">
                          {quiz.lesson.period}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 rounded-lg p-3 border border-gray-700">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>{quiz.questions?.[0]?.count || 0} flashcards</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartReview(quiz.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    <Play className="w-4 h-4" />
                    Start Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReviewQuizzesPage;