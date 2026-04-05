import { getTrustScoreColor } from '../utils/helpers.js';
import './Header.css';

function Header({ user, unreadCount, currentPage, onLogout, navigateTo }) {
  const trustClass = getTrustScoreColor(user.trustScore);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="title-name" onClick={() => navigateTo('dashboard')}>
            Home Medical Care
          </h1>
        </div>

        <nav className="header-nav">
          <button
            className={'nav-button' + (currentPage === 'dashboard' ? ' active' : '')}
            onClick={() => navigateTo('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={'nav-button' + (currentPage === 'activity' ? ' active' : '')}
            onClick={() => navigateTo('activity')}
          >
            Activity
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
          {user.isAdmin && (
            <button
              className={'nav-button admin-nav' + (currentPage === 'admin' ? ' active' : '')}
              onClick={() => navigateTo('admin')}
            >
              Admin
            </button>
          )}
        </nav>

        <div className="header-user">
          <div className="user-info" onClick={() => navigateTo('profile')}>
            <span className="user-name">{user.displayName}</span>
            <button className="logout-button" onClick={(e) => { e.stopPropagation(); onLogout(); }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;