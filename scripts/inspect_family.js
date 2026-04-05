
import mongoose from 'mongoose';
import users from '../models/users.js';

const MONGODB_URI = 'mongodb://localhost:27017/medcare4home';
const TARGET_USER = 'linlin_husky';

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await users.getUser(TARGET_USER);
        console.log('Current Family Members:', JSON.stringify(user.familyMembers, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspect();
