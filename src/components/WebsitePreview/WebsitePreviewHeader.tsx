
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const WebsitePreviewHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="mb-6 animate-slide-up">
      <Button
        variant="ghost"
        className="flex items-center text-brand-brown hover:text-brand-coral mb-4 transition-colors"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="ml-2" size={16} />
        <span>العودة إلى الرئيسية</span>
      </Button>
      <h1 className="text-3xl font-bold text-brand-brown mb-3">معاينة المواقع الخارجية</h1>
      <p className="text-muted-foreground">
        قم بعرض المواقع الخارجية داخل تطبيقك لتسهيل تصدير البيانات المستخرجة
      </p>
    </header>
  );
};

export default WebsitePreviewHeader;
