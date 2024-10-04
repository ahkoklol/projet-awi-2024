import './App.css';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom'; // Import useNavigate
import UserProfile from './components/userProfile';
import Navbar from './components/navbar';
import Footer from './components/footer';

function App() {

  return (
    <div>
      <UserProfile />
      <ToastContainer />
      <Navbar />
        <div>
          <Outlet />
        </div>
      <Footer />
    </div>
  );
}

export default App;
