"use strict";

import express from 'express';

function createVitalsRoutes(models) {
    const router = express.Router();
    const { vitals, sessions, users } = models;

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

    // GET all vitals
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

            const vitalsList = await vitals.getVitals(targetUser, req.query.type);
            res.json({ vitals: vitalsList });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST new vital
    router.post('/', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            if (!data.type || !data.value) {
                return res.status(400).json({ error: 'required-fields', message: 'Type and value are required' });
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

            const vital = await vitals.addVital(targetUser, data);
            res.status(201).json({ vital });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE vital
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            await vitals.removeVital(req.params.id, req.username);
            res.json({ message: 'Vital deleted' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
}

export default createVitalsRoutes;