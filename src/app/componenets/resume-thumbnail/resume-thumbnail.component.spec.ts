import { supabaseMock } from '../../../testing/supabase-mock';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeThumbnailComponent } from './resume-thumbnail.component';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { provideHttpClient } from '@angular/common/http';

describe('ResumeThumbnailComponent', () => {
  let component: ResumeThumbnailComponent;
  let fixture: ComponentFixture<ResumeThumbnailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeThumbnailComponent],
      providers: [provideHttpClient(), { provide: SUPERBASE_CLIENT, useValue: supabaseMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumeThumbnailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
