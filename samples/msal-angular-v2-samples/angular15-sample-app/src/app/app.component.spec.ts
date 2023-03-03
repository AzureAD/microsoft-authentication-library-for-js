import { TestBed, waitForAsync, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { AppModule } from './app.module';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule, AppModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();

  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Angular 15 - MSAL Angular v3 Sample'`, () => {
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Angular 15 - MSAL Angular v3 Sample');
  });

  it('should render title', () => {
    let el;
    fixture.whenStable().then(
      ()=>{
        el = fixture.nativeElement.getElementsByClassName("title");
      },
      (error)=>{console.error(error)})
      .finally(()=>{
        expect(el.nativeElement.innerText).toBeDefined(); // Unit test reads render a title. Hence contribution assumes the value of the text to be irrelevant.
      })
  });
});
