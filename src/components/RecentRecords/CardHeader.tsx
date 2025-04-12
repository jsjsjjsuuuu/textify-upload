
import React from 'react';
import { Button } from "@/components/ui/button";
import { CardHeader as UICardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface CardHeaderProps {
  onRefresh: () => void;
}

const CardHeader = ({ onRefresh }: CardHeaderProps) => {
  return (
    <UICardHeader className="glassmorphism-header border-b border-white/10">
      <CardTitle className="flex justify-between items-center text-white">
        <span>آخر السجلات</span>
        <Button variant="outline" size="icon" onClick={onRefresh} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardTitle>
      <CardDescription className="text-white/70">
        عرض أحدث السجلات المضافة في النظام
      </CardDescription>
    </UICardHeader>
  );
};

export default CardHeader;
