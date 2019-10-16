/*! msal-common v0.0.1 2019-10-16 */
'use strict';
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.Msal = {}));
}(this, function (exports) { 'use strict';

	var greet = function () { return console.log("Hello, world!"); };

	exports.greet = greet;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
