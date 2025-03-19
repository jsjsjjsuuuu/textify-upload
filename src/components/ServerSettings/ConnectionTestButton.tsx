
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkConnection } from "@/utils/automationServerUrl";

interface ConnectionTestButtonProps {
  onConnectionResult?: (isConnected: boolean) => void;
  className?: string;
}

const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = ({ 
  onConnectionResult,
  className 
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  
  const testConnection = async () => {
    setIsTesting(true);
    
    try {
      const result = await checkConnection();
      
      if (result.isConnected) {
        toast({
          title: "متصل بالخادم",
          description: "تم الاتصال بالخادم بنجاح.",
          variant: "default",
        });
      } else {
        toast({
          title: "فشل الاتصال",
          description: result.message,
          variant: "destructive",
        });
      }
      
      onConnectionResult?.(result.isConnected);
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء الاتصال بالخادم",
        variant: "destructive",
      });
      
      onConnectionResult?.(false);
    } finally {
      setIsTesting(false);
    }
  };
  
  return (
    <Button
      onClick={testConnection}
      disabled={isTesting}
      variant="outline"
      className={className}
    >
      {isTesting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          جاري الاختبار...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          اختبار الاتصال
        </>
      )}
    </Button>
  );
};

export default ConnectionTestButton;
