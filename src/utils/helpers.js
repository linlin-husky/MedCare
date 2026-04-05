"use strict";

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '$0.00';
  return '$' + parseFloat(amount).toFixed(2);
}

function getDaysUntil(timestamp) {
  if (!timestamp) return 0;
  const now = Date.now();
  const diff = timestamp - now;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function getDaysAgo(timestamp) {
  if (!timestamp) return 0;
  const now = Date.now();
  const diff = now - timestamp;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function getDateInputValue(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTrustScoreColor(score) {
  if (score >= 95) return 'trust-elite';
  if (score >= 85) return 'trust-trusted';
  if (score >= 70) return 'trust-reliable';
  if (score >= 50) return 'trust-new';
  return 'trust-caution';
}

function getStatusColor(status) {
  switch (status) {
    case 'active':
    case 'available':
    case 'completed':
    case 'resolved':
      return 'status-success';
    case 'pending':
    case 'negotiating':
    case 'return-initiated':
      return 'status-warning';
    case 'overdue':
    case 'declined':
    case 'disputed':
    case 'escalated':
      return 'status-danger';
    case 'lent':
      return 'status-info';
    default:
      return 'status-default';
  }
}

function getConditionColor(condition) {
  switch (condition) {
    case 'excellent':
      return 'condition-excellent';
    case 'good':
      return 'condition-good';
    case 'fair':
      return 'condition-fair';
    case 'poor':
      return 'condition-poor';
    default:
      return '';
  }
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function validateUsername(username) {
  const errors = [];
  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else {
    if (username.length < 2) {
      errors.push('Username must be at least 2 characters');
    }
    if (username.length > 30) {
      errors.push('Username must be less than 30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }
  return errors;
}

function validateEmail(email) {
  if (!email) return [];
  if (!email.includes('@')) {
    return ['Please enter a valid email address'];
  }
  return [];
}

function validatePhone(phone) {
  if (!phone) return [];
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return ['Phone number must have at least 10 digits'];
  }
  if (digitsOnly.length > 15) {
    return ['Phone number cannot exceed 15 digits'];
  }
  if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
    return ['Phone number contains invalid characters'];
  }
  return [];
}

function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    return [fieldName + ' is required'];
  }
  return [];
}

function validateMinLength(value, minLength, fieldName) {
  if (!value || value.length < minLength) {
    return [fieldName + ' must be at least ' + minLength + ' characters'];
  }
  return [];
}

function validatePositiveNumber(value, fieldName) {
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    return [fieldName + ' must be a positive number'];
  }
  return [];
}

function validateDateAfter(date1, date2, fieldName) {
  if (new Date(date1) <= new Date(date2)) {
    return [fieldName + ' must be after the start date'];
  }
  return [];
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return minutes + ' min ago';
  if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago';
  if (days < 7) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
  return formatDate(timestamp);
}

export {
  formatDate,
  formatDateTime,
  formatCurrency,
  getDaysUntil,
  getDaysAgo,
  getDateInputValue,
  getTodayDateString,
  capitalizeFirst,
  getTrustScoreColor,
  getStatusColor,
  getConditionColor,
  truncateText,
  validateUsername,
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validatePositiveNumber,
  validateDateAfter,
  formatTimeAgo
};
