import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode is left out on purpose: in dev it calls effects twice,
  // which would send two requests and confuse the HIT/MISS log.
  <App />
);
