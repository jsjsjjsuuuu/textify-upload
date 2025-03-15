
import React from "react";
import ThemeToggle from "./ThemeToggle";
import { BookmarkIcon, ImageIcon, Settings, Database } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const AppHeader: React.FC = () => {
  return (
    <header className="w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-brand-brown dark:text-brand-beige">
            أداة تحليل الوصولات
          </h1>
          <div className="hidden md:flex ml-8 space-x-4 rtl:space-x-reverse">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-coral">
                <ImageIcon className="h-4 w-4 ml-2" />
                معالجة الصور
              </Button>
            </Link>
            <Link to="/records">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-coral">
                <Database className="h-4 w-4 ml-2" />
                السجلات
              </Button>
            </Link>
            <Link to="/bookmarklet">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-coral">
                <BookmarkIcon className="h-4 w-4 ml-2" />
                أداة نقل البيانات
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Link to="/api-settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4 text-muted-foreground hover:text-brand-coral" />
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
