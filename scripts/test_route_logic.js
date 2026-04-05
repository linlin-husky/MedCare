import mongoose from 'mongoose';
import users from '../models/users.js';

const MONGODB_URI = 'mongodb://localhost:27017/medcare4home';

async function testRoute() {
    try {
        await mongoose.connect(MONGODB_URI);

        // Mimic the route handler
        const username = 'linlin_husky';
        const body = {
            familyMembers: [{ name: 'TestRoute', relation: 'Kid', age: 5 }]
        };

        console.log('--- TEST ROUTE START ---');
        console.log('Using payload:', JSON.stringify(body));

        const updatedUser = await users.updateUser(username, body);

        console.log('updatedUser returned from model:', updatedUser ? 'OBJECT' : 'NULL');
        if (updatedUser) {
            console.log('updatedUser keys:', Object.keys(updatedUser));
            console.log('updatedUser.familyMembers:', updatedUser.familyMembers);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testRoute();
