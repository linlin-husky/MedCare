import { useEffect, useState } from 'react';
import { ACTIONS } from '../reducers/appReducer.js';
import * as api from '../services/api.js';
import './UserDirectory.css';

function UserDirectory({ dispatch }) {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    function loadUsers() {
        setLoading(true);
        api.getAllUsers()
            .then(data => {
                // Handle { users: [...] } or [...] depending on API response structure
                const userList = (data && data.users) || data || [];
                setUsers(userList);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load users', err);
                setLoading(false);
            });
    }

    // Filter users based on searchTerm (Simple "hint" logic)
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const nameMatch = user.displayName && user.displayName.toLowerCase().includes(term);
        const userMatch = user.username && user.username.toLowerCase().includes(term);
        return nameMatch || userMatch;
    });

    return (
        <div className="directory-page">
            <h1 className="page-title">User Directory</h1>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by username or display name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    autoFocus
                />
            </div>

            {loading ? (
                <div className="loading">Loading directory...</div>
            ) : (
                <div className="user-grid">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div key={user.username} className="user-card">
                                <div className="user-avatar-placeholder">
                                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="user-info">
                                    <h3>{user.displayName}</h3>
                                    <p className="user-handle">@{user.username}</p>
                                    <div className="user-stats">
                                        <span>Rank: {user.trustScore}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-results">No users found matching "{searchTerm}".</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default UserDirectory;
