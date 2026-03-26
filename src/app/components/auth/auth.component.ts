import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { BUTTON } from '../../types/TButtons';
import { AuthService } from '../../service/auth-service/auth.service';
import { ToastService } from '../../service/toast-service/toast.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);;

  readonly buttonSecondary = BUTTON.Secondary;

  readonly authForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    // Your `AuthService` currently implements Google OAuth only.
    this.toastService.neutral(
      'Email/password sign-in is not implemented yet. Use "Continue with Google".',
    );
  }

  async onGoogleSignIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch (error: unknown) {
      console.error('Google sign-in failed:', error);
      this.toastService.error('Google sign-in failed. Please try again.');
    }
  }

  onForgotClick(event: Event): void {
    event.preventDefault();
    this.toastService.neutral('Password can not be reset, Please try the Google sign-in option.');
  }

  onRequestAccessClick(event: Event): void {
    event.preventDefault();
    this.toastService.neutral('We are not accepting new users at the moment. Please try again later.');
  }
}

