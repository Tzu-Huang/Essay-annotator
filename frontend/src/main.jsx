/**
 * 🔹 React Application Entry Point
 *
 * This file is responsible for:
 * 1. Finding the root DOM element in index.html
 * 2. Creating a React root
 * 3. Rendering the main App component into the DOM
 *
 * this file bootstraps and starts the entire React application
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


/**
 * Find the root #root in index.html,
 * create a React root to take control of it,
 * and render the App component into the DOM
 * 
 * 
*/
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
