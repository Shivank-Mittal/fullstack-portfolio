import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { TContactForm } from '../../types/TContactForm';
import { ToastService } from '../toast-service/toast.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ContactService {

  private readonly dbClient: SupabaseClient = inject(SUPERBASE_CLIENT);
  private readonly toasterService = inject(ToastService)
  private readonly httpClient: HttpClient = inject(HttpClient);

  private readonly functionAPI = environment.supabaseFunctionUrl;
  private readonly anonKey = environment.supabaseAnonKey;

  private headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.anonKey}`
    });

  addNewContactInfo(formData: TContactForm) {
    let formattedData = {...formData, company_name: formData.companyName, contact: formData.phoneNumber};
    delete (formattedData as any).companyName;
    delete (formattedData as any).phoneNumber;
    // const response = await this.dbClient?.from('contact').insert([formattedData]);
    return this.httpClient.post(this.functionAPI , formattedData, {headers: this.headers})

//     if(response?.status === 201) {
//       this.toasterService.success(`Thank you for reaching out! Your contact request has been successfully received. I’ll personally give you a call shortly to discuss your needs and how we can work together.
// Looking forward to connecting with you soon!`) 
//     }else {
//       console.error('Error submitting contact request:', response?.error);
//       this.toasterService.error(`We’re sorry! It seems there was an issue submitting your contact request. Please try again, or feel free to reach out to us directly. 
// We apologize for the inconvenience!`)
//     }
    
  }

  sendContact(data: {
    company_name: string;
    name: string;
    email: string;
    contact: number;
    message: string;
  }) {
    return this.httpClient.post(this.functionAPI , data);
  }
  
}
