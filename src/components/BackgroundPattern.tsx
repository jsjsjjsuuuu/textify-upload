
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const BackgroundPattern = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Top right circles */}
      <div 
        className={`design-element top-0 right-0 w-96 h-96 rounded-full ${
          theme === "dark" ? "bg-brand-green/5" : "bg-brand-coral/5"
        }`} 
        style={{ transform: "translate(30%, -30%)" }}
      />
      <div 
        className={`design-element top-0 right-0 w-64 h-64 rounded-full ${
          theme === "dark" ? "bg-brand-green/10" : "bg-brand-coral/10"
        }`} 
        style={{ transform: "translate(10%, -10%)" }}
      />
      
      {/* Bottom left circles */}
      <div 
        className={`design-element bottom-0 left-0 w-96 h-96 rounded-full ${
          theme === "dark" ? "bg-brand-green/5" : "bg-brand-brown/5"
        }`} 
        style={{ transform: "translate(-30%, 30%)" }}
      />
      <div 
        className={`design-element bottom-0 left-0 w-64 h-64 rounded-full ${
          theme === "dark" ? "bg-brand-green/10" : "bg-brand-brown/10"
        }`} 
        style={{ transform: "translate(-10%, 10%)" }}
      />
      
      {/* Scattered small circles */}
      <div 
        className={`floating-element top-1/4 left-1/3 w-12 h-12 rounded-full ${
          theme === "dark" ? "bg-brand-green/10" : "bg-brand-beige"
        }`} 
      />
      <div 
        className={`floating-element top-2/3 right-1/4 w-8 h-8 rounded-full ${
          theme === "dark" ? "bg-brand-green/15" : "bg-brand-beige"
        }`} 
        style={{ animationDelay: "1s" }}
      />
      <div 
        className={`floating-element top-1/2 right-1/3 w-16 h-16 rounded-full ${
          theme === "dark" ? "bg-brand-green/5" : "bg-brand-beige"
        }`} 
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
};

export default BackgroundPattern;
