describe('Google\'s Search Functionality', function() {
  it('can find search results', function() {
    browser.driver.get('https://google.com/ncr').then(function() {
      browser.driver.findElement(by.name('q')).sendKeys('BrowserStack\n').then(function() {
        expect(browser.driver.getTitle()).toEqual('BrowserStack - Google Search');
      });
    });
  });
});
