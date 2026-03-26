export type ToastVariant = 'success' | 'error' | 'neutral';

export type TToast = {
  id: string;
  message: string;
  variant: ToastVariant;
};
