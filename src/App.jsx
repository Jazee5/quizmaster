// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing Page
import Landing from './pages/Landing';

// Pages
import TeacherLogin from './pages/Teacher/TeacherLogin';
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import Login from './pages/Student/Login';
import Dashboard from './pages/Student/Dashboard';
import CreateQuiz from './pages/Teacher/CreateQuiz';
import EditQuiz from './pages/Teacher/EditQuiz';
import QuizResult from './pages/Student/QuizResult';
import TakeQuiz from './pages/Student/TakeQuiz';
import QuizResultsDetail from './pages/Student/QuizResultsDetail';
import QuizResultsManager from './pages/Teacher/QuizResultsManager';
import StudentResultsPage from './pages/Student/StudentResultsPage';
import ReviewQuizzesPage from './pages/Student/ReviewQuizzesPage';
import FlashcardReview from './pages/Student/FlashcardReview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />

          {/* Protected routes */}
          <Route 
            path="/teacher-dashboard" 
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <Dashboard />
              </ProtectedRoute>
            }
          />

         

          <Route
            path="/create-quiz"
            element={
              <ProtectedRoute requiredRole="teacher">
                <CreateQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/take-quiz/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <TakeQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-result/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizResult />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-results/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizResultsDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-results"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizResultsManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentResultsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/review-quizzes"
            element={
              <ProtectedRoute requiredRole="student">
                <ReviewQuizzesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/flashcard-review/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <FlashcardReview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-quiz/:id"
            element={
              <ProtectedRoute requiredRole="teacher">
                <EditQuiz />
              </ProtectedRoute>
            }
          />

          {/* If no route found → go to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
