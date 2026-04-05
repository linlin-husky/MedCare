"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto';

const lendingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  itemId: { type: String, required: true },
  lenderUsername: { type: String, required: true, lowercase: true },
  borrowerUsername: { type: String, default: null, lowercase: true },
  borrowerInfo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    isPlatformUser: { type: Boolean }
  },
  terms: {
    dateLent: { type: Number },
    expectedReturnDate: { type: Number },
    conditionExpectation: { type: String },
    notes: { type: String },
    requireDeposit: { type: Boolean },
    depositAmount: { type: Number },
    allowExtensions: { type: Boolean }
  },
  status: { type: String, default: 'pending' },
  isBorrowRequest: { type: Boolean, default: false },
  negotiationRounds: { type: Number, default: 0 },
  negotiationHistory: [{ type: Object }],
  conditionAtLending: { type: String, default: 'good' },
  conditionAtReturn: { type: String, default: null },
  actualReturnDate: { type: Number, default: null },
  returnInitiatedAt: { type: Number, default: null },
  lenderRating: { type: Number, default: null },
  borrowerRating: { type: Number, default: null },
  reminders: [{ type: Object }],
  extensionRequest: { type: Object }, // Was missing in schema definition
  declineReason: { type: String },
  declinedBy: { type: String },
  returnNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lending = mongoose.model('Lending', lendingSchema);

const LENDING_STATUSES = [
  'pending',
  'negotiating',
  'accepted',
  'active',
  'return-initiated',
  'completed',
  'declined',
  'cancelled',
  'disputed'
];

const MAX_NEGOTIATION_ROUNDS = 3;

function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
}

function generateLendingId() {
  return crypto.randomUUID();
}

async function createLending(lenderUsername, borrowerInfo, itemId, terms) {
  const id = generateLendingId();

  const sanitizedBorrowerName = sanitizeInput(borrowerInfo.name || borrowerInfo.username);
  const sanitizedBorrowerEmail = sanitizeInput(borrowerInfo.email || '');
  const sanitizedBorrowerPhone = sanitizeInput(borrowerInfo.phone || '');
  const sanitizedNotes = sanitizeInput(terms.notes || '');
  const sanitizedConditionExpectation = sanitizeInput(terms.conditionExpectation || '');

  if (!terms.dateLent) {
    return { success: false, reason: 'Date lent is required' };
  }

  if (!terms.expectedReturnDate) {
    return { success: false, reason: 'Expected return date is required' };
  }

  const dateLent = new Date(terms.dateLent).getTime();
  const expectedReturn = new Date(terms.expectedReturnDate).getTime();

  if (expectedReturn <= dateLent) {
    return { success: false, reason: 'Return date must be after lending date' };
  }

  let securityDeposit = 0;
  if (terms.requireDeposit) {
    securityDeposit = parseFloat(terms.depositAmount) || 0;
    if (securityDeposit <= 0) {
      return { success: false, reason: 'Deposit amount must be greater than zero' };
    }
  }

  const isBorrowRequest = terms.isBorrowRequest || false;

  try {
    const newLending = new Lending({
      id,
      itemId,
      lenderUsername: lenderUsername.toLowerCase(),
      borrowerUsername: borrowerInfo.username ? borrowerInfo.username.toLowerCase() : null,
      borrowerInfo: {
        name: sanitizedBorrowerName,
        email: sanitizedBorrowerEmail,
        phone: sanitizedBorrowerPhone,
        isPlatformUser: Boolean(borrowerInfo.username)
      },
      terms: {
        dateLent,
        expectedReturnDate: expectedReturn,
        conditionExpectation: sanitizedConditionExpectation,
        notes: sanitizedNotes,
        requireDeposit: Boolean(terms.requireDeposit),
        depositAmount: securityDeposit,
        allowExtensions: Boolean(terms.allowExtensions)
      },
      status: borrowerInfo.username ? 'pending' : 'active',
      isBorrowRequest: isBorrowRequest,
      conditionAtLending: terms.conditionAtLending || 'good'
    });

    await newLending.save();
    return { success: true, lending: newLending.toObject() };
  } catch (err) {
    console.error("Error creating lending:", err);
    return { success: false, reason: 'Database error' };
  }
}

async function getLending(lendingId) {
  const lending = await Lending.findOne({ id: lendingId });
  return lending ? lending.toObject() : null;
}

async function updateLendingStatus(lendingId, newStatus, username) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  const isLender = lending.lenderUsername === username.toLowerCase();
  const isBorrower = lending.borrowerUsername === username.toLowerCase();

  if (!isLender && !isBorrower) {
    return { success: false, reason: 'Not authorized' };
  }

  if (!LENDING_STATUSES.includes(newStatus)) {
    return { success: false, reason: 'Invalid status' };
  }

  lending.status = newStatus;
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function acceptLending(lendingId, username) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  const isLender = lending.lenderUsername === username.toLowerCase();
  const isBorrower = lending.borrowerUsername === username.toLowerCase();

  if (lending.isBorrowRequest) {
    if (!isLender) {
      return { success: false, reason: 'Only the item owner can accept borrow requests' };
    }
  } else {
    if (!isBorrower) {
      return { success: false, reason: 'Only the borrower can accept lending offers' };
    }
  }

  if (lending.status !== 'pending' && lending.status !== 'negotiating') {
    return { success: false, reason: 'Cannot accept lending in current state' };
  }

  lending.status = 'active';
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function declineLending(lendingId, username, reason) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  const isLender = lending.lenderUsername === username.toLowerCase();
  const isBorrower = lending.borrowerUsername === username.toLowerCase();

  if (!isLender && !isBorrower) {
    return { success: false, reason: 'Not authorized' };
  }

  if (lending.status !== 'pending' && lending.status !== 'negotiating') {
    return { success: false, reason: 'Cannot decline lending in current state' };
  }

  lending.status = 'declined';
  lending.declineReason = sanitizeInput(reason || '');
  lending.declinedBy = username.toLowerCase();
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function proposeDifferentTerms(lendingId, username, newTerms, message) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  const isLender = lending.lenderUsername === username.toLowerCase();
  const isBorrower = lending.borrowerUsername === username.toLowerCase();

  if (!isLender && !isBorrower) {
    return { success: false, reason: 'Not authorized' };
  }

  if (lending.status !== 'pending' && lending.status !== 'negotiating') {
    return { success: false, reason: 'Cannot negotiate in current state' };
  }

  if (lending.negotiationRounds >= MAX_NEGOTIATION_ROUNDS) {
    lending.status = 'declined';
    lending.declineReason = 'Maximum negotiation rounds exceeded';
    lending.updatedAt = Date.now();
    await lending.save();
    return { success: false, reason: 'Maximum negotiation rounds exceeded. Lending declined.' };
  }

  lending.negotiationRounds += 1;
  lending.negotiationHistory.push({
    round: lending.negotiationRounds,
    proposedBy: username.toLowerCase(),
    terms: newTerms,
    message: sanitizeInput(message || ''),
    timestamp: Date.now()
  });

  if (newTerms.expectedReturnDate) {
    lending.terms.expectedReturnDate = new Date(newTerms.expectedReturnDate).getTime();
  }
  if (newTerms.depositAmount !== undefined) {
    lending.terms.depositAmount = parseFloat(newTerms.depositAmount) || 0;
  }
  if (newTerms.conditionExpectation) {
    lending.terms.conditionExpectation = sanitizeInput(newTerms.conditionExpectation);
  }

  lending.status = 'negotiating';
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function requestExtension(lendingId, borrowerUsername, newReturnDate, reason) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  if (lending.borrowerUsername !== borrowerUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized' };
  }

  if (lending.status !== 'active') {
    return { success: false, reason: 'Can only request extension for active lendings' };
  }

  if (!lending.terms.allowExtensions) {
    return { success: false, reason: 'Extensions are not allowed for this lending' };
  }

  const newDate = new Date(newReturnDate).getTime();
  if (newDate <= lending.terms.expectedReturnDate) {
    return { success: false, reason: 'New date must be after current return date' };
  }

  lending.extensionRequest = {
    newReturnDate: newDate,
    reason: sanitizeInput(reason || ''),
    requestedAt: Date.now(),
    status: 'pending'
  };
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function respondToExtension(lendingId, lenderUsername, approved) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  if (lending.lenderUsername !== lenderUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized' };
  }

  if (!lending.extensionRequest || lending.extensionRequest.status !== 'pending') {
    return { success: false, reason: 'No pending extension request' };
  }

  if (approved) {
    lending.terms.expectedReturnDate = lending.extensionRequest.newReturnDate;
    lending.extensionRequest.status = 'approved';
  } else {
    lending.extensionRequest.status = 'denied';
  }
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function initiateReturn(lendingId, borrowerUsername) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  if (lending.borrowerUsername !== borrowerUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized' };
  }

  if (lending.status !== 'active') {
    return { success: false, reason: 'Can only initiate return for active lendings' };
  }

  lending.status = 'return-initiated';
  lending.returnInitiatedAt = Date.now();
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function confirmReturn(lendingId, lenderUsername, returnDetails) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  if (lending.lenderUsername !== lenderUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized' };
  }

  if (lending.status !== 'return-initiated' && lending.status !== 'active') {
    return { success: false, reason: 'Cannot confirm return in current state' };
  }

  lending.conditionAtReturn = returnDetails.condition || lending.conditionAtLending;
  lending.actualReturnDate = Date.now();
  lending.status = 'completed';
  lending.returnNotes = sanitizeInput(returnDetails.notes || '');
  lending.updatedAt = Date.now();
  await lending.save();

  return { success: true, lending: lending.toObject() };
}

async function addRating(lendingId, username, rating, isLenderRating) {
  const lending = await Lending.findOne({ id: lendingId });
  if (!lending) {
    return { success: false, reason: 'Lending not found' };
  }

  if (lending.status !== 'completed') {
    return { success: false, reason: 'Can only rate completed lendings' };
  }

  const numRating = parseInt(rating, 10);
  if (numRating < 1 || numRating > 5) {
    return { success: false, reason: 'Rating must be between 1 and 5' };
  }

  if (isLenderRating) {
    if (lending.borrowerUsername !== username.toLowerCase()) {
      return { success: false, reason: 'Not authorized' };
    }
    lending.lenderRating = numRating;
  } else {
    if (lending.lenderUsername !== username.toLowerCase()) {
      return { success: false, reason: 'Not authorized' };
    }
    lending.borrowerRating = numRating;
  }

  lending.updatedAt = Date.now();
  await lending.save();
  return { success: true, lending: lending.toObject() };
}

async function getUserLendings(username) {
  const lendings = await Lending.find({ lenderUsername: username.toLowerCase() });
  return lendings.map(l => l.toObject());
}

async function getUserBorrowings(username) {
  const lendings = await Lending.find({ borrowerUsername: username.toLowerCase() });
  return lendings.map(l => l.toObject());
}

async function getActiveLendings(username) {
  const lendings = await Lending.find({
    lenderUsername: username.toLowerCase(),
    status: { $in: ['active', 'return-initiated'] }
  });
  return lendings.map(l => l.toObject());
}

async function getActiveBorrowings(username) {
  const lendings = await Lending.find({
    borrowerUsername: username.toLowerCase(),
    status: { $in: ['active', 'return-initiated'] }
  });
  return lendings.map(l => l.toObject());
}


async function getPendingRequests(username) {
  const lowerUsername = username.toLowerCase();
  // Complex OR query to match memory logic
  const lendings = await Lending.find({
    $and: [
      { status: { $in: ['pending', 'negotiating'] } },
      {
        $or: [
          { isBorrowRequest: true, lenderUsername: lowerUsername },
          { isBorrowRequest: false, borrowerUsername: lowerUsername }
        ]
      }
    ]
  });
  return lendings.map(l => l.toObject());
}

async function getOutgoingRequests(username) {
  const lowerUsername = username.toLowerCase();
  const lendings = await Lending.find({
    $and: [
      { status: { $in: ['pending', 'negotiating'] } },
      {
        $or: [
          { isBorrowRequest: true, borrowerUsername: lowerUsername },
          { isBorrowRequest: false, lenderUsername: lowerUsername }
        ]
      }
    ]
  });
  return lendings.map(l => l.toObject());
}

async function getOverdueLendings(username) {
  const now = Date.now();
  const lendings = await Lending.find({
    lenderUsername: username.toLowerCase(),
    status: { $in: ['active', 'return-initiated'] },
    'terms.expectedReturnDate': { $lt: now }
  });
  return lendings.map(l => l.toObject());
}

async function getOverdueBorrowings(username) {
  const now = Date.now();
  const lendings = await Lending.find({
    borrowerUsername: username.toLowerCase(),
    status: { $in: ['active', 'return-initiated'] },
    'terms.expectedReturnDate': { $lt: now }
  });
  return lendings.map(l => l.toObject());
}

async function getDueSoonLendings(username, daysAhead = 3) {
  const now = Date.now();
  const threshold = now + (daysAhead * 24 * 60 * 60 * 1000);
  const lendings = await Lending.find({
    lenderUsername: username.toLowerCase(),
    status: { $in: ['active', 'return-initiated'] },
    'terms.expectedReturnDate': { $gt: now, $lte: threshold }
  });
  return lendings.map(l => l.toObject());
}

async function getLendingHistory(itemId) {
  const lendings = await Lending.find({ itemId }).sort({ createdAt: -1 });
  return lendings.map(l => l.toObject());
}

async function addReminder(lendingId, reminderType) {
  await Lending.updateOne(
    { id: lendingId },
    { $push: { reminders: { type: reminderType, sentAt: Date.now() } } }
  );
}

async function getAllActiveLendings() {
  const lendings = await Lending.find({ status: 'active' });
  return lendings.map(l => l.toObject());
}

export default {
  createLending,
  getLending,
  updateLendingStatus,
  acceptLending,
  declineLending,
  proposeDifferentTerms,
  requestExtension,
  respondToExtension,
  initiateReturn,
  confirmReturn,
  addRating,
  getUserLendings,
  getUserBorrowings,
  getActiveLendings,
  getActiveBorrowings,
  getPendingRequests,
  getOutgoingRequests,
  getOverdueLendings,
  getOverdueBorrowings,
  getDueSoonLendings,
  getLendingHistory,
  addReminder,
  getAllActiveLendings
};
