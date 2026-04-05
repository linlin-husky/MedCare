import { useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { ACTIONS, initialState, appReducer } from '../reducers/appReducer.js';
import * as api from './services/api.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from './constants.js';

// Components
import Sidebar from './components/Sidebar.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import Calendar from './components/Calendar.jsx';
import MedicalTests from './components/MedicalTests.jsx';
import ManagePrescriptions from './components/ManagePrescriptions.jsx';
import ReportSymptoms from './components/ReportSymptoms.jsx';
import BodyMeasurement from './components/BodyMeasurement.jsx';
import PulseMonitoring from './components/PulseMonitoring.jsx';
import Visualization from './components/Visualization.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import SuccessMessage from './components/SuccessMessage.jsx';
import ProfileEdit from './components/ProfileEdit.jsx';
import UserDirectory from './components/UserDirectory.jsx';

import './App.css';

// ============ CONSTANTS ============
const PAGE_COMPONENTS = {
  'dashboard': Dashboard,
  'calendar': Calendar,
  'tests': MedicalTests,
  'manage-prescriptions': ManagePrescriptions,
  'report-symptoms': ReportSymptoms,
  'body-measurement': BodyMeasurement,
  'pulse-monitoring': PulseMonitoring,
  'visualization': Visualization,
  'profile': ProfileEdit,
  'directory': UserDirectory
};

const PROTECTED_PAGES = ['dashboard', 'calendar', 'tests', 'manage-prescriptions', 'report-symptoms', 'body-measurement', 'pulse-monitoring', 'visualization', 'profile', 'directory'];

// ============ MAIN COMPONENT ============
function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ============ SESSION CHECK ============
  useEffect(() => {
    checkSession();
  }, []);

  // ============ GLOBAL PROFILE STATE ============
  const [selectedUsername, setSelectedUsername] = useState(null);

  useEffect(() => {
    if (state.user?.username && !selectedUsername) {
      setSelectedUsername(state.user.username);
    }
  }, [state.user, selectedUsername]);

  const profiles = useMemo(() => {
    const list = [{ username: state.user?.username, displayName: 'Me' }];
    if (state.user?.familyMembers) {
      state.user.familyMembers.forEach(m => {
        const username = m.username || `virtual:${state.user.username}:${m.name}`;
        list.push({ username: username, displayName: `${m.name} (${m.relation})${!m.username ? ' (Local)' : ''}` });
      });
    }
    return list;
  }, [state.user]);

  const checkSession = useCallback(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    api.fetchSession()
      .then(userData => {
        dispatch({ type: ACTIONS.SET_USER, payload: userData });
      })
      .catch(() => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      });
  }, []);

  // ============ AUTH HANDLERS ============
  const handleLogin = useCallback((username) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    api.login(username)
      .then(userData => {
        dispatch({ type: ACTIONS.SET_USER, payload: userData });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: SUCCESS_MESSAGES.LOGIN_SUCCESS });
      })
      .catch(err => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        const errorMsg = ERROR_MESSAGES[err.error] || err.message || ERROR_MESSAGES.default;
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorMsg });
      });
  }, []);

  const handleRegister = useCallback((formData) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: ACTIONS.CLEAR_ERROR });

    api.register(formData.username, formData.displayName, formData.email, formData.phone)
      .then(userData => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        dispatch({ type: ACTIONS.SET_SUCCESS, payload: SUCCESS_MESSAGES.SIGNUP_SUCCESS });
      })
      .catch(err => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        const errorMsg = ERROR_MESSAGES[err.error] || err.message || ERROR_MESSAGES.default;
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorMsg });
      });
  }, []);

  const handleLogout = useCallback(() => {
    api.logout()
      .then(() => {
        dispatch({ type: ACTIONS.LOGOUT });
      })
      .catch(() => {
        dispatch({ type: ACTIONS.LOGOUT });
      });
  }, []);

  // ============ NAVIGATION & MESSAGES ============
  const navigateTo = useCallback((page) => {
    dispatch({ type: ACTIONS.SET_PAGE, payload: page });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
    dispatch({ type: ACTIONS.CLEAR_SUCCESS });
  }, []);

  // ============ EARLY RETURNS FOR AUTH STATES ============
  if (!state.isLoggedIn && state.currentPage === 'register') {
    return (
      <RegisterForm
        onRegister={handleRegister}
        onSwitchToLogin={() => navigateTo('login')}
        error={state.error}
        success={state.success}
      />
    );
  }

  if (!state.isLoggedIn) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => navigateTo('register')}
        error={state.error}
        success={state.success}
      />
    );
  }

  // ============ GET CURRENT PAGE COMPONENT ============
  const CurrentPageComponent = PAGE_COMPONENTS[state.currentPage];

  // ============ RENDER AUTHENTICATED APP ============
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar currentPage={state.currentPage} navigateTo={navigateTo} />

      <main id="main-content" className="main-content">
        <header className="top-bar">
          <div className="user-info">
            {state.user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span onClick={() => navigateTo('profile')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>Logged in as {state.user.displayName}</div>
                  {(() => {
                    const currentProfile = profiles.find(p => p.username === selectedUsername);
                    return currentProfile ? (
                      <div style={{ fontSize: '14px' }}>Viewing: <b>{currentProfile.displayName}</b></div>
                    ) : (
                      <div style={{ fontSize: '14px' }}>Viewing: <b>{state.user.displayName}</b></div>
                    );
                  })()}
                </span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </header>

        {/* Loading & Message States */}
        {state.isLoading && <LoadingSpinner />}
        {state.error && <ErrorMessage message={state.error} onClose={clearMessages} />}
        {state.success && <SuccessMessage message={state.success} onClose={clearMessages} />}

        {/* Page Content */}
        {CurrentPageComponent ? (
          <CurrentPageComponent
            user={state.user}
            navigateTo={navigateTo}
            dispatch={dispatch}
            state={state}
            selectedUsername={selectedUsername}
            setSelectedUsername={setSelectedUsername}
            profiles={profiles}
          />
        ) : (
          <div className="page-placeholder">
            <h2>{state.currentPage.toUpperCase().replace('-', ' ')}</h2>
            <p>This feature is under development.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;