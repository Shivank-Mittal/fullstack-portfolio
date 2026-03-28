import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';
import { type TContactForm } from '../../types/TContactForm';
import { ContactService } from '../../service/contact-service/contact.service';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css',
})
export class ContactFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  private readonly contactService = inject(ContactService);

  readonly isSubmitted = signal(false);


  readonly contactForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required]],
    companyName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    message: ['', [Validators.required]],
  });

  onSubmit(event: Event): void {
    event.preventDefault();
    this.isSubmitted.set(true);

    // if (this.contactForm.invalid) {
    //   this.contactForm.markAllAsTouched();
    //   return;
    // }

    const payload: TContactForm = this.contactForm.getRawValue();
    this.contactService.addNewContactInfo(payload);
    console.log('Contact form submitted:', payload);
    this.contactForm.reset({
      name: '',
      companyName: '',
      email: '',
      phoneNumber: '',
      message: '',
    } satisfies TContactForm);
    this.isSubmitted.set(false);
  }
}
