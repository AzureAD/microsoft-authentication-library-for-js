"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var MSALException_1 = require("./MSALException");
var MSALClientException = /** @class */ (function (_super) {
    tslib_1.__extends(MSALClientException, _super);
    function MSALClientException(errorCode, errorMessage) {
        return _super.call(this, errorCode, errorMessage) || this;
    }
    return MSALClientException;
}(MSALException_1.MSALException));
exports.MSALClientException = MSALClientException;
//# sourceMappingURL=MSALClientException.js.map