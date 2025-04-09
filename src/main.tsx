
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// تأكد من أن مكون AuthProvider يتم استدعاؤه من App.tsx حيث تم استخدامه بشكل صحيح
createRoot(document.getElementById("root")!).render(<App />);
