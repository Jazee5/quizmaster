// src/pages/QuizResult.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Navbar from "../components/Navbar";
import QuizLeaderboard from "./QuizLeaderboard";
import {
  CheckCircle,
  XCircle,
  Home,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const QuizResult = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { score: stateScore, totalQuestions: stateTotal } = location.state || {};

  const [score, setScore] = useState(stateScore || 0);
  const [totalQuestions, setTotalQuestions] = useState(stateTotal || 0);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [correctAnswers, setCorrectAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchResultData();
  }, [quizId]);

const fetchResultData = async () => {
  try {
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();
    if (quizError) throw quizError;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // ✅ Get latest score for this user
    const { data: scoreData, error: scoreError } = await supabase
      .from("scores")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (scoreError) throw scoreError;

    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: true });
    if (questionsError) throw questionsError;

    // ✅ Parse JSON safely
    const parsedAnswers = typeof scoreData.answers === "string"
      ? JSON.parse(scoreData.answers)
      : scoreData.answers || {};

    const parsedCorrectAnswers = typeof scoreData.correct_answers === "string"
      ? JSON.parse(scoreData.correct_answers)
      : scoreData.correct_answers || {};

    setQuiz(quizData);
    setQuestions(questionsData);
    setUserAnswers(parsedAnswers);
    setCorrectAnswers(parsedCorrectAnswers);
    setScore(scoreData.score);
    setTotalQuestions(scoreData.total_questions);
    setLoading(false);
  } catch (err) {
    console.error("Error:", err);
    setError("Failed to load results");
    setLoading(false);
  }
};

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600 font-medium">Loading quiz results...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center text-center">
          <div className="card">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const scorePercent = Math.round((score / totalQuestions) * 100);

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl text-center py-10 px-6">
            <div className="flex justify-center mb-4">
              <Trophy className="w-14 h-14 text-yellow-300 drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-extrabold mb-2 text-white">
              {quiz?.title || "Quiz Result"}
            </h1>
            <p className="text-gray-200 mb-4 text-lg">{quiz?.subject}</p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl border border-white/20">
                <p className="text-5xl font-extrabold text-yellow-300">{score}</p>
                <p className="text-gray-200 font-medium">Score</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl border border-white/20">
                <p className="text-5xl font-extrabold text-green-400">
                  {totalQuestions}
                </p>
                <p className="text-gray-200 font-medium">Total Questions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-xl border border-white/20">
                <p className="text-5xl font-extrabold text-blue-400">
                  {scorePercent}%
                </p>
                <p className="text-gray-200 font-medium">Accuracy</p>
              </div>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-8 bg-white text-purple-700 hover:bg-purple-100 font-bold py-3 px-6 rounded-full transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
            >
              <Home className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Leaderboard */}
          <QuizLeaderboard
            quizId={quizId}
            userScore={score}
            totalQuestions={totalQuestions}
          />

          {/* Review Section */}
          <div className="card">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-2xl font-bold text-gray-900">
                Review Your Answers
              </h2>
              {showReview ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>

           {showReview && (
  <div className="mt-6 space-y-6">
    {questions.map((question, index) => {
      const userAnswer = userAnswers[question.id];
      const correctData = correctAnswers[question.id];
      const isCorrect = correctData?.isCorrect;
      const correctAnswerText =
        typeof correctData?.correct_answer === "object"
          ? JSON.stringify(correctData.correct_answer)
          : correctData?.correct_answer || "N/A";

      return (
        <div
          key={question.id}
          className={`p-6 rounded-2xl border-2 transition-all ${
            isCorrect
              ? "border-green-500 bg-green-50"
              : "border-red-500 bg-red-50"
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900">
              {index + 1}. {question.question_text}
            </h3>
            {isCorrect ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>

          <p className="text-gray-800 mb-1">
            <strong>Your Answer:</strong>{" "}
            {userAnswer ? (
              <span
                className={
                  isCorrect
                    ? "text-green-700 font-semibold"
                    : "text-red-700 font-semibold"
                }
              >
                {typeof userAnswer === "object"
                  ? JSON.stringify(userAnswer)
                  : userAnswer}
              </span>
            ) : (
              <em className="text-gray-500">Not answered</em>
            )}
          </p>

          {!isCorrect && (
            <p className="text-gray-800">
              <strong>Correct Answer:</strong>{" "}
              {correctAnswerText}
            </p>
          )}
        </div>
      );
    })}
  </div>
)}

          </div>
        </div>
      </div>
    </>
  );
};

export default QuizResult;
