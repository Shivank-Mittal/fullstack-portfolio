import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

export const SUPERBASE_CLIENT = new InjectionToken<SupabaseClient>('SUPERBASE_CLIENT');
export const superbaseProvider = {
  provide: SUPERBASE_CLIENT,
  useFactory: () =>{
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return null as any; // SSR safe
    }

    return createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  },
};