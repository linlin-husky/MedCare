"use strict";

import express from 'express';

function createAppointmentRoutes(models) {
    const router = express.Router();
    const { sessions, appointments, users } = models;

    const requireAuth = async (req, res, next) => {
        const sid = req.cookies.sid;
        if (!sid) {
            return res.status(401).json({ error: 'auth-missing', message: 'Not logged in' });
        }
        const isValid = await sessions.isValidSession(sid);
        if (!isValid) {
            return res.status(401).json({ error: 'auth-missing', message: 'Not logged in' });
        }
        req.username = await sessions.getUsername(sid);
        next();
    };

    router.get('/', requireAuth, async (req, res) => {
        try {
            const targetUser = req.query.username || req.username;

            // Authorization check
            if (targetUser.toLowerCase() !== req.username.toLowerCase()) {
                const isVirtualForMe = targetUser.toLowerCase().startsWith(`virtual:${req.username.toLowerCase()}:`);
                if (!isVirtualForMe) {
                    const requester = await users.getUser(req.username);
                    const isFamily = requester.familyMembers?.some(m => m.username?.toLowerCase() === targetUser.toLowerCase());
                    if (!isFamily) {
                        return res.status(403).json({ error: 'forbidden', message: 'You do not have access to this user\'s data' });
                    }
                }
            }

            const list = await appointments.getAppointments(targetUser);
            res.json({ appointments: list });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            if (!data.title || !data.date) {
                return res.status(400).json({ error: 'required-fields', message: 'Title and Date are required' });
            }

            const targetUser = data.username || req.username;

            // Authorization check
            if (targetUser.toLowerCase() !== req.username.toLowerCase()) {
                const isVirtualForMe = targetUser.toLowerCase().startsWith(`virtual:${req.username.toLowerCase()}:`);
                if (!isVirtualForMe) {
                    const requester = await users.getUser(req.username);
                    const isFamily = requester.familyMembers?.some(m => m.username?.toLowerCase() === targetUser.toLowerCase());
                    if (!isFamily) {
                        return res.status(403).json({ error: 'forbidden', message: 'You do not have access to this user\'s data' });
                    }
                }
            }

            // Ensure date is a valid date string or timestamp
            if (new Date(data.date).toString() === 'Invalid Date') {
                return res.status(400).json({ error: 'invalid-date', message: 'Invalid date format' });
            }

            const appt = await appointments.createAppointment(targetUser, data);
            res.status(201).json({ appointment: appt });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updated = await appointments.updateAppointment(id, req.username, updates);
            if (!updated) {
                return res.status(404).json({ error: 'not-found', message: 'Appointment not found' });
            }
            res.json({ appointment: updated });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const { id } = req.params;
            await appointments.deleteAppointment(id, req.username);
            res.json({ message: 'Appointment deleted' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
}

export default createAppointmentRoutes;
