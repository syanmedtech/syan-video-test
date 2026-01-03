
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { isConfigMissing, missingKeys } from './firebase';

const ErrorBoundary = ({ message, missingVars }: { message: string, missingVars: string[] }) => (
  <div style={{ 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#fff',
    color: '#000',
    padding: '20px',
    textAlign: 'center'
  }}>
    <div style={{ maxWidth: '400px' }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '10px' }}>App failed to start</h1>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '20px' }}>{message}</p>
      
      {missingVars.length > 0 && (
        <div style={{ textAlign: 'left', backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '8px', fontSize: '0.75rem' }}>
          <p style={{ fontWeight: '600', marginBottom: '5px' }}>Missing Firebase Environment Variables:</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {missingVars.map(v => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}
    </div>
  </div>
);

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  try {
    if (isConfigMissing) {
      root.render(<ErrorBoundary message="Firebase configuration is incomplete." missingVars={missingKeys} />);
    } else {
      root.render(
        <React.StrictMode>
          <HashRouter>
            <App />
          </HashRouter>
        </React.StrictMode>
      );
    }
  } catch (err: any) {
    root.render(<ErrorBoundary message={err?.message || "An unknown error occurred during startup."} missingVars={missingKeys} />);
  }
}
