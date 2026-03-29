import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';


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
      // const response = await client.from(this.resumeDatabaseTable).select('*').eq('name', resumeName).single();
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

  
  
}
