import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import Onboarding from '../pages/auth/Onboarding';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import SetupProfile from '../pages/auth/SetupProfile';
import Home from '../pages/Home';
import CreateRoom from '../pages/CreateRoom';
import Lobby from '../pages/Lobby';
import Game from '../pages/Game';
import Results from '../pages/Results';
import Profile from '../pages/Profile';
import NotRegistered from '../pages/NotRegistered';

export const router = createBrowserRouter([
  // Auth pages blocked for authenticated users
  {
    element: <GuestRoute />,
    children: [
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
    ],
  },
  // Auth pages always accessible (even when logged in)
  { path: '/verify-otp', element: <VerifyOtp /> },
  { path: '/forgot', element: <ForgotPassword /> },
  { path: '/reset', element: <ResetPassword /> },
  { path: '/setup-profile', element: <SetupProfile /> },
  // Protected game pages
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: '/home', element: <Home /> },
      { path: '/create', element: <CreateRoom /> },
      { path: '/lobby/:code', element: <Lobby /> },
      { path: '/game/:code', element: <Game /> },
      { path: '/results', element: <Results /> },
      { path: '/profile', element: <Profile /> },
      { path: '/not-registered', element: <NotRegistered /> },
    ],
  },
]);
