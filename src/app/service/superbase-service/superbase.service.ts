import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { EFunction } from './functions';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment.production';
import { EMPTY, firstValueFrom, Observable, of } from 'rxjs';


type TSuperBaseResponse = {
  data: any;
  error: any;
  isError: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SuperBaseService {

  private dbClient: SupabaseClient = inject(SUPERBASE_CLIENT);
  private httpClient = inject(HttpClient);
  private readonly functionAPI = environment.supabaseFunctionUrl;
  private readonly anonKey = environment.supabaseAnonKey;

  private headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.anonKey}`
    });

  async getResume(resumeName:string) {
    if(!this.dbClient) { 
      return { data: null, error: new Error('Supabase not initialized on server') };
    }
    const superbaseResponse = await this.getResumeInfo(resumeName);
    if(superbaseResponse.isError) {
      console.error('Error fetching resume info:', superbaseResponse.error);
      return { data: null, error: superbaseResponse.error };
    }   
    return superbaseResponse;
  }


  async getResumeInfo(resumeName: string): Promise<TSuperBaseResponse> {
    const data:TSuperBaseResponse = {data: undefined, error: undefined, isError: false};
    try {
      const download = await this.getFileFromStorage('resumes', resumeName)
      data.data = download;
    } catch (error) {
      data.error = error;
      data.isError = true;
    }
    return data;
  }

  // ---- Table API ---------------------
  async getTableData(tableName: string) {
    return this.dbClient.from(tableName).select('*');
  }

  // ---- Storage API ---------------------
  async getAllResumeFromStorage() {
    return this.dbClient.storage.from('resumes').list()
  }


  async getFileFromStorage(bucketName: string, fileName: string) {
    return this.dbClient.storage.from(bucketName).download(fileName);
  }

  getFilePublicHTML(bucketName: string, fileName: string) {
    return this.dbClient.storage.from(bucketName).getPublicUrl(fileName)
  }

  getSignedURL(bucketName: string, fileName: string) {
     return this.dbClient.storage.from(bucketName).createSignedUrl(fileName, 3600)
  }


  // ---- Functions API ---------------------

  public async callFunction(functionName: EFunction, body?: any) {
    const { data: { session }, error: sessionError } = await this.dbClient.auth.getSession();

    if (!session) {
      console.error("No active session found. Are you logged in?");
      // Trigger your login flow here if needed
      return;
    }

    const info = {data: undefined, error: undefined, isError: false};
    try {
      const {data, error} = await this.dbClient.functions.invoke(functionName, {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      info.data = data;
      info.error = error;
      info.isError = false;
      if (error) {
        console.error(`Error calling function ${functionName}:`, error);
        info.isError = true;
      }
      return info;
    } catch (error) {
      console.error(`Error calling function ${functionName}:`, error);
      return {data: undefined, error, isError: true};
    }
  }


  public async callFunctionWithHTTP(functionName: EFunction, body?: any) {
    const uri =`${this.functionAPI}/${functionName}`;
    const formattedData = JSON.stringify(body);
    const headers = await this.getHeaders();
    return firstValueFrom(this.httpClient.post(uri, formattedData, {headers}));
  }


  private async getHeaders() {
    const { data: { session }, error } = await this.dbClient.auth.getSession();
    const token = session?.access_token;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': this.anonKey // Supabase Gateway still needs the anonKey here
    });
    return headers;
  }
}
