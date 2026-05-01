import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* GoogleOAuthProvider enables the Google sign-in hook/button. */}
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_LOGIN_ID}>
      {/* AuthProvider shares the current user across all pages/components. */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
