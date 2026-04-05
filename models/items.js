"use strict";

import mongoose from 'mongoose';
import crypto from 'crypto'; // For backward compatibility if needed, but Mongoose creates IDs automatically usually. I will use UUID string to match existing logic if I can, or switch to ObjectId. The existing code uses crypto.randomUUID(). To be safe, I'll stick to string IDs or let Mongoose use ObjectId and map it to `id`. Mongoose `_id` is an ObjectId. Existing logic expects `id` to be a string. I can set _id to be the UUID string or just have a separate id field. I'll use a separate id field to minimize friction, or override _id. Let's use a separate id field which is the UUID, to match `generateItemId`.

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  ownerUsername: { type: String, required: true, lowercase: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  estimatedValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  isPublic: { type: Boolean, default: false },
  status: { type: String, default: 'available' },
  currentLendingId: { type: String, default: null }, // Reference to lending ID string
  lendingHistory: [{ type: Object }], // Or strict schema for history
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

const CATEGORIES = [
  'books',
  'electronics',
  'tools',
  'sports',
  'kitchen',
  'clothing',
  'games',
  'music',
  'outdoor',
  'other'
];

const CONDITIONS = ['excellent', 'good', 'fair', 'poor'];

function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().replace(/[<>]/g, '');
}

function generateItemId() {
  return crypto.randomUUID();
}

async function createItem(ownerUsername, itemData) {
  const id = generateItemId();
  const sanitizedName = sanitizeInput(itemData.name);
  const sanitizedDescription = sanitizeInput(itemData.description || '');
  const sanitizedNotes = sanitizeInput(itemData.notes || '');

  if (!sanitizedName || sanitizedName.length < 2) {
    return { success: false, reason: 'Item name must be at least 2 characters' };
  }

  if (!CATEGORIES.includes(itemData.category)) {
    return { success: false, reason: 'Invalid category' };
  }

  if (!CONDITIONS.includes(itemData.condition)) {
    return { success: false, reason: 'Invalid condition' };
  }

  const estimatedValue = parseFloat(itemData.estimatedValue) || 0;
  if (estimatedValue < 0) {
    return { success: false, reason: 'Value cannot be negative' };
  }

  try {
    const newItem = new Item({
      id,
      ownerUsername: ownerUsername.toLowerCase(),
      name: sanitizedName,
      description: sanitizedDescription,
      category: itemData.category,
      condition: itemData.condition,
      estimatedValue,
      notes: sanitizedNotes,
      isPublic: Boolean(itemData.isPublic),
      lendingHistory: []
    });
    await newItem.save();
    return { success: true, item: newItem.toObject() };
  } catch (err) {
    console.error("Error creating item:", err);
    return { success: false, reason: 'Database error' };
  }
}

async function getItem(itemId) {
  const item = await Item.findOne({ id: itemId });
  return item ? item.toObject() : null;
}

async function updateItem(itemId, ownerUsername, updates) {
  const item = await Item.findOne({ id: itemId });
  if (!item) {
    return { success: false, reason: 'Item not found' };
  }

  if (item.ownerUsername !== ownerUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized to update this item' };
  }

  if (item.status !== 'available') {
    return { success: false, reason: 'Cannot update item while it is lent out' };
  }

  if (updates.name !== undefined) {
    const sanitizedName = sanitizeInput(updates.name);
    if (sanitizedName.length < 2) {
      return { success: false, reason: 'Item name must be at least 2 characters' };
    }
    item.name = sanitizedName;
  }

  if (updates.description !== undefined) {
    item.description = sanitizeInput(updates.description);
  }

  if (updates.category !== undefined) {
    if (!CATEGORIES.includes(updates.category)) {
      return { success: false, reason: 'Invalid category' };
    }
    item.category = updates.category;
  }

  if (updates.condition !== undefined) {
    if (!CONDITIONS.includes(updates.condition)) {
      return { success: false, reason: 'Invalid condition' };
    }
    item.condition = updates.condition;
  }

  if (updates.estimatedValue !== undefined) {
    const value = parseFloat(updates.estimatedValue);
    if (value < 0) {
      return { success: false, reason: 'Value cannot be negative' };
    }
    item.estimatedValue = value;
  }

  if (updates.notes !== undefined) {
    item.notes = sanitizeInput(updates.notes);
  }

  if (updates.isPublic !== undefined) {
    item.isPublic = Boolean(updates.isPublic);
  }

  item.updatedAt = Date.now();
  await item.save();
  return { success: true, item: item.toObject() };
}

async function deleteItem(itemId, ownerUsername) {
  const item = await Item.findOne({ id: itemId });
  if (!item) {
    return { success: false, reason: 'Item not found' };
  }

  if (item.ownerUsername !== ownerUsername.toLowerCase()) {
    return { success: false, reason: 'Not authorized to delete this item' };
  }

  if (item.status !== 'available') {
    return { success: false, reason: 'Cannot delete item while it is lent out' };
  }

  await Item.deleteOne({ id: itemId });
  return { success: true };
}

async function getUserItems(username) {
  const items = await Item.find({ ownerUsername: username.toLowerCase() });
  return items.map(i => i.toObject());
}

async function getAvailableItems(username) {
  const items = await Item.find({
    ownerUsername: username.toLowerCase(),
    status: 'available'
  });
  return items.map(i => i.toObject());
}

async function getLentItems(username) {
  const items = await Item.find({
    ownerUsername: username.toLowerCase(),
    status: 'lent'
  });
  return items.map(i => i.toObject());
}

async function setItemLent(itemId, lendingId) {
  await Item.updateOne(
    { id: itemId },
    {
      $set: {
        status: 'lent',
        currentLendingId: lendingId,
        updatedAt: Date.now()
      }
    }
  );
}

async function setItemAvailable(itemId) {
  await Item.updateOne(
    { id: itemId },
    {
      $set: {
        status: 'available',
        currentLendingId: null,
        updatedAt: Date.now()
      }
    }
  );
}

async function addToLendingHistory(itemId, lendingRecord) {
  await Item.updateOne(
    { id: itemId },
    { $push: { lendingHistory: lendingRecord } }
  );
}

async function getPublicItems(filters = {}) {
  const query = {
    isPublic: true,
    status: 'available'
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.condition) {
    query.condition = filters.condition;
  }

  if (filters.minValue !== undefined) {
    query.estimatedValue = { ...query.estimatedValue, $gte: filters.minValue };
  }

  if (filters.maxValue !== undefined) {
    query.estimatedValue = { ...query.estimatedValue, $lte: filters.maxValue };
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    // Complex OR query
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  let sort = {};
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'value-high':
        sort = { estimatedValue: -1 };
        break;
      case 'value-low':
        sort = { estimatedValue: 1 };
        break;
      case 'name':
        sort = { name: 1 };
        break;
    }
  }

  const items = await Item.find(query).sort(sort);
  return items.map(i => i.toObject());
}

async function searchItems(query, ownerUsername = null) {
  const searchTerm = query.toLowerCase();
  const dbQuery = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (ownerUsername) {
    dbQuery.ownerUsername = ownerUsername.toLowerCase();
  }

  const items = await Item.find(dbQuery);
  return items.map(i => i.toObject());
}

function getCategories() {
  return CATEGORIES;
}

function getConditions() {
  return CONDITIONS;
}

export default {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  getUserItems,
  getAvailableItems,
  getLentItems,
  setItemLent,
  setItemAvailable,
  addToLendingHistory,
  getPublicItems,
  searchItems,
  getCategories,
  getConditions
};
