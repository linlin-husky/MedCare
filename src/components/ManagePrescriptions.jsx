
import React, { useState, useEffect } from 'react';
import * as api from '../services/api.js';
import DeleteButton from './DeleteButton.jsx';
import './ManagePrescriptions.css';

function ManagePrescriptions({ user }) {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedUsername, setSelectedUsername] = useState(user?.username);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user]);

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

    // Form State
    const [formData, setFormData] = useState({
        medicationName: '',
        form: 'Tablet',
        route: 'Oral',
        dosage: '',
        frequency: '',
        timesPerDay: 1,
        timing: '',
        schedule: { type: 'Daily', days: [], interval: 0 },
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        reason: '',
        instructions: '',
        function: '',
        mealTiming: 'No Restriction',
        warning: '',
        allergyFlag: false,
        status: 'Active',
        asNeeded: false,
        reminders: false,
        refillReminder: false,
        refillReminderDate: ''
    });

    // Schedule Logic State
    const [scheduleType, setScheduleType] = useState('Daily');
    const [selectedDays, setSelectedDays] = useState([]);
    const [intervalVal, setIntervalVal] = useState(1);

    useEffect(() => {
        fetchPrescriptions();
    }, [selectedUsername]);

    // Auto-update frequency string when schedule changes
    useEffect(() => {
        let freqString = '';
        if (scheduleType === 'Daily') freqString = 'Daily';
        else if (scheduleType === 'Weekly') {
            freqString = selectedDays.length > 0 ? `Every ${selectedDays.join(', ')} ` : 'Weekly';
        }
        else if (scheduleType === 'Interval') {
            freqString = `Every ${intervalVal} days`;
        }
        else if (scheduleType === 'PRN') freqString = 'As Needed';
        else if (scheduleType === 'Custom') freqString = ''; // User types manually

        if (scheduleType !== 'Custom') {
            setFormData(prev => ({
                ...prev,
                frequency: freqString,
                schedule: { type: scheduleType, days: selectedDays, interval: intervalVal }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                schedule: { type: 'Custom', days: [], interval: 0 }
            }));
        }
    }, [scheduleType, selectedDays, intervalVal]);


    async function fetchPrescriptions() {
        try {
            setLoading(true);
            const data = await api.getPrescriptions(selectedUsername);
            setPrescriptions(data.medications || data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setError('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const submitData = { ...formData, username: selectedUsername };
            if (editingId) {
                await api.updatePrescription(editingId, submitData);
            } else {
                await api.createPrescription(submitData);
            }
            resetForm();
            fetchPrescriptions();
        } catch (err) {
            setError('Failed to save prescription');
        }
    }

    function resetForm() {
        setFormData({
            medicationName: '',
            form: 'Tablet',
            route: 'Oral',
            dosage: '',
            frequency: '',
            timesPerDay: 1,
            timing: '',
            schedule: { type: 'Daily', days: [], interval: 0 },
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            reason: '',
            instructions: '',
            function: '',
            mealTiming: 'No Restriction',
            warning: '',
            allergyFlag: false,
            status: 'Active',
            asNeeded: false,
            reminders: false,
            refillReminder: false,
            refillReminderDate: ''
        });
        setScheduleType('Daily');
        setSelectedDays([]);
        setIntervalVal(1);
        setShowForm(false);
        setEditingId(null);
    }

    function handleEdit(prescription) {
        const sched = prescription.schedule || { type: 'Custom', days: [], interval: 0 };
        setFormData({
            medicationName: prescription.medicationName || prescription.name,
            form: prescription.form || 'Tablet',
            route: prescription.route || 'Oral',
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            timesPerDay: prescription.timesPerDay || 1,
            timing: prescription.timing || '',
            schedule: sched,
            startDate: prescription.startDate ? new Date(prescription.startDate).toISOString().split('T')[0] : '',
            endDate: prescription.endDate ? new Date(prescription.endDate).toISOString().split('T')[0] : '',
            reason: prescription.reason || prescription.sideEffects || '',
            instructions: prescription.instructions || '',
            function: prescription.function || '',
            mealTiming: prescription.mealTiming || 'No Restriction',
            warning: prescription.warning || '',
            allergyFlag: prescription.allergyFlag || false,
            status: prescription.status || 'Active',
            asNeeded: prescription.asNeeded || false,
            reminders: prescription.reminders || false,
            refillReminder: prescription.refillReminder || false,
            refillReminderDate: prescription.refillReminderDate ? new Date(prescription.refillReminderDate).toISOString().split('T')[0] : ''
        });

        // Load schedule UI state
        setScheduleType(sched.type || 'Custom');
        setSelectedDays(sched.days || []);
        setIntervalVal(sched.interval || 1);

        setEditingId(prescription.id);
        setShowForm(true);
    }

    async function handleDelete(id) {
        try {
            await api.deletePrescription(id);
            fetchPrescriptions();
        } catch (err) {
            setError('Failed to delete prescription');
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    function toggleDay(day) {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    }

    function handleRefillChange(e) {
        const checked = e.target.checked;
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setFormData(prev => ({
            ...prev,
            refillReminder: checked,
            refillReminderDate: checked ? (prev.refillReminderDate || nextWeek.toISOString().split('T')[0]) : prev.refillReminderDate
        }));
    }

    // Adherence Logging
    function logAdherence(id, status) {
        setPrescriptions(prev => prev.map(p =>
            p.id === id ? { ...p, _todayStatus: status } : p
        ));
    }

    if (loading) {
        return <div className="manage-prescriptions"><p>Loading prescriptions...</p></div>;
    }

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Helper to derive readable schedule from the schedule object
    function getDerivedSchedule(p) {
        const s = p.schedule || {};
        if (s.type === 'Weekly' && s.days && s.days.length > 0) return `Every ${s.days.join(', ')} `;
        if (s.type === 'Interval' && s.interval) return `Every ${s.interval} days`;
        if (s.type === 'PRN') return 'As Needed';
        if (s.type === 'Daily') return 'Daily';
        if (s.type === 'Custom') return ''; // Custom usually stored in frequency
        return 'Daily'; // Default
    }

    // Helper to simulate adherence tendency
    function calculateAdherence(startDate) {
        if (!startDate) return null;
        // Mock calculation: 90% + small random variation
        const percent = 85 + Math.floor(Math.random() * 15);
        const startStr = new Date(startDate).toLocaleDateString();
        return { percent, startStr };
    }

    const AdherenceChart = ({ percent, startStr }) => {
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        const color = percent >= 90 ? '#4caf50' : percent >= 75 ? '#ff9800' : '#f44336';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                    <svg width="50" height="50" viewBox="0 0 50 50">
                        <circle
                            cx="25"
                            cy="25"
                            r={radius}
                            fill="none"
                            stroke="#e6e6e6"
                            strokeWidth="4"
                        />
                        <circle
                            cx="25"
                            cy="25"
                            r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 25 25)"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        {percent}%
                    </div>
                </div>
                <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.2' }}>
                    <strong>Adherence Tendency</strong><br />
                    Since {startStr}
                </div>
            </div>
        );
    };

    return (
        <div className="manage-prescriptions">
            <div className="prescriptions-header">
                <h1>Medications</h1>
                <div className="header-actions">
                    <div className="profile-selector">
                        <label htmlFor="profile-select">Profile:</label>
                        <select
                            id="profile-select"
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
                    <button className="print-btn" title="Print">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                            <path d="M6 14h12v8H6z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="medications-content">
                <div className="section-title-row">
                    <h2>Current Medications</h2>
                </div>

                <div className="info-box">
                    <p>Please review your medications and Manage your adherence daily to keep the list up to date.</p>

                </div>

                <div className="actions-row">
                    <button className="add-btn" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
                        + Record Medication
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {showForm && (
                    <div className="prescription-form-container">
                        <form className="prescription-form" onSubmit={handleSubmit}>
                            <h2>{editingId ? 'Edit Medication' : 'Record New Medication'}</h2>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Medication Name *</label>
                                    <input type="text" name="medicationName" value={formData.medicationName} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Function / Purpose</label>
                                    <input type="text" name="function" value={formData.function} onChange={handleChange} placeholder="e.g. Pain relief, Blood pressure" />
                                </div>
                            </div>


                            <div className="form-row">
                                <div className="form-group">
                                    <label>Form</label>
                                    <select name="form" value={formData.form} onChange={handleChange}>
                                        <option value="Tablet">Tablet</option>
                                        <option value="Capsule">Capsule</option>
                                        <option value="Topical">Topical</option>
                                        <option value="Injection">Injection</option>
                                        <option value="Liquid">Liquid</option>
                                        <option value="Inhaler">Inhaler</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Route</label>
                                    <select name="route" value={formData.route} onChange={handleChange}>
                                        <option value="Oral">Oral</option>
                                        <option value="Topical">Topical</option>
                                        <option value="Injection">Injection</option>
                                        <option value="Inhaled">Inhaled</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Dosage *</label>
                                    <input type="text" name="dosage" value={formData.dosage} onChange={handleChange} placeholder="e.g. 500mg" required />
                                </div>

                                <div className="form-group">
                                    <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly (Specific Days)</option>
                                        <option value="Interval">Every X Days</option>
                                        <option value="PRN">As Needed</option>
                                        <option value="Custom">Custom Text</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Times Per Day</label>
                                    <input
                                        type="number"
                                        name="timesPerDay"
                                        min="1"
                                        value={formData.timesPerDay}
                                        onChange={handleChange}
                                        placeholder="e.g. 1"
                                        style={{ width: '80px' }}
                                    />
                                </div>
                            </div>


                            {/* Dynamic Schedule Inputs */}
                            {scheduleType === 'Weekly' && (
                                <div className="form-group" style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                                    <label>Select Days:</label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {daysOfWeek.map(day => (
                                            <label key={day} style={{ fontWeight: 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDays.includes(day)}
                                                    onChange={() => toggleDay(day)}
                                                    style={{ marginRight: '4px' }}
                                                />
                                                {day}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {scheduleType === 'Interval' && (
                                <div className="form-group">
                                    <label>Interval (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={intervalVal}
                                        onChange={(e) => setIntervalVal(parseInt(e.target.value) || 1)}
                                        placeholder="e.g. 2 for every other day"
                                    />
                                    <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>Example: 2 = Every other day</small>
                                </div>
                            )}

                            {scheduleType === 'PRN' && (
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <input type="text" value="As Needed" readOnly style={{ background: '#eee' }} />
                                </div>
                            )}

                            {scheduleType === 'Custom' && (
                                <div className="form-group">
                                    <label>Custom Frequency Text *</label>
                                    <input type="text" name="frequency" value={formData.frequency} onChange={handleChange} placeholder="e.g. 21 days on, 7 days off" required />
                                </div>
                            )}

                            {/* Read-only feedback for auto-generated frequency */}
                            {scheduleType !== 'Custom' && (
                                <div className="form-group" style={{ opacity: 0.7 }}>
                                    <label>Generated Schedule Summary</label>
                                    <input type="text" value={formData.frequency} readOnly style={{ background: '#eee' }} />
                                </div>
                            )}


                            <div className="form-row">
                                <div className="form-group">
                                    <label>Timing Schedule</label>
                                    <input type="text" name="timing" value={formData.timing} onChange={handleChange} placeholder="e.g. At bedtime" />
                                </div>
                                <div className="form-group">
                                    <label>Meal Timing</label>
                                    <select name="mealTiming" value={formData.mealTiming} onChange={handleChange}>
                                        <option value="No Restriction">No Restriction</option>
                                        <option value="Before Meal">Before Meal</option>
                                        <option value="After Meal">After Meal</option>
                                        <option value="With Meal">With Meal</option>
                                        <option value="Take with or without food">Take with or without food</option>
                                        <option value="May be taken regardless of food">May be taken regardless of food</option>
                                        <option value="Take at any time of day">Take at any time of day</option>
                                        <option value="Take on an empty stomach">Take on an empty stomach</option>
                                        <option value="Take with food or a snack">Take with food or a snack</option>
                                        <option value="Take within 30 minutes after a meal">Take within 30 minutes after a meal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group checkbox-group">
                                <label>
                                    <input type="checkbox" name="reminders" checked={formData.reminders} onChange={handleChange} />
                                    Enable General Reminders
                                </label>
                            </div>

                            <div className="form-row" style={{ background: '#f0f7ff', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                                <div className="form-group checkbox-group" style={{ marginTop: 0 }}>
                                    <label style={{ color: '#0046be', fontWeight: 'bold' }}>
                                        <input type="checkbox" name="refillReminder" checked={formData.refillReminder} onChange={handleRefillChange} />
                                        Remind me to send refill request to my doctor
                                    </label>
                                </div>
                                {formData.refillReminder && (
                                    <div className="form-group">
                                        <input type="date" name="refillReminderDate" value={formData.refillReminderDate} onChange={handleChange} />
                                    </div>
                                )}
                            </div>

                            <div className="form-row" style={{ marginTop: '15px' }}>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="Active">Active</option>
                                        <option value="Paused">Paused</option>
                                        <option value="Stopped">Stopped</option>
                                    </select>
                                </div>
                            </div>

                            {/* Warnings Section */}
                            <div className="form-group" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <label>Warnings & Dietary Restrictions</label>
                                <input type="text" name="warning" value={formData.warning} onChange={handleChange} placeholder="e.g. Avoid grapefruit, May cause drowsiness" />
                            </div>
                            <div className="form-group checkbox-group">
                                <label style={{ color: '#d32f2f' }}>
                                    <input type="checkbox" name="allergyFlag" checked={formData.allergyFlag} onChange={handleChange} />
                                    Flag as Allergy Risk
                                </label>
                            </div>

                            <div className="form-row" style={{ marginTop: '15px' }}>
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>End Date (Optional)</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason / Notes</label>
                                <textarea name="reason" value={formData.reason} onChange={handleChange} rows="2" />
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">{editingId ? 'Update' : 'Save'}</button>
                                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                            </div>
                        </form>
                    </div>

                )}

                <div className="prescriptions-list">
                    {prescriptions.length === 0 ? (
                        <div className="empty-state">
                            <p>No medications recorded yet.</p>
                        </div>
                    ) : (
                        prescriptions.map(p => {
                            const derivedSched = getDerivedSchedule(p);
                            const freqText = p.frequency;
                            // Combine frequency and schedule (e.g. "1 pill" + "Daily" -> "1 pill Daily")
                            // If they are the same (e.g. "Daily" + "Daily"), just show one.
                            const combinedFreq = (derivedSched && freqText !== derivedSched)
                                ? `${freqText} ${derivedSched}`
                                : freqText;

                            return (
                                <div key={p.id} className={`medication-card ${p.status.toLowerCase()}`}>
                                    <div className="card-top">
                                        <div className="med-header-row">
                                            <div style={{ flex: 1 }}>
                                                <h3 className="med-name">
                                                    {p.medicationName || p.name} <span style={{ fontWeight: 'normal', color: '#555', marginLeft: '5px' }}>({p.route || 'Oral'}) {p.dosage}</span>
                                                    <span className="med-info-inline" style={{ marginLeft: '5px' }}>
                                                        • {combinedFreq} ({p.timesPerDay || 1}x/day) {p.timing ? ` • ${p.timing}` : ''}
                                                        {p.mealTiming && p.mealTiming !== 'No Restriction' && ` • ${p.mealTiming}`}
                                                        {p.reminders && <span title="Daily Reminder Enabled"> • 🔔 Reminders On</span>}
                                                    </span>
                                                </h3>
                                            </div>
                                            <span className={`status-badge ${p.status.toLowerCase()}`}>{p.status}</span>
                                        </div>



                                        <div className="med-instructions">


                                            {p.asNeeded && <span className="prn-tag">PRN</span>}
                                            {(p.warning || p.allergyFlag) && (
                                                <div className="med-warning-banner">
                                                    {p.allergyFlag && <span className="allergy-badge">ALLERGY</span>}
                                                    <strong>Safety Warnings:</strong> {p.warning}
                                                </div>
                                            )}
                                        </div>

                                        {p.reason && <div className="med-reason">Reason: {p.reason}</div>}
                                    </div>

                                    <div className="card-details-grid">
                                        <div className="detail-col">
                                            <span className="label">Prescription Details</span>
                                            {p.function && <div className="value-row">Function <span className="val">{p.function}</span></div>}


                                            <div className="value-row">Prescribed <span className="val">{p.prescribedDate ? new Date(p.prescribedDate).toLocaleDateString() : 'Dec 16, 2025'}</span></div>
                                            <div className="value-row">Approved by <a href="#" className="doctor-link">{p.approvedBy || 'Dr. Eileen Wegener, MD'}</a></div>
                                            <div className="value-row">Start Date <span className="val">{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</span></div>
                                        </div>
                                        <div className="detail-col">
                                            <span className="label">Adherence (Today)</span>
                                            {p._todayStatus ? (
                                                <div style={{ marginTop: '5px' }}>
                                                    <span className={`status-badge ${p._todayStatus === 'Taken' ? 'active' : 'stopped'}`}>
                                                        {p._todayStatus === 'Taken' ? '✓ Taken' : '✕ Skipped'}
                                                    </span>
                                                    {p.startDate && (
                                                        <AdherenceChart {...calculateAdherence(p.startDate)} />
                                                    )}
                                                    <button
                                                        onClick={() => logAdherence(p.id, null)}
                                                        style={{
                                                            marginLeft: '8px',
                                                            fontSize: '11px',
                                                            cursor: 'pointer',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#666',
                                                            textDecoration: 'underline'
                                                        }}
                                                    >
                                                        Undo
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="adherence-controls">
                                                    <button className="check-btn taken" onClick={() => logAdherence(p.id, 'Taken')}>✓ Taken</button>
                                                    <button className="check-btn skipped" onClick={() => logAdherence(p.id, 'Skipped')}>✕ Skipped</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pharmacy-details">
                                        <span className="label">Pharmacy Details</span>
                                        <div className="pharmacy-info">
                                            <div className="pharmacy-text">
                                                {p.pharmacy || (
                                                    <>
                                                        <div>CVS/pharmacy #0130 - ARLINGTON, MA</div>
                                                        <div>23-25 MASSACHUSETTS AVE, ARLINGTON MA 02474</div>
                                                        <div>781-648-0557</div>
                                                    </>
                                                )}
                                            </div>
                                            {p.refillReminder && (
                                                <div className="refill-alert" style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>
                                                    Refill Reminder: please remember to send refill request to your doctor on {p.refillReminderDate ? new Date(p.refillReminderDate).toLocaleDateString() : 'Next Week'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button className="card-action-btn" onClick={() => handleEdit(p)}>
                                            <span className="icon">✎</span> Edit Details
                                        </button>
                                        <button className="card-action-btn delete" onClick={() => handleDelete(p.id)}>
                                            <span className="icon">🗑</span> Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div >
        </div >
    );
}

export default ManagePrescriptions;
