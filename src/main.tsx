import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import SignUp from './pages/SignUp.tsx'
import Login from './pages/login.tsx'
import ProfilePage from './pages/profile.tsx'
import GameViewPage from './pages/games.tsx'
import GameDetailsPage from './pages/gameDetails.tsx'

const router = createBrowserRouter(createRoutesFromElements(

  <Route path="/" element={<App />} >
    <Route path="signup" element={<SignUp />} />
    <Route path="login" element={<Login />} />
    <Route path="profile" element={<ProfilePage />} />
    <Route path="allgames" element={<GameViewPage />} />
    <Route path="game/:gameName" element={<GameDetailsPage />} />
  </Route>

));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
