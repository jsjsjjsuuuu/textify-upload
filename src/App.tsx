
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Records from './pages/Records';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ApiSettings from './pages/ApiSettings';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './hooks/useAuth';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <AuthGuard>
              <Index />
            </AuthGuard>
          } />
          <Route path="/records" element={
            <AuthGuard>
              <Records />
            </AuthGuard>
          } />
          <Route path="/api" element={
            <AuthGuard>
              <ApiSettings />
            </AuthGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
