
import { ImageData } from '@/types/ImageData';

export interface UseImageDatabaseConfig {
  updateImage: (id: string, data: Partial<ImageData>) => void;
}
