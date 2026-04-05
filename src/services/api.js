"use strict";

// ============ HELPER FUNCTION ============
function handleResponse(response) {
  if (!response.ok) {
    return response.json().then(err => Promise.reject(err));
  }
  return response.json();
}

// ============ AUTH ============
function fetchSession() {
  return fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include'
  }).then(handleResponse);
}

function register(username, displayName, email, phone) {
  return fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, displayName, email, phone })
  }).then(handleResponse);
}

function login(username) {
  return fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username })
  }).then(handleResponse);
}

function logout() {
  return fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

// ============ PROFILE ============
function getUserProfile() {
  return fetch('/api/users/profile', {
    method: 'GET',
    credentials: 'include'
  }).then(handleResponse);
}

function getPublicProfile(username) {
  return fetch(`/api/users/${encodeURIComponent(username)}`, {
    method: 'GET',
    credentials: 'include'
  }).then(handleResponse);
}

function updateUserProfile(data) {
  return fetch('/api/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

// ============ APPOINTMENTS ============
function getAppointments(username) {
  const url = username ? `/api/appointments?username=${encodeURIComponent(username)}` : '/api/appointments';
  return fetch(url, {
    method: 'GET',
    credentials: 'include'
  }).then(handleResponse);
}

function createAppointment(apptData) {
  // apptData can include 'username'
  return fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(apptData)
  }).then(handleResponse);
}

// ============ MEDICAL TESTS ============
function getMedicalTests(username) {
  const url = username ? `/api/medical-tests?username=${encodeURIComponent(username)}` : '/api/medical-tests';
  return fetch(url, {
    credentials: 'include'
  }).then(handleResponse);
}

function addMedicalTest(testData) {
  // If testData already contains username, it will be sent in body
  return fetch('/api/medical-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(testData)
  }).then(handleResponse);
}

function updateMedicalTest(id, testData) {
  return fetch(`/api/medical-tests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(testData)
  }).then(handleResponse);
}

function deleteMedicalTest(id) {
  return fetch(`/api/medical-tests/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

function filterMedicalTestsByStatus(status) {
  return fetch(`/api/medical-tests/filter/status/${status}`, {
    credentials: 'include'
  }).then(handleResponse);
}

function filterMedicalTestsByCategory(category) {
  return fetch(`/api/medical-tests/filter/category/${category}`, {
    credentials: 'include'
  }).then(handleResponse);
}

function searchMedicalTests(query) {
  return fetch(`/api/medical-tests/search/${encodeURIComponent(query)}`, {
    credentials: 'include'
  }).then(handleResponse);
}

// ============ MEDICATIONS/PRESCRIPTIONS ============
function getMedications(username) {
  const url = username ? `/api/medications?username=${encodeURIComponent(username)}` : '/api/medications';
  return fetch(url, {
    credentials: 'include'
  }).then(handleResponse);
}

function createMedication(data) {
  return fetch('/api/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function updateMedication(id, data) {
  return fetch(`/api/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function deleteMedication(id) {
  return fetch(`/api/medications/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

// ============ PRESCRIPTIONS ============
function getPrescriptions(username) {
  const url = username ? `/api/medications?username=${encodeURIComponent(username)}` : '/api/medications';
  return fetch(url, {
    credentials: 'include'
  }).then(handleResponse);
}

function createPrescription(data) {
  return fetch('/api/medications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function updatePrescription(id, data) {
  return fetch(`/api/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function deletePrescription(id) {
  return fetch(`/api/medications/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

// ============ SYMPTOMS ============
function getSymptoms(username) {
  const url = username ? `/api/symptoms?username=${encodeURIComponent(username)}` : '/api/symptoms';
  return fetch(url, {
    credentials: 'include'
  }).then(handleResponse);
}

function createSymptom(data) {
  return fetch('/api/symptoms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function updateSymptom(id, data) {
  return fetch(`/api/symptoms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function deleteSymptom(id) {
  return fetch(`/api/symptoms/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

// ============ VITALS ============
function getVitals(type, username) {
  let url = '/api/vitals';
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (username) params.append('username', username);

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return fetch(url, {
    credentials: 'include'
  }).then(handleResponse);
}

function addVital(data) {
  // data can include 'username' for dependents
  return fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function deleteVital(id) {
  return fetch(`/api/vitals/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  }).then(handleResponse);
}

function getAllUsers() {
  return fetch('/api/users', {
    credentials: 'include'
  }).then(handleResponse);
}

function searchUsers(query) {
  return fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
    credentials: 'include'
  }).then(handleResponse);
}

// ============ EXPORTS ============
export {
  // Auth
  fetchSession,
  register,
  login,
  logout,
  // Profile
  getUserProfile,
  getPublicProfile,
  updateUserProfile,
  getAllUsers,
  searchUsers,
  // Appointments
  getAppointments,
  createAppointment,
  // Medical Tests
  getMedicalTests,
  addMedicalTest,
  updateMedicalTest,
  deleteMedicalTest,
  filterMedicalTestsByStatus,
  filterMedicalTestsByCategory,
  searchMedicalTests,
  // Medications
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  // Prescriptions
  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
  // Symptoms
  getSymptoms,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  // Vitals
  getVitals,
  addVital,
  deleteVital
};