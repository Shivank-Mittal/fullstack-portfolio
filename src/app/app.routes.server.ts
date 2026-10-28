import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // One page per saved plan date: rendered on request, there is nothing to prerender.
  { path: 'nutrition/:date', renderMode: RenderMode.Server },
  // Everything else keeps the existing behaviour (prerendered at build time).
  { path: '**', renderMode: RenderMode.Prerender },
];
