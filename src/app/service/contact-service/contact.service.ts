import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { TContactForm } from '../../types/TContactForm';
import { ToastService } from '../toast-service/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ContactService {

  private readonly dbClient: SupabaseClient = inject(SUPERBASE_CLIENT);
  private readonly toasterService = inject(ToastService)

  async addNewContactInfo(formData: TContactForm) {
    let formattedData = {...formData, company_name: formData.companyName, contact: formData.phoneNumber};
    delete (formattedData as any).companyName;
    delete (formattedData as any).phoneNumber;
    const response = await this.dbClient?.from('contact').insert([formattedData]);

    if(response?.status === 201) {
      this.toasterService.success(`Thank you for reaching out! Your contact request has been successfully received. I’ll personally give you a call shortly to discuss your needs and how we can work together.
Looking forward to connecting with you soon!`) 
    }else {
      console.error('Error submitting contact request:', response?.error);
      this.toasterService.error(`We’re sorry! It seems there was an issue submitting your contact request. Please try again, or feel free to reach out to us directly. 
We apologize for the inconvenience!`)
    }
    
  }
  
}
