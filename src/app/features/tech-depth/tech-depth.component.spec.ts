import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechDepthComponent } from './tech-depth.component';

describe('TechDepthComponent', () => {
  let component: TechDepthComponent;
  let fixture: ComponentFixture<TechDepthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechDepthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechDepthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
