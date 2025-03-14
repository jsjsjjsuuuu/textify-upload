
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

const AppHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="text-center mb-8 animate-slide-up">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-brown dark:text-brand-beige mb-3">استخراج النص من الصور</h1>
      </header>

      <div className="flex justify-between items-center mb-8">
        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>

        {/* Desktop navigation */}
        <nav className="hidden md:block">
          <ul className="flex gap-6">
            <li>
              <Link to="/" className="text-brand-brown dark:text-brand-beige font-medium hover:text-brand-coral transition-colors">
                الرئيسية
              </Link>
            </li>
            <li>
              <Link to="/records" className="text-brand-brown dark:text-brand-beige font-medium hover:text-brand-coral transition-colors">
                <span className="flex items-center">
                  <Settings size={16} className="ml-1.5" />
                  إعدادات استخراج البيانات
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav className="md:hidden mb-8 bg-secondary dark:bg-secondary rounded-lg p-4 animate-slide-up">
          <ul className="flex flex-col gap-4">
            <li>
              <Link 
                to="/" 
                className="text-brand-brown dark:text-brand-beige font-medium hover:text-brand-coral transition-colors block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Link>
            </li>
            <li>
              <Link 
                to="/records" 
                className="text-brand-brown dark:text-brand-beige font-medium hover:text-brand-coral transition-colors block py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <Settings size={16} className="ml-1.5" />
                  إعدادات استخراج البيانات
                </span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default AppHeader;
