// EditQuiz.jsx - Updated for New Schema (Part 1)
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  ArrowLeft,
  BookOpen,
  Clock,
  Hash,
  AlertCircle,
  Calendar,
  GraduationCap,
  FileText
} from 'lucide-react';
import Navbar from '../../components/Navbar';

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [quizData, setQuizData] = useState({
    title: '',
    lesson_id: '',
    time_limit: 30,
    quiz_code: '',
    category: '',
  });
  
  const [questions, setQuestions] = useState([]);
  const [deletedQuestions, setDeletedQuestions] = useState([]);

  // New state for fetched data
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // Display info
  const [displayInfo, setDisplayInfo] = useState({
    departmentName: '',
    courseName: '',
    lessonName: '',
    subject: '',
  });

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'identification', label: 'Identification' },
    { value: 'essay', label: 'Essay/Short Answer' },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchQuizData();
      fetchDepartments();
    }
  }, [id, user]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchCourses(selectedDepartment);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCourses = async (departmentId) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, subject')
        .eq('department_id', departmentId)
        .order('course_name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchLessons = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, lesson_name, period, lesson_order')
        .eq('course_id', courseId)
        .order('lesson_order');

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz with lesson, course, and department info
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select(`
          *,
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
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', id)
        .order('created_at', { ascending: true });

      if (questionsError) throw questionsError;

      // Set quiz data
      setQuizData({
        title: quizData.title,
        lesson_id: quizData.lesson_id,
        time_limit: quizData.time_limit,
        quiz_code: quizData.quiz_code,
        category: quizData.category || '',
      });

      // Set display info and selection states
      if (quizData.lessons) {
        const lesson = quizData.lessons;
        const course = lesson.courses;
        const department = course?.departments;

        setDisplayInfo({
          departmentName: department?.name || '',
          courseName: course?.course_name || '',
          lessonName: lesson.lesson_name || '',
          subject: course?.subject || '',
        });

        setSelectedDepartment(department?.id || '');
        setSelectedCourse(course?.id || '');
      }

      // Map the questions with support for all types
      const mappedQuestions = (questionsData || []).map(q => ({
        id: q.id,
        question_text: q.question_text || '',
        question_type: q.question_type || 'multiple_choice',
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_answer: q.correct_answer || 'A',
        correct_text_answer: q.correct_text_answer || ''
      }));

      setQuestions(mappedQuestions);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz data. You may not have permission to edit this quiz.');
      setTimeout(() => navigate('/teacher-dashboard'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizDataChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Handle question type change
    if (field === 'question_type') {
      if (value === 'true_false') {
        updated[index].option_a = 'True';
        updated[index].option_b = 'False';
        updated[index].option_c = '';
        updated[index].option_d = '';
        updated[index].correct_answer = 'A';
        updated[index].correct_text_answer = '';
      } else if (value === 'multiple_choice') {
        updated[index].option_a = '';
        updated[index].option_b = '';
        updated[index].option_c = '';
        updated[index].option_d = '';
        updated[index].correct_answer = 'A';
        updated[index].correct_text_answer = '';
      } else {
        // fill_blank, identification, essay
        updated[index].option_a = '';
        updated[index].option_b = '';
        updated[index].option_c = '';
        updated[index].option_d = '';
        updated[index].correct_answer = null;
        updated[index].correct_text_answer = '';
      }
    }
    
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'multiple_choice',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      correct_text_answer: ''
    }]);
  };

  const deleteQuestion = (index) => {
    const questionToDelete = questions[index];
    if (questionToDelete.id) {
      setDeletedQuestions([...deletedQuestions, questionToDelete.id]);
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!quizData.title.trim()) { 
      setError('Quiz title is required'); 
      return false; 
    }
    if (!quizData.lesson_id) { 
      setError('Lesson is required'); 
      return false; 
    }
    if (questions.length === 0) { 
      setError('At least one question is required'); 
      return false; 
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) { 
        setError(`Question ${i + 1}: Question text is required`); 
        return false; 
      }
      
      if (q.question_type === 'multiple_choice') {
        if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
          setError(`Question ${i + 1}: All options must be filled for multiple choice`);
          return false;
        }
      }
      
      if (q.question_type === 'true_false') {
        if (!q.correct_answer) {
          setError(`Question ${i + 1}: Please select the correct answer (True or False)`);
          return false;
        }
      }
      
      if (['fill_blank', 'identification'].includes(q.question_type)) {
        if (!q.correct_text_answer?.trim()) {
          setError(`Question ${i + 1}: Correct answer is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    setError('');
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Update quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title: quizData.title,
          lesson_id: quizData.lesson_id,
          time_limit: quizData.time_limit,
          category: quizData.category || null,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (quizError) throw quizError;

      // Delete removed questions
      for (const questionId of deletedQuestions) {
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('id', questionId);
        if (deleteError) throw deleteError;
      }

      // Update or insert questions
      for (const question of questions) {
        const questionData = {
          question_text: question.question_text,
          question_type: question.question_type,
          option_a: ['multiple_choice', 'true_false'].includes(question.question_type) ? question.option_a : null,
          option_b: ['multiple_choice', 'true_false'].includes(question.question_type) ? question.option_b : null,
          option_c: question.question_type === 'multiple_choice' ? question.option_c : null,
          option_d: question.question_type === 'multiple_choice' ? question.option_d : null,
          correct_answer: ['multiple_choice', 'true_false'].includes(question.question_type) ? question.correct_answer : null,
          correct_text_answer: ['fill_blank', 'identification', 'essay'].includes(question.question_type) ? question.correct_text_answer : null
        };

        if (question.id) {
          const { error: updateError } = await supabase
            .from('questions')
            .update(questionData)
            .eq('id', question.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('questions')
            .insert({
              quiz_id: id,
              ...questionData
            });
          if (insertError) throw insertError;
        }
      }

      alert('✅ Quiz updated successfully!');
      navigate('/teacher-dashboard');
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError('Failed to save quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionInputs = (question, index) => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option}>
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Option {option} *
                  </label>
                  <input
                    type="text"
                    value={question[`option_${option.toLowerCase()}`]}
                    onChange={(e) => handleQuestionChange(index, `option_${option.toLowerCase()}`, e.target.value)}
                    className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all"
                    placeholder={`Enter option ${option}`}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Correct Answer *
              </label>
              <select
                value={question.correct_answer || 'A'}
                onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all uppercase font-semibold"
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
          </>
        );

      case 'true_false':
        return (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Correct Answer *
            </label>
            <select
              value={question.correct_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all font-semibold"
            >
              <option value="A">True</option>
              <option value="B">False</option>
            </select>
          </div>
        );

      case 'fill_blank':
      case 'identification':
        return (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Correct Answer *
            </label>
            <input
              type="text"
              value={question.correct_text_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_text_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all"
              placeholder="Enter the correct answer"
            />
          </div>
        );

      case 'essay':
        return (
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Model/Expected Answer (Optional)
            </label>
            <textarea
              value={question.correct_text_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_text_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all min-h-[100px]"
              placeholder="Enter a model answer or key points to guide grading (optional)"
            />
            <p className="text-xs text-yellow-400 mt-2">
              ⚠️ Note: Essay questions require manual grading
            </p>
          </div>
        );

      default:
        return null;
    }
  };
  // EditQuiz.jsx - Part 2 (Continuation - JSX Return)

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl font-bold uppercase tracking-wider">Loading Quiz...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}></div>
        </div>

        <div className="max-w-full sm:max-w-3xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <Link to="/teacher-dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 font-bold uppercase tracking-wider transition-colors">
              <ArrowLeft className="w-5 h-5" /> Back to Dashboard
            </Link>
            <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg uppercase tracking-wide">EDIT QUIZ</h1>
            <p className="text-gray-300 text-base sm:text-lg font-semibold uppercase tracking-wide">Modify Quiz Details & Questions</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-xl p-4 flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 font-semibold">{error}</p>
            </div>
          )}

          {/* Quiz Details */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 p-4 sm:p-6 shadow-2xl mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Quiz Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Quiz Title */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  placeholder="Enter quiz title"
                  onChange={(e) => handleQuizDataChange('title', e.target.value)}
                  className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all"
                />
              </div>

              {/* Current Assignment Info (Read-Only) */}
              <div className="sm:col-span-2 bg-gray-900/50 border-2 border-blue-500/20 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-300 mb-3 uppercase tracking-wider">Current Assignment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 uppercase text-xs mb-1">Department</p>
                    <p className="text-white font-semibold">{displayInfo.departmentName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-xs mb-1">Course</p>
                    <p className="text-white font-semibold">{displayInfo.courseName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 uppercase text-xs mb-1">Lesson</p>
                    <p className="text-white font-semibold">{displayInfo.lessonName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Change Assignment Section */}
              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Change Assignment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedCourse('');
                        setQuizData(prev => ({ ...prev, lesson_id: '' }));
                      }}
                      className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all font-semibold"
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      Course
                    </label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setQuizData(prev => ({ ...prev, lesson_id: '' }));
                      }}
                      disabled={!selectedDepartment}
                      className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all font-semibold disabled:opacity-50"
                    >
                      <option value="">
                        {selectedDepartment ? 'Select Course' : 'Select Department First'}
                      </option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} {course.subject ? `- ${course.subject}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      Lesson *
                    </label>
                    <select
                      value={quizData.lesson_id}
                      onChange={(e) => handleQuizDataChange('lesson_id', e.target.value)}
                      disabled={!selectedCourse}
                      className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all font-semibold disabled:opacity-50"
                    >
                      <option value="">
                        {selectedCourse ? 'Select Lesson' : 'Select Course First'}
                      </option>
                      {lessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.lesson_name} {lesson.period ? `(${lesson.period})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={quizData.time_limit}
                  min="1"
                  max="180"
                  onChange={(e) => handleQuizDataChange('time_limit', parseInt(e.target.value) || 30)}
                  className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={quizData.category}
                  placeholder="e.g., Beginner, Advanced"
                  onChange={(e) => handleQuizDataChange('category', e.target.value)}
                  className="w-full bg-gray-900/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all"
                />
              </div>

              {/* Quiz Code (Read-Only) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Quiz Code (Read-Only)</label>
                <div className="w-full bg-gray-900/70 border-2 border-gray-600/30 text-gray-400 rounded-xl py-2 sm:py-3 px-3 sm:px-4 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="font-mono font-bold tracking-wider">{quizData.quiz_code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-indigo-500/30 p-4 sm:p-6 shadow-2xl mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                Questions ({questions.length})
              </h2>
              <button
                onClick={addQuestion}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
              >
                <Plus className="w-5 h-5" /> Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-xl">
                <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg font-semibold uppercase tracking-wider">
                  No questions yet. Click "Add Question" to start.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 border-2 border-indigo-500/20 rounded-xl p-4 sm:p-6 relative hover:border-indigo-400/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-indigo-400 uppercase tracking-wider">
                        Question {index + 1}
                      </h3>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                        title="Delete Question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Question Type Selector */}
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Question Type *</label>
                        <select
                          value={question.question_type}
                          onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                          className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all uppercase font-semibold"
                        >
                          {questionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Question Text */}
                      <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Question Text *</label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => handleQuestionChange(index, 'question_text', e.target.value)}
                          className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white rounded-xl py-2 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all resize-none"
                          rows="3"
                          placeholder="Enter your question"
                        />
                      </div>

                      {/* Dynamic inputs based on question type */}
                      {renderQuestionInputs(question, index)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={() => navigate('/teacher-dashboard')}
              disabled={saving}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 justify-center transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 justify-center hover:shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditQuiz;