import './App.css';
import { Auth } from './components/auth';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div>
      <Auth />
      <ToastContainer />
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default App;
