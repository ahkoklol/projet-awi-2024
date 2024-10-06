import './App.css';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import { BasketProvider } from './context/BasketContext';

function App() {

  return (
    <BasketProvider>
      <div className="app-container">
        <Navbar />
        <ToastContainer />
        <div className="content">
          <Outlet />
        </div>
        <Footer />
      </div>
    </BasketProvider>
  );
}

export default App;
