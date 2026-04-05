"use strict";

import express from 'express';

function createUserRoutes(models) {
  const router = express.Router();
  const { sessions, users } = models;

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
    const allUsers = await users.getAllUsers();
    res.json({ users: allUsers });
  });

  router.get('/profile', requireAuth, async (req, res) => {
    const user = await users.getUser(req.username);
    if (!user) {
      return res.status(404).json({ error: 'not-found', message: 'User not found' });
    }

    res.json({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      trustScore: user.trustScore,
      badge: getTrustBadge(user.trustScore),
      totalLendings: user.totalLendings,
      totalBorrowings: user.totalBorrowings,
      onTimeReturns: user.onTimeReturns,
      lateReturns: user.lateReturns,
      memberSince: user.createdAt,
      familyMembers: user.familyMembers
    });
  });

  function getTrustBadge(score) {
    if (score >= 90) return { badge: 'Trust Star', color: 'gold' };
    if (score >= 70) return { badge: 'Reliable', color: 'blue' };
    if (score >= 50) return { badge: 'New User', color: 'gray' };
    return { badge: 'At Risk', color: 'red' };
  }

  router.put('/profile', requireAuth, async (req, res) => {
    const { displayName, email, phone, familyMembers } = req.body;

    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'invalid-email', message: 'Invalid email format' });
    }

    const updatedUser = await users.updateUser(req.username, { displayName, email, phone, familyMembers });

    if (!updatedUser) {
      return res.status(404).json({ error: 'not-found', message: 'User not found' });
    }

    res.json({
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      trustScore: updatedUser.trustScore,
      badge: users.getTrustBadge(updatedUser.trustScore),
      familyMembers: updatedUser.familyMembers
    });
  });

  router.get('/search', requireAuth, async (req, res) => {
    const query = req.query.q || '';

    if (query.length < 2) {
      return res.json({ users: [] });
    }

    const searchResults = await users.searchUsers(query);

    const filteredResults = searchResults.filter(
      user => user.username !== req.username
    );

    res.json({ users: filteredResults });
  });

  router.get('/:username', requireAuth, async (req, res) => {
    const { username } = req.params;
    const profile = await users.getPublicProfile(username);

    if (!profile) {
      return res.status(404).json({ error: 'not-found', message: 'User not found' });
    }

    res.json({ user: profile });
  });

  return router;
}

export default createUserRoutes;
