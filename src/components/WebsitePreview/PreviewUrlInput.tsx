
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Monitor, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface PreviewUrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  lastValidUrl: string;
  viewMode: "iframe" | "external";
  setViewMode: (mode: "iframe" | "external") => void;
  loadWebsite: (inputUrl?: string) => void;
  refreshWebsite: () => void;
  openExternalUrl: () => void;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

const PreviewUrlInput = ({
  url,
  setUrl,
  lastValidUrl,
  viewMode,
  setViewMode,
  loadWebsite,
  refreshWebsite,
  openExternalUrl,
  handleUrlChange,
  handleKeyDown,
  children,
}: PreviewUrlInputProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800/90 rounded-xl shadow-md p-4 mb-4"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              placeholder="أدخل عنوان URL للموقع (مثال: https://example.com)"
              className="pr-10 text-right flex-1"
              dir="rtl"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: "iframe" | "external") => setViewMode(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="طريقة العرض" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iframe">داخل التطبيق</SelectItem>
              <SelectItem value="external">في نافذة جديدة</SelectItem>
            </SelectContent>
          </Select>
          
          {children}
          
          <Button onClick={() => loadWebsite()} className="bg-brand-brown hover:bg-brand-brown/90 flex-shrink-0">
            <Monitor className="ml-2 h-4 w-4" />
            عرض الموقع
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={refreshWebsite}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تحديث الصفحة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={openExternalUrl}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>فتح في صفحة جديدة</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewUrlInput;
