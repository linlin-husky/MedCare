import { useEffect, useState } from 'react';
import * as api from '../services/api.js';
import './DeviceSignalPanel.css';

function normalizeSensorType(sensorType) {
    return (sensorType || '').toLowerCase().replace(/[_\s-]/g, '');
}

function findLatestSignal(signals, candidates) {
    return signals.find(signal => candidates.includes(normalizeSensorType(signal.sensorType))) || null;
}

function formatSignalValue(signal, fallbackText) {
    if (!signal) {
        return fallbackText;
    }

    const unit = signal.unit ? ` ${signal.unit}` : '';
    return `${signal.value}${unit}`;
}

function DeviceSignalPanel({ user, selectedUsername }) {
    const [signals, setSignals] = useState([]);
    const [latest, setLatest] = useState(null);
    const [deviceOnline, setDeviceOnline] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        function loadSignals() {
            const username = selectedUsername || user?.username;
            if (!username) {
                return Promise.resolve();
            }

            return api.getDeviceSignals(username, 8)
                .then(data => {
                    if (!active) {
                        return;
                    }

                    setSignals(data.signals || []);
                    setLatest(data.latest || null);
                    setDeviceOnline(Boolean(data.deviceOnline));
                    setError(null);
                })
                .catch(err => {
                    if (!active) {
                        return;
                    }

                    setError(err.message || 'Failed to load device signals');
                });
        }

        loadSignals();
        const timer = window.setInterval(loadSignals, 10000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [user?.username, selectedUsername]);

    const lastUpdated = latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : 'Waiting for device';
    const latestTemperature = findLatestSignal(signals, ['temperature', 'temp']);
    const latestHumidity = findLatestSignal(signals, ['humidity', 'humid']);

    return (
        <section className="device-signal-card" aria-labelledby="device-signal-title">
            <div className="device-signal-header">
                <div>
                    <p className="device-signal-eyebrow">Environmental feed</p>
                    <h3 id="device-signal-title">Temp &amp; Humidity Monitor</h3>
                </div>
                <span className={`device-signal-status ${deviceOnline ? 'online' : 'offline'}`}>
                    {deviceOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            <div className="device-signal-highlights">
                <div className="device-signal-highlight temp">
                    <div className="device-signal-label">Temperature</div>
                    <div className="device-signal-highlight-value">{formatSignalValue(latestTemperature, '-- C')}</div>
                </div>
                <div className="device-signal-highlight humidity">
                    <div className="device-signal-label">Humidity</div>
                    <div className="device-signal-highlight-value">{formatSignalValue(latestHumidity, '-- %')}</div>
                </div>
            </div>

            <div className="device-signal-summary">
                <div className="device-signal-label">Last update</div>
                <div className="device-signal-value device-signal-time">{lastUpdated}</div>
                <div className="device-signal-label">Latest raw reading</div>
                <div className="device-signal-value">
                    {latest ? `${latest.sensorType} ${latest.value}${latest.unit ? ` ${latest.unit}` : ''}` : 'No signal yet'}
                </div>
            </div>

            {error && <p className="device-signal-error">{error}</p>}

            <ul className="device-signal-list">
                {signals.length > 0 ? signals.map(signal => (
                    <li key={signal.id} className={`device-signal-item ${signal.acknowledged ? 'acknowledged' : ''}`}>
                        <div>
                            <strong>{signal.sensorType}</strong>
                            <span>{signal.value}{signal.unit ? ` ${signal.unit}` : ''}</span>
                        </div>
                        <div className="device-signal-meta">
                            <span>{signal.deviceId}</span>
                            <span>{new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </li>
                )) : (
                    <li className="device-signal-empty">No telemetry received yet.</li>
                )}
            </ul>
        </section>
    );
}

export default DeviceSignalPanel;