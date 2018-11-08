var webdriver = require('selenium-webdriver');
var until = webdriver.until;

module.exports = {

    login: async function(driver, userName, password) {
        var nextBtn = await driver.findElement(webdriver.By.id('idSIButton9'));
        var usernameInput = await driver.findElement(webdriver.By.id('i0116'));

        await usernameInput.sendKeys(userName);
        await nextBtn.click();
        await driver.sleep(1000);

        await driver.wait(until.elementLocated(webdriver.By.id('idSIButton9')), 5000);
        await driver.wait(until.elementLocated(webdriver.By.id('i0118')), 5000);
        var submitBtn = await driver.findElement(webdriver.By.id('idSIButton9'));
        var passwordInput = await driver.findElement(webdriver.By.id('i0118'));
        await passwordInput.sendKeys(password);
        await submitBtn.click();
        await driver.sleep(1000);
    },

    logout: async function(driver) {
        var signOutBtn = await driver.findElement(webdriver.By.css('.table')).click();
    },

}