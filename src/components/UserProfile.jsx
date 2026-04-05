import { useEffect, useState } from 'react';
import { ACTIONS } from '../reducers/appReducer.js';
import * as api from '../services/api.js';
import { formatDate, getTrustScoreColor } from '../utils/helpers.js';
import './UserProfile.css';

function UserProfile({ state, dispatch, navigateTo }) {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (state.selectedItem?.owner?.username) {
      loadUserProfile(state.selectedItem.owner.username);
    }
  }, [state.selectedItem]);

  function loadUserProfile(user) {
    setUsername(user);
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    api.getPublicUserProfile(user)
      .then(data => {
        setProfile(data.user);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      })
      .catch(err => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to load profile' });
      });
  }

  if (!profile) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <button className="back-button" onClick={() => navigateTo('public-library')}>
            ← Back
          </button>
        </div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const trustClass = getTrustScoreColor(profile.trustScore);

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigateTo('public-library')}>
          ← Back
        </button>
        <h1 className="page-title">User Profile</h1>
      </div>

      <article className="profile-card">
        <header className="profile-header">
          <h2 className="user-name">{profile.displayName}</h2>
          <span className="username">@{profile.username}</span>
        </header>

        <div className="trust-section">
          <div className={'trust-display ' + trustClass}>
            <span className="trust-score">{profile.trustScore}</span>
            <span className="trust-badge">{profile.badge?.badge}</span>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat">
            <span className="stat-value">{profile.totalLendings}</span>
            <span className="stat-label">Items Lent</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile.totalBorrowings}</span>
            <span className="stat-label">Items Borrowed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile.onTimeRate}%</span>
            <span className="stat-label">On-time Rate</span>
          </div>
        </div>

        <footer className="profile-footer">
          <span className="member-since">Member since {formatDate(profile.memberSince)}</span>
        </footer>
      </article>
    </div>
  );
}

export default UserProfile;

