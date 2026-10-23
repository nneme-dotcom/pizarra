import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// Angular 22 funciona sin zone.js (zoneless): la vista se actualiza a partir de signals.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
