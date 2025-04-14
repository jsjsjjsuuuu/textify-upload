
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';

// تجاهل خطأ URL.createObjectURL في بيئة الاختبار
window.URL.createObjectURL = vi.fn(() => 'test-url');

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('FileUploader Component', () => {
  const mockOnFilesSelected = vi.fn();
  const defaultProps = {
    onFilesSelected: mockOnFilesSelected,
    isProcessing: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('يعرض منطقة السحب والإفلات', () => {
    render(<FileUploader {...defaultProps} />);
    expect(screen.getByText(/اسحب الصور هنا/i)).toBeInTheDocument();
  });

  it('يقبل تحميل الملفات عند النقر', async () => {
    render(<FileUploader {...defaultProps} />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /اختر الصور/i });
    
    fireEvent.click(input);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }
    
    await waitFor(() => {
      expect(mockOnFilesSelected).toHaveBeenCalledWith(expect.any(FileList));
    });
  });

  it('يعرض مؤشر التقدم أثناء المعالجة', () => {
    render(<FileUploader {...defaultProps} isProcessing={true} />);
    expect(screen.getByText(/جاري معالجة الصور/i)).toBeInTheDocument();
  });

  it('يتحقق من نوع الملف', async () => {
    render(<FileUploader {...defaultProps} />);
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]');
    
    if (input) {
      fireEvent.change(input, { target: { files: [invalidFile] } });
    }
    
    await waitFor(() => {
      expect(mockOnFilesSelected).not.toHaveBeenCalled();
    });
  });
});
