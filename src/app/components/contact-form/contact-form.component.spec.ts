import { supabaseMock } from '../../../testing/supabase-mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactFormComponent } from './contact-form.component';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('ContactFormComponent', () => {
  let component: ContactFormComponent;
  let fixture: ComponentFixture<ContactFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactFormComponent],
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
