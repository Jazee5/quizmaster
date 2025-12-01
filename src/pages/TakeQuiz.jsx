// TakeQuiz.jsx - Fixed for Philippine Time
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Navbar from "../components/Navbar";
import {
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Timer,
  Zap,
  Lock
} from "lucide-react";

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Time limits per question type (in seconds)
  const TIME_LIMITS = {
    multiple_choice: 20,
    true_false: 15,
    fill_blank: 30,
    identification: 30,
    essay: 120,
  };

  const checkQuizAvailability = (quiz) => {
    const now = new Date();
    
    // Parse times without timezone conversion (treat as Philippine time)
    let openTime = null;
    let closeTime = null;
    
    if (quiz.open_time) {
      const cleanOpenTime = quiz.open_time.replace(/\+\d{2}:\d{2}$/, '').replace(' ', 'T').slice(0, 16);
      openTime = new Date(cleanOpenTime);
    }
    
    if (quiz.close_time) {
      const cleanCloseTime = quiz.close_time.replace(/\+\d{2}:\d{2}$/, '').replace(' ', 'T').slice(0, 16);
      closeTime = new Date(cleanCloseTime);
    }

    if (!openTime && !closeTime) {
      return { available: true, status: 'open', message: '' };
    }

    if (openTime && now < openTime) {
      return {
        available: false,
        status: 'not_open',
        message: `Quiz opens on ${openTime.toLocaleString('en-PH', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}`
      };
    }

    if (closeTime && now > closeTime) {
      return {
        available: false,
        status: 'closed',
        message: `Quiz closed on ${closeTime.toLocaleString('en-PH', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}`
      };
    }

    return {
      available: true,
      status: 'open',
      message: closeTime ? `Quiz closes on ${closeTime.toLocaleString('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })}` : ''
    };
  };

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  useEffect(() => {
    if (quizStarted && questionTimeRemaining > 0) {
      const timer = setInterval(() => {
        setQuestionTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizStarted, questionTimeRemaining, currentQuestionIndex]);

  const fetchQuizData = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();
      if (quizError) throw quizError;

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: true });
      if (questionsError) throw questionsError;

      setQuiz(quizData);
      setQuestions(questionsData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to load quiz. Please try again.");
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
    const firstQuestion = questions[0];
    setQuestionTimeRemaining(TIME_LIMITS[firstQuestion.question_type] || 30);
  };

  const handleTimeExpired = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToNextQuestion();
    } else {
      handleSubmitQuiz(true);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm("Are you sure you want to submit your quiz?")) return;
    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated.");

      let score = 0;
      const correctAnswers = {};
      const totalQuestions = questions.length;

      questions.forEach((question, index) => {
        const userAnswer = answers[question.id];
        
        let correctAnswer = "";
        
        if (question.question_type === "multiple_choice") {
          const correctLetter = (question.correct_answer || "").toUpperCase().trim();
          correctAnswer = question[`option_${correctLetter.toLowerCase()}`] || "";
        } else {
          correctAnswer = question.correct_answer || question.correct_text_answer || "";
        }

        const normalizedUserAnswer = userAnswer 
          ? String(userAnswer).toLowerCase().trim() 
          : "";
        const normalizedCorrectAnswer = String(correctAnswer).toLowerCase().trim();

        const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

        correctAnswers[question.id] = {
          correct_answer: correctAnswer,
          isCorrect: isCorrect,
        };

        if (isCorrect) {
          score++;
        }
      });

      const endTime = Date.now();
      const timeTaken = Math.floor((endTime - startTime) / 1000);

      const { data: insertedData, error: scoreError } = await supabase
        .from("scores")
        .insert([
          {
            user_id: user.id,
            quiz_id: quizId,
            score: score,
            total_questions: totalQuestions,
            time_taken: timeTaken,
            answers: JSON.stringify(answers),
            correct_answers: JSON.stringify(correctAnswers),
            completed_at: new Date().toISOString(),
          },
        ])
        .select();

      if (scoreError) {
        console.error("Database Insert Error:", scoreError);
        throw scoreError;
      }

      navigate(`/quiz-result/${quizId}`, {
        state: { score, totalQuestions, quizTitle: quiz.title },
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setError("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = questions[nextIndex];
      setQuestionTimeRemaining(TIME_LIMITS[nextQuestion.question_type] || 30);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevQuestion = questions[prevIndex];
      setQuestionTimeRemaining(TIME_LIMITS[prevQuestion.question_type] || 30);
    }
  };

  const renderQuestionInput = (question) => {
    const userAnswer = answers[question.id] || "";

    switch (question.question_type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            {["A", "B", "C", "D"].map((option) => {
              const optionText = question[`option_${option.toLowerCase()}`];
              if (!optionText) return null;

              return (
                <label
                  key={option}
                 className={`flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all group text-sm sm:text-base ${
                    userAnswer === optionText
                      ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
                      : "border-gray-600 hover:border-cyan-500/50 hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionText}
                    checked={userAnswer === optionText}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="w-5 h-5 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="ml-3 text-white font-semibold uppercase tracking-wide">
                    {option}. {optionText}
                  </span>
                </label>
              );
            })}
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            {["True", "False"].map((val) => (
              <label
                key={val}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  userAnswer === val
                    ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20"
                    : "border-gray-600 hover:border-cyan-500/50 hover:bg-gray-800/50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={val}
                  checked={userAnswer === val}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  className="w-5 h-5 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="ml-3 text-white font-semibold uppercase tracking-wide">{val}</span>
              </label>
            ))}
          </div>
        );

      case "fill_blank":
      case "identification":
        return (
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white rounded-xl py-2.5 px-3 text-sm sm:text-base focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500"
            placeholder="Type your answer here..."
          />
        );

      case "essay":
        return (
          <textarea
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full bg-gray-900/50 border-2 border-cyan-500/30 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-500/20 transition-all placeholder-gray-500 min-h-[200px]"
            placeholder="Write your answer here..."
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Quiz...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 p-8 max-w-md w-full text-center shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Error</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-2xl hover:shadow-red-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!quizStarted) {
    const availability = checkQuizAvailability(quiz);

    if (!availability.available) {
      return (
        <>
          <Navbar />
          <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md mx-auto px-3 sm:px-4 relative z-10">
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-red-500/50 p-8 text-center shadow-2xl">
                <Lock className="w-20 h-20 text-red-400 mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-white mb-4 uppercase tracking-wide">
                  Quiz Unavailable
                </h1>
                <div className={`p-4 rounded-xl mb-6 ${
                  availability.status === 'not_open' 
                    ? 'bg-yellow-500/20 border border-yellow-500/50' 
                    : 'bg-red-500/20 border border-red-500/50'
                }`}>
                  <p className={`text-lg font-bold uppercase tracking-wide ${
                    availability.status === 'not_open' ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {availability.message}
                  </p>
                </div>
               <button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all uppercase tracking-wider"
              >
                Back to Dashboard
              </button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <Navbar />
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-20 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-20 right-20 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          <div className="w-full max-w-md sm:max-w-2xl mx-auto px-3 sm:px-4 relative z-10">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-5 sm:p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>

              <div className="absolute top-0 left-0 w-14 h-14 sm:w-20 sm:h-20 border-t-2 border-l-2 border-purple-400/50 rounded-tl-2xl"></div>
              <div className="absolute bottom-0 right-0 w-14 h-14 sm:w-20 sm:h-20 border-b-2 border-r-2 border-pink-400/50 rounded-br-2xl"></div>

              <div className="relative z-10">
                <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />

                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4 uppercase tracking-wide break-words">
                  {quiz.title}
                </h1>

                <div className="flex items-center justify-center gap-4 sm:gap-8 text-gray-300 mb-4 text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    <span className="font-bold uppercase tracking-wider">
                      {questions.length} Questions
                    </span>
                  </div>
                </div>

                {availability.message && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 mb-6">
                    <p className="text-green-300 font-semibold text-sm sm:text-base">
                      {availability.message}
                    </p>
                  </div>
                )}

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 sm:p-4 mb-6 text-sm sm:text-base">
                  <p className="text-cyan-300 font-bold uppercase tracking-wide mb-2">⏱️ Timed Questions</p>
                  <div className="text-gray-300 space-y-1">
                    <p>• Multiple Choice: 20 seconds</p>
                    <p>• True/False: 15 seconds</p>
                    <p>• Fill in the Blank: 30 seconds</p>
                    <p>• Identification: 30 seconds</p>
                    <p>• Essay: 2 minutes</p>
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-base sm:text-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all uppercase tracking-wider w-full sm:w-auto"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const timePercentage = (questionTimeRemaining / TIME_LIMITS[currentQuestion.question_type]) * 100;

  return (
    <>
      <div className="min-h-screen py-4 sm:py-6 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 relative z-10">
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-4 sm:p-5 mb-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wide">
                    {quiz.title}
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-base border-2 w-full sm:w-auto justify-center ${
                    questionTimeRemaining <= 5
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                      : questionTimeRemaining <= 10
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                      : "bg-green-500/20 border-green-500 text-green-400"
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  {formatTime(questionTimeRemaining)}
                </div>
              </div>

              <div className="relative w-full h-2 bg-gray-900/50 rounded-full overflow-hidden border border-gray-700 mb-2">
                <div
                  className={`absolute h-full transition-all duration-800 ${
                    timePercentage <= 25
                      ? "bg-red-500"
                      : timePercentage <= 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>

              <div className="relative w-full h-3 bg-gray-900/50 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="absolute h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-1 text-xs text-gray-400 text-right font-semibold uppercase tracking-wider">
                {answeredCount} of {questions.length} answered
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-cyan-500/30 p-5 mb-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none"></div>

            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/50">
                {currentQuestionIndex + 1}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                    {currentQuestion.question_text}
                  </h3>

                  <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-full font-bold uppercase whitespace-nowrap ml-2">
                    {currentQuestion.question_type.replace("_", " ")}
                  </span>
                </div>

                {renderQuestionInput(currentQuestion)}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between gap-3">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-700 text-white font-bold py-3 px-5 rounded-xl flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-all uppercase tracking-wider"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={() => handleSubmitQuiz(false)}
                  disabled={submitting}
                  className="bg-green-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-all uppercase tracking-wider"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:scale-105 transition-all uppercase tracking-wider"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TakeQuiz;