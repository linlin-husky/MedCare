"use strict";

import express from 'express';

function createMedicationRoutes(models) {
    const router = express.Router();
    const { medications, sessions, users } = models;

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

    // GET all medications
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

            const meds = await medications.getMedications(targetUser);
            res.json({ medications: meds });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST new medication
    router.post('/', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            if (!data.name && !data.medicationName) {
                return res.status(400).json({ error: 'required-fields', message: 'Medication name is required' });
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

            // Support both 'name' and 'medicationName' fields
            const medData = {
                ...data,
                name: data.medicationName || data.name
            };
            const med = await medications.addMedication(targetUser, medData);
            res.status(201).json({ medication: med });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // PUT update medication
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const data = req.body;
            // Support both 'name' and 'medicationName' fields
            if (data.medicationName && !data.name) {
                data.name = data.medicationName;
            }
            const updated = await medications.updateMedication(req.params.id, req.username, data);
            if (!updated) {
                return res.status(404).json({ error: 'not-found', message: 'Medication not found' });
            }
            res.json({ medication: updated });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE medication
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            await medications.removeMedication(req.params.id, req.username);
            res.json({ message: 'Medication deleted' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    return router;
}

export default createMedicationRoutes;