import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import * as api from '../services/api.js';
import DeleteButton from './DeleteButton.jsx';
import './PulseMonitoring.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function PulseMonitoring({ user }) {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        value: '',
        regularity: 'regular',
        strength: 'normal',
        date: new Date().toISOString().substring(0, 16) // YYYY-MM-DDTHH:mm
    });

    const [selectedUsername, setSelectedUsername] = useState(user?.username);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user, selectedUsername]);

    useEffect(() => {
        fetchReadings();
    }, [selectedUsername]);

    async function fetchReadings() {
        try {
            setLoading(true);
            const data = await api.getVitals('pulse', selectedUsername);
            // data.vitals is the array from the route response { vitals: [...] }
            // But check if api.getVitals returns the raw body or just the list.
            // Looking at api.js: getVitals calls fetch and returns handleResponse.
            // Routes return { vitals: [...] }. So data should be { vitals: [...] }
            // Let's handle both just in case.
            const list = data.vitals || data || [];
            setReadings(list);
            setError(null);
        } catch (err) {
            console.error('Error fetching pulse:', err);
            setError('Failed to load pulse history');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const submitData = {
                type: 'pulse',
                value: Number(formData.value),
                regularity: formData.regularity,
                strength: formData.strength,
                date: new Date(formData.date).toISOString(),
                username: selectedUsername
            };
            await api.addVital(submitData); // Using addVital as per api.js
            setFormData({
                value: '',
                regularity: 'regular',
                strength: 'normal',
                date: new Date().toISOString().substring(0, 16)
            });
            setShowForm(false);
            fetchReadings();
        } catch (err) {
            setError('Failed to save reading');
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Delete this reading?')) return;
        try {
            await api.deleteVital(id); // Assuming generic deleteVital works
            fetchReadings();
        } catch (err) {
            setError('Failed to delete reading');
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Chart Configuration
    const chartData = {
        labels: readings.map(r => new Date(r.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Pulse (BPM)',
                data: readings.map(r => r.value),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.2)',
                tension: 0.3,
                fill: true
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Heart Rate Trend',
            },
            annotation: { // Placeholder if we had chartjs-plugin-annotation
                // We can use simple background color on the canvas or plugins for 'Normal Range'
            }
        },
        scales: {
            y: {
                min: 40,
                max: 140, // Reasonable default range
                title: { display: true, text: 'BPM' }
            }
        }
    };

    // Profiles
    const profiles = React.useMemo(() => {
        const list = [{ username: user?.username, displayName: 'Me' }];
        if (user?.familyMembers) {
            user.familyMembers.forEach(m => {
                const username = m.username || `virtual:${user.username}:${m.name}`;
                list.push({ username: username, displayName: `${m.name} (${m.relation})${!m.username ? ' (Local)' : ''}` });
            });
        }
        return list;
    }, [user]);

    if (loading && readings.length === 0) return <div className="pulse-page"><p>Loading heart health data...</p></div>;

    const latest = readings.length > 0 ? readings[readings.length - 1] : null;

    return (
        <div className="pulse-page">
            <div className="page-header">
                <div>
                    <h1>Heart Health</h1>
                    <p className="subtitle">Monitor pulse, regularity, and strength.</p>
                </div>
                <div className="header-controls">
                    <select
                        className="profile-select"
                        value={selectedUsername}
                        onChange={(e) => setSelectedUsername(e.target.value)}
                    >
                        {profiles.map(p => <option key={p.username} value={p.username}>{p.displayName}</option>)}
                    </select>
                </div>
            </div>

            {/* Current Status Card */}
            <div className="status-grid">
                <div className="status-card main-rate">
                    <h3>Current Pulse</h3>
                    <div className="big-value">
                        {latest ? latest.value : '--'} <span className="unit">BPM</span>
                    </div>
                    <div className={`status-badge ${latest ? (latest.value < 60 || latest.value > 100 ? 'warning' : 'good') : ''}`}>
                        {latest ? (latest.value >= 60 && latest.value <= 100 ? 'Normal Range' : 'Attention Needed') : 'No Data'}
                    </div>
                </div>
                <div className="status-card">
                    <h3>Regularity</h3>
                    <div className="param-value">
                        {latest?.regularity ? (latest.regularity.charAt(0).toUpperCase() + latest.regularity.slice(1)) : '--'}
                    </div>
                    {latest?.regularity === 'irregular' && <p className="alert-text">Consult a doctor if this persists.</p>}
                    {latest?.regularity === 'afib' && <p className="alert-text danger">Atrial Fibrillation Warning</p>}
                </div>
                <div className="status-card">
                    <h3>Strength</h3>
                    <div className="param-value">
                        {latest?.strength ? (latest.strength.charAt(0).toUpperCase() + latest.strength.slice(1)) : '--'}
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="chart-section">
                <Line options={chartOptions} data={chartData} />
            </div>

            {/* Action Area */}
            <div className="action-area">
                {!showForm ? (
                    <button className="add-reading-btn" onClick={() => setShowForm(true)}>+ Add New Reading</button>
                ) : (
                    <div className="reading-form-card">
                        <div className="form-header">
                            <h3>New Pulse Reading</h3>
                            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Pulse (BPM)</label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        placeholder="e.g. 72"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Rhythm</label>
                                <div className="radio-group">
                                    <label className={`radio-opt ${formData.regularity === 'regular' ? 'selected' : ''}`}>
                                        <input type="radio" name="regularity" value="regular" checked={formData.regularity === 'regular'} onChange={handleChange} />
                                        Regular
                                    </label>
                                    <label className={`radio-opt ${formData.regularity === 'irregular' ? 'selected' : ''}`}>
                                        <input type="radio" name="regularity" value="irregular" checked={formData.regularity === 'irregular'} onChange={handleChange} />
                                        Irregular
                                    </label>
                                    <label className={`radio-opt ${formData.regularity === 'afib' ? 'selected' : ''}`}>
                                        <input type="radio" name="regularity" value="afib" checked={formData.regularity === 'afib'} onChange={handleChange} />
                                        Atrial Fib.
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Strength</label>
                                <div className="radio-group">
                                    <label className={`radio-opt ${formData.strength === 'strong' ? 'selected' : ''}`}>
                                        <input type="radio" name="strength" value="strong" checked={formData.strength === 'strong'} onChange={handleChange} />
                                        Strong
                                    </label>
                                    <label className={`radio-opt ${formData.strength === 'normal' ? 'selected' : ''}`}>
                                        <input type="radio" name="strength" value="normal" checked={formData.strength === 'normal'} onChange={handleChange} />
                                        Normal
                                    </label>
                                    <label className={`radio-opt ${formData.strength === 'weak' ? 'selected' : ''}`}>
                                        <input type="radio" name="strength" value="weak" checked={formData.strength === 'weak'} onChange={handleChange} />
                                        Weak
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save Reading</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Recent History Table */}
            <div className="history-section">
                <h3>Recent History</h3>
                <div className="table-responsive">
                    <table className="readings-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>BPM</th>
                                <th>Rhythm</th>
                                <th>Strength</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...readings].reverse().map(r => (
                                <tr key={r.id}>
                                    <td>{new Date(r.date).toLocaleString()}</td>
                                    <td className="bpm-cell">{r.value}</td>
                                    <td>
                                        <span className={`tag ${r.regularity || 'regular'}`}>{r.regularity || 'Regular'}</span>
                                    </td>
                                    <td>{r.strength || '-'}</td>
                                    <td>
                                        <DeleteButton onDelete={() => handleDelete(r.id)} />
                                    </td>
                                </tr>
                            ))}
                            {readings.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No readings yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PulseMonitoring;
