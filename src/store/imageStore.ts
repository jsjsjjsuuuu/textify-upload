
import { create } from 'zustand';
import { ImageData } from '@/types/ImageData';

interface ImageStore {
  images: ImageData[];
  setImages: (images: ImageData[]) => void;
  addImage: (image: ImageData) => void;
  updateImage: (id: string, data: Partial<ImageData>) => void;
  removeImage: (id: string) => void;
  setImageData: (images: ImageData[]) => void;
  clearImages: () => void;
}

export const useImageStore = create<ImageStore>((set) => ({
  images: [],
  
  setImages: (images) => set({ images }),
  
  addImage: (image) => set((state) => ({
    images: [...state.images, image]
  })),
  
  updateImage: (id, data) => set((state) => ({
    images: state.images.map((img) => 
      img.id === id ? { ...img, ...data } : img
    )
  })),
  
  removeImage: (id) => set((state) => ({
    images: state.images.filter((img) => img.id !== id)
  })),
  
  setImageData: (images) => set({ images }),
  
  clearImages: () => set({ images: [] })
}));
