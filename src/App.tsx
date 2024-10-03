import './App.css';
import { Auth } from './components/auth';
import { ToastContainer } from 'react-toastify';
import { Outlet, useNavigate } from 'react-router-dom'; // Import useNavigate
import UserProfile from './components/userProfile';
import Navbar from './components/navbar';
import Footer from './components/footer';

function App() {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Handler functions for navigation
  const handleSignUpClick = () => {
    navigate('/signup'); // Navigate to sign-up page
  };

  const handleLoginClick = () => {
    navigate('/login'); // Navigate to login page
  };

  return (
    <div>
      <UserProfile />
      <Auth />
      <ToastContainer />
      <Navbar />
        <div>
          <Outlet />
        </div>
      <div>
        <button onClick={handleSignUpClick}>Sign Up</button> {/* Replaced href with onClick */}
        <button onClick={handleLoginClick}>Login</button>   {/* Replaced href with onClick */}
      </div>
      <Footer />
    </div>
  );
}

export default App;
