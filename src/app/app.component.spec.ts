import { supabaseMock } from '../testing/supabase-mock';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SUPERBASE_CLIENT } from '../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: SUPERBASE_CLIENT, useValue: supabaseMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
