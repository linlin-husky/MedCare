"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSignalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, lowercase: true },
    deviceId: { type: String, required: true },
    sensorType: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String },
    status: { type: String, default: 'ok' },
    message: { type: String },
    battery: { type: Number },
    acknowledged: { type: Boolean, default: false },
    source: { type: String, default: 'arduino' },
    timestamp: { type: Date, default: Date.now }
});

const DeviceSignal = mongoose.model('DeviceSignal', deviceSignalSchema);

function generateId() {
    return crypto.randomUUID();
}

function sanitizeText(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().replace(/[<>]/g, '');
}

function toFiniteNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function validateSignalPayload(payload) {
    const deviceId = sanitizeText(payload.deviceId);
    const sensorType = sanitizeText(payload.sensorType);
    const unit = sanitizeText(payload.unit);
    const status = sanitizeText(payload.status) || 'ok';
    const message = sanitizeText(payload.message);
    const source = sanitizeText(payload.source) || 'arduino';
    const value = toFiniteNumber(payload.value);
    const battery = payload.battery === undefined || payload.battery === null || payload.battery === ''
        ? null
        : toFiniteNumber(payload.battery);

    if (!deviceId) {
        return { valid: false, reason: 'deviceId is required' };
    }

    if (!sensorType) {
        return { valid: false, reason: 'sensorType is required' };
    }

    if (value === null) {
        return { valid: false, reason: 'value must be a number' };
    }

    if (battery !== null && (battery < 0 || battery > 100)) {
        return { valid: false, reason: 'battery must be between 0 and 100' };
    }

    return {
        valid: true,
        data: {
            deviceId,
            sensorType,
            value,
            unit,
            status,
            message,
            battery: battery === null ? undefined : battery,
            source,
            timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
        }
    };
}

async function addSignal(username, payload) {
    const id = generateId();
    const signal = new DeviceSignal({
        id,
        username: username.toLowerCase(),
        ...payload
    });

    await signal.save();
    return signal.toObject();
}

async function getSignals(username, options = {}) {
    const query = { username: username.toLowerCase() };
    const limit = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
        ? Number(options.limit)
        : 20;

    const signals = await DeviceSignal.find(query).sort({ timestamp: -1 }).limit(limit);
    return signals.map(signal => signal.toObject());
}

async function getLatestSignal(username) {
    const signals = await getSignals(username, { limit: 1 });
    return signals[0] || null;
}

async function acknowledgeSignal(id, username, acknowledged) {
    const updated = await DeviceSignal.findOneAndUpdate(
        { id, username: username.toLowerCase() },
        { $set: { acknowledged: Boolean(acknowledged) } },
        { new: true }
    );

    return updated ? updated.toObject() : null;
}

export {
    DeviceSignal,
    validateSignalPayload
};

export default {
    addSignal,
    getSignals,
    getLatestSignal,
    acknowledgeSignal,
    validateSignalPayload
};