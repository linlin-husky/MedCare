"use strict";

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  displayName: { type: String, required: true },
  email: { type: String }, // Optional
  phone: { type: String }, // Optional

  // Medical Profile
  height: { type: Number }, // in cm or ft/in (store as cm standard maybe, or string if user enters string)
  weight: { type: Number }, // in lbs
  bmi: { type: Number },
  bloodType: { type: String },
  birthDate: { type: Date },

  trustScore: { type: Number, default: 50 },
  totalLendings: { type: Number, default: 0 },
  totalBorrowings: { type: Number, default: 0 },
  onTimeReturns: { type: Number, default: 0 },
  lateReturns: { type: Number, default: 0 },
  disputesAgainst: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },

  // Family Members
  familyMembers: [{
    name: { type: String },
    relation: { type: String },
    age: { type: Number },
    username: { type: String } // Optional: Link to an existing user account
  }]
});

const User = mongoose.model('User', userSchema);

const BANNED_USERS = ['dog'];
const ADMIN_USERS = ['admin'];
const DEFAULT_TRUST_SCORE = 50;

function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
}

function isValidUsername(username) {
  const sanitized = sanitizeInput(username);
  if (!sanitized || sanitized.length < 2 || sanitized.length > 30) {
    return { valid: false, reason: 'Username must be between 2 and 30 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) {
    return { valid: false, reason: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

function isBannedUser(username) {
  return BANNED_USERS.includes(username.toLowerCase());
}

function isAdmin(username) {
  return ADMIN_USERS.includes(username.toLowerCase());
}

async function userExists(username) {
  const count = await User.countDocuments({ username: username.toLowerCase() });
  return count > 0;
}

async function createUser(username, displayName, email, phone) {
  const sanitizedUsername = sanitizeInput(username).toLowerCase();
  const sanitizedDisplayName = sanitizeInput(displayName) || sanitizedUsername;
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPhone = sanitizeInput(phone);

  if (await userExists(sanitizedUsername)) {
    return { success: false, reason: 'Username already exists' };
  }

  try {
    const newUser = new User({
      username: sanitizedUsername,
      displayName: sanitizedDisplayName,
      email: sanitizedEmail,
      phone: sanitizedPhone
    });
    await newUser.save();
    return { success: true, user: newUser.toObject() };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, reason: 'Database error' };
  }
}

async function getUser(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  return user ? user.toObject() : null;
}

async function updateUser(username, updates) {
  const allowedUpdates = ['displayName', 'email', 'phone', 'familyMembers'];
  const updateFields = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      if (key === 'familyMembers') {
        updateFields[key] = updates[key]; // Don't sanitize array/objects as string
      } else {
        updateFields[key] = sanitizeInput(updates[key]);
      }
    }
  }
  updateFields.lastActive = Date.now();

  const user = await User.findOneAndUpdate(
    { username: username.toLowerCase() },
    { $set: updateFields },
    { new: true }
  );

  return user ? user.toObject() : null;
}

async function updateTrustScore(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    return;
  }

  let score = DEFAULT_TRUST_SCORE;

  const totalTransactions = user.onTimeReturns + user.lateReturns;
  if (totalTransactions > 0) {
    const onTimeRate = user.onTimeReturns / totalTransactions;
    score += Math.round(onTimeRate * 30);
  }

  if (user.totalRatings > 0) {
    const avgRating = user.ratingSum / user.totalRatings;
    score += Math.round((avgRating / 5) * 15);
  }

  const transactionBonus = Math.min(10, Math.floor(totalTransactions / 5));
  score += transactionBonus;

  score -= user.disputesAgainst * 5;

  score = Math.max(0, Math.min(100, score));
  user.trustScore = score;

  await user.save();
  return score;
}

async function addRating(username, rating) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) return;

  user.totalRatings += 1;
  user.ratingSum += rating;
  await user.save();
  await updateTrustScore(username);
}

async function recordReturn(username, isOnTime) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) return;

  if (isOnTime) {
    user.onTimeReturns += 1;
  } else {
    user.lateReturns += 1;
  }
  await user.save();
  await updateTrustScore(username);
}

async function recordDispute(username) {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) return;

  user.disputesAgainst += 1;
  await user.save();
  await updateTrustScore(username);
}

async function incrementLendings(username) {
  await User.updateOne({ username: username.toLowerCase() }, { $inc: { totalLendings: 1 } });
}

async function incrementBorrowings(username) {
  await User.updateOne({ username: username.toLowerCase() }, { $inc: { totalBorrowings: 1 } });
}

function getTrustBadge(score) {
  if (score >= 95) {
    return { badge: 'Elite', color: 'gold' };
  }
  if (score >= 85) {
    return { badge: 'Trusted', color: 'green' };
  }
  if (score >= 70) {
    return { badge: 'Reliable', color: 'blue' };
  }
  if (score >= 50) {
    return { badge: 'New User', color: 'gray' };
  }
  return { badge: 'Caution', color: 'red' };
}

async function getPublicProfile(username) {
  const user = await getUser(username);
  if (!user) {
    return null;
  }
  return {
    username: user.username,
    displayName: user.displayName,
    trustScore: user.trustScore,
    badge: getTrustBadge(user.trustScore),
    totalLendings: user.totalLendings,
    totalBorrowings: user.totalBorrowings,
    onTimeRate: user.onTimeReturns + user.lateReturns > 0
      ? Math.round((user.onTimeReturns / (user.onTimeReturns + user.lateReturns)) * 100)
      : 100,
    memberSince: user.createdAt,
    // Health Data for Dashboard
    height: user.height,
    weight: user.weight,
    bmi: user.bmi,
    bloodType: user.bloodType,
    birthDate: user.birthDate
  };
}

async function getAllUsers() {
  const users = await User.find({});
  // This might be expensive if many users, for now keep it simple map
  // Note: getPublicProfile is async so need to Promise.all
  // Alternatively mapping directly from the user doc since we have it
  return users.map(user => ({
    username: user.username,
    displayName: user.displayName,
    trustScore: user.trustScore,
    badge: getTrustBadge(user.trustScore),
    totalLendings: user.totalLendings,
    totalBorrowings: user.totalBorrowings,
    onTimeRate: user.onTimeReturns + user.lateReturns > 0
      ? Math.round((user.onTimeReturns / (user.onTimeReturns + user.lateReturns)) * 100)
      : 100,
    memberSince: user.createdAt
  }));
}

async function searchUsers(query) {
  const searchTerm = sanitizeInput(query).toLowerCase();
  const users = await User.find({
    $or: [
      { username: { $regex: searchTerm, $options: 'i' } },
      { displayName: { $regex: searchTerm, $options: 'i' } }
    ]
  });

  return users.map(user => ({
    username: user.username,
    displayName: user.displayName,
    trustScore: user.trustScore,
    badge: getTrustBadge(user.trustScore),
    totalLendings: user.totalLendings,
    totalBorrowings: user.totalBorrowings,
    onTimeRate: user.onTimeReturns + user.lateReturns > 0
      ? Math.round((user.onTimeReturns / (user.onTimeReturns + user.lateReturns)) * 100)
      : 100,
    memberSince: user.createdAt
  }));
}

// ... existing exports
export { User }; // Named export for direct access
export default {
  sanitizeInput,
  isValidUsername,
  isBannedUser,
  isAdmin,
  userExists,
  createUser,
  getUser,
  updateUser,
  updateTrustScore,
  addRating,
  recordReturn,
  recordDispute,
  incrementLendings,
  incrementBorrowings,
  getPublicProfile,
  getTrustBadge,
  getAllUsers,
  searchUsers,
  User
};
