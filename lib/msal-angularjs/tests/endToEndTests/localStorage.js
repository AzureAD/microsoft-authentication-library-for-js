var _this;
class LocalStorage {

    constructor() {
        _this = this;
    }

    getValue(key) {
        return browser.executeScript("return window.localStorage.getItem('" + key + "');");
    };

    setValue(key, value) {
        return browser.executeScript("return window.localStorage.setItem('" + key + "','" + value + "');");
    };

    removeValue(key, value) {
        return browser.executeScript("return window.localStorage.removeItem('" + key + "');");
    };

    get() {
        return browser.executeScript("return window.localStorage;");
    };

    keys() {
        return browser.executeScript("return Object.keys(localStorage);");
    }; 

    clear() {
        return browser.executeScript("return window.localStorage.clear();");
    };

    changed(key, oldValue) {
        return function () {
            return browser.executeScript("return localStorage.getItem('" + key + "');").then(function (newValue) {
                return oldValue !== newValue;
            });
        };
    };
};

module.exports = new LocalStorage();