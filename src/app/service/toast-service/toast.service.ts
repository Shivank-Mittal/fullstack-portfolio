import { Injectable, signal } from '@angular/core';
import type { TToast, ToastVariant } from '../../types/TToast';

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  neutral: 4000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<TToast[]>([]);
  /** Read-only view of active toasts (e.g. for `app-toaster`). */
  readonly toasts = this._toasts.asReadonly();

  private seq = 0;

  show(message: string, variant: ToastVariant, durationMs?: number): void {
    const id = `toast-${++this.seq}-${Date.now()}`;
    const toast: TToast = { id, message, variant };
    const ms = durationMs ?? DEFAULT_DURATION_MS[variant];
    this._toasts.update((list) => [...list, toast]);
    if (ms > 0) {
      setTimeout(() => this.dismiss(id), ms);
    }
  }

  success(message: string, durationMs?: number): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show(message, 'error', durationMs);
  }

  neutral(message: string, durationMs?: number): void {
    this.show(message, 'neutral', durationMs);
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
