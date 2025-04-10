
import React from 'react';
import { Button } from "@/components/ui/button";
import { CardHeader as UICardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface CardHeaderProps {
  onRefresh: () => void;
}

const CardHeader = ({ onRefresh }: CardHeaderProps) => {
  return (
    <UICardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>آخر السجلات</span>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardTitle>
      <CardDescription>
        عرض أحدث السجلات المضافة في النظام
      </CardDescription>
    </UICardHeader>
  );
};

export default CardHeader;
