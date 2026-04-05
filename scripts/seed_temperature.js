import mongoose from 'mongoose';
import '../models/vitals.js';
import '../models/users.js';
import crypto from 'crypto';

mongoose.connect('mongodb://localhost:27017/medcare4home')
    .then(async () => {
        console.log('Connected to MongoDB');

        const Vitals = mongoose.model('Vitals');
        const User = mongoose.model('User');

        // Find a user to assign vitals to
        const user = await User.findOne({ username: 'linlin_husky' });
        if (!user) {
            console.error('User linlin_husky not found. Please create this user first.');
            process.exit(1);
        }

        const username = user.username;
        console.log(`Seeding temperature data for user: ${username}`);

        // Clear existing temperature data for this user to avoid duplicates
        await Vitals.deleteMany({ username: username.toLowerCase(), type: 'temperature' });

        const dataPoints = [];
        const today = new Date();

        // Generate 14 days of data
        for (let i = 13; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);

            // Random time between 8am and 8pm
            date.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

            let tempValue;
            let note = '';

            // Simulate some abnormal data
            if (i === 3) {
                tempValue = 100.2; // Fever
                note = 'Feeling feverish';
            } else if (i === 7) {
                tempValue = 99.8; // Mild fever
                note = 'Mild headache';
            } else if (i === 10) {
                tempValue = 96.5; // low
                note = 'Feeling cold';
            } else {
                // Normal random range 97.5 - 99.0
                tempValue = 97.5 + Math.random() * 1.5;
                note = 'Routine check';
            }

            dataPoints.push({
                id: crypto.randomUUID(),
                username: username.toLowerCase(),
                type: 'temperature',
                value: parseFloat(tempValue.toFixed(1)),
                unit: '°F',
                date: date,
                notes: note
            });
        }

        await Vitals.insertMany(dataPoints);
        console.log(`Successfully added ${dataPoints.length} temperature records.`);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
