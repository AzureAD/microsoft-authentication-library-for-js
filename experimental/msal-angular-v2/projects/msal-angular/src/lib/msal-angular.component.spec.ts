import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MsalAngularComponent } from './msal-angular.component';

describe('MsalAngularComponent', () => {
  let component: MsalAngularComponent;
  let fixture: ComponentFixture<MsalAngularComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MsalAngularComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MsalAngularComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
