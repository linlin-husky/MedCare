"use strict";

import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Keeping custom ID or could rely on _id. Let's use custom string to match existing.
  username: { type: String, required: true, lowercase: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  relatedLendingId: { type: String, default: null },
  timestamp: { type: Number, default: Date.now },
  read: { type: Boolean, default: false }
});

const Activity = mongoose.model('Activity', activitySchema);

let activityIdCounter = 1;

function generateActivityId() {
  return 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  // Improved ID generation for persistence without relying on memory counter
}

async function addActivity(username, type, message, relatedLendingId) {
  const id = generateActivityId();
  const activity = new Activity({
    id,
    username: username.toLowerCase(),
    type,
    message,
    relatedLendingId: relatedLendingId || null,
    timestamp: Date.now(),
    read: false
  });

  try {
    await activity.save();

    // Maintain limit of 100 activities per user
    const count = await Activity.countDocuments({ username: username.toLowerCase() });
    if (count > 100) {
      // Find extra and remove oldest
      const toRemove = count - 100;
      const oldest = await Activity.find({ username: username.toLowerCase() })
        .sort({ timestamp: 1 })
        .limit(toRemove)
        .select('_id');

      if (oldest.length > 0) {
        await Activity.deleteMany({ _id: { $in: oldest.map(a => a._id) } });
      }
    }

    return activity.toObject();
  } catch (err) {
    console.error("Error adding activity:", err);
    return null;
  }
}

async function getActivitiesForUser(username) {
  const activities = await Activity.find({ username: username.toLowerCase() })
    .sort({ timestamp: -1 });
  return activities.map(a => a.toObject());
}

async function getUnreadCount(username) {
  return await Activity.countDocuments({
    username: username.toLowerCase(),
    read: false
  });
}

async function markAsRead(username, activityId) {
  const result = await Activity.updateOne(
    { id: activityId, username: username.toLowerCase() },
    { $set: { read: true } }
  );
  return result.modifiedCount > 0;
}

async function markAllAsRead(username) {
  await Activity.updateMany(
    { username: username.toLowerCase(), read: false },
    { $set: { read: true } }
  );
}

// Helper wrappers for specific notifications
async function notifyLendingRequest(borrowerUsername, lenderDisplayName, itemName, lendingId) {
  await addActivity(
    borrowerUsername,
    'lending_request',
    lenderDisplayName + ' wants to lend you "' + itemName + '"',
    lendingId
  );
}

async function notifyLendingAccepted(lenderUsername, borrowerDisplayName, itemName, lendingId) {
  await addActivity(
    lenderUsername,
    'lending_accepted',
    borrowerDisplayName + ' accepted your lending request for "' + itemName + '"',
    lendingId
  );
}

async function notifyLendingDeclined(lenderUsername, borrowerDisplayName, itemName, lendingId) {
  await addActivity(
    lenderUsername,
    'lending_declined',
    borrowerDisplayName + ' declined your lending request for "' + itemName + '"',
    lendingId
  );
}

async function notifyReturnInitiated(lenderUsername, borrowerDisplayName, itemName, lendingId) {
  await addActivity(
    lenderUsername,
    'return_initiated',
    borrowerDisplayName + ' is returning "' + itemName + '"',
    lendingId
  );
}

async function notifyItemReturned(borrowerUsername, lenderDisplayName, itemName, lendingId) {
  await addActivity(
    borrowerUsername,
    'item_returned',
    'You have returned "' + itemName + '" to ' + lenderDisplayName,
    lendingId
  );
}

async function notifyExtensionRequested(lenderUsername, borrowerDisplayName, itemName, lendingId) {
  await addActivity(
    lenderUsername,
    'extension_requested',
    borrowerDisplayName + ' requested an extension for "' + itemName + '"',
    lendingId
  );
}

async function notifyExtensionApproved(borrowerUsername, lenderDisplayName, itemName, lendingId) {
  await addActivity(
    borrowerUsername,
    'extension_approved',
    lenderDisplayName + ' approved your extension request for "' + itemName + '"',
    lendingId
  );
}

async function notifyExtensionDenied(borrowerUsername, lenderDisplayName, itemName, lendingId) {
  await addActivity(
    borrowerUsername,
    'extension_denied',
    lenderDisplayName + ' denied your extension request for "' + itemName + '"',
    lendingId
  );
}

async function notifyDueReminder(borrowerUsername, itemName, daysLeft, lendingId) {
  let message = '';
  if (daysLeft > 0) {
    message = 'Reminder: "' + itemName + '" is due in ' + daysLeft + ' day' + (daysLeft > 1 ? 's' : '');
  } else if (daysLeft === 0) {
    message = 'Reminder: "' + itemName + '" is due today';
  }
  await addActivity(borrowerUsername, 'due_reminder', message, lendingId);
}

async function notifyOverdue(borrowerUsername, itemName, daysOverdue, lendingId) {
  await addActivity(
    borrowerUsername,
    'overdue',
    '"' + itemName + '" is ' + daysOverdue + ' day' + (daysOverdue > 1 ? 's' : '') + ' overdue',
    lendingId
  );
}

async function notifyDisputeFiled(targetUsername, filedByName, itemName, lendingId) {
  await addActivity(
    targetUsername,
    'dispute_filed',
    filedByName + ' filed a dispute regarding "' + itemName + '"',
    lendingId
  );
}

async function notifyDisputeResolved(username, itemName, lendingId) {
  await addActivity(
    username,
    'dispute_resolved',
    'The dispute for "' + itemName + '" has been resolved',
    lendingId
  );
}

async function notifyRatingReceived(username, raterName, rating, lendingId) {
  await addActivity(
    username,
    'rating_received',
    raterName + ' gave you a ' + rating + '-star rating',
    lendingId
  );
}

export default {
  addActivity,
  getActivitiesForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  notifyLendingRequest,
  notifyLendingAccepted,
  notifyLendingDeclined,
  notifyReturnInitiated,
  notifyItemReturned,
  notifyExtensionRequested,
  notifyExtensionApproved,
  notifyExtensionDenied,
  notifyDueReminder,
  notifyOverdue,
  notifyDisputeFiled,
  notifyDisputeResolved,
  notifyRatingReceived
};
