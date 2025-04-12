
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/utils/dateFormatter';
import AppHeader from '@/components/AppHeader';
import { Check, Clock, AlertTriangle, Grid, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { useImageProcessing } from '@/hooks/useImageProcessing';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ImageData } from '@/types/ImageData';

const Records = () => {
  const { user } = useAuth();
  const { images, loadUserImages } = useImageProcessing();
  const { toast } = useToast();
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);

  // إحصائيات السجلات
  const [stats, setStats] = useState({
    all: 0,
    processing: 0,
    pending: 0,
    completed: 0,
    incomplete: 0,
    error: 0
  });

  // تحميل بيانات الصور عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      loadUserImages();
    }
  }, [user, loadUserImages]);

  // حساب إحصائيات السجلات
  useEffect(() => {
    const calcStats = {
      all: images.length,
      processing: images.filter(img => img.status === 'processing').length,
      pending: images.filter(img => img.status === 'pending').length,
      completed: images.filter(img => img.status === 'completed' && img.submitted).length,
      incomplete: images.filter(img => 
        img.status === 'completed' && 
        !img.submitted && 
        (!img.code || !img.senderName || !img.province || !img.price)
      ).length,
      error: images.filter(img => img.status === 'error').length
    };
    setStats(calcStats);
  }, [images]);

  // تصفية السجلات حسب الحالة
  useEffect(() => {
    let filtered = [...images];
    
    if (filterStatus === 'processing') {
      filtered = filtered.filter(img => img.status === 'processing');
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(img => img.status === 'pending');
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(img => img.status === 'completed' && img.submitted);
    } else if (filterStatus === 'incomplete') {
      filtered = filtered.filter(img => 
        img.status === 'completed' && 
        !img.submitted && 
        (!img.code || !img.senderName || !img.province || !img.price)
      );
    } else if (filterStatus === 'error') {
      filtered = filtered.filter(img => img.status === 'error');
    }
    
    // ترتيب حسب التاريخ (الأحدث أولاً)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredImages(filtered);
  }, [images, filterStatus]);

  // التبديل بين العرض الشبكي والقائمة
  const toggleView = (viewType: 'grid' | 'list') => {
    setView(viewType);
  };

  // تغيير فلتر الحالة
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
  };

  return (
    <div className="min-h-screen bg-[#0e1320] text-white">
      <AppHeader />
      
      <div className="container mx-auto p-4 pt-8">
        {/* رأس الصفحة والتاريخ */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">نظام إدارة المهام</h1>
          <div className="text-slate-300">
            {new Date().toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        
        {/* فلاتر الحالة */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <button 
            onClick={() => handleStatusFilter('all')}
            className={`glass-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xl">الكل</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'all' ? 'active' : ''}`}>{stats.all}</span>
                <Grid className="w-5 h-5 ml-2" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusFilter('pending')}
            className={`glass-filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>قيد الانتظار</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'pending' ? 'active' : ''}`}>{stats.pending}</span>
                <Clock className="w-5 h-5 ml-2" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusFilter('processing')}
            className={`glass-filter-btn ${filterStatus === 'processing' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>قيد المعالجة</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'processing' ? 'active' : ''}`}>{stats.processing}</span>
                <Clock className="w-5 h-5 ml-2 animate-spin" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusFilter('error')}
            className={`glass-filter-btn ${filterStatus === 'error' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>أخطاء</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'error' ? 'active' : ''}`}>{stats.error}</span>
                <AlertTriangle className="w-5 h-5 ml-2" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusFilter('incomplete')}
            className={`glass-filter-btn ${filterStatus === 'incomplete' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>غير مكتملة</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'incomplete' ? 'active' : ''}`}>{stats.incomplete}</span>
                <AlertTriangle className="w-5 h-5 ml-2" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => handleStatusFilter('completed')}
            className={`glass-filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>مكتملة</span>
              <div className="flex">
                <span className={`status-count ${filterStatus === 'completed' ? 'active' : ''}`}>{stats.completed}</span>
                <Check className="w-5 h-5 ml-2" />
              </div>
            </div>
          </button>
        </div>
        
        {/* شريط الأدوات وعدد العناصر */}
        <div className="flex justify-between items-center mb-6 glassmorphism-toolbar p-3 rounded-lg">
          <div className="flex gap-2">
            <button 
              onClick={() => toggleView('list')}
              className={`glass-view-btn ${view === 'list' ? 'active' : ''}`}
              aria-label="عرض القائمة"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => toggleView('grid')}
              className={`glass-view-btn ${view === 'grid' ? 'active' : ''}`}
              aria-label="عرض الشبكة"
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
          <div className="glassmorphism-badge">
            عناصر {filteredImages.length}
          </div>
        </div>
        
        {/* قائمة السجلات */}
        {filteredImages.length === 0 ? (
          <div className="glassmorphism-empty text-center p-12">
            لا توجد مهام متاحة بهذه المعايير
          </div>
        ) : (
          <div className="space-y-4">
            {filteredImages.map((record) => (
              <div key={record.id} className="glassmorphism-record-item">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="status-badge green-badge">
                      <span>مكتمل</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="record-title">
                      مهمة #{record.code || record.id.substring(0, 4)}
                    </h3>
                    <p className="record-date">
                      تم الانتهاء بتاريخ {formatDate(record.date)}
                    </p>
                  </div>
                  <div>
                    <button className="complete-button">
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
