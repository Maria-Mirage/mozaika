import './index.css';
import App from './App';
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

const container = document.getElementById('root');

if (!container) throw new Error('No container found.');

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
