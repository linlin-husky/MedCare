
import mongoose from 'mongoose';
import users from '../models/users.js';
import appointments from '../models/appointments.js';
import medications from '../models/medications.js';
import vitals from '../models/vitals.js';
import medicalTests from '../models/medicalTests.js';

const MONGODB_URI = 'mongodb://localhost:27017/medcare4home';
const TARGET_USER = 'linlin_husky';

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Ensure Jorts exists for directory testing
        const jortsExists = await users.userExists('jorts');
        if (!jortsExists) {
            await users.createUser('jorts', 'Jorts the Cat', 'jorts@cat.com', '555-MEOW');
            await mongoose.connection.collection('users').updateOne(
                { username: 'jorts' },
                { $set: { trustScore: 99, totalLendings: 50, totalBorrowings: 2 } }
            );
            console.log('Created user: Jorts');
        }

        // 1. Create User
        console.log(`Checking user: ${TARGET_USER}...`);
        let user = await users.getUser(TARGET_USER);
        if (!user) {
            console.log('User not found. Creating...');
            const result = await users.createUser(
                TARGET_USER,
                'Linlin Fan',
                'linlin@husky.neu.edu',
                '617-555-0123'
            );

            // Add Family Members directly to the user document
            if (result.success) {
                await mongoose.connection.collection('users').updateOne(
                    { username: TARGET_USER },
                    {
                        $set: {
                            familyMembers: [
                                { name: 'Yen', relation: 'Spouse', age: 32 },
                                { name: 'Baby Lin', relation: 'Child', age: 2 },
                                { name: 'Grandma Fan', relation: 'Parent', age: 65 }
                            ]
                        }
                    }
                );
            }
            if (result.success) {
                console.log('User created successfully.');
                user = result.user;
            } else {
                throw new Error(`Failed to create user: ${result.reason}`);
            }
        } else {
            console.log('User already exists.');
        }

        // Always update family members to ensure they are seeded correctly
        console.log('Updating family members...');
        await mongoose.connection.collection('users').updateOne(
            { username: TARGET_USER },
            {
                $set: {
                    familyMembers: [
                        { name: 'Yen', relation: 'Spouse', age: 32 },
                        { name: 'Baby Lin', relation: 'Child', age: 2 },
                        { name: 'Grandma Fan', relation: 'Parent', age: 65 }
                    ]
                }
            }
        );

        // 2. Add Appointments
        console.log('Adding appointments...');
        const appointmentData = [
            {
                title: 'Check up for Yen',
                time: '2:00 PM', // Note: Schema stores Date, frontend needs to handle time extraction or we store it separately if schema changed.
                // Wait, schema says `date: Date`. The frontend dashboard mocked `time: '2:00 PM'`.
                // I will set the date to today at 14:00.
                date: new Date(new Date().setHours(14, 0, 0, 0)),
                location: 'Boston Medical Center',
                doctorName: 'Dr. Smith',
                status: 'upcoming'
            },
            {
                title: 'Dental Cleaning',
                date: new Date(new Date().setDate(new Date().getDate() + 7)), // 1 week later
                location: 'Smile Dental',
                doctorName: 'Dr. Tooth',
                status: 'upcoming'
            }
        ];

        // Clear existing for idempotency? Or just append?
        // Let's check if they exist to avoid duplicates if run multiple times, or just clear all for this user.
        // For simplicity, let's delete existing appointments for this user first.
        await mongoose.connection.collection('appointments').deleteMany({ username: TARGET_USER.toLowerCase() });

        for (const appt of appointmentData) {
            await appointments.createAppointment(TARGET_USER, appt);
        }
        console.log('Appointments added.');

        // 3. Add Medications
        console.log('Adding medications...');
        const medicationData = [
            {
                name: 'Acetaminophen',
                dose: '500mg',
                frequency: '1 pill',
                icon: 'sun',
                timesPerDay: 1
            },
            {
                name: 'Atorvastatin',
                dose: '20mg',
                frequency: '1 pill',
                icon: 'cloud',
                timesPerDay: 1
            },
            {
                name: 'Januvia',
                dose: '100mg',
                frequency: '1 pill',
                icon: 'moon',
                timesPerDay: 1
            }
        ];

        await mongoose.connection.collection('medications').deleteMany({ username: TARGET_USER.toLowerCase() });

        for (const med of medicationData) {
            // Adapt to schema: name, dosage, frequency, icon
            await medications.addMedication(TARGET_USER, {
                name: med.name,
                dosage: med.dose,
                frequency: med.frequency, // string e.g. "1 pill"
                icon: med.icon,
                timesPerDay: med.timesPerDay
            });
        }
        console.log('Medications added.');

        // 4. Add Vitals (Weight)
        // Dashboard shows weight Chart.
        // Schema check for vitals?
        // Let's assume vitals model has addVital.
        console.log('Adding vitals...');
        // Mock weight data from dashboard: [150, 145, 140, 138, 142, 137, 135, 140, 145, 150, 140, 80]
        // These look like historical data.
        // Let's add a few recent weight entries.
        await mongoose.connection.collection('vitals').deleteMany({ username: TARGET_USER.toLowerCase() });

        const weightData = [
            { value: 150, date: new Date(new Date().setMonth(0)) }, // Jan
            { value: 145, date: new Date(new Date().setMonth(1)) }, // Feb
            { value: 140, date: new Date(new Date().setMonth(2)) }, // Mar
        ];

        for (const w of weightData) {
            await vitals.addVital(TARGET_USER, {
                type: 'weight',
                value: w.value,
                unit: 'lbs',
                date: w.date
            });
        }
        console.log('Vitals added.');

        // 5. Add Medical Tests
        console.log('Adding medical tests...');
        const testData = [
            {
                testName: 'MRI - Brain Scan',
                category: 'Imaging',
                status: 'scheduled',
                testDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 2 weeks later
                doctor: 'Dr. Neuro',
                facility: 'City General Hospital',
                notes: 'Follow-up for headaches.'
            },
            {
                testName: 'CT Scan - Chest',
                category: 'Imaging',
                status: 'completed',
                testDate: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
                result: 'Normal',
                doctor: 'Dr. Pulmon',
                facility: 'Advanced Imaging Center',
                notes: 'Routine screening.'
            },
            {
                testName: 'Ultrasound - Abdominal',
                category: 'Imaging',
                status: 'completed',
                testDate: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
                result: 'No abnormalities',
                doctor: 'Dr. Sono',
                facility: 'Community Hospital',
                notes: 'Checked liver and kidneys.'
            },
            {
                testName: 'Endoscopy',
                category: 'Procedure',
                status: 'completed',
                testDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), // 1 month ago
                result: 'Mild gastritis',
                doctor: 'Dr. Gastro',
                facility: 'Specialty Clinic',
                notes: 'Start omeprazole.'
            }
        ];

        await mongoose.connection.collection('medicaltests').deleteMany({ username: TARGET_USER.toLowerCase() });

        for (const test of testData) {
            await medicalTests.addTest(TARGET_USER, test);
        }
        console.log('Medical tests added.');

        // 6. Add Detailed Body Measurement Data (BP, Weight, Height)
        console.log('Adding detailed body measurements...');

        // Clear existing vitals
        await mongoose.connection.collection('vitals').deleteMany({ username: TARGET_USER.toLowerCase() });

        const measurements = [];
        const today = new Date();

        // 6a. Height (Static)
        measurements.push({
            type: 'height',
            value: 165,
            unit: 'cm',
            date: new Date(today.getFullYear(), today.getMonth() - 6, 1),
            notes: 'Baseline height'
        });

        // 6b. Weight (Weekly for 3 months)
        let weight = 145; // starting lbs
        for (let i = 12; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - (i * 7));
            // Slight fluctuation
            const variance = (Math.random() * 2) - 1;
            weight += variance;

            measurements.push({
                type: 'weight',
                value: parseFloat(weight.toFixed(1)),
                unit: 'lb',
                date: date
            });
        }

        // 6c. Blood Pressure (2-3 times a week for 3 months)
        for (let i = 25; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - (i * 3)); // every 3 days approx

            // Randomized but realistic BP (e.g., 115-125 / 75-85)
            const sys = Math.floor(115 + Math.random() * 15);
            const dia = Math.floor(75 + Math.random() * 10);
            const pulse = Math.floor(65 + Math.random() * 15);

            measurements.push({
                type: 'bloodPressure',
                systolic: sys,
                diastolic: dia,
                pulse: pulse,
                unit: 'mmHg',
                date: date,
                notes: i % 5 === 0 ? 'Morning reading' : ''
            });
        }

        for (const m of measurements) {
            await vitals.addVital(TARGET_USER, m);
        }
        console.log(`Added ${measurements.length} body measurement records.`);

        console.log('Seeding completed successfully.');
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
