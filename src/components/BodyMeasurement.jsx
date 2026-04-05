import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../services/api.js';
import './BodyMeasurement.css';
import LoadingSpinner from './LoadingSpinner.jsx';
import DeleteButton from './DeleteButton.jsx';

// --- Helper for Charts ---
const TrendChart = ({ data, dataKey, dataKey2, color = '#3b82f6', color2 = '#14b8a6', height = 150, labels = [], abnormalRange = null }) => {
    if (!data || data.length < 2) return <div className="no-chart">Not enough data for trend</div>;

    const validData = data.filter(d => !isNaN(d[dataKey]));
    if (validData.length === 0) return null;

    // 1. Determine Scale
    const values = validData.map(d => d[dataKey]);
    let min = Math.min(...values);
    let max = Math.max(...values);

    // Check secondary data
    if (dataKey2) {
        const values2 = validData.map(d => d[dataKey2]);
        min = Math.min(min, ...values2);
        max = Math.max(max, ...values2);
    }

    // Add Buffer (10% or min 5 units)
    const paddingVal = (max - min) * 0.1 || 5;
    const chartMin = min - paddingVal;
    const chartMax = max + paddingVal;
    const chartRange = chartMax - chartMin || 1;

    // 2. Map Points to % coordinates
    // We will use 0-100 coordinate space for simplicity in line generation
    const getX = (index) => (index / (validData.length - 1)) * 100;
    const getY = (val) => 100 - ((val - chartMin) / chartRange) * 100;

    const points1 = validData.map((d, i) => `${getX(i)},${getY(d[dataKey])}`).join(' ');
    const points2 = dataKey2 ? validData.map((d, i) => `${getX(i)},${getY(d[dataKey2])}`).join(' ') : null;

    // Helper to check abnormality
    const isAbnormal = (val) => {
        if (!abnormalRange) return false;
        return val < abnormalRange.min || val > abnormalRange.max;
    };

    return (
        <div className="mini-chart-container" style={{ height: (height + (labels.length ? 20 : 0)) + 'px' }}>
            <div style={{ position: 'relative', height: height + 'px', width: '100%' }}>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="chart-svg"
                >
                    {/* Grid Lines (25%, 50%, 75%) */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                    {/* Line 1 */}
                    <polyline
                        points={points1}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Line 2 */}
                    {points2 && (
                        <polyline
                            points={points2}
                            fill="none"
                            stroke={color2}
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                            strokeDasharray="4"
                        />
                    )}

                    {/* Abnormal Points Highlighting */}
                    {validData.map((d, i) => {
                        const val1 = d[dataKey];
                        const val2 = dataKey2 ? d[dataKey2] : null;

                        const svgs = [];
                        if (isAbnormal(val1)) {
                            svgs.push(<circle key={`p1-${i}`} cx={getX(i)} cy={getY(val1)} r="3" fill="#ef4444" stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />);
                        }
                        if (val2 !== null && isAbnormal(val2)) {
                            svgs.push(<circle key={`p2-${i}`} cx={getX(i)} cy={getY(val2)} r="3" fill="#ef4444" stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />);
                        }
                        return svgs;
                    })}
                </svg>

                {/* Overlay Labels (Min/Max) */}
                <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '10px', color: '#94a3b8' }}>{Math.round(chartMax)}</div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, fontSize: '10px', color: '#94a3b8' }}>{Math.round(chartMin)}</div>
            </div>

            {/* Legend */}
            {labels.length > 0 && (
                <div style={{ display: 'flex', gap: '15px', marginTop: '5px', justifyContent: 'center', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></span>
                        {labels[0]}
                    </div>
                    {labels[1] && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '2px', background: color2 }}></span>
                            <span style={{ width: '2px', height: '2px', background: color2, borderRadius: '50%' }}></span>
                            {labels[1]}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


function BodyMeasurement({ user }) {
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formType, setFormType] = useState('bloodPressure');
    const [formData, setFormData] = useState({
        value: '', // for weight/height/temperature
        systolic: '',
        diastolic: '',
        unit: 'lbs', // Default
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [selectedUsername, setSelectedUsername] = useState(user?.username);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user]);
    const profiles = useMemo(() => {
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
        fetchVitals();
    }, [selectedUsername]);

    const fetchVitals = () => {
        setLoading(true);
        api.getVitals(null, selectedUsername).then(data => {
            setVitals(data.vitals || data || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    // Calculate Latest & History for Charts
    const history = useMemo(() => {
        const sorted = [...vitals].sort((a, b) => new Date(a.date) - new Date(b.date));

        const weightData = sorted.filter(v => v.type === 'weight');
        const heightData = sorted.filter(v => v.type === 'height');
        const bpData = sorted.filter(v => v.type === 'bloodPressure');
        const tempData = sorted.filter(v => v.type === 'temperature');

        // Calculate BMI History
        const bmiData = weightData.map(w => {
            const hRecord = heightData
                .filter(h => new Date(h.date) <= new Date(w.date))
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (!hRecord) return null;

            let weightKg = w.unit === 'lb' ? w.value * 0.453592 : w.value;
            let heightM = hRecord.unit === 'cm' ? hRecord.value / 100 : (hRecord.unit === 'ft' ? hRecord.value * 0.3048 : hRecord.value);

            if (!heightM || !weightKg) return null;

            const bmi = weightKg / (heightM * heightM);
            return {
                date: w.date,
                value: parseFloat(bmi.toFixed(1)),
                unit: 'BMI'
            };
        }).filter(Boolean);

        return {
            weight: weightData,
            height: heightData,
            bloodPressure: bpData,
            temperature: tempData,
            bmi: bmiData
        };
    }, [vitals]);

    const latest = {
        weight: history.weight[history.weight.length - 1],
        height: history.height[history.height.length - 1],
        bp: history.bloodPressure[history.bloodPressure.length - 1],
        temp: history.temperature[history.temperature.length - 1],
        bmi: history.bmi[history.bmi.length - 1]
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormType(newType);
        let defaultUnit = '';
        if (newType === 'weight') defaultUnit = 'lb';
        if (newType === 'height') defaultUnit = 'cm';
        if (newType === 'bloodPressure') defaultUnit = 'mmHg';
        if (newType === 'temperature') defaultUnit = '°F';

        setFormData(prev => ({
            ...prev,
            unit: defaultUnit,
            value: '',
            systolic: '',
            diastolic: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            type: formType,
            date: new Date(formData.date),
            notes: formData.notes,
            unit: formData.unit
        };

        if (formType === 'bloodPressure') {
            payload.systolic = parseFloat(formData.systolic);
            payload.diastolic = parseFloat(formData.diastolic);
            payload.value = payload.systolic;
        } else {
            payload.value = parseFloat(formData.value);
        }

        try {
            await api.addVital({ ...payload, username: selectedUsername });
            setShowForm(false);
            setFormData({ ...formData, notes: '', value: '', systolic: '', diastolic: '' });
            fetchVitals();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        await api.deleteVital(id);
        fetchVitals();
    };

    return (
        <div className="body-measurement">
            <div className="vitals-header">
                <h1>Body Measurement & Vitals</h1>
                <div className="header-actions">
                    <div className="profile-selector">
                        <label htmlFor="target-profile">Profile: </label>
                        <select
                            id="target-profile"
                            value={selectedUsername}
                            onChange={(e) => setSelectedUsername(e.target.value)}
                            className="profile-dropdown"
                        >
                            {profiles.map(p => (
                                <option key={p.username} value={p.username}>{p.displayName}</option>
                            ))}
                        </select>
                    </div>
                    <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                        <span style={{ fontSize: '1.25rem' }}>+</span> Add Record
                    </button>
                </div>
            </div>

            {/* --- Section 1: Fixed Stats (Weight, Height, BMI) --- */}
            <div className="fixed-stats-row">
                <div className="stat-card">
                    <div className="stat-label">Weight</div>
                    <div className="stat-value">
                        {latest.weight ? `${latest.weight.value} ${latest.weight.unit}` : '--'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Height</div>
                    <div className="stat-value">
                        {latest.height ? `${latest.height.value} ${latest.height.unit}` : '--'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">BMI</div>
                    <div className="stat-value">
                        {latest.bmi ? latest.bmi.value : '--'}
                    </div>
                    {latest.bmi && (
                        <div className={`bmi-tag ${latest.bmi.value < 18.5 ? 'orange' : latest.bmi.value < 25 ? 'green' : 'red'}`}>
                            {latest.bmi.value < 18.5 ? 'Underweight' : latest.bmi.value < 25 ? 'Normal' : 'Overweight'}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Section 2: Daily Charts (BP, Temp) --- */}
            <div className="charts-grid">
                {/* Blood Pressure Chart */}
                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Blood Pressure</span>
                        <div className="card-icon">❤️</div>
                    </div>
                    {latest.bp ? (
                        <>
                            <div className="latest-value">
                                {latest.bp.systolic}/{latest.bp.diastolic}
                                <span className="latest-unit">mmHg</span>
                            </div>
                            <div className="latest-date">{new Date(latest.bp.date).toLocaleDateString()}</div>
                            <TrendChart
                                data={history.bloodPressure}
                                dataKey="systolic"
                                dataKey2="diastolic"
                                labels={['SBP', 'DBP']}
                                abnormalRange={{ min: 60, max: 130 }}
                            />
                        </>
                    ) : (
                        <div className="no-data">No data</div>
                    )}
                </div>

                {/* Body Temperature Chart */}
                <div className="chart-card">
                    <div className="card-header">
                        <span className="card-title">Body Temperature</span>
                        <div className="card-icon">🌡️</div>
                    </div>
                    {latest.temp ? (
                        <>
                            <div className="latest-value">
                                {latest.temp.value}
                                <span className="latest-unit">{latest.temp.unit}</span>
                            </div>
                            <div className="latest-date">{new Date(latest.temp.date).toLocaleDateString()}</div>
                            <TrendChart
                                data={history.temperature}
                                dataKey="value"
                                color="#f59e0b"
                                labels={['Temp']}
                                abnormalRange={{ min: 97, max: 99.5 }}
                            />
                        </>
                    ) : (
                        <div className="no-data">No data</div>
                    )}
                </div>
            </div>

            {/* --- Quick Add Form --- */}
            {showForm && (
                <div className="vital-form-container">
                    <form className="vital-form" onSubmit={handleSubmit}>
                        <h2>Record New Measurement</h2>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Type</label>
                            <div className="type-radios">
                                <label><input type="radio" name="type" value="bloodPressure" checked={formType === 'bloodPressure'} onChange={handleTypeChange} /> Blood Pressure</label>
                                <label><input type="radio" name="type" value="temperature" checked={formType === 'temperature'} onChange={handleTypeChange} /> Temperature</label>
                                <label><input type="radio" name="type" value="weight" checked={formType === 'weight'} onChange={handleTypeChange} /> Weight</label>
                                <label><input type="radio" name="type" value="height" checked={formType === 'height'} onChange={handleTypeChange} /> Height</label>
                            </div>
                        </div>

                        <div className="form-grid">
                            {formType === 'bloodPressure' ? (
                                <>
                                    <div className="form-group">
                                        <label>Systolic (mmHg)</label>
                                        <input type="number" name="systolic" value={formData.systolic} onChange={handleFormChange} placeholder="120" required className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Diastolic (mmHg)</label>
                                        <input type="number" name="diastolic" value={formData.diastolic} onChange={handleFormChange} placeholder="80" required className="form-input" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Value</label>
                                        <input type="number" name="value" step="0.1" value={formData.value} onChange={handleFormChange} placeholder="0.0" required className="form-input" />
                                    </div>
                                    <div className="form-group">
                                        <label>Unit</label>
                                        <select name="unit" value={formData.unit} onChange={handleFormChange} className="form-input">
                                            {formType === 'weight' && <><option value="lb">lb</option><option value="kg">kg</option></>}
                                            {formType === 'height' && <><option value="cm">cm</option><option value="ft">ft</option></>}
                                            {formType === 'temperature' && <><option value="°F">°F</option><option value="°C">°C</option></>}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleFormChange} required className="form-input" />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="submit-btn" style={{ width: 'auto' }}>Save Record</button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- History List --- */}
            <div className="vitals-history">
                <h2>History Log</h2>
                {vitals.length === 0 ? <p>No history yet.</p> : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Value</th>
                                <th>Notes</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...vitals].sort((a, b) => new Date(b.date) - new Date(a.date)).map(v => (
                                <tr key={v.id}>
                                    <td>{new Date(v.date).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`type-badge ${v.type ? v.type.toLowerCase() : ''}`}>
                                            {v.type === 'bloodPressure' ? 'BP' : v.type}
                                        </span>
                                    </td>
                                    <td>
                                        {v.type === 'bloodPressure'
                                            ? `${v.systolic}/${v.diastolic} ${v.unit}`
                                            : `${v.value} ${v.unit}`
                                        }
                                    </td>
                                    <td>{v.notes}</td>
                                    <td>
                                        <DeleteButton
                                            onDelete={() => handleDelete(v.id)}
                                            className="delete-action"
                                            style={{ padding: '0.25rem 0.5rem' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default BodyMeasurement;