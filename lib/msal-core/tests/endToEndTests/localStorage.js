var _this;
class LocalStorage {

    constructor(driver) {
        _this = this;
        _this.driver = driver;
    }

    getValue(key) {
        return _this.driver.executeScript("return window.localStorage.getItem('" + key + "');");
    };

    setValue(key, value) {
        return _this.driver.executeScript("return window.localStorage.setItem('" + key + "','" + value + "');");
    };

    removeValue(key, value) {
        return _this.driver.executeScript("return window.localStorage.removeItem('" + key + "');");
    };

    get() {
        return _this.driver.executeScript("return window.localStorage;");
    };

    keys() {
        return _this.driver.executeScript("return Object.keys(localStorage);");
    }; 

    clear() {
        return _this.driver.executeScript("return window.localStorage.clear();");
    };

    changed(key, oldValue) {
        return function () {
            return _this.driver.executeScript("return localStorage.getItem('" + key + "');").then(function (newValue) {
                return oldValue !== newValue;
            });
        };
    };

    setDriver(driver) {
        _this.driver = driver;
    }
};

module.exports = new LocalStorage();