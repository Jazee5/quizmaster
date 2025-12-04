import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { Search, BookOpen, Clock, PlayCircle, Filter, X } from 'lucide-react';
import Navbar from '../../components/Navbar';

const BrowseQuizzes = () => {
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
    fetchAllQuizzes();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [searchTerm, selectedCourse, selectedSubject, quizzes]);

  const fetchAllQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          quiz_code,
          created_at,
          questions(count),
          lessons (
            id,
            lesson_name,
            courses (
              id,
              course_name,
              subject
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);

      // Extract unique courses and subjects
      const uniqueCourses = [...new Set(data.map(q => q.lessons?.courses?.course_name).filter(Boolean))];
      const uniqueSubjects = [...new Set(data.map(q => q.lessons?.courses?.subject).filter(Boolean))];

      setCourses(uniqueCourses);
      setSubjects(uniqueSubjects);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setLoading(false);
    }
  };

  const filterQuizzes = () => {
    let filtered = [...quizzes];

    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.lessons?.courses?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.lessons?.courses?.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(quiz => quiz.lessons?.courses?.course_name === selectedCourse);
    }

    if (selectedSubject) {
      filtered = filtered.filter(quiz => quiz.lessons?.courses?.subject === selectedSubject);
    }

    setFilteredQuizzes(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
    setSelectedSubject('');
  };

  const handleTakeQuiz = (quizId) => {
    navigate(`/take-quiz/${quizId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Loading quizzes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 drop-shadow-lg">
              BROWSE QUIZZES 🔍
            </h1>
            <p className="text-gray-300 text-lg font-semibold uppercase tracking-wide">
              Explore & Take Any Quiz
            </p>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-300 uppercase tracking-wide">Filters</h2>
              {(searchTerm || selectedCourse || selectedSubject) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1 uppercase tracking-wider"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             

              {/* Course Filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-purple-400 focus:shadow-lg transition-all uppercase font-semibold text-sm"
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
                className="w-full bg-gray-900/50 border-2 border-purple-500/30 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-purple-400 focus:shadow-lg transition-all uppercase font-semibold text-sm"
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
            <div className="bg-gray-800/50 backdrop-blur-xl border-2 border-gray-700 text-center py-16 rounded-2xl shadow-2xl">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-500/30">
                <BookOpen className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">No Quizzes Found</h3>
              <p className="text-gray-400 mb-6">
                { selectedCourse || selectedSubject
                  ? 'Try adjusting your filters'
                  : 'No quizzes available yet'}
              </p>
              {( selectedCourse || selectedSubject) && (
                <button 
                  onClick={clearFilters} 
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl text-white font-bold transition-all uppercase tracking-wider"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-gray-800/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/20 hover:border-purple-400/50 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wide">{quiz.title}</h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {quiz.lessons?.courses?.course_name && (
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                          {quiz.lessons.courses.course_name}
                        </span>
                      )}
                      {quiz.lessons?.courses?.subject && (
                        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                          {quiz.lessons.courses.subject}
                        </span>
                      )}
                      {quiz.lessons?.lesson_name && (
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-semibold rounded-full uppercase tracking-wider">
                          {quiz.lessons.lesson_name}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4 bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                        {quiz.questions?.[0]?.count || 0} questions
                      </div>
                    </div>

                    {/* Quiz Code */}
                    <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-center">
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Quiz Code</p>
                      <p className="text-lg font-mono text-cyan-300 font-bold tracking-widest">{quiz.quiz_code}</p>
                    </div>

                    {/* Take Quiz Button */}
                    <button
                      onClick={() => handleTakeQuiz(quiz.id)}
                      className="w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Take Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseQuizzes;