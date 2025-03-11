
import React from "react";
import { ImageData } from "@/types/ImageData";
import { motion } from "framer-motion";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

interface ImageTableProps {
  images: ImageData[];
  isSubmitting: boolean;
  onImageClick: (image: ImageData) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  formatDate: (date: Date) => string;
}

const ImageTable: React.FC<ImageTableProps> = ({
  images,
  isSubmitting,
  onImageClick,
  onDelete,
  onSubmit,
  formatDate
}) => {
  if (images.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="mb-6 border-r-4 border-brand-green/60 pr-3">
        <h2 className="text-2xl font-bold text-brand-brown dark:text-brand-beige flex items-center">
          جدول النصوص المستخرجة
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          عرض منظم لجميع البيانات المستخرجة من الصور
        </p>
      </div>
      
      <div className="rounded-xl border-2 border-border shadow-lg dark:shadow-md dark:shadow-black/20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full rtl-table">
            <TableHeader />
            <tbody>
              {images.map(image => (
                <TableRow
                  key={image.id}
                  image={image}
                  isSubmitting={isSubmitting}
                  onImageClick={onImageClick}
                  onDelete={onDelete}
                  onSubmit={onSubmit}
                  formatDate={formatDate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.section>
  );
};

export default ImageTable;
