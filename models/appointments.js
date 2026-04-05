"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const appointmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, lowercase: true },
    title: { type: String, required: true },
    doctorName: { type: String },
    location: { type: String },
    date: { type: Date, required: true },
    type: { type: String, default: 'checkup' }, // checkup, follow-up, test, etc.
    notes: { type: String },
    status: { type: String, default: 'upcoming' }, // upcoming, completed, cancelled
    createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

function generateId() {
    return crypto.randomUUID();
}

async function createAppointment(username, data) {
    const id = generateId();
    const appointment = new Appointment({
        id,
        username: username.toLowerCase(),
        ...data
    });
    await appointment.save();
    return appointment.toObject();
}

async function getAppointments(username) {
    const appointments = await Appointment.find({ username: username.toLowerCase() }).sort({ date: 1 });
    return appointments.map(a => a.toObject());
}

async function updateAppointment(id, username, updates) {
    const appointment = await Appointment.findOneAndUpdate(
        { id, username: username.toLowerCase() },
        { $set: updates },
        { new: true }
    );
    return appointment ? appointment.toObject() : null;
}

async function deleteAppointment(id, username) {
    await Appointment.deleteOne({ id, username: username.toLowerCase() });
}

export default {
    createAppointment,
    getAppointments,
    updateAppointment,
    deleteAppointment
};
