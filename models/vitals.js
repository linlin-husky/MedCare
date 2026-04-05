"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const vitalsSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, lowercase: true },
    type: { type: String, required: true }, // weight, height, bloodPressure, pulse, etc.
    value: { type: Number }, // Primary value (e.g. weight, or systolic if simple)
    // Extended fields for specific types
    systolic: { type: Number },
    diastolic: { type: Number },
    pulse: { type: Number },
    // Pulse specific metadata
    regularity: {
        type: String,
        enum: ['regular', 'irregular', 'afib']
    },
    strength: {
        type: String,
        enum: ['strong', 'normal', 'weak']
    },
    unit: { type: String },
    date: { type: Date, default: Date.now },
    notes: { type: String }
});

const Vitals = mongoose.model('Vitals', vitalsSchema);

function generateId() {
    return crypto.randomUUID();
}

async function addVital(username, data) {
    const id = generateId();
    const vital = new Vitals({
        id,
        username: username.toLowerCase(),
        ...data
    });
    await vital.save();
    return vital.toObject();
}

async function getVitals(username, type) {
    const query = { username: username.toLowerCase() };
    if (type) {
        query.type = type;
    }
    const records = await Vitals.find(query).sort({ date: 1 }); // Sort by date ascending for charts
    return records.map(r => r.toObject());
}

async function getLatestVitals(username) {
    // Aggregate to get latest of each type is complex in Mongo without aggregation framework or multiple queries.
    // For simplicity, fetch all and reduce in JS since data volume is likely small per user for MVP.
    const records = await Vitals.find({ username: username.toLowerCase() }).sort({ date: -1 });
    const latest = {};
    for (const r of records) {
        if (!latest[r.type]) {
            latest[r.type] = r.toObject();
        }
    }
    return latest;
}

async function removeVital(id, username) {
    await Vitals.deleteOne({ id, username: username.toLowerCase() });
}

export { Vitals };
export default {
    addVital,
    getVitals,
    getLatestVitals,
    removeVital
};
