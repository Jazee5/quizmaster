// src/pages/QuizBrowser.jsx - Course & Subject Required Before Showing Quizzes
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import {
  BookOpen,
  Filter,
  Play,
  Clock,
  GraduationCap,
  Calendar,
  FileText,
} from "lucide-react";
import Navbar from "../components/Navbar";

const QuizBrowser = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("none");
  const [selectedSubject, setSelectedSubject] = useState("none");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedLesson, setSelectedLesson] = useState("all");

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setQuizzes(data || []);
      setCourses([...new Set(data.map((q) => q.course).filter(Boolean))]);
      setPeriods([...new Set(data.map((q) => q.period).filter(Boolean))]);
      setLessons([...new Set(data.map((q) => q.lesson).filter(Boolean))]);
    } catch (err) {
      setError("Failed to load quizzes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // update subjects when course changes
  useEffect(() => {
    if (selectedCourse === "none") {
      setSubjects([]);
      setSelectedSubject("none");
      return;
    }

    const courseSubjects = quizzes
      .filter((q) => q.course === selectedCourse)
      .map((q) => q.subject)
      .filter(Boolean);

    setSubjects([...new Set(courseSubjects)]);
    setSelectedSubject("none");
  }, [selectedCourse, quizzes]);

  // update filtered quizzes only if both course & subject are selected
  useEffect(() => {
    if (selectedCourse === "none" || selectedSubject === "none") {
      setFilteredQuizzes([]);
      return;
    }

    let filtered = [...quizzes];

    filtered = filtered.filter((q) => q.course === selectedCourse);
    filtered = filtered.filter((q) => q.subject === selectedSubject);

    if (selectedPeriod !== "all")
      filtered = filtered.filter((q) => q.period === selectedPeriod);
    if (selectedLesson !== "all")
      filtered = filtered.filter((q) => q.lesson === selectedLesson);

    setFilteredQuizzes(filtered);
  }, [selectedCourse, selectedSubject, selectedPeriod, selectedLesson, quizzes]);

  const resetFilters = () => {
    setSelectedCourse("none");
    setSelectedSubject("none");
    setSelectedPeriod("all");
    setSelectedLesson("all");
    setFilteredQuizzes([]);
    setSubjects([]);
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900">
          <div className="text-center text-white font-bold">
            Loading Quizzes...
          </div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className="text-center text-red-400 mt-10">{error}</div>
      </>
    );

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 bg-gradient-to-br from-gray-900 via-cyan-900 to-gray-900 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-cyan-400 mb-6 text-center">
            Browse Quizzes
          </h1>

          {/* Filter Section */}
          <div className="bg-gray-800/50 rounded-2xl border-2 border-cyan-500/30 p-6 shadow-2xl mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Course */}
              <div>
                <label className="text-cyan-300 font-bold text-sm mb-2 block">
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full bg-gray-900/60 border border-cyan-500/30 text-white rounded-xl py-2 px-3 focus:border-cyan-400"
                >
                  <option value="none">Select Course</option>
                  {courses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="text-cyan-300 font-bold text-sm mb-2 block">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={selectedCourse === "none"}
                  className={`w-full bg-gray-900/60 border ${
                    selectedCourse === "none"
                      ? "border-gray-700 text-gray-500"
                      : "border-cyan-500/30 text-white"
                  } rounded-xl py-2 px-3 focus:border-cyan-400`}
                >
                  {selectedCourse === "none" ? (
                    <option value="none">Select a course first</option>
                  ) : (
                    <>
                      <option value="none">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Period */}
              <div>
                <label className="text-cyan-300 font-bold text-sm mb-2 block">
                  Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-gray-900/60 border border-cyan-500/30 text-white rounded-xl py-2 px-3 focus:border-cyan-400"
                >
                  <option value="all">All Periods</option>
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson */}
              <div>
                <label className="text-cyan-300 font-bold text-sm mb-2 block">
                  Lesson
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full bg-gray-900/60 border border-cyan-500/30 text-white rounded-xl py-2 px-3 focus:border-cyan-400"
                >
                  <option value="all">All Lessons</option>
                  {lessons.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 px-6 rounded-xl hover:shadow-lg hover:shadow-red-500/40"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Quiz Display */}
          <div className="bg-gray-800/50 rounded-2xl border-2 border-cyan-500/30 p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Available Quizzes
            </h2>

            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                {selectedCourse === "none"
                  ? "Please select a course to view subjects and quizzes."
                  : selectedSubject === "none"
                  ? "Please select a subject to view available quizzes."
                  : "No quizzes found for this selection."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-gray-900/60 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400 transition-all"
                  >
                    <h3 className="text-white font-bold text-lg mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">
                      {quiz.course} - {quiz.subject}
                    </p>
                    <div className="flex justify-between text-gray-400 text-sm mb-4">
                      <span>
                        <BookOpen className="inline w-4 h-4 mr-1" />
                        {quiz.questions?.[0]?.count || 0} Questions
                      </span>
                      <span>
                        <Clock className="inline w-4 h-4 mr-1" />
                        {quiz.time_limit} mins
                      </span>
                    </div>
                    <Link
                      to={`/take-quiz/${quiz.id}`}
                      className="block w-full text-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-2 rounded-xl hover:shadow-lg hover:shadow-cyan-500/40"
                    >
                      <Play className="inline w-4 h-4 mr-2" />
                      Start Quiz
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizBrowser;
