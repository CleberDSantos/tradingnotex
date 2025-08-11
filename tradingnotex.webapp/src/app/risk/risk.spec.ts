import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Risk } from './risk';

describe('Risk', () => {
  let component: Risk;
  let fixture: ComponentFixture<Risk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Risk]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Risk);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
