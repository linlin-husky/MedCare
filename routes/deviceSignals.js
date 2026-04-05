"use strict";

import express from 'express';

function createDeviceSignalRoutes(models) {
    const router = express.Router();
    const { deviceSignals, sessions, users } = models;
    const deviceToken = process.env.DEVICE_INGEST_TOKEN || 'medcare-device-token';

    async function requireSession(req, res, next) {
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
    }

    function requireDeviceToken(req, res, next) {
        const incomingToken = req.get('x-device-token');
        if (!incomingToken || incomingToken !== deviceToken) {
            return res.status(403).json({ error: 'device-auth-failed', message: 'Invalid device token' });
        }

        next();
    }

    async function ensureUserAccess(req, res, targetUser) {
        if (users.isAdmin(req.username)) {
            return true;
        }

        if (req.username.toLowerCase() === targetUser.toLowerCase()) {
            return true;
        }

        if (targetUser.toLowerCase().startsWith(`virtual:${req.username.toLowerCase()}:`)) {
            return true;
        }

        const requester = await users.getUser(req.username);
        const isFamily = requester?.familyMembers?.some(member => member.username?.toLowerCase() === targetUser.toLowerCase());
        if (isFamily) {
            return true;
        }

        res.status(403).json({ error: 'forbidden', message: 'You do not have access to this user\'s data' });
        return false;
    }

    router.get('/', requireSession, async (req, res) => {
        try {
            const targetUser = req.query.username || req.username;
            if (!targetUser) {
                return res.status(400).json({ error: 'required-username', message: 'username is required' });
            }

            const allowed = await ensureUserAccess(req, res, targetUser);
            if (!allowed) {
                return;
            }

            const limit = Number(req.query.limit || 12);
            const signals = await deviceSignals.getSignals(targetUser, { limit });
            const latest = signals[0] || null;

            res.json({
                signals,
                latest,
                deviceOnline: latest ? (Date.now() - new Date(latest.timestamp).getTime()) < 120000 : false
            });
        } catch (err) {
            console.error('Error fetching device signals:', err);
            res.status(500).json({ error: 'failed-to-fetch-signals' });
        }
    });

    router.post('/ingest', requireDeviceToken, async (req, res) => {
        try {
            const { username } = req.body;
            const validation = deviceSignals.validateSignalPayload(req.body);

            if (!username || typeof username !== 'string') {
                return res.status(400).json({ error: 'required-username', message: 'username is required' });
            }

            if (!validation.valid) {
                return res.status(400).json({ error: 'invalid-signal', message: validation.reason });
            }

            const targetUser = username.toLowerCase();
            const user = await users.getUser(targetUser);
            if (!user) {
                return res.status(404).json({ error: 'user-not-found', message: 'Target user not found' });
            }

            const signal = await deviceSignals.addSignal(targetUser, validation.data);
            res.status(201).json({ signal });
        } catch (err) {
            console.error('Error ingesting device signal:', err);
            res.status(500).json({ error: 'failed-to-ingest-signal' });
        }
    });

    router.patch('/:id', requireSession, async (req, res) => {
        try {
            const { id } = req.params;
            const { acknowledged = true } = req.body;
            const targetUser = req.body.username || req.username;

            const allowed = await ensureUserAccess(req, res, targetUser);
            if (!allowed) {
                return;
            }

            const signal = await deviceSignals.acknowledgeSignal(id, targetUser, acknowledged);
            if (!signal) {
                return res.status(404).json({ error: 'signal-not-found' });
            }

            res.json({ signal });
        } catch (err) {
            console.error('Error updating device signal:', err);
            res.status(500).json({ error: 'failed-to-update-signal' });
        }
    });

    return router;
}

export default createDeviceSignalRoutes;