import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import SignupPage from '../pages/SignupPage';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import MapPage from '../pages/ItineraryPage';

import { APIProvider } from '@vis.gl/react-google-maps';

const GoogleMapsAPIKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function App() {
  const [session, setSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('supabase_session');
      if (sessionStr) {
        setSession(JSON.parse(sessionStr));
      }
    } catch (err) {
      console.error('Error parsing session:', err);
      localStorage.removeItem('supabase_session');
      setSession(null);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  // Show loading screen until session check is done
  if (!sessionChecked) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <APIProvider apiKey={GoogleMapsAPIKey}>
      <Router>
        <Routes>
          {/* Signup & Login with setSession */}
          <Route path="/signup" element={<SignupPage setSession={setSession} />} />
          <Route path="/login" element={<LoginPage setSession={setSession} />} />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/login" />}
          />

          {/* Trip Map Page */}
          <Route path="/itinerarypage/:tripId" element={<MapPage />} />

          {/* Default Redirect */}
          <Route
            path="*"
            element={<Navigate to={session ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </Router>
    </APIProvider>
  );
}

export default App;
