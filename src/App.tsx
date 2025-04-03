
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import UserDetail from './pages/admin/UserDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeProvider from './providers/ThemeProvider';
import SupabaseStorageBucketCheck from './components/SupabaseStorageBucketCheck';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <Router>
          <SupabaseStorageBucketCheck /> {/* مكون فحص سلة التخزين */}
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route 
              path="/app" 
              element={
                <ProtectedRoute requireApproval={true}>
                  <Index />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records" 
              element={
                <ProtectedRoute requireApproval={true}>
                  <Records />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/records/:id" 
              element={
                <ProtectedRoute requireApproval={true}>
                  <RecordDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/users/:id" 
              element={
                <ProtectedRoute adminOnly>
                  <UserDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
