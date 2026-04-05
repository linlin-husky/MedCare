import { useState, useEffect, useMemo } from 'react';
import './MedicalTests.css';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';
import LoadingSpinner from './LoadingSpinner';

const TEST_CATEGORIES = [
    'Blood Work',
    'Imaging',
    'Cardiac',
    'Respiratory',
    'Neurological',
    'Dermatological',
    'Other'
];

const TEST_STATUSES = [
    'scheduled',
    'completed',
    'pending'
];

export default function MedicalTests({ user }) {
    const [selectedUsername, setSelectedUsername] = useState(user?.username);

    useEffect(() => {
        if (user?.username && !selectedUsername) {
            setSelectedUsername(user.username);
        }
    }, [user, selectedUsername]);
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

    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [statusFilter, setStatusFilter] = useState('All Items');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [searchQuery, setSearchQuery] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        testName: '',
        category: '',
        status: 'pending',
        testDate: '',
        resultDate: '',
        result: '',
        notes: '',
        doctor: '',
        facility: ''
    });

    // Fetch all tests
    useEffect(() => {
        fetchTests();
    }, [selectedUsername]);

    // Apply filters when tests or filters change
    useEffect(() => {
        applyFilters();
    }, [tests, statusFilter, categoryFilter, searchQuery]);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const url = selectedUsername
                ? `/api/medical-tests?username=${encodeURIComponent(selectedUsername)}`
                : '/api/medical-tests';
            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tests');
            }

            const data = await response.json();
            // Handle both { tests: [] } and [] response formats
            const testsArray = data.tests || data || [];
            setTests(Array.isArray(testsArray) ? testsArray : []);
            setError('');
        } catch (err) {
            setError('Failed to load medical tests');
            console.error(err);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...tests];

        // Apply status filter
        if (statusFilter !== 'All Items') {
            filtered = filtered.filter(test => test.status === statusFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'All Categories') {
            filtered = filtered.filter(test => test.category === categoryFilter);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(test =>
                test.testName.toLowerCase().includes(query) ||
                test.category.toLowerCase().includes(query) ||
                test.doctor?.toLowerCase().includes(query) ||
                test.result?.toLowerCase().includes(query)
            );
        }

        setFilteredTests(filtered);
    };

    const [isNoteExpanded, setIsNoteExpanded] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    const [editingId, setEditingId] = useState(null);

    const handleSaveTest = async (e) => {
        e.preventDefault();

        if (!formData.testName || !formData.category) {
            setError('Test name and category are required');
            return;
        }

        try {
            const payload = { ...formData, username: selectedUsername };
            let response;

            if (editingId) {
                response = await fetch(`/api/medical-tests/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/medical-tests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                throw new Error('Failed to save test');
            }

            const savedTest = await response.json();

            if (editingId) {
                setTests(tests.map(t => t.id === editingId ? savedTest : t));
                setSuccess('Medical test updated successfully');
            } else {
                setTests([...tests, savedTest]);
                setSuccess('Medical test added successfully');
            }

            setFormData({
                testName: '',
                category: '',
                status: 'pending',
                testDate: '',
                resultDate: '',
                result: '',
                notes: '',
                doctor: '',
                facility: ''
            });
            setEditingId(null);
            setShowForm(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save test');
            console.error(err);
        }
    };

    const handleEditTest = (test) => {
        setEditingId(test.id);
        setFormData({
            testName: test.testName,
            category: test.category,
            status: test.status || 'pending',
            testDate: test.testDate ? new Date(test.testDate).toISOString().split('T')[0] : '',
            resultDate: test.resultDate ? new Date(test.resultDate).toISOString().split('T')[0] : '',
            result: test.result || '',
            notes: test.notes || '',
            doctor: test.doctor || '',
            facility: test.facility || ''
        });
        setShowForm(true);
    };

    const handleDeleteTest = async (id) => {
        if (!confirm('Are you sure you want to delete this test?')) return;

        try {
            const response = await fetch(`/api/medical-tests/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete test');
            }

            setTests(tests.filter(test => test.id !== id));
            setSuccess('Medical test deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete test');
            console.error(err);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            testName: '',
            category: '',
            status: 'pending',
            testDate: '',
            resultDate: '',
            result: '',
            notes: '',
            doctor: '',
            facility: ''
        });
        setShowForm(false);
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        // Add one day to fix timezone offset issues if relying on UTC/Local mixing, 
        // or just use UTC methods for simple displays. 
        // For simplicity:
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="medical-tests-container">
            <div className="page-header">
                <h1>Test Results</h1>
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
                    <button
                        className="add-test-btn"
                        onClick={() => { resetForm(); setShowForm(true); }}
                        title="Add new test record"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Expandable Note */}
            <div className="expandable-note">
                <div
                    className="note-header"
                    onClick={() => setIsNoteExpanded(!isNoteExpanded)}
                    role="button"
                    tabIndex="0"
                >
                    <span className="note-title">PLEASE NOTE (click to expand)</span>
                    <span className={`chevron ${isNoteExpanded ? 'expanded' : ''}`}>▼</span>
                </div>
                {isNoteExpanded && (
                    <div className="note-content">
                        Medical Tests show results from hospital or clinic visits performed by doctors, excluding home-based tests.
                    </div>
                )}
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}
            {success && <SuccessMessage message={success} />}

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingId ? 'Edit Test' : 'Add New Test'}</h3>
                        <form className="test-form" onSubmit={handleSaveTest}>
                            <div className="form-group">
                                <label>Test Name *</label>
                                <input
                                    type="text"
                                    value={formData.testName}
                                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {TEST_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Doctor</label>
                                <input
                                    type="text"
                                    value={formData.doctor}
                                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formData.testDate}
                                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Result (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.result}
                                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                                    placeholder="e.g. Normal, High Glucose, Pending"
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {TEST_STATUSES.map(s => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={resetForm}>Cancel</button>
                                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="main-layout">
                {/* Left Content Area */}
                <div className="left-content">
                    {/* Search Bar */}
                    <div className="search-bar-container">
                        <input
                            type="text"
                            placeholder="Search test results"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="main-search-input"
                        />
                        <span className="search-icon">🔍</span>
                        {searchQuery && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="results-section">
                        <h2>Individual Results</h2>
                        <p className="results-count">Showing {filteredTests.length} of {tests.length}</p>

                        <div className="results-list">
                            {filteredTests.length === 0 ? (
                                <div className="no-tests-state">
                                    <p>No test results found.</p>
                                </div>
                            ) : (
                                filteredTests.map(test => (
                                    <div key={test.id} className="result-item">
                                        <div className="result-icon">
                                            <svg viewBox="0 0 24 24" className="beaker-icon">
                                                <path fill="currentColor" d="M21,2H3V4H5V16C5,18.76 7.24,21 10,21H14C16.76,21 19,18.76 19,16V4H21V2M15,16H9V4H15V16Z" />
                                            </svg>
                                        </div>
                                        <div className="result-info">
                                            <h3 className="result-name">{test.testName}</h3>
                                            {test.result && <div className="result-value">{test.result}</div>}
                                            <div className="result-date">
                                                {formatDate(test.testDate || test.resultDate)}
                                            </div>
                                        </div>
                                        <div className="result-doctor">
                                            <div className="doc-avatar">
                                                <svg viewBox="0 0 24 24" fill="#fff">
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            </div>
                                            <div className="doc-details">
                                                <div className="doc-name">{test.doctor || 'Unknown Doctor'}</div>
                                                <div className="message-btn">Messages from Care Team</div>
                                            </div>
                                        </div>
                                        <div className="item-actions">
                                            <button
                                                className="action-icon-btn edit-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditTest(test);
                                                }}
                                                title="Edit record"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                className="action-icon-btn delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTest(test.id);
                                                }}
                                                title="Delete record"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="right-sidebar">
                    <div className="sidebar-section">
                        <div
                            className="sidebar-header"
                            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                        >
                            <h3>Settings and filters</h3>
                            <span className={`chevron ${isSidebarExpanded ? 'expanded' : ''}`}>▼</span>
                        </div>

                        {isSidebarExpanded && (
                            <div className="sidebar-content">
                                <div className="filter-option">
                                    <p>Show results from hospital visits?</p>
                                    <div className="toggle-group">
                                        <button className="toggle-btn active">Yes</button>
                                        <button className="toggle-btn">No</button>
                                    </div>
                                </div>
                                <div className="sidebar-link">
                                    <span className="edit-icon">✎</span>
                                    <a href="#preferences">Test result preferences</a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
