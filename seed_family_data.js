
import mongoose from 'mongoose';
import { User } from './models/users.js';
import { Vitals } from './models/vitals.js';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcare4home';

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected');

        const username = 'linlin_husky';

        // 1. Create or Update User (Linlin)
        let user = await User.findOne({ username });
        if (!user) {
            console.log(`Creating user: ${username}`);
            user = new User({
                username,
                displayName: 'Linlin Husky', // Linlin
                email: 'linlin@example.com',
                phone: '123-456-7890',
                height: 165,
                weight: 120, // Linlin's weight ~120
                bmi: 22
            });
        } else {
            console.log(`User ${username} exists. Updating family members.`);
            user.displayName = 'Linlin Husky';
            user.weight = 120;
        }

        // 2. Set Family Members: Grandma Fan, Peter, Baby Linlin
        // Peter is likely the "Dad" or husband equivalent, Grandma Fan is older, Baby Linlin is baby
        const family = [
            { name: 'Grandma Fan', relation: 'Grandmother', age: 75, username: 'grandma_fan' },
            { name: 'Peter', relation: 'Partner', age: 30, username: 'peter_husky' },
            { name: 'Baby Linlin', relation: 'Child', age: 2, username: 'baby_linlin' }
        ];
        user.familyMembers = family;
        await user.save();

        // 3. Clear existing vitals for these users to avoid duplicates
        const allUsernames = [username, ...family.map(f => f.username)];
        await Vitals.deleteMany({ username: { $in: allUsernames }, type: 'weight' });
        console.log('Cleared existing weight data.');

        // 4. Generate Weight Data (Past 6 months)
        const today = new Date();
        const records = [];

        // Linlin's data (stable ~120lbs)
        for (let i = 0; i < 6; i++) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            records.push({
                id: crypto.randomUUID(),
                username: username, // linlin_husky
                type: 'weight',
                value: 120 + Math.random() * 4 - 2, // 118-122
                unit: 'lb',
                date: d
            });
        }

        // Grandma Fan (stable ~130lbs)
        for (let i = 0; i < 6; i++) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            records.push({
                id: crypto.randomUUID(),
                username: 'grandma_fan',
                type: 'weight',
                value: 130 + Math.random() * 2 - 1,
                unit: 'lb',
                date: d
            });
        }

        // Peter (fluctuating ~170lbs)
        for (let i = 0; i < 6; i++) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            records.push({
                id: crypto.randomUUID(),
                username: 'peter_husky',
                type: 'weight',
                value: 170 + Math.random() * 6 - 3,
                unit: 'lb',
                date: d
            });
        }

        // Baby Linlin (Growing! 25lbs -> 30lbs)
        for (let i = 0; i < 6; i++) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            // Date goes back in time, so i=0 is today (heavy), i=5 is 6 months ago (light)
            // Today 30lbs, 6 months ago 24lbs -> gain 1lb per month approx
            const w = 30 - i;
            records.push({
                id: crypto.randomUUID(),
                username: 'baby_linlin',
                type: 'weight',
                value: w + Math.random() * 0.5,
                unit: 'lb',
                date: d
            });
        }

        // 5. Generate Height Data (Stable for adults, growing for baby)
        await Vitals.deleteMany({ username: { $in: allUsernames }, type: 'height' });
        console.log('Cleared existing height data.');

        // Linlin (165cm)
        records.push({
            id: crypto.randomUUID(),
            username: username,
            type: 'height',
            value: 165,
            unit: 'cm',
            date: new Date()
        });

        // Grandma Fan (160cm)
        records.push({
            id: crypto.randomUUID(),
            username: 'grandma_fan',
            type: 'height',
            value: 160,
            unit: 'cm',
            date: new Date()
        });

        // Peter (180cm)
        records.push({
            id: crypto.randomUUID(),
            username: 'peter_husky',
            type: 'height',
            value: 180,
            unit: 'cm',
            date: new Date()
        });

        // Baby Linlin (Growing! 80cm -> 88cm)
        for (let i = 0; i < 6; i++) {
            const d = new Date(today);
            d.setMonth(today.getMonth() - i);
            // i=0 is today (88cm), i=5 is 6 months ago (80cm)
            const h = 88 - (i * 1.5);
            records.push({
                id: crypto.randomUUID(),
                username: 'baby_linlin',
                type: 'height',
                value: h,
                unit: 'cm',
                date: d
            });
        }

        await Vitals.insertMany(records);
        console.log(`✅ Seeded ${records.length} weight records for family.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
}

seedData();
