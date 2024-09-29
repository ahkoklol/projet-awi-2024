import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import SignUp from './pages/SignUp.tsx'

const router = createBrowserRouter(createRoutesFromElements(

  <Route path="/" element={<App />} >
    <Route path="signup" element={<SignUp />} />
  </Route>

));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
