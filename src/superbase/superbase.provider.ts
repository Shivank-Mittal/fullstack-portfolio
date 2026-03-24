import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';


const superBaseUrl = 'https://fsbpaqjdrnzjtbdfzrju.supabase.co';
const superBaseKeyPUBLISHABLE_DEFAULT_KEY = 'sb_publishable_SMloEHJrqstoES99FCdXlA_xMs86FmB';

export const SUPERBASE_CLIENT = new InjectionToken<SupabaseClient>('SUPERBASE_CLIENT');
export const superbaseProvider = {
  provide: SUPERBASE_CLIENT,
  useFactory: () =>{
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return null as any; // SSR safe
    }

    return createClient(
      superBaseUrl,
      superBaseKeyPUBLISHABLE_DEFAULT_KEY
    );
  },
};