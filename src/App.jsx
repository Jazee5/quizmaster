// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import TeacherLogin from './pages/TeacherLogin';
import TeacherSignup from './pages/TeacherSignup';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import QuizBrowser from './pages/QuizBrowser';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import QuizResult from './pages/QuizResult';
import TakeQuiz from './pages/TakeQuiz';
import QuizResultsDetail from './pages/QuizResultsDetail';
import QuizResultsManager from './pages/QuizResultsManager';
import StudentResultsPage from './pages/StudentResultsPage';
import ReviewQuizzesPage from './pages/ReviewQuizzesPage';
import FlashcardReview from './pages/FlashcardReview';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/teacher-signup" element={<TeacherSignup />} />
          
          {/* Protected routes with ProtectedRoute wrapper */}
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
            path="/browse-quizzes"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizBrowser />
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
                <EditQuiz/>
              </ProtectedRoute>
            }
          />
          
         <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;