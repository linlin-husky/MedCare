import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import * as api from '../services/api.js';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dashboard-error">
          <h3>Something went wrong in the Dashboard.</h3>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}


function Dashboard(props) {
  return (
    <ErrorBoundary>
      <DashboardContent {...props} />
    </ErrorBoundary>
  );
}

function DashboardContent({ user, navigateTo, selectedUsername, setSelectedUsername, profiles }) { // Receive props
  const [appointments, setAppointments] = useState([]);
  const [medications, setMedications] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [medicalTests, setMedicalTests] = useState([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [familyWeightData, setFamilyWeightData] = useState({});

  // Calculate current week's days (Mon-Sun)
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 1 is Mon
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [displayUser, setDisplayUser] = useState(user);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        // Fetch Profile for selected user
        if (selectedUsername) {
          let foundLocally = false;
          // 1. Check if it's a family member (local data)
          if (user && user.familyMembers) {
            let member = user.familyMembers.find(m => m.username === selectedUsername);

            // Fallback: Check if selectedUsername is a virtual ID (virtual:parent:name)
            if (!member && selectedUsername.startsWith('virtual:')) {
              const parts = selectedUsername.split(':');
              if (parts.length >= 3) {
                const nameToFind = parts[2];
                member = user.familyMembers.find(m => m.name === nameToFind);
              }
            }

            if (member) {
              setDisplayUser({
                displayName: member.name,
                username: member.username || selectedUsername, // Use selected if member has no username
                relation: member.relation,
                weight: member.weight || '-',
                height: member.height || '-',
                bmi: member.bmi || '-'
              });
              foundLocally = true;
            }
          }

          // 2. If not found locally, try API (e.g. for the main user or other real users)
          if (!foundLocally) {
            try {
              const profile = await api.getPublicProfile(selectedUsername);
              // Ensure we don't accidentally show the logged-in user if the API ignores the param
              const fetchedUser = profile.user || profile;
              if (fetchedUser.username === selectedUsername) {
                setDisplayUser(fetchedUser);
              } else if (selectedUsername === user.username) {
                // explicitly requesting self
                setDisplayUser(fetchedUser);
              } else {
                console.warn('API returned matching user mismatch. Ignoring.');
              }
            } catch (profileErr) {
              console.warn(`Could not fetch profile for ${selectedUsername}`, profileErr);
            }
          }
        }

        const appts = await api.getAppointments(selectedUsername);
        if (appts && Array.isArray(appts.appointments)) {
          setAppointments(appts.appointments);
        } else if (Array.isArray(appts)) {
          setAppointments(appts);
        }

        const meds = await api.getMedications(selectedUsername);
        if (meds && Array.isArray(meds.medications)) {
          setMedications(meds.medications);
        } else if (Array.isArray(meds)) {
          setMedications(meds);
        }

        // Fetch Weight
        const wVitals = await api.getVitals('weight', selectedUsername);
        const wList = wVitals && (wVitals.vitals || wVitals);
        let latestWeightVal = null;
        if (Array.isArray(wList) && wList.length > 0) {
          // Sort by date descending
          const sortedW = wList.sort((a, b) => new Date(b.date) - new Date(a.date));
          setWeightData(sortedW.map(v => v.value).reverse()); // For chart (oldest first)
          latestWeightVal = sortedW[0].value;
        } else {
          setWeightData([]);
        }

        // Fetch Height
        const hVitals = await api.getVitals('height', selectedUsername);
        const hList = hVitals && (hVitals.vitals || hVitals);
        let latestHeightVal = null;
        if (Array.isArray(hList) && hList.length > 0) {
          const sortedH = hList.sort((a, b) => new Date(b.date) - new Date(a.date));
          latestHeightVal = sortedH[0].value;
        }

        // Calculate BMI
        let calculatedBMI = '-';
        if (latestWeightVal && latestHeightVal) {
          // Assuming weight in lbs and height in cm (based on seed)
          // BMI = (lb / 2.20462) / ((cm / 100) ^ 2)
          const weightKg = latestWeightVal / 2.20462;
          const heightM = latestHeightVal / 100;
          if (heightM > 0) {
            calculatedBMI = (weightKg / (heightM * heightM)).toFixed(1);
          }
        }

        // Update display user with latest metrics if available, or keep existing
        setDisplayUser(prev => ({
          ...prev,
          weight: latestWeightVal || prev.weight,
          height: latestHeightVal || prev.height,
          bmi: calculatedBMI !== '-' ? calculatedBMI : prev.bmi
        }));

        const tests = await api.getMedicalTests(selectedUsername);
        const tList = tests && (tests.tests || tests);
        if (Array.isArray(tList)) {
          setMedicalTests(tList);
        } else {
          setMedicalTests([]);
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchData();
  }, [user, selectedUsername]); // Re-fetch if user or selectedUsername changes

  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: '',
    time: '',
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddAppointment = (e) => {
    e.preventDefault();
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
        // Refresh appointments
        api.getAppointments(selectedUsername)
          .then(data => setAppointments(data.appointments || []))
          .catch(err => console.error('Failed to load appointments', err));
      })
      .catch(err => alert(err.message));
  };

  // Find upcoming test
  const upcomingTest = medicalTests.find(t => t.status === 'scheduled') || medicalTests[0];




  useEffect(() => {
    const fetchFamilyWeights = async () => {
      if (!user) return;

      const members = [{ username: user.username, displayName: 'Me', color: '#9b59b6' }];
      if (user.familyMembers) {
        const colors = ['#1abc9c', '#e67e22', '#3498db', '#e74c3c'];
        user.familyMembers.forEach((m, idx) => {
          if (m.username) {
            members.push({
              username: m.username,
              displayName: m.name,
              color: colors[idx % colors.length]
            });
          }
        });
      }

      const weightMap = {};

      // Fetch for all members
      await Promise.all(members.map(async (member) => {
        try {
          const vitals = await api.getVitals('weight', member.username);
          const vList = vitals && (vitals.vitals || vitals);
          if (Array.isArray(vList)) {
            // Sort by date
            const sorted = vList.sort((a, b) => new Date(a.date) - new Date(b.date));
            // Keep last 6 months or sufficient data points
            weightMap[member.username] = {
              data: sorted,
              color: member.color,
              name: member.displayName
            };
          }
        } catch (e) {
          console.error(`Failed to fetch weight for ${member.username}`, e);
        }
      }));

      setFamilyWeightData(weightMap);
    };

    fetchFamilyWeights();
  }, [user]); // Re-run if user changes (e.g. login)

  // Chart Rendering Helpers
  const renderChartLines = () => {
    try {
      // 1. Determine Global Min/Max for Scales
      let allPoints = [];
      Object.values(familyWeightData).forEach(entry => {
        if (entry.data) allPoints = [...allPoints, ...entry.data];
      });

      if (allPoints.length === 0) return null;

      const values = allPoints.map(p => p.value);
      const dates = allPoints.map(p => new Date(p.date).getTime());

      // Calculate nice ranges
      let minVal = Math.min(...values);
      let maxVal = Math.max(...values);
      if (minVal === maxVal) {
        minVal -= 10;
        maxVal += 10;
      } else {
        // Add padding
        const padding = (maxVal - minVal) * 0.1;
        minVal -= padding;
        maxVal += padding;
      }
      // Ensure min is at least 0 if values are positive, or just round down
      minVal = Math.max(0, Math.floor(minVal / 10) * 10);
      maxVal = Math.ceil(maxVal / 10) * 10;

      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);

      // Dimensions
      const fullWidth = 300;
      const fullHeight = 150;
      const margin = { top: 10, right: 15, bottom: 20, left: 30 };
      const width = fullWidth - margin.left - margin.right;
      const height = fullHeight - margin.top - margin.bottom;

      const valRange = maxVal - minVal || 10;
      const dateRange = maxDate - minDate || 1;

      // Coordinate transformers
      const getX = (dateMs) => ((dateMs - minDate) / dateRange) * width + margin.left;
      const getY = (val) => height - ((val - minVal) / valRange) * height + margin.top;

      // Generate Grid Lines & Y-Axis Labels
      const gridLines = [];
      const yLabels = [];
      const step = (maxVal - minVal) / 4; // 5 lines
      for (let i = 0; i <= 4; i++) {
        const val = minVal + (step * i);
        const y = getY(val);
        gridLines.push(
          <line
            key={`grid-${i}`}
            x1={margin.left}
            y1={y}
            x2={fullWidth - margin.right}
            y2={y}
            stroke="#e0e0e0"
            strokeWidth="1"
          />
        );
        yLabels.push(
          <text
            key={`ylabel-${i}`}
            x={margin.left - 5}
            y={y + 3} // vertical center adjustment
            textAnchor="end"
            fontSize="8"
            fill="#666"
          >
            {Math.round(val)}
          </text>
        );
      }

      // Generate X-Axis Labels (Timeline)
      const xLabels = [];
      const startDate = new Date(minDate);
      const endDate = new Date(maxDate);
      // Rough heuristic: picking start, end, and middle
      const datePoints = [startDate];
      const midDate = new Date((minDate + maxDate) / 2);
      if (maxDate - minDate > 86400000 * 60) { // If span > 2 months
        datePoints.push(midDate);
      }
      datePoints.push(endDate);

      // Better heuristic: Pick ~4-5 evenly spaced points
      const numXLabels = 5;
      for (let i = 0; i < numXLabels; i++) {
        const t = minDate + (dateRange * (i / (numXLabels - 1)));
        const d = new Date(t);
        const x = getX(t);
        const month = d.toLocaleString('default', { month: 'short' });
        // const day = d.getDate();

        xLabels.push(
          <text
            key={`xlabel-${i}`}
            x={x}
            y={fullHeight - 5}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
          >
            {month}
          </text>
        );
      }


      const lines = Object.entries(familyWeightData).map(([username, entry]) => {
        if (!entry.data || entry.data.length === 0) return null;

        const points = entry.data.map(d => {
          return `${getX(new Date(d.date).getTime())},${getY(d.value)}`;
        }).join(' ');

        // Last point for dot
        const last = entry.data[entry.data.length - 1];
        const lastX = getX(new Date(last.date).getTime());
        const lastY = getY(last.value);

        return (
          <g key={username}>
            <path
              d={`M${points}`}
              fill="none"
              stroke={entry.color}
              strokeWidth="2"
            />
            <circle cx={lastX} cy={lastY} r="3" fill="white" stroke={entry.color} strokeWidth="2" />
          </g>
        );
      });

      return (
        <g>
          {gridLines}
          {lines}
          {/* Axes lines */}
          <line x1={margin.left} y1={margin.top} x2={margin.left} y2={fullHeight - margin.bottom} stroke="#ccc" strokeWidth="1" />
          <line x1={margin.left} y1={fullHeight - margin.bottom} x2={fullWidth - margin.right} y2={fullHeight - margin.bottom} stroke="#ccc" strokeWidth="1" />
          {yLabels}
          {xLabels}
        </g>
      );

    } catch (err) {
      console.error("Error rendering chart:", err);
      return null;
    }
  };

  const chartLegend = () => {
    return (
      <div className="chart-legend" style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.values(familyWeightData).map(entry => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color }}></div>
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <div className="dashboard-title">
          <h1>Health Dashboard</h1>
          <p>Welcome back, {user ? user.displayName : 'Guest'}</p>
        </div>

        {profiles && profiles.length > 0 && (
          <div className="profile-selector-container">
            <label htmlFor="dashboard-profile-select">Profile:</label>
            <select
              id="dashboard-profile-select"
              className="profile-dropdown-dashboard"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername && setSelectedUsername(e.target.value)}
            >
              {profiles.map(p => (
                <option key={p.username} value={p.username}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top Row */}
      <div className="dashboard-row">

        {/* Appointment Card */}
        <div
          className="metric-card appointment-card"
          onClick={() => navigateTo('calendar')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateTo('calendar')}
          role="button"
          tabIndex="0"
          style={{ cursor: 'pointer' }}
          title="Go to Calendar"
          aria-label="Go to Calendar"
        >
          <div className="card-header-clean">
            <h3>Upcoming Appointment</h3>
            <button
              className="dashboard-add-btn"
              aria-label="Add Appointment"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddModal(true);
              }}
            >+</button>
          </div>

          <div className="appointment-main">
            <div className="time-display">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {appointments.filter(appt => {
              const apptDate = new Date(appt.date);
              return apptDate.getDate() === selectedDate.getDate() &&
                apptDate.getMonth() === selectedDate.getMonth() &&
                apptDate.getFullYear() === selectedDate.getFullYear();
            }).length > 0 ? (
              appointments.filter(appt => {
                const apptDate = new Date(appt.date);
                return apptDate.getDate() === selectedDate.getDate() &&
                  apptDate.getMonth() === selectedDate.getMonth() &&
                  apptDate.getFullYear() === selectedDate.getFullYear();
              }).map((appt, i) => (
                <div key={i}>
                  <div className="appt-title">{appt.title}</div>
                  <div className="appt-loc">@ {appt.location}</div>
                </div>
              ))
            ) : (
              <div className="appt-title">No appointments</div>
            )}
          </div>

          <div className="calendar-strip">
            {weekDays.map((date, index) => {
              const isSelected = date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth();
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return (
                <div
                  key={index}
                  className={`day-box ${isSelected ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(date);
                  }}
                >
                  <span className="day-name">{dayNames[date.getDay()]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medication Reminder */}
        <div
          className="metric-card medication-card"
          onClick={() => navigateTo('manage-prescriptions')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateTo('manage-prescriptions')}
          role="button"
          tabIndex="0"
          style={{ cursor: 'pointer' }}
          title="Manage Prescriptions"
          aria-label="Manage Prescriptions"
        >
          <div className="card-header-clean">
            <div className="blue-accent-bar"></div>
            <h3>Medication Reminder</h3>
          </div>

          <div className="medication-list">
            {medications.map((med, idx) => (
              <div key={idx} className="medication-item">
                <div className={`med-icon icon-${med.icon || 'pill'}`}></div>
                <div className="med-info">
                  <div className="med-name">{med.name}</div>
                  <div className="med-dose">{med.dosage || med.dose}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-row">

        {/* Profile Card */}
        <div className="metric-card profile-card">
          <div className="profile-image-container">
            <div className="profile-avatar">
              {/* Placeholder Avatar */}
              <svg viewBox="0 0 24 24" fill="#ff6b6b" width="60" height="60" role="img" aria-label="Profile Avatar">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>

          <h2 className="profile-name">{displayUser ? displayUser.displayName : 'Guest'}</h2>

          <div className="profile-stats">
            <div className="p-stat">
              <div className="p-val">
                {displayUser?.weight && !isNaN(displayUser.weight)
                  ? Number(displayUser.weight).toFixed(1)
                  : (displayUser?.weight || '-')} lb
              </div>
              <div className="p-lbl">Weight</div>
            </div>
            <div className="p-stat">
              <div className="p-val">
                {displayUser?.height && !isNaN(displayUser.height)
                  ? Number(displayUser.height).toFixed(1)
                  : (displayUser?.height || '-')}
              </div>
              <div className="p-lbl">Height</div>
            </div>
            <div className="p-stat">
              <div className="p-val">
                {displayUser?.bmi && !isNaN(displayUser.bmi)
                  ? Number(displayUser.bmi).toFixed(1)
                  : (displayUser?.bmi || '-')}
              </div>
              <div className="p-lbl">BMI</div>
            </div>
          </div>

          <div
            className="test-item"
            onClick={() => navigateTo('tests')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateTo('tests')}
            role="button"
            tabIndex="0"
            style={{ cursor: 'pointer' }}
            aria-label="View Medical Tests"
          >
            <div className="test-status-dot"></div>
            <div className="test-info">
              <div className="test-name">
                {upcomingTest ? upcomingTest.testName : 'No upcoming tests'}
              </div>
              <div className="test-desc">
                {upcomingTest ? (upcomingTest.notes || upcomingTest.category) : 'Check back later'}
              </div>
            </div>
            <div className="test-cycle">
              {upcomingTest && upcomingTest.testDate
                ? new Date(upcomingTest.testDate).toLocaleDateString()
                : ''}
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="metric-card chart-card">
          <div className="card-header-clean">
            <div className="blue-accent-bar"></div>
            <h3>Family Weight</h3>
          </div>

          <div className="chart-area">
            {/* Dynamic SVG Line Chart */}
            <svg viewBox="0 0 300 150" className="simple-line-chart">
              {renderChartLines()}
            </svg>
            {chartLegend()}
          </div>
        </div>

      </div>

      {/* Motivational Quote */}


      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Appointment</h3>
            <form onSubmit={handleAddAppointment}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newAppt.title}
                  onChange={e => setNewAppt({ ...newAppt, title: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={newAppt.date}
                  onChange={e => setNewAppt({ ...newAppt, date: e.target.value })}
                  required
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="time"
                  value={newAppt.time}
                  onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                  required
                  aria-required="true"
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



export default Dashboard;
