// src/pages/CreateQuiz.jsx - Responsive Dark Gaming Theme
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabaseClient';
import { PlusCircle, Trash2, Save, AlertCircle, GraduationCap, BookOpen, Calendar, FileText, Clock, HelpCircle, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const CreateQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState({
    title: '',
    category: '',
    course: '',
    subject: '',
    period: '',
    lesson: '',
    time_limit: 30,
  });

  const [questions, setQuestions] = useState([
    {
      question_type: 'multiple_choice',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      correct_text_answer: '',
    },
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice', icon: '📝' },
    { value: 'true_false', label: 'True/False', icon: '✓✗' },
    { value: 'fill_blank', label: 'Fill in the Blank', icon: '___' },
    { value: 'identification', label: 'Identification', icon: '🔍' },
    { value: 'essay', label: 'Essay/Short Answer', icon: '📄' },
  ];

  // Course-Subject mapping
  const courseSubjects = {
    'Information Technology': [
      'Programming Fundamentals',
      'Database Management',
      'Networking Fundamentals',
      'Web Development',
      'Mobile Development',
      'System Administration',
      'IT Project Management',
      'Computer Hardware',
      'Other'
    ],
    'Computer Science': [
      'Data Structures & Algorithms',
      'Software Engineering',
      'Computer Architecture',
      'Operating Systems',
      'Artificial Intelligence',
      'Machine Learning',
      'Discrete Mathematics',
      'Theory of Computation',
      'Other'
    ],
    'Engineering': [
      'Engineering Mathematics',
      'Physics for Engineers',
      'Engineering Drawing',
      'Mechanics',
      'Thermodynamics',
      'Electrical Circuits',
      'Material Science',
      'Engineering Ethics',
      'Other'
    ],
    'Business': [
      'Business Management',
      'Marketing',
      'Accounting',
      'Finance',
      'Human Resources',
      'Economics',
      'Entrepreneurship',
      'Business Law',
      'Other'
    ],
    'Mathematics': [
      'Algebra',
      'Calculus',
      'Geometry',
      'Statistics',
      'Trigonometry',
      'Linear Algebra',
      'Probability',
      'Mathematical Analysis',
      'Other'
    ],
    'Science': [
      'Biology',
      'Chemistry',
      'Physics',
      'Earth Science',
      'Environmental Science',
      'General Science',
      'Laboratory Techniques',
      'Research Methods',
      'Other'
    ],
    'Arts': [
      'Art History',
      'Drawing & Painting',
      'Digital Arts',
      'Sculpture',
      'Photography',
      'Graphic Design',
      'Art Appreciation',
      'Studio Arts',
      'Other'
    ],
    'Other': [
      'General Subject',
      'Custom Subject'
    ]
  };

  const courseOptions = Object.keys(courseSubjects);
  
  const getSubjectsForCourse = (course) => {
    return courseSubjects[course] || [];
  };

  const periodOptions = [
    'Prelim',
    'Midterm',
    'Finals',
    '1st Quarter',
    '2nd Quarter',
    '3rd Quarter',
    '4th Quarter',
    'Other'
  ];

  const handleQuizDataChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'course') {
      setQuizData({
        ...quizData,
        course: value,
        subject: '',
      });
    } else {
      setQuizData({
        ...quizData,
        [name]: value,
      });
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    
    if (field === 'question_type') {
      if (value === 'true_false') {
        updatedQuestions[index].option_a = 'True';
        updatedQuestions[index].option_b = 'False';
        updatedQuestions[index].option_c = '';
        updatedQuestions[index].option_d = '';
        updatedQuestions[index].correct_answer = 'A';
      } else if (value === 'multiple_choice') {
        updatedQuestions[index].option_a = '';
        updatedQuestions[index].option_b = '';
        updatedQuestions[index].option_c = '';
        updatedQuestions[index].option_d = '';
        updatedQuestions[index].correct_answer = 'A';
      } else {
        updatedQuestions[index].option_a = '';
        updatedQuestions[index].option_b = '';
        updatedQuestions[index].option_c = '';
        updatedQuestions[index].option_d = '';
        updatedQuestions[index].correct_answer = null;
      }
    }
    
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_type: 'multiple_choice',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        correct_text_answer: '',
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
    }
  };

  const validateForm = () => {
    if (!quizData.title.trim()) {
      setError('Please enter a quiz title');
      return false;
    }

    if (!quizData.course || !quizData.subject) {
      setError('Please select both course and subject');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1}: Please enter the question text`);
        return false;
      }

      if (q.question_type === 'multiple_choice') {
        if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
          setError(`Question ${i + 1}: Please fill all four options`);
          return false;
        }
      }

      if (q.question_type === 'true_false') {
        if (!q.correct_answer) {
          setError(`Question ${i + 1}: Please select the correct answer (True or False)`);
          return false;
        }
      }

      if (['fill_blank', 'identification', 'essay'].includes(q.question_type)) {
        if (!q.correct_text_answer?.trim()) {
          setError(`Question ${i + 1}: Please provide the correct answer`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    setLoading(true);

    try {
      const { data: insertedQuiz, error: quizError } = await supabase
        .from("quizzes")
        .insert([{
          user_id: user.id,
          title: quizData.title,
          category: quizData.category,
          course: quizData.course,
          subject: quizData.subject,
          period: quizData.period,
          lesson: quizData.lesson,
          time_limit: parseInt(quizData.time_limit),
        }])
        .select("id")
        .single();

      if (quizError) throw quizError;
      if (!insertedQuiz?.id) throw new Error("Failed to get quiz ID");

      const quizId = insertedQuiz.id;

      const questionsToInsert = questions.map((q) => ({
        quiz_id: quizId,
        question_type: q.question_type,
        question_text: q.question_text,
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_answer: q.correct_answer || null,
        correct_text_answer: q.correct_text_answer || null,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      alert("🎉 Quiz created successfully!");
      navigate("/teacher-dashboard");
    } catch (error) {
      console.error("❌ Error:", error);
      setError(`Failed to create quiz: ${error.message}`);
      setLoading(false);
    }
  };

  const renderQuestionInputs = (question, index) => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option}>
                  <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                    Option {option}
                  </label>
                  <input
                    type="text"
                    value={question[`option_${option.toLowerCase()}`]}
                    onChange={(e) =>
                      handleQuestionChange(index, `option_${option.toLowerCase()}`, e.target.value)
                    }
                    className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
                    placeholder={`Enter option ${option}`}
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                Correct Answer
              </label>
              <select
                value={question.correct_answer}
                onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all font-semibold"
                required
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </>
        );

      case 'true_false':
        return (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Correct Answer
            </label>
            <select
              value={question.correct_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all font-semibold"
              required
            >
              <option value="A">True</option>
              <option value="B">False</option>
            </select>
          </div>
        );

      case 'fill_blank':
        return (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Correct Answer
            </label>
            <input
              type="text"
              value={question.correct_text_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_text_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
              placeholder="Enter the correct answer to fill in the blank"
              required
            />
            <p className="text-xs text-cyan-400 mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">💡</span>
              <span>Tip: Use underscores (___) in your question to indicate where the blank should be</span>
            </p>
          </div>
        );

      case 'identification':
        return (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Correct Answer
            </label>
            <input
              type="text"
              value={question.correct_text_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_text_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500"
              placeholder="Enter the correct answer"
              required
            />
          </div>
        );

      case 'essay':
        return (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
              Model/Expected Answer (Optional)
            </label>
            <textarea
              value={question.correct_text_answer}
              onChange={(e) => handleQuestionChange(index, 'correct_text_answer', e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all min-h-[100px] placeholder-gray-500"
              placeholder="Enter a model answer or key points to guide grading (optional)"
            />
            <p className="text-xs text-yellow-400 mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">⚠️</span>
              <span>Note: Essay questions require manual grading</span>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-4 sm:py-8 bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 relative overflow-hidden">
        {/* Animated Background - Hidden on very small screens for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-20 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Scanline Effect - Reduced opacity on mobile */}
        <div className="absolute inset-0 pointer-events-none opacity-3 sm:opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Sparkles className="w-6 h-6 sm:w-10 sm:h-10 text-purple-400 flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
                CREATE NEW QUIZ 📝
              </h1>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg font-semibold uppercase tracking-wide">
              Build A Quiz With Multiple Assessment Types
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-900/50 backdrop-blur-xl border-2 border-red-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="flex items-start gap-2 text-red-300">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                  <span className="font-bold uppercase tracking-wide text-xs sm:text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Quiz Details */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-indigo-500/30 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-indigo-400 flex-shrink-0" />
                  <span>Quiz Details</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                      Quiz Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={quizData.title}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all placeholder-gray-500 font-semibold"
                      placeholder="e.g., JavaScript Basics Quiz"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                      <span>Course *</span>
                    </label>
                    <select
                      name="course"
                      value={quizData.course}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-blue-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all font-semibold"
                      required
                    >
                      <option value="">Select Course</option>
                      {courseOptions.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                      <span>Subject *</span>
                    </label>
                    <select
                      name="subject"
                      value={quizData.subject}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-purple-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/20 transition-all font-semibold disabled:opacity-50"
                      required
                      disabled={!quizData.course}
                    >
                      <option value="">
                        {quizData.course ? 'Select Subject' : 'Select Course First'}
                      </option>
                      {quizData.course && getSubjectsForCourse(quizData.course).map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    {!quizData.course && (
                      <p className="text-xs text-cyan-400 mt-1">
                        Please select a course first
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                      <span>Period</span>
                    </label>
                    <select
                      name="period"
                      value={quizData.period}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-green-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-green-400 focus:shadow-lg focus:shadow-green-500/20 transition-all font-semibold"
                    >
                      <option value="">Select Period</option>
                      {periodOptions.map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0" />
                      <span>Lesson</span>
                    </label>
                    <input
                      type="text"
                      name="lesson"
                      value={quizData.lesson}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-orange-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/20 transition-all placeholder-gray-500 font-semibold"
                      placeholder="e.g., Lesson 1, Chapter 3"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                      Category (Optional)
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={quizData.category}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-pink-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-pink-400 focus:shadow-lg focus:shadow-pink-500/20 transition-all placeholder-gray-500 font-semibold"
                      placeholder="e.g., Beginner, Advanced"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                      <span>Time Limit (minutes)</span>
                    </label>
                    <input
                      type="number"
                      name="time_limit"
                      value={quizData.time_limit}
                      onChange={handleQuizDataChange}
                      className="w-full bg-gray-800/50 border-2 border-cyan-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all font-semibold"
                      min="1"
                      max="180"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-purple-500/30 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 sm:w-8 sm:h-8 text-purple-400 flex-shrink-0" />
                    <span>Questions</span>
                  </h2>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
                  >
                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {questions.map((question, index) => (
                    <div key={index} className="bg-gray-900/50 border-2 border-indigo-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 relative overflow-hidden group hover:border-indigo-400/50 transition-all">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white uppercase tracking-wide">
                            Question {index + 1}
                          </h3>
                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-400 hover:text-red-300 p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                          {/* Question Type Selector */}
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-1 sm:gap-2">
                              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 flex-shrink-0" />
                              <span>Question Type</span>
                            </label>
                            <select
                              value={question.question_type}
                              onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                              className="w-full bg-gray-800/50 border-2 border-cyan-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all font-semibold"
                            >
                              {questionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Question Text */}
                          <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">
                              Question
                            </label>
                            <textarea
                              value={question.question_text}
                              onChange={(e) =>
                                handleQuestionChange(index, 'question_text', e.target.value)
                              }
                              className="w-full bg-gray-800/50 border-2 border-indigo-500/30 text-white text-sm sm:text-base rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/20 transition-all min-h-[80px] sm:min-h-[100px] placeholder-gray-500"
                              placeholder="Enter your question here..."
                              required
                            />
                          </div>

                          {/* Dynamic inputs based on question type */}
                          {renderQuestionInputs(question, index)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/teacher-dashboard')}
                className="w-full sm:flex-1 bg-gray-700/50 backdrop-blur-xl border-2 border-gray-600/30 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl hover:bg-gray-600/50 hover:border-gray-500/50 hover:shadow-lg hover:shadow-gray-500/20 transform hover:scale-105 transition-all uppercase tracking-wider text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none uppercase tracking-wider text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : ( 
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Create Quiz</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateQuiz;