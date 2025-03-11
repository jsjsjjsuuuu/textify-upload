
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import { useAuth } from '@/hooks/useAuth';

const AppHeader = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <motion.header 
      className="flex justify-between items-center py-4 sm:py-6 mb-4 px-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-brand-brown dark:text-brand-beige">
          نظام استخراج البيانات
        </h1>
      </div>
      <nav className="hidden md:flex items-center space-x-6 space-x-reverse ml-4">
        <a
          onClick={() => navigate('/')}
          className="text-brand-brown dark:text-brand-beige font-medium cursor-pointer hover:text-brand-coral transition-colors duration-200"
        >
          الرئيسية
        </a>
        <a
          onClick={() => navigate('/records')}
          className="text-brand-brown dark:text-brand-beige font-medium cursor-pointer hover:text-brand-coral transition-colors duration-200"
        >
          السجلات
        </a>
        <a
          onClick={() => navigate('/api')}
          className="text-brand-brown dark:text-brand-beige font-medium cursor-pointer hover:text-brand-coral transition-colors duration-200"
        >
          API
        </a>
      </nav>
      <div className="flex items-center space-x-2 space-x-reverse">
        {isAuthenticated && <UserMenu />}
        <ThemeToggle />
      </div>
    </motion.header>
  );
};

export default AppHeader;
