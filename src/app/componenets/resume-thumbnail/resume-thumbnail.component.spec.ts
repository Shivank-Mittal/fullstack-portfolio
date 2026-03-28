import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeThumbnailComponent } from './resume-thumbnail.component';

describe('ResumeThumbnailComponent', () => {
  let component: ResumeThumbnailComponent;
  let fixture: ComponentFixture<ResumeThumbnailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeThumbnailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeThumbnailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
