
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function UserAuthForm() {
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/login">تسجيل الدخول</Link>
      </Button>
      <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800">
        <Link to="/signup">إنشاء حساب</Link>
      </Button>
    </div>
  );
}
