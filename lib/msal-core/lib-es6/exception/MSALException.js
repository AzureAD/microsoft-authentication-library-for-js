import * as tslib_1 from "tslib";
var MSALException = /** @class */ (function (_super) {
    tslib_1.__extends(MSALException, _super);
    function MSALException(errorCode, errorMessage) {
        var _this = _super.call(this) || this;
        _this._errorCode = errorCode;
        _this._errorMessage = errorMessage;
        return _this;
    }
    Object.defineProperty(MSALException.prototype, "errorCode", {
        get: function () {
            return this._errorCode ? this._errorCode : "";
        },
        set: function (errorCode) {
            this._errorCode = errorCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MSALException.prototype, "errorMessage", {
        get: function () {
            return this._errorMessage ? this._errorMessage : "";
        },
        set: function (errorMessage) {
            this._errorMessage = errorMessage;
        },
        enumerable: true,
        configurable: true
    });
    return MSALException;
}(Error));
export { MSALException };
//# sourceMappingURL=MSALException.js.map