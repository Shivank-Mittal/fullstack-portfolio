import { supabaseMock } from '../../../testing/supabase-mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalenderComponent } from './calender.component';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('CalenderComponent', () => {
  let component: CalenderComponent;
  let fixture: ComponentFixture<CalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalenderComponent],
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
