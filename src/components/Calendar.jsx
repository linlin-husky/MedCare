import React, { useState, useEffect } from 'react';
import * as api from '../services/api.js';
import './Calendar.css';

function Calendar({ user, selectedUsername, setSelectedUsername, profiles }) { // Receive props for profile management
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAppt, setNewAppt] = useState({
        title: '',
        time: '',
        location: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadAppointments();
    }, [user, selectedUsername]);

    function loadAppointments() {
        // For MVP, we fetch all appointments. Real app would fetch by month/range.
        api.getAppointments(selectedUsername)
            .then(data => {
                setAppointments(data.appointments || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load appointments', err);
                setLoading(false);
            });
    }

    function handleCreate(e) {
        e.preventDefault();
        // Combine date and time to ISO string
        const dateTime = new Date(`${newAppt.date}T${newAppt.time || '12:00'}`);

        api.createAppointment({
            title: newAppt.title,
            location: newAppt.location,
            date: dateTime,
            username: selectedUsername
        })
            .then(() => {
                setShowAddModal(false);
                setNewAppt({ title: '', time: '', location: '', date: new Date().toISOString().split('T')[0] });
                loadAppointments();
            })
            .catch(err => (console.error('Failed to create appointment', err), alert(err.message)));
    }

    // Helper to render calendar grid
    const renderCalendarGrid = () => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 is Sunday

        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDayDate = new Date(year, month, i);
            const isToday = new Date().toDateString() === currentDayDate.toDateString();

            const dayAppts = appointments.filter(a => {
                const aDate = new Date(a.date);
                return aDate.getDate() === i && aDate.getMonth() === month && aDate.getFullYear() === year;
            });

            days.push(
                <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`}>
                    <div className="day-number">{i}</div>
                    <div className="day-appts">
                        {dayAppts.map(appt => (
                            <div key={appt.id} className="mini-appt-pill" title={appt.title}>
                                {appt.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Filter appointments
    const now = new Date();
    const historyAppointments = appointments.filter(a => new Date(a.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));
    const upcomingAppointments = appointments.filter(a => new Date(a.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="calendar-page">
            <div className="calendar-header">
                <h1>Assignments & Appointments</h1>
                <div className="header-actions">
                    <div className="profile-selector">
                        <label htmlFor="calendar-profile-select">Profile:</label>
                        <select
                            id="calendar-profile-select"
                            className="profile-dropdown"
                            value={selectedUsername || ''}
                            onChange={(e) => setSelectedUsername && setSelectedUsername(e.target.value)}
                        >
                            {profiles && profiles.map(p => (
                                <option key={p.username} value={p.username}>
                                    {p.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="add-appt-btn" onClick={() => setShowAddModal(true)}>+ New Appointment</button>
                </div>
            </div>

            <div className="calendar-content-wrapper">
                <div className="calendar-main">
                    <div className="calendar-container">
                        <div className="calendar-nav">
                            <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() - 1)))}>&lt;</button>
                            <h2>{monthNames[date.getMonth()]} {date.getFullYear()}</h2>
                            <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() + 1)))}>&gt;</button>
                        </div>

                        <div className="calendar-grid-header">
                            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                        </div>

                        <div className="calendar-grid">
                            {renderCalendarGrid()}
                        </div>
                    </div>

                    <div className="appointments-list-view">
                        <h3>Upcoming</h3>
                        {loading ? <p>Loading...</p> : (
                            <div className="appt-list">
                                {upcomingAppointments.map(appt => (
                                    <div key={appt.id} className="appt-item">
                                        <div className="appt-time">
                                            {new Date(appt.date).toLocaleDateString()} <br />
                                            {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="appt-info">
                                            <div className="appt-title-list">{appt.title}</div>
                                            <div className="appt-loc-list">{appt.location || 'No location'}</div>
                                        </div>
                                    </div>
                                ))}
                                {upcomingAppointments.length === 0 && <p className="no-data">No upcoming appointments.</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="calendar-sidebar">
                    <h3>Appointment History</h3>
                    <div className="history-list">
                        {historyAppointments.length === 0 ? (
                            <p className="no-data">No history available.</p>
                        ) : (
                            historyAppointments.map(appt => (
                                <div key={appt.id} className="history-item">
                                    <div className="history-date">{new Date(appt.date).toLocaleDateString()}</div>
                                    <div className="history-details">
                                        <div className="history-title">{appt.title}</div>
                                        <div className="history-loc">{appt.location}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Appointment</h3>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={newAppt.title}
                                    onChange={e => setNewAppt({ ...newAppt, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={newAppt.date}
                                    onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={newAppt.time}
                                    onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={newAppt.location}
                                    onChange={e => setNewAppt({ ...newAppt, location: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Calendar;
