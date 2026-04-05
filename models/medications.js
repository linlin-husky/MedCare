"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const medicationSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    medicationName: { type: String }, // alias for name
    dosage: { type: String }, // e.g. "500mg"
    frequency: { type: String }, // e.g. "1 pill"
    timesPerDay: { type: Number, default: 1 },
    instructions: { type: String }, // e.g. "Take with food"
    prescribedBy: { type: String }, // doctor name
    approvedBy: { type: String }, // "Dr. Eileen Wegener, MD"
    prescribedDate: { type: Date }, // Date prescription was written
    pharmacy: { type: String }, // Pharmacy details text
    refillsRemaining: { type: Number, default: 0 },
    sideEffects: { type: String },

    // Self-management
    function: { type: String }, // Purpose/Function e.g. "Pain relief"
    form: { type: String }, // tablet, capsule, etc.
    route: { type: String, default: 'Oral' }, // Oral, Topical, Injection, Inhaled
    route: { type: String, default: 'Oral' }, // Oral, Topical, Injection, Inhaled
    mealTiming: { type: String, enum: ['Before Meal', 'After Meal', 'With Meal', 'No Restriction', 'Take with or without food', 'May be taken regardless of food', 'Take at any time of day', 'Take on an empty stomach', 'Take with food or a snack', 'Take within 30 minutes after a meal'], default: 'No Restriction' },
    startDate: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    reason: { type: String },

    // Dosage Schedule breakdown
    // dosage & frequency already exist as strings
    timing: { type: String }, // e.g. "At bedtime"

    // Structured Schedule for UI Logic
    schedule: {
        type: { type: String, enum: ['Daily', 'Weekly', 'Interval', 'PRN', 'Custom'], default: 'Daily' },
        days: [{ type: String }], // Mon, Tue, Wed, etc.
        interval: { type: Number } // e.g. every 2 days
    },

    // Warnings
    warning: { type: String },
    allergyFlag: { type: Boolean, default: false },

    // Status & Adherence
    status: { type: String, default: 'Active', enum: ['Active', 'Paused', 'Stopped'] },
    asNeeded: { type: Boolean, default: false }, // PRN
    reminders: { type: Boolean, default: false }, // General reminders
    refillReminder: { type: Boolean, default: false }, // Specific refill reminder
    refillReminderDate: { type: Date }, // Date for refill reminder
    adherenceLog: [{
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ['Taken', 'Skipped'] },
        notes: String
    }],

    icon: { type: String, default: 'pill' }, // sun, cloud, moon identifiers for frontend
    createdAt: { type: Date, default: Date.now }
});

const Medication = mongoose.model('Medication', medicationSchema);

function generateId() {
    return crypto.randomUUID();
}

async function addMedication(username, data) {
    const id = generateId();
    const medication = new Medication({
        id,
        username: username.toLowerCase(),
        ...data
    });
    await medication.save();
    return medication.toObject();
}

async function getMedications(username) {
    const meds = await Medication.find({ username: username.toLowerCase() });
    return meds.map(m => m.toObject());
}

async function removeMedication(id, username) {
    await Medication.deleteOne({ id, username: username.toLowerCase() });
}

async function updateMedication(id, username, updates) {
    const medication = await Medication.findOneAndUpdate(
        { id, username: username.toLowerCase() },
        { $set: updates },
        { new: true }
    );
    return medication ? medication.toObject() : null;
}

export default {
    addMedication,
    getMedications,
    removeMedication,
    updateMedication
};
