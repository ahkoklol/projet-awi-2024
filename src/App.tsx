import './App.css';
import { Auth } from './components/auth';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';
import UserProfile from './components/userProfile';

function App() {
  return (
    <div>
      <UserProfile />
      <Auth />
      <ToastContainer />
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
