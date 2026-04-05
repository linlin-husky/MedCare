import mongoose from 'mongoose';
import '../models/medications.js'; // Side-effect: Registers the model with mongoose

mongoose.connect('mongodb://localhost:27017/medcare4home')
    .then(async () => {
        console.log('Connected to MongoDB');

        // Retrieve the model that was registered by the side-effect import
        const Medication = mongoose.model('Medication');

        const updates = [
            {
                name: 'Acetaminophen',
                function: 'Pain Relief',
                mealTiming: 'Take with or without food',
                warning: 'Avoid alcohol. Do not exceed 4000mg/day.',
                refill: true,
                daysAgo: 30
            },
            {
                name: 'Lisinopril',
                function: 'Blood Pressure Control',
                mealTiming: 'Take at any time of day',
                warning: 'May cause dizziness. Drink plenty of water.',
                refill: true,
                daysAgo: 60
            },
            {
                name: 'Metformin',
                function: 'Diabetes Management',
                mealTiming: 'Take with food or a snack',
                warning: 'Take with with meals to reduce upset stomach.',
                refill: true,
                daysAgo: 120
            },
            {
                name: 'Atorvastatin',
                function: 'Cholesterol Management',
                mealTiming: 'Take at any time of day',
                warning: 'Avoid grapefruit juice while taking this medication.',
                refill: false,
                daysAgo: 90
            },
            {
                name: 'Amoxicillin',
                function: 'Antibiotic',
                mealTiming: 'Take within 30 minutes after a meal',
                warning: 'Finish the full course as prescribed.',
                refill: false,
                daysAgo: 5
            },
            {
                name: 'Januvia',
                function: 'Type 2 Diabetes Control',
                mealTiming: 'Take with or without food',
                warning: 'Stop and call doctor if severe stomach pain occurs.',
                refill: true,
                daysAgo: 180
            }
        ];

        for (const update of updates) {
            const med = await Medication.findOne({ $or: [{ medicationName: update.name }, { name: update.name }] });
            if (med) {
                med.function = update.function;
                med.mealTiming = update.mealTiming;
                med.warning = update.warning;
                med.refillReminder = update.refill;
                if (update.refill) {
                    med.refillReminderDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                }
                med.startDate = new Date(Date.now() - update.daysAgo * 24 * 60 * 60 * 1000);
                med.status = 'Active';
                await med.save();
                console.log(`Updated ${update.name}`);
            } else {
                console.log(`${update.name} not found, skipping.`);
            }
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
