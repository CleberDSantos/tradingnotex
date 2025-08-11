import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Partials } from './partials';

describe('Partials', () => {
  let component: Partials;
  let fixture: ComponentFixture<Partials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Partials]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Partials);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
