import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Show error message to user
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Error loading application</h1>
      <p>Please refresh the page or contact support.</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}