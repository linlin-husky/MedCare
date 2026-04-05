"use strict";

const baseUrl = process.env.MEDCARE_BASE_URL || 'http://localhost:3000';
const token = process.env.DEVICE_INGEST_TOKEN || 'medcare-device-token';

const payload = {
    username: process.env.MEDCARE_TARGET_USER || 'admin',
    deviceId: process.env.MEDCARE_DEVICE_ID || 'esp32-living-room-01',
    sensorType: process.env.MEDCARE_SENSOR_TYPE || 'heart-rate',
    value: Number(process.env.MEDCARE_SENSOR_VALUE || 78),
    unit: process.env.MEDCARE_SENSOR_UNIT || 'bpm',
    battery: Number(process.env.MEDCARE_SENSOR_BATTERY || 88),
    status: process.env.MEDCARE_SENSOR_STATUS || 'ok',
    message: process.env.MEDCARE_SENSOR_MESSAGE || 'simulated signal from local script',
    source: 'simulator',
    timestamp: new Date().toISOString()
};

fetch(`${baseUrl}/api/device-signals/ingest`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-device-token': token
    },
    body: JSON.stringify(payload)
})
    .then(response => {
        if (!response.ok) {
            return response.json().then(body => Promise.reject(body));
        }

        return response.json();
    })
    .then(data => {
        console.log('Signal sent successfully.');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => {
        console.error('Failed to send signal.');
        console.error(err);
        process.exit(1);
    });