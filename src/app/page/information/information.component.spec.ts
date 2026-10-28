import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformationComponent } from './information.component';
import { AuthStore } from '../../store/auth/auth.store';

describe('InformationComponent', () => {
  let component: InformationComponent;
  let fixture: ComponentFixture<InformationComponent>;

  async function create(isOwner: boolean) {
    await TestBed.configureTestingModule({
      imports: [InformationComponent],
      providers: [{ provide: AuthStore, useValue: { isOwner: signal(isOwner) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(InformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await create(true);
    expect(component).toBeTruthy();
  });

  it('shows the owner every section', async () => {
    await create(true);
    const sections = (component as any).userNavbarInfo().map((s: { id: string }) => s.id);
    expect(sections).toEqual(['documents', 'schedule', 'health', 'activity']);
  });

  it('shows anyone else only the nutrition section', async () => {
    await create(false);
    const sections = (component as any).userNavbarInfo().map((s: { id: string }) => s.id);
    expect(sections).toEqual(['health']);
  });
});
