
import React from 'react';
import { Button } from "@/components/ui/button";

interface ImagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ImagePagination = ({
  currentPage,
  totalPages,
  onPageChange
}: ImagePaginationProps) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center mt-4">
      <div className="flex items-center space-x-1 space-x-reverse">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          السابق
        </Button>
        
        <span className="px-3 py-1 text-sm">
          صفحة {currentPage} من {totalPages}
        </span>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          التالي
        </Button>
      </div>
    </div>
  );
};

export default React.memo(ImagePagination);
