import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeCollectionComponent } from './resume-collection.component';

describe('ResumeCollectionComponent', () => {
  let component: ResumeCollectionComponent;
  let fixture: ComponentFixture<ResumeCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeCollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
