// src/pages/QuizLeaderboard.jsx
import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";

const QuizLeaderboard = ({ quizId, userScore }) => {
  const { user } = useAuth(); // get logged-in user
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

useEffect(() => {
  if (quizId && user) {
    fetchRankings();
  }
}, [quizId, user]);

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`
          *,
          profiles:user_id (username, full_name)
        `)
        .eq("quiz_id", quizId)
        .order("score", { ascending: false });

      if (error) throw error;

      // Calculate rankings and score percentages
      const rankedData = data.map((item, index) => ({
        ...item,
        rank: index + 1,
        percentage: Math.round((item.score / item.total_questions) * 100),
      }));

      setRankings(rankedData.slice(0, 10)); // Show top 10

      // Find the logged-in user's rank
      const myRank = rankedData.findIndex((r) => r.user_id === user.id);
      setUserRank(myRank !== -1 ? myRank + 1 : null);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setLoading(false);
    }
  };

  // Emoji icons for ranks
  const getRankIcon = (rank) => {
    if (rank === 1) return "🏆";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  // Background color per rank
  const getRankColor = (rank) => {
    if (rank === 1) return "bg-yellow-100 border-yellow-500";
    if (rank === 2) return "bg-gray-100 border-gray-400";
    if (rank === 3) return "bg-orange-100 border-orange-500";
    return "bg-white border-gray-200";
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 py-6">
        Loading leaderboard...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
        🏆 Quiz Leaderboard
      </h2>

      {/* User's Rank Display */}
      {userRank && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-300">
          <p className="text-center text-lg font-medium">
            <span className="font-bold text-indigo-700">Your Rank:</span>{" "}
            <span className="text-2xl font-bold text-indigo-700">
              {getRankIcon(userRank)}
            </span>{" "}
            <span className="ml-1 text-gray-700">
              {userRank} out of {rankings.length}
            </span>
          </p>
        </div>
      )}

      {/* Top Rankings */}
      <div className="space-y-3">
        {rankings.map((ranking) => (
          <div
            key={ranking.id}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${getRankColor(
              ranking.rank
            )}`}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold w-12 text-center">
                {getRankIcon(ranking.rank)}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {ranking.profiles?.username ||
                    ranking.profiles?.full_name ||
                    "Anonymous"}
                </p>
                <p className="text-sm text-gray-600">
                  {ranking.percentage}% correct
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {ranking.score}/{ranking.total_questions}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizLeaderboard;
