import mongoose from 'mongoose';
import '../models/medicalTests.js';
import '../models/users.js';
import crypto from 'crypto';

mongoose.connect('mongodb://localhost:27017/medcare4home')
    .then(async () => {
        console.log('Connected to MongoDB');

        const MedicalTest = mongoose.model('MedicalTest');
        const User = mongoose.model('User');

        const user = await User.findOne({});
        if (!user) {
            console.error('No users found.');
            process.exit(1);
        }

        const username = user.username;
        console.log(`Seeding medical tests for: ${username}`);

        await MedicalTest.deleteMany({ username: username.toLowerCase() });

        const tests = [];
        const categories = ['Blood Work', 'Imaging', 'Cardiac', 'Respiratory', 'Dermatological'];
        const statuses = ['completed', 'pending', 'scheduled'];

        for (let i = 0; i < 20; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i * 5); // Spread over months

            tests.push({
                id: crypto.randomUUID(),
                username: username.toLowerCase(),
                testName: `Test Record ${i + 1}`,
                category: categories[Math.floor(Math.random() * categories.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                testDate: date,
                resultDate: new Date(date.getTime() + 86400000),
                result: i % 3 === 0 ? 'Abnormal' : 'Normal',
                doctor: 'Dr. Smith',
                facility: 'General Hospital'
            });
        }

        await MedicalTest.insertMany(tests);
        console.log(`Added ${tests.length} medical tests.`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
