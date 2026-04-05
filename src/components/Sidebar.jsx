import React from 'react';
import './Sidebar.css';

function Sidebar({ currentPage, navigateTo }) {
    const menuGroups = [
        {
            title: 'DASHBOARD',
            items: [
                { id: 'dashboard', label: 'Home', icon: 'home' }
            ]
        },
        {
            title: 'APPOINTMENT',
            items: [
                { id: 'calendar', label: 'Calendar', icon: 'calendar' }
            ]
        },
        {
            title: 'MEDICAL INSTRUCTION',
            items: [
                { id: 'manage-prescriptions', label: 'Manage Prescriptions', icon: 'pill' },
                { id: 'report-symptoms', label: 'Report Symptoms', icon: 'file-text' },
                { id: 'tests', label: 'Medical Test', icon: 'star' },
                { id: 'body-measurement', label: 'Body Measurement', icon: 'activity' }
            ]
        },
        {
            title: 'HEALTH MONITOR',
            items: [
                { id: 'pulse-monitoring', label: 'Pulse Monitor', icon: 'heart' },
                { id: 'visualization', label: 'Visualization', icon: 'pie-chart' }
            ],
        },
        {
            title: 'ACCOUNT',
            items: [
                { id: 'profile', label: 'My Profile', icon: 'user' },
                { id: 'directory', label: 'User Directory', icon: 'users' }
            ]
        }
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">♡</div>
                <div className="logo-text">Home Medical Care</div>
            </div>

            <div className="sidebar-content">
                {menuGroups.map((group, index) => (
                    <div key={index} className="menu-group">
                        <div className="group-title">{group.title}</div>
                        {group.items.map(item => (
                            <div
                                key={item.id}
                                className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
                                onClick={() => navigateTo(item.id)}
                            >
                                <div className={`item-icon icon-${item.icon}`}></div>
                                <div className="item-label">{item.label}</div>
                                {item.badge && <div className="item-badge">{item.badge}</div>}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Sidebar;
