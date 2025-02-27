
import React from "react";
import { Diamond } from "lucide-react";

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {/* Top right diamond */}
      <div className="absolute -top-10 -right-10 transform rotate-45 opacity-10">
        <Diamond size={200} className="text-brand-coral" />
      </div>

      {/* Bottom left diamond */}
      <div className="absolute -bottom-20 -left-20 transform rotate-12 opacity-10">
        <Diamond size={300} className="text-brand-coral" />
      </div>

      {/* Multiple floating diamonds */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="absolute opacity-5"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        >
          <Diamond size={20 + Math.random() * 60} className="text-brand-brown" />
        </div>
      ))}

      {/* Curved lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 C30,30 70,70 100,50"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-brand-brown"
        />
        <path
          d="M0,70 C20,50 80,50 100,30"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          className="text-brand-coral"
        />
      </svg>
    </div>
  );
};

export default BackgroundPattern;
