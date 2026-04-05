import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import * as api from '../services/api.js';
import './Visualization.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function Visualization({ user, navigateTo }) {
    const [selectedUsername, setSelectedUsername] = useState(user?.username);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        consultations: 21, // Mocked as per design
        procedures: 3,     // Mocked
        noShows: 1         // Mocked
    });
    const [vitals, setVitals] = useState({
        heartRate: '--',
        temp: '--',
        glucose: '--',
        weight: '--',
        bp: '--/--'
    });
    const [recentVisits, setRecentVisits] = useState([]);
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);

    const profiles = React.useMemo(() => {
        const list = [{ username: user?.username, displayName: 'Me' }];
        if (user?.familyMembers) {
            user.familyMembers.forEach(m => {
                const username = m.username || `virtual:${user.username}:${m.name}`;
                list.push({ username: username, displayName: m.name });
            });
        }
        return list;
    }, [user]);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user]);

    useEffect(() => {
        if (!selectedUsername) return;
        fetchDashboardData();
    }, [selectedUsername]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Profile
            let userProfile = {};
            if (selectedUsername === user.username) {
                const p = await api.getPublicProfile(selectedUsername);
                userProfile = p.user || p;
            } else {
                try {
                    const p = await api.getPublicProfile(selectedUsername);
                    userProfile = p.user || p;
                } catch (e) {
                    const member = user.familyMembers.find(m => m.username === selectedUsername);
                    userProfile = member ? { displayName: member.name, age: member.age } : {};
                }
            }
            setProfile(userProfile);

            // 2. Vitals
            const [pulseData, tempData, weightData, bpData] = await Promise.all([
                api.getVitals('pulse', selectedUsername),
                api.getVitals('temperature', selectedUsername),
                api.getVitals('weight', selectedUsername),
                api.getVitals('bloodPressure', selectedUsername)
            ]);

            const getLatest = (res) => {
                const list = res?.vitals || res || [];
                const sorted = Array.isArray(list) ? list.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
                return sorted.length > 0 ? sorted[0] : null;
            };

            const latestPulse = getLatest(pulseData);
            const latestTemp = getLatest(tempData);
            const latestWeight = getLatest(weightData);
            const latestBP = getLatest(bpData);

            setVitals({
                heartRate: latestPulse ? `${latestPulse.value} bpm` : '-- bpm',
                temp: latestTemp ? `${latestTemp.value} °F` : '-- °F',
                glucose: '-- mg/dL',
                weight: latestWeight ? `${latestWeight.value} lbs` : '-- lbs',
                bp: latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : '--/-- mmHg'
            });

            // 3. Visits
            const appts = await api.getAppointments(selectedUsername);
            const apptList = appts?.appointments || appts || [];
            const pastVisits = apptList
                .filter(a => new Date(a.date) < new Date())
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
            setRecentVisits(pastVisits);

            // 4. Medications
            const meds = await api.getMedications(selectedUsername);
            setMedications((meds?.medications || meds || []));

            // 5. Medical Tests
            const tests = await api.getMedicalTests(selectedUsername);
            const testList = tests?.tests || tests || [];

            setStats({
                consultations: apptList.length,
                procedures: testList.length,
                noShows: 0
            });

            setLoading(false);
        } catch (err) {
            console.error("Failed to load visualization data", err);
            setLoading(false);
        }
    };

    // Chart Data
    const doughnutData = {
        labels: ['Completed', 'Pending', 'Cancelled'],
        datasets: [
            {
                data: [12, 5, 4],
                backgroundColor: ['#2E86C1', '#AED6F1', '#E74C3c'],
                borderWidth: 0,
                radius: '80%',
                cutout: '70%'
            },
        ],
    };

    if (loading) return <div className="viz-loading">Loading Patient Dashboard...</div>;

    return (
        <div className="viz-container">
            {/* Header */}
            <header className="viz-header">
                <div className="header-top">
                    <h1>Patient Overview <span className="badge-ccm">CCM</span></h1>
                    <div className="header-controls">
                        <select
                            className="viz-profile-select"
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)}
                        >
                            {profiles.map(p => <option key={p.username} value={p.username}>{p.displayName}</option>)}
                        </select>
                        <button className="btn-add-primary">+ ADD</button>
                    </div>
                </div>

                <div className="patient-banner">
                    <div className="patient-avatar">
                        {/* Placeholder or user image */}
                        <span>{profile?.displayName?.charAt(0) || 'U'}</span>
                    </div>
                    <div className="patient-info">
                        <h2>{profile?.displayName || 'Unknown Patient'}</h2>
                        <p>{profile?.age ? `${profile.age} Y` : 'N/A'} | {profile?.gender || 'Patient'}</p>
                    </div>
                    <div className="patient-metrics">
                        <div className="metric-simple">
                            <span className="label">Last Updated</span>
                            <span className="value">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <section className="stats-row">
                <div className="stats-chart">
                    <div style={{ width: '40px', height: '40px' }}>
                        <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="stat-item">
                    <span className="stat-count">{stats.consultations}</span>
                    <span className="stat-label">Consultation</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <span className="stat-count">0{stats.procedures}</span>
                    <span className="stat-label">Surgical Procedure</span>
                </div>
                <div className="stat-divider highlight"></div>
                <div className="stat-item">
                    <span className="stat-count highlight">{stats.noShows}</span>
                    <span className="stat-label">Appointment No Show</span>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="viz-grid">

                {/* Left Column: Medical History */}
                <div className="viz-column history-column">
                    <h3>Medical History</h3>

                    <div className="history-card">
                        <div className="card-header-link">
                            <h4>Procedures & Surgeries</h4>
                            <span className="arrow">→</span>
                        </div>
                        <p className="card-content-text">
                            {stats.procedures > 0 ? `${stats.procedures} records found` : 'No surgeries recorded.'}
                        </p>
                    </div>

                    <div className="history-card">
                        <div className="card-header-link">
                            <h4>Allergies</h4>
                            <span className="arrow">→</span>
                        </div>
                        <p className="card-content-text">No known allergies.</p>
                    </div>

                    <div className="history-card">
                        <div className="card-header-link">
                            <h4>Medications</h4>
                            <span className="arrow">→</span>
                        </div>
                        <p className="card-content-text">
                            {medications.length > 0 ? medications.map(m => m.name).join(', ') : 'No active medications'}
                        </p>
                    </div>

                    <div className="history-card">
                        <div className="card-header-link">
                            <h4>Family History</h4>
                            <span className="arrow">→</span>
                        </div>
                        <p className="card-content-text">No history recorded.</p>
                    </div>
                </div>

                {/* Middle Column: Vitals & Files */}
                <div className="viz-column status-column">
                    <div className="section-card vitals-card">
                        <h3>Vitals</h3>
                        <div className="vitals-grid-display">
                            <div className="vital-item">
                                <span className="v-icon">❤️</span>
                                <span className="v-val">{vitals.heartRate}</span>
                            </div>
                            <div className="vital-item">
                                <span className="v-icon">🌡️</span>
                                <span className="v-val">{vitals.temp}</span>
                            </div>
                            <div className="vital-item">
                                <span className="v-icon">🩸</span>
                                <span className="v-val">{vitals.glucose}</span>
                            </div>
                            <div className="vital-item">
                                <span className="v-icon">⚖️</span>
                                <span className="v-val">{vitals.weight}</span>
                            </div>
                            <div className="vital-item full-width">
                                <span className="v-icon">🩺</span>
                                <span className="v-val">{vitals.bp}</span>
                            </div>
                        </div>
                    </div>

                    <div className="section-card files-card">
                        <div className="card-split-header">
                            <h3>Files & Documents</h3>
                            <button className="btn-upload">↑ Upload</button>
                        </div>
                        <ul className="file-list">
                            <li>
                                <span className="file-icon">📄</span>
                                <span className="file-name">Medical Record</span>
                            </li>
                            <li>
                                <span className="file-icon">📄</span>
                                <span className="file-name">Consent Form</span>
                            </li>
                            <li>
                                <span className="file-icon">📄</span>
                                <span className="file-name">Insurance Card_{profile?.displayName?.split(' ')[0]}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Recent Visits */}
                <div className="viz-column visits-column">
                    <div className="visits-header">
                        <h3>Recent Visits</h3>
                        <button className="btn-text">+ New Visit</button>
                    </div>

                    <div className="visits-list">
                        {recentVisits.length > 0 ? recentVisits.map((visit, idx) => (
                            <div key={idx} className="visit-item">
                                <div className="visit-main-info">
                                    <h4 className="doc-name">{visit.doctorName || 'Dr. Smith'}</h4>
                                    <span className="doc-specialty">General Practice</span>
                                </div>
                                <span className="visit-tag">Follow up</span>
                                <div className="visit-meta">
                                    <span className="v-date">📅 {new Date(visit.date).toLocaleDateString()}</span>
                                    <span className="v-time">🕒 {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="no-data">No recent visits recorded.</p>
                        )}

                        {/* Mock items to fill UI if empty list */}
                        {recentVisits.length === 0 && (
                            <>
                                <div className="visit-item">
                                    <div className="visit-main-info">
                                        <h4 className="doc-name">Dr. Daniel McAdams</h4>
                                        <span className="doc-specialty">Cardiology</span>
                                    </div>
                                    <span className="visit-tag">Follow up</span>
                                    <div className="visit-meta">
                                        <span className="v-date">📅 03/09/2024</span>
                                        <span className="v-time">🕒 08:45 AM - 09:15 AM</span>
                                    </div>
                                </div>
                                <div className="visit-item">
                                    <div className="visit-main-info">
                                        <h4 className="doc-name">Dr. Michael Lee</h4>
                                        <span className="doc-specialty">Endocrinology</span>
                                    </div>
                                    <span className="visit-tag gray">Insulin Level</span>
                                    <div className="visit-meta">
                                        <span className="v-date">📅 09/12/2023</span>
                                        <span className="v-time">🕒 02:00 PM - 02:30 PM</span>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Visualization;
