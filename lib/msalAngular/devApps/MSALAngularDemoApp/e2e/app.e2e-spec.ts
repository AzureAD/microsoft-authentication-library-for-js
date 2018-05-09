import { StartPage } from './app.po';

describe('start App', function() {
  let page: StartPage;

  beforeEach(() => {
    page = new StartPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
