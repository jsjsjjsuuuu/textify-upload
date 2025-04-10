import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Database, Images } from 'lucide-react';

const DashboardContent = () => {

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/records">
              <Database className="h-4 w-4 ml-1" />
              السجلات
            </Link>
          </Button>
          <Button asChild className="bg-purple-700 hover:bg-purple-800">
            <Link to="/receipts">
              <Images className="h-4 w-4 ml-1" />
              معرض الوصولات
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
