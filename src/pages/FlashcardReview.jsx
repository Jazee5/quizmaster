// src/pages/FlashcardReview.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Home,
  BookOpen,
  Check,
  X,
  Shuffle
} from 'lucide-react';
import Navbar from '../components/Navbar';

const FlashcardReview = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [masteredCards, setMasteredCards] = useState(new Set());
  const [needsReviewCards, setNeedsReviewCards] = useState(new Set());
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      // Fetch quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching quiz data:', err);
      setError('Failed to load flashcards. Please try again.');
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    const newMastered = new Set(masteredCards);
    newMastered.add(questions[currentIndex].id);
    setMasteredCards(newMastered);
    
    const newNeedsReview = new Set(needsReviewCards);
    newNeedsReview.delete(questions[currentIndex].id);
    setNeedsReviewCards(newNeedsReview);
    
    handleNext();
  };

  const handleNeedsReview = () => {
    const newNeedsReview = new Set(needsReviewCards);
    newNeedsReview.add(questions[currentIndex].id);
    setNeedsReviewCards(newNeedsReview);
    
    const newMastered = new Set(masteredCards);
    newMastered.delete(questions[currentIndex].id);
    setMasteredCards(newMastered);
    
    handleNext();
  };

  const shuffleCards = () => {
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQuestions);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffled(true);
  };

  const resetProgress = () => {
    setMasteredCards(new Set());
    setNeedsReviewCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const getAnswerText = (question) => {
    switch (question.question_type) {
      case 'multiple_choice':
        const correctOption = question.correct_answer;
        return question[`option_${correctOption.toLowerCase()}`];
      case 'true_false':
        return question.correct_answer === 'A' ? 'True' : 'False';
      case 'fill_blank':
      case 'identification':
      case 'essay':
        return question.correct_text_answer;
      default:
        return 'No answer available';
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 font-medium">Loading flashcards...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md text-center shadow-xl">
            <p className="text-red-400 mb-4 text-lg">{error}</p>
            <button 
              onClick={() => navigate('/review-quizzes')} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Back to Review
            </button>
          </div>
        </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md text-center shadow-xl">
            <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-100 mb-2">No questions available</p>
            <p className="text-gray-400 mb-4">This quiz doesn't have any questions yet.</p>
            <button 
              onClick={() => navigate('/review-quizzes')} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Back to Review
            </button>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const masteredCount = masteredCards.size;
  const needsReviewCount = needsReviewCards.size;

  return (
    <>
        <div className="min-h-screen py-8 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/review-quizzes')}
              className="text-gray-400 hover:text-purple-400 flex items-center gap-2 mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Review List
            </button>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text">
                  {quiz?.title}
                </h1>
                <p className="text-gray-400 mt-1">{quiz?.subject}</p>
              </div>
              <button
                onClick={shuffleCards}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-purple-300 font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </button>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-3 text-center shadow-lg">
                <p className="text-2xl font-bold text-purple-300">{currentIndex + 1}/{questions.length}</p>
                <p className="text-xs text-gray-400">Cards</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-800 border border-gray-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transition-all duration-300 shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Flashcard */}
          <div className="mb-6" style={{ perspective: '1000px' }}>
            <div
              onClick={handleFlip}
              className={`relative w-full cursor-pointer transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: '400px'
              }}
            >
              {/* Front of Card */}
              <div
                className={`absolute w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border-4 ${
                  masteredCards.has(currentQuestion.id)
                    ? 'border-green-500/50'
                    : needsReviewCards.has(currentQuestion.id)
                    ? 'border-orange-500/50'
                    : 'border-purple-500/50'
                } ${isFlipped ? 'invisible' : 'visible'}`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <span className="px-4 py-2 bg-purple-900/50 text-purple-300 rounded-full text-sm font-semibold border border-purple-500/30">
                      Question
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-100 leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                  <p className="text-sm text-gray-500 mt-6">Click to reveal answer</p>
                </div>
              </div>

              {/* Back of Card */}
              <div
                className={`absolute w-full bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white border-2 border-purple-500/30 ${
                  isFlipped ? 'visible' : 'invisible'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                      Answer
                    </span>
                  </div>
                  <p className="text-2xl font-bold leading-relaxed">
                    {getAnswerText(currentQuestion)}
                  </p>
                  <p className="text-sm text-white/80 mt-6">Click to see question</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Completion Message */}
          {currentIndex === questions.length - 1 && isFlipped && (
            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-500/50 rounded-2xl p-6 mt-6 text-center shadow-xl">
              <h3 className="text-2xl font-bold text-green-300 mb-2">🎉 You've reached the last card!</h3>
              <p className="text-gray-300 mb-4">
                You've reviewed {questions.length} flashcards. Great job!
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetProgress}
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-200 font-semibold py-2 px-6 rounded-lg transition-all"
                >
                  Review Again
                </button>
                <button
                  onClick={() => navigate('/review-quizzes')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg"
                >
                  <Home className="w-5 h-5" />
                  Back to Review List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FlashcardReview;