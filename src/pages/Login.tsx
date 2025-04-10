
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setIsSubmitting(true);
      const { error, user } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: error.message,
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بعودتك!",
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("خطأ في تسجيل الدخول:", err);
      setError('حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">تسجيل الدخول</h1>
          
          {error && (
            <div className="bg-red-900/30 text-red-200 p-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">كلمة المرور</Label>
                <Link to="/forgot-password" className="text-sm text-purple-400 hover:underline">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-700 hover:bg-purple-800"
            >
              {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الدخول'}
            </Button>
          </form>
          
          <div className="text-sm text-gray-400 text-center mt-6">
            ليس لديك حساب؟{' '}
            <Link to="/signup" className="text-purple-400 hover:underline">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
