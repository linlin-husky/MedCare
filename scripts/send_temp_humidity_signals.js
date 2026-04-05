"use strict";

const baseUrl = process.env.MEDCARE_BASE_URL || 'http://localhost:3000';
const token = process.env.DEVICE_INGEST_TOKEN || 'medcare-device-token';
const username = process.env.MEDCARE_TARGET_USER || 'admin';
const deviceId = process.env.MEDCARE_DEVICE_ID || 'rpi-room-dht11';

const temperatureValue = Number(process.env.MEDCARE_TEMP_VALUE || 24.6);
const humidityValue = Number(process.env.MEDCARE_HUMIDITY_VALUE || 57.2);

function sendSignal(signal) {
    return fetch(`${baseUrl}/api/device-signals/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-device-token': token
        },
        body: JSON.stringify(signal)
    }).then(response => {
        if (!response.ok) {
            return response.json().then(body => Promise.reject(body));
        }
        return response.json();
    });
}

const now = new Date().toISOString();
const temperatureSignal = {
    username,
    deviceId,
    sensorType: 'temperature',
    value: temperatureValue,
    unit: 'C',
    status: 'ok',
    message: 'simulated temperature reading',
    source: 'simulator',
    timestamp: now
};

const humiditySignal = {
    username,
    deviceId,
    sensorType: 'humidity',
    value: humidityValue,
    unit: '%',
    status: 'ok',
    message: 'simulated humidity reading',
    source: 'simulator',
    timestamp: now
};

Promise.all([
    sendSignal(temperatureSignal),
    sendSignal(humiditySignal)
])
    .then(([tempResult, humidityResult]) => {
        console.log('Temperature and humidity signals sent successfully.');
        console.log('Temperature:', JSON.stringify(tempResult, null, 2));
        console.log('Humidity:', JSON.stringify(humidityResult, null, 2));
    })
    .catch(err => {
        console.error('Failed to send temperature/humidity signals.');
        console.error(err);
        process.exit(1);
    });