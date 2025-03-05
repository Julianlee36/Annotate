import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LogIn } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="bg-gray-800 p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white">
          Annotate
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <Link 
              to="/profile" 
              className="flex items-center text-white hover:text-blue-400"
              title="Your Profile"
            >
              <User className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <Link 
              to="/signin" 
              className="flex items-center text-white hover:text-blue-400"
              title="Sign In"
            >
              <LogIn className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;