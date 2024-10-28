import './App.css';
import { ToastContainer } from 'react-toastify';
import { Outlet } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/footer';
import { BasketProvider } from './context/BasketContext';
import { SessionProvider } from './context/SessionContext';

function App() {

  return (
    <BasketProvider>
      <SessionProvider>
        <div className="app-container">
          <Navbar />
          <ToastContainer
            position="top-right" // Still keep it on the top-right
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            className="Toastify__toast-container--custom" // Apply custom class
          />
          <div className="content">
            <Outlet />
          </div>
          <Footer />
        </div>
      </SessionProvider>
    </BasketProvider>
  );
}

export default App;
