// src/components/Navbar.jsx - Fully Responsive Version
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, BarChart3, BookOpen, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  const role = profile?.role || 'student';
  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Common header
  const Brand = ({ gradientFrom, gradientTo }) => (
    <Link
      to={role === 'teacher' ? '/teacher-dashboard' : '/dashboard'}
      className="flex items-center gap-2 group"
    >
      <div
        className={`w-10 h-10 bg-gradient-to-br from-${gradientFrom} to-${gradientTo} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-${gradientFrom}/50 transition-all`}
      >
        <BookOpen className="w-6 h-6 text-white" />
      </div>
      <span
        className={`text-xl font-bold bg-gradient-to-r from-${gradientFrom} to-${gradientTo} bg-clip-text text-transparent`}
      >
        QuizMaster
      </span>
    </Link>
  );

  return (
    <nav
      className={`bg-gray-900 border-b-2 ${
        role === 'teacher'
          ? 'border-indigo-500/30'
          : 'border-cyan-500/30'
      } backdrop-blur-xl relative z-50`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Brand
            gradientFrom={role === 'teacher' ? 'indigo-500' : 'cyan-500'}
            gradientTo={role === 'teacher' ? 'purple-500' : 'purple-500'}
          />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-4">
            {role === 'student' && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-all font-semibold uppercase tracking-wide"
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/results"
                  className="flex items-center gap-2 text-gray-300 hover:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all font-semibold uppercase tracking-wide"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Results</span>
                </Link>
              </>
            )}

            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700">
              <div className="text-right">
                <p className="text-sm font-bold text-white uppercase tracking-wide">
                  {user.user_metadata?.username ||
                    user.user_metadata?.full_name ||
                    user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400 font-semibold capitalize">
                  {role}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-300 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col bg-gray-800/80 border-t border-gray-700 px-4 py-3 space-y-3">
          {role === 'student' && (
            <>
              <Link
                to="/dashboard"
                onClick={toggleMenu}
                className="flex items-center gap-2 text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-all font-semibold uppercase tracking-wide"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Link>

              <Link
                to="/results"
                onClick={toggleMenu}
                className="flex items-center gap-2 text-gray-300 hover:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all font-semibold uppercase tracking-wide"
              >
                <BarChart3 className="w-5 h-5" />
                Results
              </Link>
            </>
          )}

          <div className="border-t border-gray-700 pt-3">
            <p className="text-sm font-bold text-white uppercase tracking-wide">
              {user.user_metadata?.username ||
                user.user_metadata?.full_name ||
                user.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-400 font-semibold capitalize">
              {role}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-300 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all font-semibold uppercase tracking-wide"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
