
import mongoose from 'mongoose';
import users from '../models/users.js';

const MONGODB_URI = 'mongodb://localhost:27017/medcare4home';
const TARGET_USER = 'linlin_husky';

async function restore() {
    try {
        await mongoose.connect(MONGODB_URI);

        const cleanMembers = [
            { name: 'Yen', relation: 'Spouse', age: 32 },
            { name: 'Baby Lin', relation: 'Child', age: 2 },
            { name: 'Grandma Fan', relation: 'Parent', age: 65 }
        ];

        console.log('Restoring family members for:', TARGET_USER);
        await users.updateUser(TARGET_USER, { familyMembers: cleanMembers });

        console.log('Restore complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
restore();
