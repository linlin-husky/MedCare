import React, { useState, useEffect } from 'react';
import * as api from '../services/api.js';
import DeleteButton from './DeleteButton.jsx';
import './ReportSymptoms.css';

function ReportSymptoms({ user }) {
    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        symptomName: '',
        severityValue: 5,
        description: '',
        onsetDate: new Date().toISOString().split('T')[0],
        status: 'ongoing',
        isOngoing: true,
        impactLevel: 'none',
        impactDescription: '',
        relatedMedications: []
    });

    const commonSymptoms = [
        "Headache", "Fever", "Fatigue", "Cough", "Nausea",
        "Dizziness", "Pain", "Anxiety", "Insomnia", "Shortness of Breath"
    ];

    const [selectedUsername, setSelectedUsername] = useState(user?.username);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user, selectedUsername]);

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

    useEffect(() => {
        fetchSymptoms();
    }, [selectedUsername]);

    async function fetchSymptoms() {
        try {
            setLoading(true);
            const data = await api.getSymptoms(selectedUsername);
            setSymptoms(data.symptoms || data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching symptoms:', err);
            setError('Failed to load symptoms');
            setLoading(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                severity: getSeverityCategory(formData.severityValue),
                duration: formData.isOngoing ? 'Ongoing' : formData.duration,
                username: selectedUsername
            };

            if (editingId) {
                await api.updateSymptom(editingId, submitData);
            } else {
                await api.createSymptom(submitData);
            }

            resetForm();
            fetchSymptoms();
        } catch (err) {
            setError('Failed to save symptom');
        }
    }

    function resetForm() {
        setFormData({
            symptomName: '',
            severityValue: 5,
            description: '',
            onsetDate: new Date().toISOString().split('T')[0],
            status: 'ongoing',
            isOngoing: true,
            impactLevel: 'none',
            impactDescription: '',
            relatedMedications: []
        });
        setEditingId(null);
        setShowForm(false);
    }

    function handleEdit(symptom) {
        setEditingId(symptom.id);
        setFormData({
            symptomName: symptom.symptomName,
            severityValue: symptom.severityValue || 5, // Fallback if missing
            description: symptom.description || '',
            onsetDate: new Date(symptom.onsetDate).toISOString().split('T')[0],
            status: symptom.status || 'ongoing',
            isOngoing: symptom.duration === 'Ongoing',
            duration: symptom.duration === 'Ongoing' ? '' : symptom.duration || '',
            impactLevel: symptom.impactLevel || 'none',
            impactDescription: symptom.impactDescription || '',
            relatedMedications: symptom.relatedMedications || []
        });
        setShowForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await api.deleteSymptom(id);
            fetchSymptoms();
        } catch (err) {
            setError('Failed to delete symptom');
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    function getSeverityCategory(val) {
        if (val <= 3) return 'mild';
        if (val <= 7) return 'moderate';
        return 'severe';
    }

    function handleImpactSelect(level) {
        setFormData(prev => ({ ...prev, impactLevel: level }));
    }

    // Split symptoms into Active and History
    const activeSymptoms = symptoms.filter(s => s.status === 'ongoing' || !s.status);
    const resolvedSymptoms = symptoms.filter(s => s.status === 'resolved' || s.status === 'improving');

    if (loading) {
        return <div className="report-symptoms"><p>Loading details...</p></div>;
    }

    return (
        <div className="report-symptoms">
            <div className="symptoms-header">
                <div>
                    <h1>Report Symptoms</h1>
                    <p className="subtitle">Log your daily health to spot trends over time.</p>
                </div>
                <div className="header-actions">
                    <div className="profile-selector">
                        <span className="profile-label"> for:</span>
                        <select
                            className="profile-dropdown"
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)}
                        >
                            {profiles.map(p => (
                                <option key={p.username} value={p.username}>
                                    {p.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* ACTION CARD */}
            {!showForm ? (
                <div className="action-card" onClick={() => { resetForm(); setShowForm(true); }}>
                    <div className="plus-icon">+</div>
                    <div className="action-text">
                        <h3>Log a New Symptom</h3>
                        <p>Track a new health concern or daily observation.</p>
                    </div>
                </div>
            ) : (
                <div className="symptom-form-card">
                    <div className="card-header">
                        <h2>{editingId ? 'Edit Observation' : 'New Observation'}</h2>
                        <button className="close-btn" onClick={resetForm}>×</button>
                    </div>
                    <form className="symptom-form" onSubmit={handleSubmit}>

                        {/* 1. IDENTIFICATION */}
                        <div className="form-section">
                            <label className="section-label">What are you feeling?</label>
                            <input
                                list="common-symptoms"
                                name="symptomName"
                                value={formData.symptomName}
                                onChange={handleChange}
                                placeholder="Search or type symptom name..."
                                required
                                className="main-input"
                                autoFocus
                            />
                            <datalist id="common-symptoms">
                                {commonSymptoms.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>

                        {/* 2. SEVERITY */}
                        <div className="form-section">
                            <div className="label-row">
                                <label className="section-label">Intensity (1-10)</label>
                                <span className={`severity-score score-${getSeverityCategory(formData.severityValue)}`}>
                                    {formData.severityValue} - {getSeverityCategory(formData.severityValue).toUpperCase()}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                name="severityValue"
                                value={formData.severityValue}
                                onChange={handleChange}
                                className={`severity-slider-hci slider-${getSeverityCategory(formData.severityValue)}`}
                            />
                            <div className="scale-labels">
                                <span>No Pain</span>
                                <span>Mild</span>
                                <span>Moderate</span>
                                <span>Severe</span>
                                <span>Worst Possible</span>
                            </div>
                        </div>

                        {/* 3. IMPACT */}
                        <div className="form-section">
                            <label className="section-label">Impact on Daily Life</label>
                            <div className="impact-selector">
                                {['none', 'mild', 'moderate', 'severe'].map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        className={`impact-btn ${formData.impactLevel === level ? 'selected' : ''} ${level}`}
                                        onClick={() => handleImpactSelect(level)}
                                    >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {formData.impactLevel !== 'none' && (
                                <textarea
                                    name="impactDescription"
                                    value={formData.impactDescription}
                                    onChange={handleChange}
                                    placeholder="How does this stop you from doing your usual activities?"
                                    className="impact-text"
                                    rows="2"
                                />
                            )}
                        </div>

                        {/* 4. CONTEXT */}
                        <div className="form-section context-grid">
                            <div className="grid-item">
                                <label>Onset Date</label>
                                <input
                                    type="date"
                                    name="onsetDate"
                                    value={formData.onsetDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid-item">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleChange}>
                                    <option value="ongoing">Ongoing (Active)</option>
                                    <option value="improving">Improving</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-section">
                            <label>Additional Notes</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Any triggers, relief factors, or other observations?"
                                rows="2"
                            />
                        </div>

                        <div className="form-actions">
                            <button type="button" className="cancel-ghost" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="save-primary">
                                {editingId ? 'Update Entry' : 'Save Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="symptoms-dashboard">
                <div className="dashboard-section">
                    <h3>Active Observations</h3>
                    {activeSymptoms.length === 0 ? (
                        <div className="empty-dash">
                            <p>No active symptoms being tracked. Good health!</p>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            {activeSymptoms.map(s => (
                                <div key={s.id} className="symptom-card-hci active">
                                    <div className="card-top">
                                        <h4>{s.symptomName}</h4>
                                        <div className="severity-bubble">
                                            <span className="sc-val">{s.severityValue || '-'}</span>
                                            <span className="sc-max">/10</span>
                                        </div>
                                    </div>
                                    <div className="card-meta">
                                        <span>Started: {new Date(s.onsetDate).toLocaleDateString()}</span>
                                        <span className="status-tag ongoing">Active</span>
                                    </div>
                                    {(s.impactLevel && s.impactLevel !== 'none') && (
                                        <div className="impact-line">
                                            <span className="i-label">Impact:</span> {s.impactLevel}
                                        </div>
                                    )}
                                    <div className="card-actions">
                                        <button className="text-btn" onClick={() => handleEdit(s)}>Edit</button>
                                        <button className="text-btn delete" onClick={() => handleDelete(s.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {resolvedSymptoms.length > 0 && (
                    <div className="dashboard-section">
                        <h3>History</h3>
                        <div className="history-list">
                            {resolvedSymptoms.map(s => (
                                <div key={s.id} className="history-row">
                                    <div className="h-main">
                                        <div className="h-top-row">
                                            <span className="h-name">{s.symptomName}</span>
                                            <span className="h-date">{new Date(s.onsetDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className="h-status resolved">Resolved</span>
                                    <button className="icon-btn edit-icon" onClick={() => handleEdit(s)} title="Edit">✎</button>
                                    <button className="icon-btn del-icon" onClick={() => handleDelete(s.id)} title="Delete">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportSymptoms;