export type DetectedColor = {
  name: string;
  confidence: number;
};

export type ImageColorDetection = {
  image: string;
  detectedColor: string;
  confidence: number;
  coverage: number;
  alternatives: DetectedColor[];
};

export type ColorDetectionResponse = {
  success: boolean;
  threshold: number;
  images_analyzed: number;
  colors: DetectedColor[];
  image_detections: ImageColorDetection[];
  error?: string;
};
