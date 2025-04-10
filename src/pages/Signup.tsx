
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { error } = await signUp(email, password, fullName, 'standard');
      
      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "خطأ في إنشاء الحساب",
          description: error.message,
        });
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم إنشاء حسابك بنجاح، يرجى تفعيل البريد الإلكتروني.",
        });
        navigate('/login');
      }
    } catch (err) {
      console.error("خطأ في التسجيل:", err);
      setError('حدث خطأ أثناء إنشاء الحساب.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">إنشاء حساب جديد</h1>
          
          {error && (
            <div className="bg-red-900/30 text-red-200 p-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">الاسم الكامل</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
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
              <Label htmlFor="password" className="text-white">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-700 hover:bg-purple-800"
            >
              {isSubmitting ? 'جاري التسجيل...' : 'إنشاء حساب'}
            </Button>
          </form>
          
          <div className="text-sm text-gray-400 text-center mt-6">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-purple-400 hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
