import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Load offline answers from localStorage
const loadOfflineAnswers = () => {
  try {
    const storedAnswers = localStorage.getItem('offlineAnswers');
    if (storedAnswers) {
      return JSON.parse(storedAnswers);
    }
  } catch (error) {
    console.error('Error loading offline answers:', error);
  }
  return [];
};

// Initialize the store with offline answers
if (typeof window !== 'undefined') {
  window.initialOfflineAnswers = loadOfflineAnswers();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);