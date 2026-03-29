export interface TResume {
  id: string;
  title: string;
  pdfUrl?: string;
  updated_at: string;   // this comes from Storage, keep as is
  language: string,
  type: string,                   // your default is 'CDI' not 'job'
  jobTitle: string,
  fileType: string,
  isNew: boolean
}