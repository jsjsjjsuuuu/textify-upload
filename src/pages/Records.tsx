
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import AppHeader from '@/components/AppHeader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable/data-table";
import { columns } from "@/components/DataTable/columns";
import { getImageRecords } from '@/integrations/supabase/image-records';

const Records = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user && !isAuthLoading) {
      navigate('/login');
    }
  }, [user, isAuthLoading, navigate]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user) {
          const records = await getImageRecords(user.id);
          setData(records);
        }
      } catch (error) {
        console.error("Failed to fetch image records:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  if (isAuthLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">جاري تحميل المعلومات...</p>
      </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto max-w-md p-8 border rounded-2xl bg-card shadow-lg">
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold mb-2">تنبيه</AlertTitle>
            <AlertDescription>
              يجب عليك تسجيل الدخول لرؤية هذه الصفحة
            </AlertDescription>
          </Alert>
        </div>
      </div>;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto py-6 px-4">
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-0">
            <CardTitle>سجل الصور</CardTitle>
            <CardDescription>
              هنا يمكنك رؤية جميع الصور التي قمت بمعالجتها.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <DataTable columns={columns} data={data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Records;
