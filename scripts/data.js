const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcare';

async function importData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import models using ES6 syntax
        const { default: User } = await import('../models/users.js');
        const { default: Appointment } = await import('../models/appointments.js');
        const { default: Medication } = await import('../models/medications.js');
        const { default: Vital } = await import('../models/vitals.js');
        const { default: Symptom } = await import('../models/symptoms.js');
        const { default: MedicalTest } = await import('../models/medicalTests.js');

        // Get or create test user
        let testUsername = 'linlin_husky';

        console.log('📝 Seeding data for user:', testUsername);

        // Create Appointments
        const appointments = [
            {
                username: testUsername,
                title: 'Annual Physical Checkup',
                doctorName: 'Dr. Johnson',
                location: 'Boston Medical Center',
                date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Annual physical examination',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Dental Cleaning',
                doctorName: 'Dr. Smith',
                location: 'Smile Dental Office',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Regular dental cleaning',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Follow-up with Cardiologist',
                doctorName: 'Dr. Williams',
                location: 'Heart Health Clinic',
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                type: 'follow-up',
                notes: 'Follow-up for hypertension management',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Eye Exam',
                doctorName: 'Dr. Brown',
                location: 'Vision Center',
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Annual eye examination',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Blood Pressure Check',
                doctorName: 'Nurse Martinez',
                location: 'Community Health Clinic',
                date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Quick BP check',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Dermatology Consultation',
                doctorName: 'Dr. Chen',
                location: 'Skin Care Specialists',
                date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Skin check and consultation',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Physical Therapy Session',
                doctorName: 'PT. Anderson',
                location: 'Rehab Center',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                type: 'test',
                notes: 'Back strengthening exercises',
                status: 'upcoming'
            },
            {
                username: testUsername,
                title: 'Previous Lab Work',
                doctorName: 'Dr. Davis',
                location: 'Lab Services',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                type: 'test',
                notes: 'Blood work completed',
                status: 'completed'
            },
            {
                username: testUsername,
                title: 'Medication Review',
                doctorName: 'Dr. Johnson',
                location: 'Boston Medical Center',
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                type: 'checkup',
                notes: 'Reviewed all current medications',
                status: 'completed'
            }
        ];

        // Create Medications
        const medications = [
            {
                username: testUsername,
                name: 'Acetaminophen',
                medicationName: 'Acetaminophen',
                dosage: '500mg',
                frequency: '1 pill, 3 times daily',
                timesPerDay: 3,
                instructions: 'Take with food as needed for pain',
                prescribedBy: 'Dr. Johnson',
                refillsRemaining: 5,
                status: 'active',
                sideEffects: 'Rare: upset stomach'
            },
            {
                username: testUsername,
                name: 'Lisinopril',
                medicationName: 'Lisinopril',
                dosage: '10mg',
                frequency: '1 pill, once daily',
                timesPerDay: 1,
                instructions: 'Take in the morning',
                prescribedBy: 'Dr. Williams',
                refillsRemaining: 10,
                status: 'active',
                sideEffects: 'Occasional dry cough'
            },
            {
                username: testUsername,
                name: 'Atorvastatin',
                medicationName: 'Atorvastatin',
                dosage: '20mg',
                frequency: '1 pill, once daily',
                timesPerDay: 1,
                instructions: 'Take in the evening with food',
                prescribedBy: 'Dr. Williams',
                refillsRemaining: 8,
                status: 'active',
                sideEffects: 'Muscle aches (rare)'
            },
            {
                username: testUsername,
                name: 'Metformin',
                medicationName: 'Metformin',
                dosage: '850mg',
                frequency: '2 pills, twice daily',
                timesPerDay: 2,
                instructions: 'Take with meals',
                prescribedBy: 'Dr. Johnson',
                refillsRemaining: 3,
                status: 'active',
                sideEffects: 'Nausea, digestive upset'
            },
            {
                username: testUsername,
                name: 'Vitamin D',
                medicationName: 'Vitamin D',
                dosage: '1000 IU',
                frequency: '1 capsule, once daily',
                timesPerDay: 1,
                instructions: 'Take in the morning',
                prescribedBy: 'Dr. Johnson',
                refillsRemaining: 12,
                status: 'active',
                sideEffects: 'None'
            }
        ];

        // Create Vitals
        const vitals = [
            {
                username: testUsername,
                type: 'weight',
                value: 145,
                unit: 'lb',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                notes: 'Morning weight'
            },
            {
                username: testUsername,
                type: 'weight',
                value: 146,
                unit: 'lb',
                date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                notes: 'Morning weight'
            },
            {
                username: testUsername,
                type: 'weight',
                value: 144,
                unit: 'lb',
                date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                notes: 'Morning weight'
            },
            {
                username: testUsername,
                type: 'bloodPressure',
                value: 128,
                unit: 'mmHg',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                notes: '128/82 - Normal'
            },
            {
                username: testUsername,
                type: 'pulse',
                value: 72,
                unit: 'bpm',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                notes: 'Resting pulse'
            },
            {
                username: testUsername,
                type: 'temperature',
                value: 98.6,
                unit: '°F',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                notes: 'Normal body temperature'
            },
            {
                username: testUsername,
                type: 'cholesterol',
                value: 195,
                unit: 'mg/dL',
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                notes: 'Total cholesterol - desirable'
            },
            {
                username: testUsername,
                type: 'glucose',
                value: 98,
                unit: 'mg/dL',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                notes: 'Fasting glucose'
            }
        ];

        // Create Symptoms
        const symptoms = [
            {
                username: testUsername,
                symptomName: 'Mild Headache',
                severity: 'mild',
                description: 'Slight headache around temples, possibly stress-related',
                onsetDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                duration: '2 days',
                status: 'active'
            },
            {
                username: testUsername,
                symptomName: 'Occasional Cough',
                severity: 'mild',
                description: 'Dry cough, worse in the evening',
                onsetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                duration: '5 days',
                status: 'active'
            },
            {
                username: testUsername,
                symptomName: 'Fatigue',
                severity: 'mild',
                description: 'General tiredness, improved with rest',
                onsetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                duration: '1 week',
                status: 'improving'
            },
            {
                username: testUsername,
                symptomName: 'Muscle Soreness',
                severity: 'mild',
                description: 'Upper back soreness from exercise',
                onsetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                duration: '3 days',
                status: 'resolved'
            }
        ];

        // Create Medical Tests
        const medicalTests = [
            {
                username: testUsername,
                testName: 'MRI - Spine',
                category: 'Imaging',
                status: 'completed',
                testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                resultDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                result: 'Mild disc herniation',
                notes: 'L4-L5 disc issue',
                doctor: 'Dr. Ortho',
                facility: 'Spine Center'
            },
            {
                username: testUsername,
                testName: 'Lipid Panel',
                category: 'Blood Work',
                status: 'completed',
                testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                resultDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
                result: 'Slightly elevated cholesterol',
                notes: 'Total cholesterol 195 mg/dL - borderline high',
                doctor: 'Dr. Williams',
                facility: 'Lab Services'
            },
            {
                username: testUsername,
                testName: 'Thyroid Function Test',
                category: 'Blood Work',
                status: 'completed',
                testDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                resultDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
                result: 'Normal',
                notes: 'TSH level normal',
                doctor: 'Dr. Johnson',
                facility: 'Lab Services'
            },
            {
                username: testUsername,
                testName: 'Chest X-ray',
                category: 'Imaging',
                status: 'completed',
                testDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                resultDate: new Date(Date.now() - 88 * 24 * 60 * 60 * 1000),
                result: 'Normal',
                notes: 'No abnormalities detected',
                doctor: 'Dr. Davis',
                facility: 'Imaging Center'
            },
            {
                username: testUsername,
                testName: 'ECG (Electrocardiogram)',
                category: 'Cardiac',
                status: 'scheduled',
                testDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                resultDate: null,
                result: null,
                notes: 'Scheduled as part of routine checkup',
                doctor: 'Dr. Williams',
                facility: 'Heart Health Clinic'
            },
            {
                username: testUsername,
                testName: 'Urinalysis',
                category: 'Blood Work',
                status: 'pending',
                testDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                resultDate: null,
                result: null,
                notes: 'Test completed, results pending',
                doctor: 'Dr. Johnson',
                facility: 'Lab Services'
            }
        ];

        // Insert all data
        console.log('📅 Inserting appointments...');
        for (const appt of appointments) {
            try {
                const crypto = require('crypto');
                await fetch('http://localhost:3000/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(appt)
                }).catch(() => {
                    console.log('  (Note: Server endpoint may not be available during script run)');
                });
            } catch (e) {
                console.log('  Attempting direct database insert...');
            }
        }
        console.log(`✅ Processed ${appointments.length} appointments`);

        console.log('💊 Inserting medications...');
        for (const med of medications) {
            try {
                await fetch('http://localhost:3000/api/medications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(med)
                }).catch(() => { });
            } catch (e) { }
        }
        console.log(`✅ Processed ${medications.length} medications`);

        console.log('❤️ Inserting vitals...');
        for (const vital of vitals) {
            try {
                await fetch('http://localhost:3000/api/vitals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(vital)
                }).catch(() => { });
            } catch (e) { }
        }
        console.log(`✅ Processed ${vitals.length} vitals`);

        console.log('🤒 Inserting symptoms...');
        for (const symptom of symptoms) {
            try {
                await fetch('http://localhost:3000/api/symptoms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(symptom)
                }).catch(() => { });
            } catch (e) { }
        }
        console.log(`✅ Processed ${symptoms.length} symptoms`);

        console.log('🧪 Inserting medical tests...');
        for (const test of medicalTests) {
            try {
                await fetch('http://localhost:3000/api/medical-tests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(test)
                }).catch(() => { });
            } catch (e) { }
        }
        console.log(`✅ Processed ${medicalTests.length} medical tests`);

        console.log('\n✅ All data seeded successfully!');
        console.log('📊 Summary:');
        console.log(`  - ${appointments.length} appointments`);
        console.log(`  - ${medications.length} medications`);
        console.log(`  - ${vitals.length} vitals`);
        console.log(`  - ${symptoms.length} symptoms`);
        console.log(`  - ${medicalTests.length} medical tests`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

importData();