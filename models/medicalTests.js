"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const medicalTestSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, lowercase: true },
    testName: { type: String, required: true },
    category: { type: String, required: true }, // e.g., "Blood Work", "Imaging", "Cardiac", etc.
    status: { type: String, enum: ['scheduled', 'completed', 'pending'], default: 'pending' },
    testDate: { type: Date },
    resultDate: { type: Date },
    result: { type: String }, // e.g., "Normal", "Abnormal", "Pending"
    notes: { type: String },
    doctor: { type: String },
    facility: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const MedicalTest = mongoose.model('MedicalTest', medicalTestSchema);

function generateId() {
    return crypto.randomUUID();
}

async function addTest(username, data) {
    const id = generateId();
    const test = new MedicalTest({
        id,
        username: username.toLowerCase(),
        ...data
    });
    await test.save();
    return test.toObject();
}

async function getTests(username) {
    const tests = await MedicalTest.find({ username: username.toLowerCase() }).sort({ createdAt: -1 });
    return tests.map(t => t.toObject());
}

async function getTestsByCategory(username, category) {
    const tests = await MedicalTest.find({
        username: username.toLowerCase(),
        category
    }).sort({ createdAt: -1 });
    return tests.map(t => t.toObject());
}

async function getTestsByStatus(username, status) {
    const tests = await MedicalTest.find({
        username: username.toLowerCase(),
        status
    }).sort({ createdAt: -1 });
    return tests.map(t => t.toObject());
}

async function searchTests(username, query) {
    const tests = await MedicalTest.find({
        username: username.toLowerCase(),
        $or: [
            { testName: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } },
            { result: { $regex: query, $options: 'i' } },
            { doctor: { $regex: query, $options: 'i' } }
        ]
    }).sort({ createdAt: -1 });
    return tests.map(t => t.toObject());
}

async function updateTest(id, username, data) {
    const test = await MedicalTest.findOneAndUpdate(
        { id, username: username.toLowerCase() },
        { ...data, updatedAt: new Date() },
        { new: true }
    );
    return test ? test.toObject() : null;
}

async function removeTest(id, username) {
    await MedicalTest.deleteOne({ id, username: username.toLowerCase() });
}

export default {
    addTest,
    getTests,
    getTestsByCategory,
    getTestsByStatus,
    searchTests,
    updateTest,
    removeTest
};
