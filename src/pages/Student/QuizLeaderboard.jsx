// src/pages/QuizLeaderboard.jsx - Real-time version
import { useState, useEffect } from "react";
import { supabase } from "../../config/supabaseClient";
import { useAuth } from "../../context/AuthContext";

const QuizLeaderboard = ({ quizId, userScore }) => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    if (quizId && user) {
      fetchRankings();
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`quiz-leaderboard-${quizId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'scores',
            filter: `quiz_id=eq.${quizId}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // Refresh rankings when any change occurs
            fetchRankings();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [quizId, user]);

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`
          *,
          profiles:user_id (username, full_name, email)
        `)
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get only the latest attempt for each user
      const latestScores = {};
      data.forEach((score) => {
        if (!latestScores[score.user_id]) {
          latestScores[score.user_id] = score;
        }
      });

      // Convert object back to array
      const uniqueScores = Object.values(latestScores);

      // Sort by score (highest first), then by percentage
      const sortedScores = uniqueScores.sort((a, b) => {
        const percentA = (a.score / a.total_questions) * 100;
        const percentB = (b.score / b.total_questions) * 100;
        
        if (percentB !== percentA) {
          return percentB - percentA;
        }
        
        return b.score - a.score;
      });

      // Calculate rankings and score percentages
      const rankedData = sortedScores.map((item, index) => ({
        ...item,
        rank: index + 1,
        percentage: Math.round((item.score / item.total_questions) * 100),
        display_name: item.profiles?.username || 
                     item.profiles?.full_name || 
                     item.profiles?.email?.split('@')[0] || 
                     'Anonymous'
      }));

      setRankings(rankedData);

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
  const getRankColor = (rank, isCurrentUser) => {
    if (isCurrentUser) return "bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300";
    if (rank === 1) return "bg-yellow-100 border-yellow-500";
    if (rank === 2) return "bg-gray-100 border-gray-400";
    if (rank === 3) return "bg-orange-100 border-orange-500";
    return "bg-white border-gray-200";
  };

  // Score badge color
  const getScoreBadgeColor = (percentage) => {
    if (percentage >= 90) return "bg-green-500 text-white";
    if (percentage >= 80) return "bg-blue-500 text-white";
    if (percentage >= 70) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          🏆 Quiz Leaderboard
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 font-medium">Live</span>
        </div>
      </div>

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

      {/* No Results */}
      {rankings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No scores yet. Be the first to take this quiz!</p>
        </div>
      )}

      {/* Top Rankings */}
      <div className="space-y-3">
        {rankings.map((ranking) => {
          const isCurrentUser = ranking.user_id === user.id;
          
          return (
            <div
              key={ranking.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${getRankColor(
                ranking.rank,
                isCurrentUser
              )}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold w-12 text-center">
                  {getRankIcon(ranking.rank)}
                </div>
                <div>
                  <p className={`font-bold ${isCurrentUser ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {ranking.display_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">
                        YOU
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getScoreBadgeColor(ranking.percentage)}`}>
                      {ranking.percentage}%
                    </span>
                    <p className="text-xs text-gray-600">
                      {new Date(ranking.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {ranking.score}/{ranking.total_questions}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Showing latest attempt for each student • Sorted by highest score • Updates in real-time
        </p>
      </div>
    </div>
  );
};

export default QuizLeaderboard;