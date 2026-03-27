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
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (this.platformId) {
      // this.dbClient = inject(SUPERBASE_CLIENT);
    }
  }

  async getResume(resumeName:string) {
    if(!this.dbClient) { 
      return { data: null, error: new Error('Supabase not initialized on server') };
    }
    const superbaseResponse = await this.getResumeInfo(this.dbClient ,resumeName);
    if(superbaseResponse.isError) {
      console.error('Error fetching resume info:', superbaseResponse.error);
      return { data: null, error: superbaseResponse.error };
    }
    return superbaseResponse;
  }


  async getResumeInfo(client: SupabaseClient ,resumeName: string): Promise<TSuperBaseResponse> {
    const data:TSuperBaseResponse = {data: undefined, error: undefined, isError: false};
    try {
      // const response = await client.from(this.resumeDatabaseTable).select('*').eq('name', resumeName).single();
      const download = await client.storage.from('resumes').download('Resume_Shivank_MITTAL.pdf');
      data.data = download;
    } catch (error) {
      data.error = error;
      data.isError = true;
    }
    return data;
  }

  async getAllResumes() {
    return this.dbClient.storage.from('resumes').list('')
  }


  getFileFromBucket(client: SupabaseClient, bucketName: string, fileName: string) {
    return client.storage.from(bucketName).download(fileName);
  }

  getTableData(client: SupabaseClient, tableName: string) {
    return client.from(tableName).select('*');
  }


  
}
