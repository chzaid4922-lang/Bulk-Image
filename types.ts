
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";
export type ImageStyle = "none" | "realistic" | "cinematic" | "hand-painted" | "stoic" | "cartoonish" | "cyberpunk" | "minimalist" | "digital-art";
export type ImageLighting = "none" | "golden-hour" | "dramatic" | "neon" | "soft" | "studio";

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  highQuality: boolean;
  style: ImageStyle;
  lighting: ImageLighting;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface PromptItem {
  id: string;
  text: string;
  status: 'pending' | 'generating' | 'done' | 'failed';
  imageUrl?: string;
  error?: string;
}
