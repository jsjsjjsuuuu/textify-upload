
import { ImageData } from "@/types/ImageData";

export default interface ImageViewerProps {
  image: ImageData;
  onClose: () => void;
  nextImage?: () => void;
  prevImage?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}
