export interface TResume {
  id: string;
  title: string;
  tag: 'tech' | 'design' | 'management' | 'general';
  thumbnail_path?: string;
  updated_at: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
}