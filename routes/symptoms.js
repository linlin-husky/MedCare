"use strict";

import express from 'express';

function createSymptomRoutes(models) {
    const router = express.Router();
    const { symptoms, sessions, users } = models;

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

            const symptomsList = await symptoms.getSymptoms(targetUser);
            res.json({ symptoms: symptomsList });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            if (!data.symptomName || !data.severity) {
                return res.status(400).json({ error: 'required-fields', message: 'Symptom name and severity are required' });
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

            const symptom = await symptoms.addSymptom(targetUser, data);
            res.status(201).json({ symptom });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            // Basic ownership verification is implicit in updateSymptom via username matching
            // But we should verify 'targetUser' if switching ownership was possible (it's not for symptoms usually)

            const updated = await symptoms.updateSymptom(req.params.id, req.username, data);
            if (!updated) {
                return res.status(404).json({ error: 'not-found', message: 'Symptom not found or unauthorized' });
            }
            res.json({ symptom: updated });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            await symptoms.removeSymptom(req.params.id, req.username);
            res.json({ message: 'Symptom deleted' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
}

export default createSymptomRoutes;