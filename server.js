"use strict";

import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// Models
import users from './models/users.js';
import sessions from './models/sessions.js';
import appointments from './models/appointments.js';
import medications from './models/medications.js';
import vitals from './models/vitals.js';
import medicalTests from './models/medicalTests.js';
import symptoms from './models/symptoms.js';

// Controllers
import createAuthController from './routes/auth.js';
import createUserRoutes from './routes/users.js';
import createAppointmentRoutes from './routes/appointments.js';
import createMedicationRoutes from './routes/medications.js';
import createVitalsRoutes from './routes/vitals.js';
import createMedicalTestRoutes from './routes/medicalTests.js';
import createSymptomRoutes from './routes/symptoms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medcare4home';

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Models object
const models = {
  users,
  sessions,
  appointments,
  medications,
  vitals,
  medicalTests,
  symptoms
};

// Auth controller
const authController = createAuthController(models);

// ============ API ROUTES ============

// Auth routes
app.post('/api/auth/signup', authController.signup);
app.get('/api/auth/session', authController.checkSession);
app.post('/api/auth/session', authController.createSession);
app.delete('/api/auth/session', authController.endSession);

// Debug endpoint
app.get('/api/debug/version', (req, res) => {
  res.json({ version: '1.0.1', timestamp: Date.now() });
});

// Other API routes
app.use('/api/users', createUserRoutes(models));
app.use('/api/appointments', createAppointmentRoutes(models));
app.use('/api/medications', createMedicationRoutes(models));
app.use('/api/vitals', createVitalsRoutes(models));
app.use('/api/medical-tests', createMedicalTestRoutes(models));
app.use('/api/symptoms', createSymptomRoutes(models));

// ============ SPA CATCH-ALL (MUST BE LAST) ============

// Temporarily commented out - investigating route pattern issue
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// ============ DATABASE CONNECTION ============

console.log('Attempting to connect to MongoDB at', MONGODB_URI);

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running!');
    process.exit(1);
  });

