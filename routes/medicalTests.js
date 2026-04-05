"use strict";

import express from 'express';

function createMedicalTestRoutes(models) {
    const router = express.Router();
    const { medicalTests, sessions, users } = models;

    // Middleware to verify session
    async function verifySession(req, res, next) {
        const sid = req.cookies.sid;
        if (!sid) {
            return res.status(401).json({ error: 'auth-missing' });
        }
        const isValid = await sessions.isValidSession(sid);
        if (!isValid) {
            return res.status(401).json({ error: 'auth-missing' });
        }
        const username = await sessions.getUsername(sid);
        req.username = username;
        next();
    }

    // ✅ SPECIFIC ROUTES FIRST

    // Search tests
    router.get('/search/:query', verifySession, async (req, res) => {
        try {
            const { query } = req.params;
            if (!query || query.length < 1) {
                return res.status(400).json({ error: 'invalid-search-query' });
            }
            const tests = await medicalTests.searchTests(req.username, query);
            res.json(tests);
        } catch (err) {
            console.error('Error searching tests:', err);
            res.status(500).json({ error: 'failed-to-search' });
        }
    });

    // Filter by status
    router.get('/filter/status/:status', verifySession, async (req, res) => {
        try {
            const { status } = req.params;
            const tests = await medicalTests.getTestsByStatus(req.username, status);
            res.json(tests);
        } catch (err) {
            console.error('Error filtering by status:', err);
            res.status(500).json({ error: 'failed-to-filter' });
        }
    });

    // Filter by category
    router.get('/filter/category/:category', verifySession, async (req, res) => {
        try {
            const { category } = req.params;
            const tests = await medicalTests.getTestsByCategory(req.username, category);
            res.json(tests);
        } catch (err) {
            console.error('Error filtering by category:', err);
            res.status(500).json({ error: 'failed-to-filter' });
        }
    });

    // ✅ GENERIC ROUTES LAST

    // Get all tests for current user
    router.get('/', verifySession, async (req, res) => {
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

            const tests = await medicalTests.getTests(targetUser);
            res.json(tests);
        } catch (err) {
            console.error('Error fetching tests:', err);
            res.status(500).json({ error: 'failed-to-fetch-tests' });
        }
    });

    // Add a new test
    router.post('/', verifySession, async (req, res) => {
        try {
            const { testName, category, status, testDate, resultDate, result, notes, doctor, facility } = req.body;

            if (!testName || !category) {
                return res.status(400).json({ error: 'missing-required-fields' });
            }

            const targetUser = req.body.username || req.username;

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

            const test = await medicalTests.addTest(targetUser, {
                testName,
                category,
                status: status || 'pending',
                testDate,
                resultDate,
                result,
                notes,
                doctor,
                facility
            });

            res.status(201).json(test);
        } catch (err) {
            console.error('Error adding test:', err);
            res.status(500).json({ error: 'failed-to-add-test' });
        }
    });

    // Update test
    router.put('/:id', verifySession, async (req, res) => {
        try {
            const { id } = req.params;
            const test = await medicalTests.updateTest(id, req.username, req.body);

            if (!test) {
                return res.status(404).json({ error: 'test-not-found' });
            }

            res.json(test);
        } catch (err) {
            console.error('Error updating test:', err);
            res.status(500).json({ error: 'failed-to-update-test' });
        }
    });

    // Delete test
    router.delete('/:id', verifySession, async (req, res) => {
        try {
            const { id } = req.params;
            await medicalTests.removeTest(id, req.username);
            res.json({ success: true });
        } catch (err) {
            console.error('Error deleting test:', err);
            res.status(500).json({ error: 'failed-to-delete-test' });
        }
    });

    return router;
}

export default createMedicalTestRoutes;