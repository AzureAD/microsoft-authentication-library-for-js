module.exports = {

    getValue: function (key) {
        return browser.executeScript("return window.localStorage.getItem('" + key + "');");
    },

    setValue: function (key, value) {
        return browser.executeScript("return window.localStorage.setItem('" + key + "','" + value + "');");
    },

    removeValue: function (key, value) {
        return browser.executeScript("return window.localStorage.removeItem('" + key + "');");
    },

    getStorage: function () {
        return browser.executeScript("return window.localStorage;");
    },

    getAllkeys: function () {
        return browser.executeScript("return Object.keys(localStorage);");
    },

    clearStorage: function () {
        return browser.executeScript("return window.localStorage.clear();");
    },

    changed: function (key, oldValue) {
        return function () {
            return browser.executeScript("return localStorage.getItem('" + key + "');").then(function (newValue) {
                return oldValue !== newValue;
            });
        };
    }
};
