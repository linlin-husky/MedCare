"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const sessionSchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  username: { type: String, required: true, lowercase: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 * 30 } // 30 days expiry (MongoDB TTL)
});

const Session = mongoose.model('Session', sessionSchema);

function generateSessionId() {
  return crypto.randomUUID();
}

async function createSession(username) {
  const sid = generateSessionId();
  const session = new Session({
    sid,
    username: username.toLowerCase()
  });
  await session.save();
  return sid;
}

async function getSession(sid) {
  const session = await Session.findOne({ sid });
  return session ? session.toObject() : null;
}

async function deleteSession(sid) {
  await Session.deleteOne({ sid });
}

async function isValidSession(sid) {
  const count = await Session.countDocuments({ sid });
  return count > 0;
}

async function getUsername(sid) {
  const session = await Session.findOne({ sid });
  return session ? session.username : null;
}

export default {
  createSession,
  getSession,
  deleteSession,
  isValidSession,
  getUsername
};
