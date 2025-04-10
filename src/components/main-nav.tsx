
import React from "react";
import { Link } from "react-router-dom";

export function MainNav({ className }: { className?: string }) {
  return (
    <div className={`${className} hidden md:flex space-x-4 space-x-reverse justify-center`}>
      {/* يمكن إضافة عناصر قائمة إضافية هنا */}
    </div>
  );
}
