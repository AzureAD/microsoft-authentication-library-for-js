/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 103:
/***/ ((__unused_webpack_module, exports) => {

/*! js-yaml 5.4.2 https://github.com/nodeca/js-yaml @license MIT */
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/tag.ts
/**
* Returned by a scalar resolver when the source does not match its tag.
*
* @category Tags
*/
var NOT_RESOLVED = Symbol("NOT_RESOLVED");
/**
* Create a normalized scalar tag definition.
*
* @category Tags
*/
function defineScalarTag(tagName, options) {
	var _options$implicit, _options$matchByTagPr, _options$implicitFirs, _options$represent, _options$representTag;
	return {
		tagName,
		nodeKind: "scalar",
		implicit: (_options$implicit = options.implicit) !== null && _options$implicit !== void 0 ? _options$implicit : false,
		matchByTagPrefix: (_options$matchByTagPr = options.matchByTagPrefix) !== null && _options$matchByTagPr !== void 0 ? _options$matchByTagPr : false,
		implicitFirstChars: (_options$implicitFirs = options.implicitFirstChars) !== null && _options$implicitFirs !== void 0 ? _options$implicitFirs : null,
		resolve: options.resolve,
		identify: options.identify,
		represent: (_options$represent = options.represent) !== null && _options$represent !== void 0 ? _options$represent : ((data) => String(data)),
		representTagName: (_options$representTag = options.representTagName) !== null && _options$representTag !== void 0 ? _options$representTag : (() => tagName)
	};
}
/**
* Create a normalized sequence tag definition.
*
* @category Tags
*/
function defineSequenceTag(tagName, options) {
	var _options$matchByTagPr2, _options$finalize, _options$represent2, _options$representTag2;
	const carrierIsResult = options.finalize === void 0;
	return {
		tagName,
		nodeKind: "sequence",
		implicit: false,
		matchByTagPrefix: (_options$matchByTagPr2 = options.matchByTagPrefix) !== null && _options$matchByTagPr2 !== void 0 ? _options$matchByTagPr2 : false,
		create: options.create,
		addItem: options.addItem,
		finalize: (_options$finalize = options.finalize) !== null && _options$finalize !== void 0 ? _options$finalize : ((carrier) => carrier),
		carrierIsResult,
		identify: options.identify,
		represent: (_options$represent2 = options.represent) !== null && _options$represent2 !== void 0 ? _options$represent2 : ((data) => data),
		representTagName: (_options$representTag2 = options.representTagName) !== null && _options$representTag2 !== void 0 ? _options$representTag2 : (() => tagName)
	};
}
/**
* Create a normalized mapping tag definition.
*
* @category Tags
*/
function defineMappingTag(tagName, options) {
	var _options$matchByTagPr3, _options$finalize2, _options$represent3, _options$representTag3;
	const carrierIsResult = options.finalize === void 0;
	return {
		tagName,
		nodeKind: "mapping",
		implicit: false,
		matchByTagPrefix: (_options$matchByTagPr3 = options.matchByTagPrefix) !== null && _options$matchByTagPr3 !== void 0 ? _options$matchByTagPr3 : false,
		create: options.create,
		addPair: options.addPair,
		has: options.has,
		keys: options.keys,
		get: options.get,
		finalize: (_options$finalize2 = options.finalize) !== null && _options$finalize2 !== void 0 ? _options$finalize2 : ((carrier) => carrier),
		carrierIsResult,
		identify: options.identify,
		represent: (_options$represent3 = options.represent) !== null && _options$represent3 !== void 0 ? _options$represent3 : ((data) => data),
		representTagName: (_options$representTag3 = options.representTagName) !== null && _options$representTag3 !== void 0 ? _options$representTag3 : (() => tagName)
	};
}
//#endregion
//#region src/tag/scalar/str.ts
/** @category Tags */
var strTag = defineScalarTag("tag:yaml.org,2002:str", {
	resolve: (source) => source,
	identify: (data) => typeof data === "string"
});
//#endregion
//#region src/tag/scalar/null_core.ts
var NULL_VALUES$1 = [
	"",
	"~",
	"null",
	"Null",
	"NULL"
];
/** @category Tags */
var nullCoreTag = defineScalarTag("tag:yaml.org,2002:null", {
	implicit: true,
	implicitFirstChars: [
		"",
		"~",
		"n",
		"N"
	],
	resolve: (source) => {
		if (NULL_VALUES$1.indexOf(source) !== -1) return null;
		return NOT_RESOLVED;
	},
	identify: (object) => object === null,
	represent: () => "null"
});
//#endregion
//#region src/tag/scalar/null_json.ts
/** @category Tags */
var nullJsonTag = defineScalarTag("tag:yaml.org,2002:null", {
	implicit: true,
	implicitFirstChars: ["n"],
	resolve: (source, isExplicit) => {
		if (source === "null" || isExplicit && source === "") return null;
		return NOT_RESOLVED;
	},
	identify: (object) => object === null,
	represent: () => "null"
});
//#endregion
//#region src/tag/scalar/null_yaml11.ts
var NULL_VALUES = [
	"",
	"~",
	"null",
	"Null",
	"NULL"
];
/** @category Tags */
var nullYaml11Tag = defineScalarTag("tag:yaml.org,2002:null", {
	implicit: true,
	implicitFirstChars: [
		"",
		"~",
		"n",
		"N"
	],
	resolve: (source) => {
		if (NULL_VALUES.indexOf(source) !== -1) return null;
		return NOT_RESOLVED;
	},
	identify: (object) => object === null,
	represent: () => "null"
});
//#endregion
//#region src/tag/scalar/bool_core.ts
var TRUE_VALUES$2 = [
	"true",
	"True",
	"TRUE"
];
var FALSE_VALUES$2 = [
	"false",
	"False",
	"FALSE"
];
/** @category Tags */
var boolCoreTag = defineScalarTag("tag:yaml.org,2002:bool", {
	implicit: true,
	implicitFirstChars: [
		"t",
		"T",
		"f",
		"F"
	],
	resolve: (source) => {
		if (TRUE_VALUES$2.indexOf(source) !== -1) return true;
		if (FALSE_VALUES$2.indexOf(source) !== -1) return false;
		return NOT_RESOLVED;
	},
	identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
	represent: (object) => object ? "true" : "false"
});
//#endregion
//#region src/tag/scalar/bool_json.ts
var TRUE_VALUES$1 = ["true"];
var FALSE_VALUES$1 = ["false"];
/** @category Tags */
var boolJsonTag = defineScalarTag("tag:yaml.org,2002:bool", {
	implicit: true,
	implicitFirstChars: ["t", "f"],
	resolve: (source) => {
		if (TRUE_VALUES$1.indexOf(source) !== -1) return true;
		if (FALSE_VALUES$1.indexOf(source) !== -1) return false;
		return NOT_RESOLVED;
	},
	identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
	represent: (object) => object ? "true" : "false"
});
//#endregion
//#region src/tag/scalar/bool_yaml11.ts
var TRUE_VALUES = [
	"true",
	"True",
	"TRUE",
	"y",
	"Y",
	"yes",
	"Yes",
	"YES",
	"on",
	"On",
	"ON"
];
var FALSE_VALUES = [
	"false",
	"False",
	"FALSE",
	"n",
	"N",
	"no",
	"No",
	"NO",
	"off",
	"Off",
	"OFF"
];
/** @category Tags */
var boolYaml11Tag = defineScalarTag("tag:yaml.org,2002:bool", {
	implicit: true,
	implicitFirstChars: [
		"y",
		"Y",
		"n",
		"N",
		"t",
		"T",
		"f",
		"F",
		"o",
		"O"
	],
	resolve: (source) => {
		if (TRUE_VALUES.indexOf(source) !== -1) return true;
		if (FALSE_VALUES.indexOf(source) !== -1) return false;
		return NOT_RESOLVED;
	},
	identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
	represent: (object) => object ? "true" : "false"
});
//#endregion
//#region src/tag/scalar/int_core.ts
var YAML_INTEGER_IMPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:0o[0-7]+|0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
var YAML_INTEGER_EXPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$2(source) {
	let value = source;
	let sign = 1;
	if (value[0] === "-" || value[0] === "+") {
		if (value[0] === "-") sign = -1;
		value = value.slice(1);
	}
	if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
	if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
	if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
	return sign * parseInt(value, 10);
}
function resolveYamlInteger$2(source, isExplicit) {
	if (isExplicit) {
		if (!YAML_INTEGER_EXPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
	} else if (!YAML_INTEGER_IMPLICIT_PATTERN$1.test(source)) return NOT_RESOLVED;
	const result = parseYamlInteger$2(source);
	return Number.isFinite(result) ? result : NOT_RESOLVED;
}
/** @category Tags */
var intCoreTag = defineScalarTag("tag:yaml.org,2002:int", {
	implicit: true,
	implicitFirstChars: [
		"-",
		"+",
		..."0123456789"
	],
	resolve: resolveYamlInteger$2,
	identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
	represent: (object) => object.toString(10)
});
//#endregion
//#region src/tag/scalar/int_json.ts
var YAML_INTEGER_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)$");
var YAML_INTEGER_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
function parseYamlInteger$1(source) {
	let value = source;
	let sign = 1;
	if (value[0] === "-" || value[0] === "+") {
		if (value[0] === "-") sign = -1;
		value = value.slice(1);
	}
	if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
	if (value.startsWith("0o")) return sign * parseInt(value.slice(2), 8);
	if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
	return sign * parseInt(value, 10);
}
function resolveYamlInteger$1(source, isExplicit) {
	if (isExplicit) {
		if (!YAML_INTEGER_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
	} else if (!YAML_INTEGER_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
	const result = parseYamlInteger$1(source);
	return Number.isFinite(result) ? result : NOT_RESOLVED;
}
/** @category Tags */
var intJsonTag = defineScalarTag("tag:yaml.org,2002:int", {
	implicit: true,
	implicitFirstChars: ["-", ..."0123456789"],
	resolve: resolveYamlInteger$1,
	identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
	represent: (object) => object.toString(10)
});
//#endregion
//#region src/tag/scalar/int_yaml11.ts
var YAML_INTEGER_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1_]+|[-+]?0[0-7_]+|[-+]?0x[0-9a-fA-F_]+|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+|[-+]?(?:0|[1-9][0-9_]*))$");
function parseYamlInteger(source) {
	let value = source.replace(/_/g, "");
	let sign = 1;
	if (value[0] === "-" || value[0] === "+") {
		if (value[0] === "-") sign = -1;
		value = value.slice(1);
	}
	if (value.startsWith("0b")) return sign * parseInt(value.slice(2), 2);
	if (value.startsWith("0x")) return sign * parseInt(value.slice(2), 16);
	if (value.includes(":")) {
		let result = 0;
		for (const part of value.split(":")) result = result * 60 + Number(part);
		return sign * result;
	}
	if (value !== "0" && value[0] === "0") return sign * parseInt(value, 8);
	return sign * parseInt(value, 10);
}
function resolveYamlInteger(source) {
	if (!YAML_INTEGER_PATTERN.test(source)) return NOT_RESOLVED;
	const result = parseYamlInteger(source);
	return Number.isFinite(result) ? result : NOT_RESOLVED;
}
/** @category Tags */
var intYaml11Tag = defineScalarTag("tag:yaml.org,2002:int", {
	implicit: true,
	implicitFirstChars: [
		"-",
		"+",
		..."0123456789"
	],
	resolve: resolveYamlInteger,
	identify: (object) => Number.isInteger(object) && !Object.is(object, -0) && object.toString(10).indexOf("e") < 0,
	represent: (object) => object.toString(10)
});
//#endregion
//#region src/tag/scalar/float_core.ts
var YAML_FLOAT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$2(source) {
	if (!YAML_FLOAT_PATTERN$1.test(source)) return NOT_RESOLVED;
	let value = source.toLowerCase();
	const sign = value[0] === "-" ? -1 : 1;
	if ("+-".includes(value[0])) value = value.slice(1);
	if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	if (value === ".nan") return NaN;
	const result = sign * parseFloat(value);
	if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN$1.test(source)) return result;
	return NOT_RESOLVED;
}
function representYamlFloat$2(object) {
	if (isNaN(object)) return ".nan";
	if (object === Number.POSITIVE_INFINITY) return ".inf";
	if (object === Number.NEGATIVE_INFINITY) return "-.inf";
	if (Object.is(object, -0)) return "-0.0";
	const result = object.toString(10);
	return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
/** @category Tags */
var floatCoreTag = defineScalarTag("tag:yaml.org,2002:float", {
	implicit: true,
	implicitFirstChars: [
		"-",
		"+",
		".",
		..."0123456789"
	],
	resolve: resolveYamlFloat$2,
	identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
	represent: representYamlFloat$2
});
//#endregion
//#region src/tag/scalar/float_json.ts
var YAML_FLOAT_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$");
var YAML_FLOAT_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat$1(source, isExplicit) {
	if (isExplicit) {
		if (!YAML_FLOAT_EXPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
		let value = source.toLowerCase();
		const sign = value[0] === "-" ? -1 : 1;
		if ("+-".includes(value[0])) value = value.slice(1);
		if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
		if (value === ".nan") return NaN;
		const result = sign * parseFloat(value);
		return Number.isFinite(result) ? result : NOT_RESOLVED;
	}
	if (!YAML_FLOAT_IMPLICIT_PATTERN.test(source)) return NOT_RESOLVED;
	const result = Number(source);
	if (Number.isFinite(result)) return result;
	return NOT_RESOLVED;
}
function representYamlFloat$1(object) {
	if (isNaN(object)) return ".nan";
	if (object === Number.POSITIVE_INFINITY) return ".inf";
	if (object === Number.NEGATIVE_INFINITY) return "-.inf";
	if (Object.is(object, -0)) return "-0.0";
	const result = object.toString(10);
	return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
/** @category Tags */
var floatJsonTag = defineScalarTag("tag:yaml.org,2002:float", {
	implicit: true,
	implicitFirstChars: ["-", ..."0123456789"],
	resolve: resolveYamlFloat$1,
	identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
	represent: representYamlFloat$1
});
//#endregion
//#region src/tag/scalar/float_yaml11.ts
var YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:(?:[0-9][0-9_]*)?\\.[0-9_]*)(?:[eE][-+][0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
var YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
function resolveYamlFloat(source) {
	if (!YAML_FLOAT_PATTERN.test(source)) return NOT_RESOLVED;
	let value = source.toLowerCase().replace(/_/g, "");
	const sign = value[0] === "-" ? -1 : 1;
	if ("+-".includes(value[0])) value = value.slice(1);
	if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	if (value === ".nan") return NaN;
	let result = 0;
	if (value.includes(":")) {
		for (const part of value.split(":")) result = result * 60 + Number(part);
		result *= sign;
	} else result = sign * parseFloat(value);
	if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN.test(source)) return result;
	return NOT_RESOLVED;
}
function representYamlFloat(object) {
	if (isNaN(object)) return ".nan";
	if (object === Number.POSITIVE_INFINITY) return ".inf";
	if (object === Number.NEGATIVE_INFINITY) return "-.inf";
	if (Object.is(object, -0)) return "-0.0";
	const result = object.toString(10);
	return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
/** @category Tags */
var floatYaml11Tag = defineScalarTag("tag:yaml.org,2002:float", {
	implicit: true,
	implicitFirstChars: [
		"-",
		"+",
		".",
		..."0123456789"
	],
	resolve: resolveYamlFloat,
	identify: (object) => typeof object === "number" && (!Number.isInteger(object) || Object.is(object, -0) || object.toString(10).indexOf("e") >= 0),
	represent: representYamlFloat
});
//#endregion
//#region src/tag/scalar/merge.ts
/**
* Enables merge keys in {@link CORE_SCHEMA} when added with
* {@link Schema.withTags}.
*
* @category Tags
*/
var mergeTag = defineScalarTag("tag:yaml.org,2002:merge", {
	implicit: true,
	implicitFirstChars: ["<"],
	resolve: (source, isExplicit) => {
		if (source === "<<" || isExplicit && source === "") return "<<";
		return NOT_RESOLVED;
	},
	identify: () => false
});
//#endregion
//#region src/tag/scalar/binary.ts
var BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
function resolveYamlBinary(source) {
	const input = source.replace(/\s/g, "");
	if (input.length % 4 !== 0 || !BASE64_PATTERN.test(input)) return NOT_RESOLVED;
	const binary = atob(input);
	const result = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) result[index] = binary.charCodeAt(index);
	return result;
}
function representYamlBinary(object) {
	let binary = "";
	for (let index = 0; index < object.length; index++) binary += String.fromCharCode(object[index]);
	return btoa(binary);
}
/**
* The `!!binary` tag, represented as a `Uint8Array`.
*
* @category Tags
*/
var binaryTag = defineScalarTag("tag:yaml.org,2002:binary", {
	resolve: resolveYamlBinary,
	identify: (object) => Object.prototype.toString.call(object) === "[object Uint8Array]",
	represent: representYamlBinary
});
//#endregion
//#region src/tag/scalar/timestamp.ts
var YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
var YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
function makeUtcDate(year, month, day, hour = 0, minute = 0, second = 0, fraction = 0) {
	const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
	date.setUTCFullYear(year, month, day);
	return date;
}
function resolveYamlTimestamp(source) {
	let match = YAML_DATE_REGEXP.exec(source);
	if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(source);
	if (match === null) return NOT_RESOLVED;
	const year = +match[1];
	const month = +match[2] - 1;
	const day = +match[3];
	if (!match[4]) {
		const date = makeUtcDate(year, month, day);
		if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return NOT_RESOLVED;
		return date;
	}
	const hour = +match[4];
	const minute = +match[5];
	const second = +match[6];
	let fraction = 0;
	if (hour > 23 || minute > 59 || second > 59) return NOT_RESOLVED;
	if (match[7]) {
		let value = match[7].slice(0, 3);
		while (value.length < 3) value += "0";
		fraction = +value;
	}
	const date = makeUtcDate(year, month, day, hour, minute, second, fraction);
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return NOT_RESOLVED;
	if (match[9]) {
		const offsetHour = +match[10];
		const offsetMinute = +(match[11] || 0);
		if (offsetHour > 23 || offsetMinute > 59) return NOT_RESOLVED;
		const offset = (offsetHour * 60 + offsetMinute) * 6e4;
		date.setTime(date.getTime() - (match[9] === "-" ? -offset : offset));
	}
	return date;
}
/**
* The YAML 1.1 `!!timestamp` tag, represented as a JavaScript `Date`.
*
* @category Tags
*/
var timestampTag = defineScalarTag("tag:yaml.org,2002:timestamp", {
	implicit: true,
	implicitFirstChars: [..."0123456789"],
	resolve: resolveYamlTimestamp,
	identify: (object) => object instanceof Date,
	represent: (object) => object.toISOString()
});
//#endregion
//#region src/tag/sequence/seq.ts
/** @category Tags */
var seqTag = defineSequenceTag("tag:yaml.org,2002:seq", {
	create: () => [],
	addItem: (container, item) => {
		container.push(item);
	},
	identify: Array.isArray
});
//#endregion
//#region src/common/object.ts
function isPlainObject(data) {
	if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
	const prototype = Object.getPrototypeOf(data);
	return prototype === null || prototype === Object.prototype;
}
function pick(object, keys) {
	const result = {};
	for (const key of keys) if (object[key] !== void 0) result[key] = object[key];
	return result;
}
//#endregion
//#region src/tag/sequence/omap.ts
/**
* Provided only for YAML 1.1 compatibility and supported by the loader only.
* JavaScript has no dedicated class to represent this type, so it cannot be
* identified and dumped.
*
* ```yaml
* !!omap
*   - one: 1
*   - two: 2
* ```
*
* is loaded as
*
* ```javascript
* [
*   { one: 1 },
*   { two: 2 }
* ]
* ```
*
* @category Tags
*/
var omapTag = defineSequenceTag("tag:yaml.org,2002:omap", {
	create: () => ({
		list: [],
		seen: /* @__PURE__ */ new Set()
	}),
	addItem: (carrier, item) => {
		let key;
		if (item instanceof Map) {
			if (item.size !== 1) return "cannot resolve an ordered map item";
			key = item.keys().next().value;
		} else if (isPlainObject(item)) {
			const itemKeys = Object.keys(item);
			if (itemKeys.length !== 1) return "cannot resolve an ordered map item";
			key = itemKeys[0];
		} else return "cannot resolve an ordered map item";
		if (carrier.seen.has(key)) return "duplicate key in ordered map";
		carrier.seen.add(key);
		carrier.list.push(item);
		return "";
	},
	finalize: (carrier) => carrier.list,
	identify: () => false
});
//#endregion
//#region src/tag/sequence/pairs.ts
/**
* Provided only for YAML 1.1 compatibility and supported by the loader only.
* JavaScript has no dedicated class to represent this type, so it cannot be
* identified and dumped.
*
* ```yaml
* !!pairs
*   - one: 1
*   - two: 2
* ```
*
* is loaded as
*
* ```javascript
* [
*   ['one', 1],
*   ['two', 2]
* ]
* ```
*
* @category Tags
*/
var pairsTag = defineSequenceTag("tag:yaml.org,2002:pairs", {
	create: () => [],
	addItem: (container, item) => {
		if (item instanceof Map) {
			if (item.size !== 1) return "cannot resolve a pairs item";
			container.push(item.entries().next().value);
			return "";
		}
		if (Object.prototype.toString.call(item) !== "[object Object]") return "cannot resolve a pairs item";
		const object = item;
		const keys = Object.keys(object);
		if (keys.length !== 1) return "cannot resolve a pairs item";
		container.push([keys[0], object[keys[0]]]);
		return "";
	},
	identify: () => false
});
//#endregion
//#region src/tag/mapping/map.ts
/**
* This is the default mapping implementation. It uses `{}` objects and has only
* partial functionality due to language limitations. This choice was made
* because users expect to get JavaScript objects, and it was left unchanged to
* avoid too many breaking changes in the v5 release.
*
* Side effects:
*
* - `Object.hasOwn()` checks or `for...of` loops are required for safe use (to
*   avoid falling through to prototypes).
* - Only scalar string keys are supported properly.
* - Other scalar keys, such as `null` and numbers, are converted to strings.
*   This is historical behaviour, and it can cause side effects such as
*   problems with `!!merge`.
*
* Note that non-string scalar keys may be deprecated in future versions.
*
* Ideally, use {@link realMapTag} instead.
*
* @category Tags
*/
var mapTag = defineMappingTag("tag:yaml.org,2002:map", {
	create: () => ({}),
	identify: isPlainObject,
	represent: (o) => {
		const map = /* @__PURE__ */ new Map();
		for (const key of Object.keys(o)) map.set(key, o[key]);
		return map;
	},
	addPair: (container, key, value) => {
		if (key !== null && typeof key === "object") return "object-based map does not support complex keys";
		const normalizedKey = String(key);
		if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else container[normalizedKey] = value;
		return "";
	},
	has: (container, key) => {
		if (key !== null && typeof key === "object") return false;
		return Object.prototype.hasOwnProperty.call(container, String(key));
	},
	keys: (container) => Object.keys(container),
	get: (container, key) => {
		const normalizedKey = String(key);
		if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
		return container[normalizedKey];
	}
});
//#endregion
//#region src/tag/mapping/set.ts
/**
* The YAML 1.1 `!!set` tag, represented as a JavaScript `Set`.
*
* @category Tags
*/
var setTag = defineMappingTag("tag:yaml.org,2002:set", {
	create: () => /* @__PURE__ */ new Set(),
	identify: (data) => data instanceof Set,
	represent: (data) => {
		const map = /* @__PURE__ */ new Map();
		for (const key of data) map.set(key, null);
		return map;
	},
	addPair: (container, key, value) => {
		if (value !== null) return "cannot resolve a set item";
		container.add(key);
		return "";
	},
	has: (container, key) => container.has(key),
	keys: (container) => container.keys(),
	get: () => null
});
//#endregion
//#region \0@oxc-project+runtime@0.137.0/helpers/esm/typeof.js
function _typeof(o) {
	"@babel/helpers - typeof";
	return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
		return typeof o;
	} : function(o) {
		return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
	}, _typeof(o);
}
//#endregion
//#region \0@oxc-project+runtime@0.137.0/helpers/esm/toPrimitive.js
function toPrimitive(t, r) {
	if ("object" != _typeof(t) || !t) return t;
	var e = t[Symbol.toPrimitive];
	if (void 0 !== e) {
		var i = e.call(t, r || "default");
		if ("object" != _typeof(i)) return i;
		throw new TypeError("@@toPrimitive must return a primitive value.");
	}
	return ("string" === r ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.137.0/helpers/esm/toPropertyKey.js
function toPropertyKey(t) {
	var i = toPrimitive(t, "string");
	return "symbol" == _typeof(i) ? i : i + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.137.0/helpers/esm/defineProperty.js
function _defineProperty(e, r, t) {
	return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
		value: t,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[r] = t, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.137.0/helpers/esm/objectSpread2.js
function ownKeys(e, r) {
	var t = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var o = Object.getOwnPropertySymbols(e);
		r && (o = o.filter(function(r) {
			return Object.getOwnPropertyDescriptor(e, r).enumerable;
		})), t.push.apply(t, o);
	}
	return t;
}
function _objectSpread2(e) {
	for (var r = 1; r < arguments.length; r++) {
		var t = null != arguments[r] ? arguments[r] : {};
		r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
			_defineProperty(e, r, t[r]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
			Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}
	return e;
}
//#endregion
//#region src/schema.ts
function createTagDefinitionMap() {
	return {
		scalar: Object.create(null),
		sequence: Object.create(null),
		mapping: Object.create(null)
	};
}
function createTagDefinitionListMap() {
	return {
		scalar: [],
		sequence: [],
		mapping: []
	};
}
function compileTags(tags) {
	const result = [];
	for (const tag of tags) {
		let index = result.length;
		for (let previousIndex = 0; previousIndex < result.length; previousIndex++) {
			const previous = result[previousIndex];
			if (previous.nodeKind === tag.nodeKind && previous.tagName === tag.tagName && previous.matchByTagPrefix === tag.matchByTagPrefix) {
				index = previousIndex;
				break;
			}
		}
		result[index] = tag;
	}
	return result;
}
/**
* Controls tag resolution when loading and type selection when dumping.
*
* @category Schemas
*/
var Schema = class Schema {
	constructor(tags) {
		_defineProperty(this, "tags", void 0);
		_defineProperty(
			this,
			/** @internal */
			"implicitScalarTags",
			void 0
		);
		_defineProperty(
			this,
			/**
			* Dispatch implicit scalar resolvers by `source.charAt(0)`. Each bucket holds
			* the resolvers that may match that key, in schema order; a key absent from
			* the map uses
			* {@link Schema.implicitScalarAnyFirstChar}
			* (resolvers that declared no first-char constraint, so they apply to any
			* first character).
			*/
			"implicitScalarByFirstChar",
			void 0
		);
		_defineProperty(this, "implicitScalarAnyFirstChar", void 0);
		_defineProperty(
			this,
			/**
			* The default scalar tag (`!!str`), resolved once so the composer's fallback
			* for unresolved plain scalars avoids a keyed lookup per scalar.
			*
			* @internal
			*/
			"defaultScalarTag",
			void 0
		);
		_defineProperty(
			this,
			/**
			* The default container tags (`!!seq` / `!!map`), used by the dumper: when a
			* value is identified by its default tag, the tag is implicit and not
			* printed. Undefined if the schema does not define them (then such values
			* can't be dumped).
			*
			* @internal
			*/
			"defaultSequenceTag",
			void 0
		);
		_defineProperty(
			this,
			/** @internal */
			"defaultMappingTag",
			void 0
		);
		_defineProperty(this, "exact", void 0);
		_defineProperty(this, "prefix", void 0);
		const compiledTags = compileTags(tags);
		const implicitScalarTags = [];
		const exact = createTagDefinitionMap();
		const prefix = createTagDefinitionListMap();
		for (const tag of compiledTags) {
			if (tag.nodeKind === "scalar" && tag.implicit) {
				if (tag.matchByTagPrefix) throw new Error("Implicit scalar tags cannot match by tag prefix");
				implicitScalarTags.push(tag);
			}
			switch (tag.nodeKind) {
				case "scalar":
					if (tag.matchByTagPrefix) prefix.scalar.push(tag);
					else exact.scalar[tag.tagName] = tag;
					break;
				case "sequence":
					if (tag.matchByTagPrefix) prefix.sequence.push(tag);
					else exact.sequence[tag.tagName] = tag;
					break;
				case "mapping":
					if (tag.matchByTagPrefix) prefix.mapping.push(tag);
					else exact.mapping[tag.tagName] = tag;
					break;
			}
		}
		const implicitScalarAnyFirstChar = implicitScalarTags.filter((tag) => tag.implicitFirstChars === null);
		const keys = /* @__PURE__ */ new Set();
		for (const tag of implicitScalarTags) if (tag.implicitFirstChars !== null) for (const key of tag.implicitFirstChars) keys.add(key);
		const implicitScalarByFirstChar = /* @__PURE__ */ new Map();
		for (const key of keys) implicitScalarByFirstChar.set(key, implicitScalarTags.filter((tag) => tag.implicitFirstChars === null || tag.implicitFirstChars.indexOf(key) !== -1));
		const defaultScalarTag = exact.scalar["tag:yaml.org,2002:str"];
		if (!defaultScalarTag) throw new Error("schema does not define the default scalar tag (tag:yaml.org,2002:str)");
		this.tags = compiledTags;
		this.implicitScalarTags = implicitScalarTags;
		this.implicitScalarByFirstChar = implicitScalarByFirstChar;
		this.implicitScalarAnyFirstChar = implicitScalarAnyFirstChar;
		this.defaultScalarTag = defaultScalarTag;
		this.defaultSequenceTag = exact.sequence["tag:yaml.org,2002:seq"];
		this.defaultMappingTag = exact.mapping["tag:yaml.org,2002:map"];
		this.exact = exact;
		this.prefix = prefix;
	}
	/** @internal */
	lookupScalarTag(tagName) {
		const exactTag = this.exact.scalar[tagName];
		if (exactTag) return exactTag;
		for (const tag of this.prefix.scalar) if (tagName.startsWith(tag.tagName)) return tag;
	}
	/** @internal */
	lookupSequenceTag(tagName) {
		const exactTag = this.exact.sequence[tagName];
		if (exactTag) return exactTag;
		for (const tag of this.prefix.sequence) if (tagName.startsWith(tag.tagName)) return tag;
	}
	/** @internal */
	lookupMappingTag(tagName) {
		const exactTag = this.exact.mapping[tagName];
		if (exactTag) return exactTag;
		for (const tag of this.prefix.mapping) if (tagName.startsWith(tag.tagName)) return tag;
	}
	/** @internal */
	resolveImplicitScalarTag(source) {
		var _this$implicitScalarB;
		const candidates = (_this$implicitScalarB = this.implicitScalarByFirstChar.get(source.charAt(0))) !== null && _this$implicitScalarB !== void 0 ? _this$implicitScalarB : this.implicitScalarAnyFirstChar;
		for (const tag of candidates) {
			const value = tag.resolve(source, false, tag.tagName);
			if (value !== NOT_RESOLVED) return {
				value,
				tag
			};
		}
		const tag = this.defaultScalarTag;
		return {
			value: tag.resolve(source, false, tag.tagName),
			tag
		};
	}
	/**
	* Creates a new schema with the specified tags added. If a tag already
	* exists, it is replaced by the specified tag.
	*
	* @example
	*
	* ```javascript
	* import { CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'
	*
	* const schema = CORE_SCHEMA.withTags(mergeTag, realMapTag)
	* ```
	*/
	withTags(...tags) {
		let flatTags = [];
		for (const tag of tags) flatTags = flatTags.concat(tag);
		return new Schema([...this.tags, ...flatTags]);
	}
};
/**
* The YAML 1.2 Failsafe Schema: strings, sequences, and mappings.
*
* @category Schemas
*/
var FAILSAFE_SCHEMA = new Schema([
	strTag,
	seqTag,
	mapTag
]);
/**
* The YAML 1.2 JSON Schema. It uses JSON scalar forms while retaining YAML
* collection syntax.
*
* @category Schemas
*/
var JSON_SCHEMA = new Schema([
	...FAILSAFE_SCHEMA.tags,
	nullJsonTag,
	boolJsonTag,
	intJsonTag,
	floatJsonTag
]);
/**
* The default schema for the loaders. Note, {@link CORE_SCHEMA} comes
* without the `!!merge` tag. You can easily enable it if needed.
*
* @example
* Enable {@link mergeTag}:
*
* ```javascript
* import { load, CORE_SCHEMA, mergeTag } from 'js-yaml'
*
* try {
*   load(data, { schema: CORE_SCHEMA.withTags(mergeTag) })
* } catch (e) {
*   console.error(e)
* }
* ```
*
* @category Schemas
*/
var CORE_SCHEMA = new Schema([
	...FAILSAFE_SCHEMA.tags,
	nullCoreTag,
	boolCoreTag,
	intCoreTag,
	floatCoreTag
]);
/**
* YAML 1.1-compatible schema.
*
* @category Schemas
*/
var YAML11_SCHEMA = new Schema([
	...FAILSAFE_SCHEMA.tags,
	nullYaml11Tag,
	boolYaml11Tag,
	intYaml11Tag,
	floatYaml11Tag,
	timestampTag,
	mergeTag,
	binaryTag,
	omapTag,
	pairsTag,
	setTag
]);
/**
* The dumper schema for maximum compatibility. It combines all supported type
* variants from YAML 1.1 and YAML 1.2 so strings matching any of them are
* quoted. This makes the generated YAML more compatible with other parsers.
*
* The schema is based on YAML 1.1, but extends `!!int` and `!!float` to accept
* both YAML 1.1 and Core Schema forms, since Core Schema supports some forms
* that YAML 1.1 does not.
*
* @category Schemas
*/
var DUMP_SCHEMA = YAML11_SCHEMA.withTags(_objectSpread2(_objectSpread2({}, intYaml11Tag), {}, { resolve: (source, isExplicit, tagName) => {
	const result = intYaml11Tag.resolve(source, isExplicit, tagName);
	return result === NOT_RESOLVED ? intCoreTag.resolve(source, isExplicit, tagName) : result;
} }), _objectSpread2(_objectSpread2({}, floatYaml11Tag), {}, { resolve: (source, isExplicit, tagName) => {
	const result = floatYaml11Tag.resolve(source, isExplicit, tagName);
	return result === NOT_RESOLVED ? floatCoreTag.resolve(source, isExplicit, tagName) : result;
} }));
//#endregion
//#region src/tag/mapping/real_map.ts
/**
* Recommended when non-string keys are actually needed. It uses native
* JavaScript `Map` objects, so keys keep their constructed types instead of
* being converted to strings.
*
* It is not the default to avoid widespread breaking changes in existing
* projects. `Map` has a different access API and does not pass deep equality
* checks against `{}`-based fixtures. Alongside the other changes in v5,
* making it the default was considered too disruptive.
*
* If these differences are acceptable for your project, we recommend using
* {@link realMapTag} to guarantee the absence of problems and side effects.
*
* @example
* Enable {@link realMapTag}:
*
* ```javascript
* import { load, CORE_SCHEMA, realMapTag } from 'js-yaml'
*
* try {
*   load(data, { schema: CORE_SCHEMA.withTags(realMapTag) })
* } catch (e) {
*   console.error(e)
* }
* ```
*
* @category Tags
*/
var realMapTag = defineMappingTag("tag:yaml.org,2002:map", {
	create: () => /* @__PURE__ */ new Map(),
	addPair: (container, key, value) => {
		container.set(key, value);
		return "";
	},
	has: (container, key) => container.has(key),
	keys: (container) => container.keys(),
	get: (container, key) => container.get(key),
	identify: (data) => data instanceof Map || isPlainObject(data),
	represent: (data) => {
		if (data instanceof Map) return data;
		const map = /* @__PURE__ */ new Map();
		const obj = data;
		for (const key of Object.keys(obj)) map.set(key, obj[key]);
		return map;
	}
});
//#endregion
//#region src/tag/mapping/legacy_map.ts
function normalizeKey(key) {
	if (Array.isArray(key)) {
		const array = Array.prototype.slice.call(key);
		for (let index = 0; index < array.length; index++) {
			if (Array.isArray(array[index])) return null;
			if (typeof array[index] === "object" && Object.prototype.toString.call(array[index]) === "[object Object]") array[index] = "[object Object]";
		}
		return String(array);
	}
	if (typeof key === "object" && Object.prototype.toString.call(key) === "[object Object]") return "[object Object]";
	return String(key);
}
/**
* This implementation exists solely to reproduce v4 behavior exactly. Its use
* is strongly discouraged. If complex or non-string keys are needed, use
* {@link realMapTag} instead.
*
* @category Tags
*/
var legacyMapTag = defineMappingTag("tag:yaml.org,2002:map", {
	create: () => ({}),
	identify: isPlainObject,
	represent: (o) => {
		const map = /* @__PURE__ */ new Map();
		for (const key of Object.keys(o)) map.set(key, o[key]);
		return map;
	},
	addPair: (container, key, value) => {
		const normalizedKey = normalizeKey(key);
		if (normalizedKey === null) return "nested arrays are not supported inside keys";
		if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
			value,
			enumerable: true,
			configurable: true,
			writable: true
		});
		else container[normalizedKey] = value;
		return "";
	},
	has: (container, key) => {
		const normalizedKey = normalizeKey(key);
		return normalizedKey !== null && Object.prototype.hasOwnProperty.call(container, normalizedKey);
	},
	keys: (container) => Object.keys(container),
	get: (container, key) => {
		const normalizedKey = String(key);
		if (!Object.prototype.hasOwnProperty.call(container, normalizedKey)) return null;
		return container[normalizedKey];
	}
});
//#endregion
//#region src/common/snippet.ts
var DEFAULT_SNIPPET_OPTIONS = {
	maxLength: 79,
	indent: 1,
	linesBefore: 3,
	linesAfter: 2
};
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
	let head = "";
	let tail = "";
	const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
	if (position - lineStart > maxHalfLength) {
		head = " ... ";
		lineStart = position - maxHalfLength + head.length;
	}
	if (lineEnd - position > maxHalfLength) {
		tail = " ...";
		lineEnd = position + maxHalfLength - tail.length;
	}
	return {
		str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
		pos: position - lineStart + head.length
	};
}
function padStart(string, max) {
	return " ".repeat(Math.max(max - string.length, 0)) + string;
}
function makeSnippet(mark, options) {
	if (!mark.buffer) return null;
	const opts = _objectSpread2(_objectSpread2({}, DEFAULT_SNIPPET_OPTIONS), options);
	const re = /\r?\n|\r|\0/g;
	const lineStarts = [0];
	const lineEnds = [];
	let match;
	let foundLineNo = -1;
	while (match = re.exec(mark.buffer)) {
		lineEnds.push(match.index);
		lineStarts.push(match.index + match[0].length);
		if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
	}
	if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
	let result = "";
	const lineNoLength = Math.min(mark.line + opts.linesAfter, lineEnds.length).toString().length;
	const maxLineLength = opts.maxLength - (opts.indent + lineNoLength + 3);
	for (let i = 1; i <= opts.linesBefore; i++) {
		if (foundLineNo - i < 0) break;
		const line = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
		result = `${" ".repeat(opts.indent)}${padStart((mark.line - i + 1).toString(), lineNoLength)} | ${line.str}\n${result}`;
	}
	const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
	result += `${" ".repeat(opts.indent)}${padStart((mark.line + 1).toString(), lineNoLength)} | ${line.str}\n`;
	result += `${"-".repeat(opts.indent + lineNoLength + 3 + line.pos)}^\n`;
	for (let i = 1; i <= opts.linesAfter; i++) {
		if (foundLineNo + i >= lineEnds.length) break;
		const line = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
		result += `${" ".repeat(opts.indent)}${padStart((mark.line + i + 1).toString(), lineNoLength)} | ${line.str}\n`;
	}
	return result.replace(/\n$/, "");
}
//#endregion
//#region src/common/exception.ts
function formatError(exception, compact) {
	let where = "";
	if (!exception.mark) return exception.reason;
	if (exception.mark.name) where += `in "${exception.mark.name}" `;
	where += `(${exception.mark.line + 1}:${exception.mark.column + 1})`;
	if (!compact && exception.mark.snippet) where += `\n\n${exception.mark.snippet}`;
	return `${exception.reason} ${where}`;
}
/**
* A YAML error. Unlike an ordinary `Error`, it adds a source snippet showing
* the location of the problem to the error message, when available.
*
* @category Main
*/
var YAMLException = class YAMLException extends Error {
	/**
	* Optional `mark` contains source snippet data. Usually, use
	* {@link YAMLException.throwAt} instead of passing it directly.
	*/
	constructor(reason, mark) {
		super();
		_defineProperty(this, "reason", void 0);
		_defineProperty(this, "mark", void 0);
		this.name = "YAMLException";
		this.reason = reason;
		this.mark = mark;
		this.message = formatError(this, false);
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
	}
	/**
	* Returns the formatted error, omitting the source snippet in compact mode.
	*/
	toString(compact) {
		return `${this.name}: ${formatError(this, compact)}`;
	}
	/**
	* Builds a YAMLException with a source snippet and throws it. `source` is
	* the raw input text; `position` is an offset into it.
	*/
	static throwAt(source, position, message, filename = "") {
		let line = 0;
		let lineStart = 0;
		for (let index = 0; index < position; index++) {
			const ch = source.charCodeAt(index);
			if (ch === 10) {
				line++;
				lineStart = index + 1;
			} else if (ch === 13) {
				line++;
				if (source.charCodeAt(index + 1) === 10) index++;
				lineStart = index + 1;
			}
		}
		const mark = {
			name: filename,
			buffer: source,
			position,
			line,
			column: position - lineStart
		};
		mark.snippet = makeSnippet(mark);
		throw new YAMLException(message, mark);
	}
};
//#endregion
//#region src/parser/events.ts
/** @category Events */
var EVENT_ID = {
	DOCUMENT: 1,
	SEQUENCE: 2,
	MAPPING: 3,
	SCALAR: 4,
	ALIAS: 5,
	POP: 6
};
/** @category Nodes */
var SCALAR_STYLE = {
	PLAIN: 1,
	SINGLE_QUOTED: 2,
	DOUBLE_QUOTED: 3,
	LITERAL_BLOCK: 4,
	FOLDED_BLOCK: 5
};
/** @category Nodes */
var COLLECTION_STYLE = {
	BLOCK: 1,
	FLOW: 2
};
/** @category Nodes */
var CHOMPING_MODE = {
	CLIP: 1,
	STRIP: 2,
	KEEP: 3
};
//#endregion
//#region src/parser/parser_scalar.ts
var NO_RANGE$3 = -1;
function simpleEscapeSequence(c) {
	switch (c) {
		case 48: return "\0";
		case 97: return "\x07";
		case 98: return "\b";
		case 116: return "	";
		case 9: return "	";
		case 110: return "\n";
		case 118: return "\v";
		case 102: return "\f";
		case 114: return "\r";
		case 101: return "\x1B";
		case 32: return " ";
		case 34: return "\"";
		case 47: return "/";
		case 92: return "\\";
		case 78: return "";
		case 95: return "\xA0";
		case 76: return "\u2028";
		case 80: return "\u2029";
		default: return "";
	}
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (let i = 0; i < 256; i++) {
	simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
	simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function charFromCodepoint(c) {
	if (c <= 65535) return String.fromCharCode(c);
	return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
function fromHexCode$1(c) {
	if (c >= 48 && c <= 57) return c - 48;
	return (c | 32) - 97 + 10;
}
function escapedHexLen$1(c) {
	if (c === 120) return 2;
	if (c === 117) return 4;
	return 8;
}
function skipFoldedBreaks(input, position, end) {
	let breaks = 0;
	while (position < end) {
		const ch = input.charCodeAt(position);
		if (ch === 10) {
			breaks++;
			position++;
		} else if (ch === 13) {
			breaks++;
			position++;
			if (input.charCodeAt(position) === 10) position++;
		} else if (ch === 32 || ch === 9) position++;
		else break;
	}
	return {
		position,
		breaks
	};
}
function foldedBreaks(count) {
	if (count === 1) return " ";
	return "\n".repeat(count - 1);
}
function getPlainValue(input, start, end) {
	let result = "";
	let position = start;
	let captureStart = start;
	let captureEnd = start;
	while (position < end) {
		const ch = input.charCodeAt(position);
		if (ch === 10 || ch === 13) {
			result += input.slice(captureStart, captureEnd);
			const fold = skipFoldedBreaks(input, position, end);
			result += foldedBreaks(fold.breaks);
			position = captureStart = captureEnd = fold.position;
		} else {
			position++;
			if (ch !== 32 && ch !== 9) captureEnd = position;
		}
	}
	return result + input.slice(captureStart, captureEnd);
}
function getSingleQuotedValue(input, start, end) {
	let result = "";
	let position = start;
	let captureStart = start;
	let captureEnd = start;
	while (position < end) {
		const ch = input.charCodeAt(position);
		if (ch === 39) {
			result += input.slice(captureStart, position) + "'";
			position += 2;
			captureStart = captureEnd = position;
		} else if (ch === 10 || ch === 13) {
			result += input.slice(captureStart, captureEnd);
			const fold = skipFoldedBreaks(input, position, end);
			result += foldedBreaks(fold.breaks);
			position = captureStart = captureEnd = fold.position;
		} else {
			position++;
			if (ch !== 32 && ch !== 9) captureEnd = position;
		}
	}
	return result + input.slice(captureStart, end);
}
function getDoubleQuotedValue(input, start, end) {
	let result = "";
	let position = start;
	let captureStart = start;
	let captureEnd = start;
	while (position < end) {
		const ch = input.charCodeAt(position);
		if (ch === 92) {
			result += input.slice(captureStart, position);
			position++;
			const escaped = input.charCodeAt(position);
			if (escaped === 10 || escaped === 13) position = skipFoldedBreaks(input, position, end).position;
			else if (escaped < 256 && simpleEscapeCheck[escaped]) {
				result += simpleEscapeMap[escaped];
				position++;
			} else {
				let hexLength = escapedHexLen$1(escaped);
				let hexResult = 0;
				for (; hexLength > 0; hexLength--) {
					position++;
					const digit = fromHexCode$1(input.charCodeAt(position));
					hexResult = (hexResult << 4) + digit;
				}
				result += charFromCodepoint(hexResult);
				position++;
			}
			captureStart = captureEnd = position;
		} else if (ch === 10 || ch === 13) {
			result += input.slice(captureStart, captureEnd);
			const fold = skipFoldedBreaks(input, position, end);
			result += foldedBreaks(fold.breaks);
			position = captureStart = captureEnd = fold.position;
		} else {
			position++;
			if (ch !== 32 && ch !== 9) captureEnd = position;
		}
	}
	return result + input.slice(captureStart, end);
}
function getBlockValue(input, start, end, indent, chomping, folded) {
	const textIndent = indent < 0 ? 0 : indent;
	const region = input.slice(start, end).replace(/\r\n?/g, "\n");
	const lines = region === "" ? [] : (region.endsWith("\n") ? region.slice(0, -1) : region).split("\n");
	let result = "";
	let didReadContent = false;
	let emptyLines = 0;
	let atMoreIndented = false;
	for (const line of lines) {
		let column = 0;
		while (column < textIndent && line.charCodeAt(column) === 32) column++;
		if (indent < 0 || column >= line.length) {
			emptyLines++;
			continue;
		}
		const content = line.slice(textIndent);
		const first = content.charCodeAt(0);
		if (folded) if (first === 32 || first === 9) {
			atMoreIndented = true;
			result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
		} else if (atMoreIndented) {
			atMoreIndented = false;
			result += "\n".repeat(emptyLines + 1);
		} else if (emptyLines === 0) {
			if (didReadContent) result += " ";
		} else result += "\n".repeat(emptyLines);
		else result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
		result += content;
		didReadContent = true;
		emptyLines = 0;
	}
	if (chomping === CHOMPING_MODE.KEEP) result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
	else if (chomping !== CHOMPING_MODE.STRIP) {
		if (didReadContent) result += "\n";
	}
	return result;
}
/**
* Decodes the scalar referenced by event offsets in `input`.
*
* @category Events
*/
function getScalarValue(input, scalar) {
	if (scalar.valueStart === NO_RANGE$3) return "";
	const { valueStart, valueEnd } = scalar;
	if (scalar.fast) return input.slice(valueStart, valueEnd);
	switch (scalar.style) {
		case SCALAR_STYLE.SINGLE_QUOTED: return getSingleQuotedValue(input, valueStart, valueEnd);
		case SCALAR_STYLE.DOUBLE_QUOTED: return getDoubleQuotedValue(input, valueStart, valueEnd);
		case SCALAR_STYLE.LITERAL_BLOCK: return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, false);
		case SCALAR_STYLE.FOLDED_BLOCK: return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, true);
		default: return getPlainValue(input, valueStart, valueEnd);
	}
}
//#endregion
//#region src/common/tagname.ts
var DEFAULT_TAG_HANDLERS = Object.assign(Object.create(null), {
	"!": "!",
	"!!": "tag:yaml.org,2002:"
});
function tagPercentEncode(source) {
	return encodeURI(source).replace(/!/g, "%21");
}
function tagNameFull(rawTag, tagHandlers) {
	var _ref, _tagHandlers$handle;
	if (rawTag.startsWith("!<") && rawTag.endsWith(">")) return decodeURIComponent(rawTag.slice(2, -1));
	const handleEnd = rawTag.indexOf("!", 1);
	const handle = handleEnd === -1 ? "!" : rawTag.slice(0, handleEnd + 1);
	const prefix = (_ref = (_tagHandlers$handle = tagHandlers === null || tagHandlers === void 0 ? void 0 : tagHandlers[handle]) !== null && _tagHandlers$handle !== void 0 ? _tagHandlers$handle : DEFAULT_TAG_HANDLERS[handle]) !== null && _ref !== void 0 ? _ref : handle;
	return decodeURIComponent(prefix) + decodeURIComponent(rawTag.slice(handle.length));
}
function tagNameShort(fullTag) {
	let tag = fullTag;
	if (tag.charCodeAt(0) === 33) {
		tag = tag.slice(1);
		return `!${tagPercentEncode(tag)}`;
	}
	if (tag.slice(0, 18) === "tag:yaml.org,2002:") return `!!${tagPercentEncode(tag.slice(18))}`;
	return `!<${tagPercentEncode(tag)}>`;
}
//#endregion
//#region src/parser/constructor.ts
var NO_RANGE$2 = -1;
var MERGE_TAG_NAME = "tag:yaml.org,2002:merge";
var DEFAULT_CONSTRUCTOR_OPTIONS = {
	filename: "",
	schema: CORE_SCHEMA,
	json: false,
	maxTotalMergeKeys: 1e4,
	maxAliases: -1
};
function eventPosition$1(event) {
	if ("tagStart" in event && event.tagStart !== NO_RANGE$2) return event.tagStart;
	if ("anchorStart" in event && event.anchorStart !== NO_RANGE$2) return event.anchorStart;
	if ("valueStart" in event && event.valueStart !== NO_RANGE$2) return event.valueStart;
	if ("start" in event) return event.start;
	return 0;
}
function throwError$1(state, message) {
	YAMLException.throwAt(state.source, state.position, message, state.filename);
}
function finalizeCollection(state, position, tag, carrier) {
	try {
		return tag.finalize(carrier);
	} catch (error) {
		if (error instanceof YAMLException) throw error;
		YAMLException.throwAt(state.source, position, error instanceof Error ? error.message : String(error), state.filename);
	}
}
function constructScalar(state, event) {
	const source = getScalarValue(state.source, event);
	const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
	const strTag = state.schema.defaultScalarTag;
	if (rawTag !== "") {
		var _state$schema$lookupM;
		if (rawTag === "!") return {
			value: source,
			tag: strTag
		};
		const tagName = tagNameFull(rawTag, state.tagHandlers);
		const scalarTag = state.schema.lookupScalarTag(tagName);
		if (scalarTag) {
			const result = scalarTag.resolve(source, true, tagName);
			if (result === NOT_RESOLVED) throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
			return {
				value: result,
				tag: scalarTag
			};
		}
		const collectionTagDef = (_state$schema$lookupM = state.schema.lookupMappingTag(tagName)) !== null && _state$schema$lookupM !== void 0 ? _state$schema$lookupM : state.schema.lookupSequenceTag(tagName);
		if (collectionTagDef) {
			if (source !== "") throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
			const carrier = collectionTagDef.create(tagName);
			return {
				value: collectionTagDef.carrierIsResult ? carrier : finalizeCollection(state, state.position, collectionTagDef, carrier),
				tag: collectionTagDef
			};
		}
		throwError$1(state, `unknown scalar tag !<${tagName}>`);
	}
	if (event.style === SCALAR_STYLE.PLAIN) return state.schema.resolveImplicitScalarTag(source);
	return {
		value: strTag.resolve(source, false, strTag.tagName),
		tag: strTag
	};
}
function collectionTagName(state, event, defaultTagName) {
	const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
	return rawTag === "" || rawTag === "!" ? defaultTagName : tagNameFull(rawTag, state.tagHandlers);
}
function isMappingTag(tag) {
	return tag.nodeKind === "mapping";
}
function chargeMergeWork(state) {
	state.totalMergeKeys++;
	if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) throwError$1(state, `merge keys exceeded maxTotalMergeKeys (${state.maxTotalMergeKeys})`);
}
function mergeKeys(state, frame, source, sourceTag) {
	chargeMergeWork(state);
	for (const sourceKey of sourceTag.keys(source)) {
		var _frame$overridable;
		chargeMergeWork(state);
		if (frame.tag.has(frame.value, sourceKey)) continue;
		const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source, sourceKey));
		if (err) throwError$1(state, err);
		(_frame$overridable = frame.overridable) !== null && _frame$overridable !== void 0 || (frame.overridable = /* @__PURE__ */ new Set());
		frame.overridable.add(sourceKey);
	}
}
function mergeSource(state, frame, source, sourceTag) {
	state.position = frame.keyPosition;
	if (isMappingTag(sourceTag)) mergeKeys(state, frame, source, sourceTag);
	else if (sourceTag.nodeKind === "sequence" && Array.isArray(source)) {
		if (source.length > 100) throwError$1(state, "abnormal merge sequence size");
		for (const element of source) {
			const elementTag = state.nodeTags.get(element);
			if (!elementTag) throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
			mergeKeys(state, frame, element, elementTag);
		}
	} else throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
}
function addMappingValue(state, frame, key, value, tag) {
	var _frame$overridable2, _frame$overridable3;
	state.position = frame.keyPosition;
	if (frame.keyIsMerge) {
		mergeSource(state, frame, value, tag);
		return;
	}
	if (!state.json && frame.tag.has(frame.value, key) && !((_frame$overridable2 = frame.overridable) === null || _frame$overridable2 === void 0 ? void 0 : _frame$overridable2.has(key))) throwError$1(state, "duplicated mapping key");
	const err = frame.tag.addPair(frame.value, key, value);
	if (err) throwError$1(state, err);
	(_frame$overridable3 = frame.overridable) === null || _frame$overridable3 === void 0 || _frame$overridable3.delete(key);
}
function addValue(state, value, tag) {
	const frame = state.frames[state.frames.length - 1];
	if (frame.kind === "document") {
		frame.value = value;
		frame.hasValue = true;
	} else if (frame.kind === "sequence") {
		if (isMappingTag(tag)) state.nodeTags.set(value, tag);
		const err = frame.tag.addItem(frame.value, value, frame.index++);
		if (err) throwError$1(state, err);
	} else if (frame.hasKey) {
		const key = frame.key;
		frame.key = void 0;
		frame.hasKey = false;
		addMappingValue(state, frame, key, value, tag);
	} else {
		frame.key = value;
		frame.keyPosition = state.position;
		frame.hasKey = true;
		frame.keyIsMerge = tag.tagName === MERGE_TAG_NAME;
	}
}
function storeAnchor(state, event, value, tag, isValueFinal) {
	if (event.anchorStart !== NO_RANGE$2) {
		const anchor = {
			value,
			tag,
			isValueFinal
		};
		state.anchors.set(state.source.slice(event.anchorStart, event.anchorEnd), anchor);
		return anchor;
	}
	return null;
}
/**
* Constructs JavaScript documents directly from parser events, without an
* intermediate AST.
*
* @category Events
*/
function constructFromEvents(events, options) {
	const state = _objectSpread2(_objectSpread2(_objectSpread2({}, DEFAULT_CONSTRUCTOR_OPTIONS), options), {}, {
		events,
		documents: [],
		eventIndex: 0,
		position: 0,
		frames: [],
		anchors: /* @__PURE__ */ new Map(),
		nodeTags: /* @__PURE__ */ new Map(),
		tagHandlers: Object.create(null),
		totalMergeKeys: 0,
		aliasCount: 0
	});
	while (state.eventIndex < state.events.length) {
		const event = state.events[state.eventIndex++];
		state.position = eventPosition$1(event);
		switch (event.type) {
			case EVENT_ID.DOCUMENT:
				state.anchors = /* @__PURE__ */ new Map();
				state.nodeTags = /* @__PURE__ */ new Map();
				state.aliasCount = 0;
				state.tagHandlers = Object.create(null);
				for (const directive of event.directives) if (directive.kind === "tag") state.tagHandlers[directive.handle] = directive.prefix;
				state.frames.push({
					kind: "document",
					position: state.position,
					value: void 0,
					hasValue: false
				});
				break;
			case EVENT_ID.SCALAR: {
				const { value, tag } = constructScalar(state, event);
				storeAnchor(state, event, value, tag, true);
				addValue(state, value, tag);
				break;
			}
			case EVENT_ID.SEQUENCE: {
				const tagName = collectionTagName(state, event, "tag:yaml.org,2002:seq");
				const tag = state.schema.lookupSequenceTag(tagName);
				if (!tag) throwError$1(state, `unknown sequence tag !<${tagName}>`);
				const value = tag.create(tagName);
				const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
				state.frames.push({
					kind: "sequence",
					position: state.position,
					value,
					tag,
					anchor,
					index: 0
				});
				break;
			}
			case EVENT_ID.MAPPING: {
				const tagName = collectionTagName(state, event, "tag:yaml.org,2002:map");
				const tag = state.schema.lookupMappingTag(tagName);
				if (!tag) throwError$1(state, `unknown mapping tag !<${tagName}>`);
				const value = tag.create(tagName);
				const anchor = storeAnchor(state, event, value, tag, tag.carrierIsResult);
				state.frames.push({
					kind: "mapping",
					position: state.position,
					value,
					tag,
					anchor,
					key: void 0,
					keyPosition: state.position,
					hasKey: false,
					keyIsMerge: false,
					overridable: null
				});
				break;
			}
			case EVENT_ID.ALIAS: {
				if (state.maxAliases !== -1 && ++state.aliasCount > state.maxAliases) throwError$1(state, `aliases exceeded maxAliases (${state.maxAliases})`);
				const name = state.source.slice(event.anchorStart, event.anchorEnd);
				const anchor = state.anchors.get(name);
				if (!anchor) throwError$1(state, `unidentified alias "${name}"`);
				if (!anchor.isValueFinal) throwError$1(state, `recursive alias "${name}" is not supported for tag ${anchor.tag.tagName} because it uses finalize()`);
				addValue(state, anchor.value, anchor.tag);
				break;
			}
			case EVENT_ID.POP: {
				const frame = state.frames.pop();
				if (frame.kind === "mapping" && frame.hasKey) {
					state.position = frame.keyPosition;
					throwError$1(state, "incomplete mapping pair in event stream");
				}
				if (frame.kind === "document") state.documents.push(frame.value);
				else {
					const value = frame.tag.carrierIsResult ? frame.value : finalizeCollection(state, frame.position, frame.tag, frame.value);
					if (frame.anchor) {
						frame.anchor.value = value;
						frame.anchor.isValueFinal = true;
					}
					addValue(state, value, frame.tag);
				}
				break;
			}
		}
	}
	return state.documents;
}
//#endregion
//#region src/parser/parser.ts
var NO_RANGE$1 = -1;
var HAS_OWN = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
var NS_URI_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$,_.!~*'()\[\]])`;
var NS_TAG_CHAR = String.raw`(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\-#;/?:@&=+$.~*'()_])`;
var PATTERN_TAG_URI = new RegExp(`^(?:${NS_URI_CHAR})*$`);
var PATTERN_TAG_SUFFIX = new RegExp(`^(?:${NS_TAG_CHAR})+$`);
var PATTERN_TAG_PREFIX = new RegExp(`^(?:!(?:${NS_URI_CHAR})*|${NS_TAG_CHAR}(?:${NS_URI_CHAR})*)$`);
var DEFAULT_PARSER_OPTIONS = {
	filename: "",
	maxDepth: 100
};
function addDocumentEvent(state, explicitStart, explicitEnd) {
	state.events.push({
		type: EVENT_ID.DOCUMENT,
		explicitStart,
		explicitEnd,
		directives: state.directives
	});
}
function addSequenceEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
	state.events.push({
		type: EVENT_ID.SEQUENCE,
		start,
		anchorStart,
		anchorEnd,
		tagStart,
		tagEnd,
		style
	});
}
function addMappingEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
	state.events.push({
		type: EVENT_ID.MAPPING,
		start,
		anchorStart,
		anchorEnd,
		tagStart,
		tagEnd,
		style
	});
}
function insertFlowPairMappingEvent(state, snapshot) {
	state.events.splice(snapshot.eventsLength, 0, {
		type: EVENT_ID.MAPPING,
		start: snapshot.position,
		anchorStart: NO_RANGE$1,
		anchorEnd: NO_RANGE$1,
		tagStart: NO_RANGE$1,
		tagEnd: NO_RANGE$1,
		style: COLLECTION_STYLE.FLOW
	});
}
function addScalarEvent(state, valueStart, valueEnd, anchorStart, anchorEnd, tagStart, tagEnd, style, chomping = CHOMPING_MODE.CLIP, indent = -1, fast = false) {
	state.events.push({
		type: EVENT_ID.SCALAR,
		valueStart,
		valueEnd,
		anchorStart,
		anchorEnd,
		tagStart,
		tagEnd,
		style,
		chomping,
		indent,
		fast
	});
}
function addAliasEvent(state, anchorStart, anchorEnd) {
	state.events.push({
		type: EVENT_ID.ALIAS,
		anchorStart,
		anchorEnd
	});
}
function addPopEvent(state) {
	state.events.push({ type: EVENT_ID.POP });
}
function addEmptyScalarEvent(state) {
	addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, SCALAR_STYLE.PLAIN);
}
function emptyProperties() {
	return {
		anchorStart: NO_RANGE$1,
		anchorEnd: NO_RANGE$1,
		tagStart: NO_RANGE$1,
		tagEnd: NO_RANGE$1
	};
}
function snapshotState(state) {
	return {
		position: state.position,
		line: state.line,
		lineStart: state.lineStart,
		lineIndent: state.lineIndent,
		firstTabInLine: state.firstTabInLine,
		eventsLength: state.events.length
	};
}
function restoreState(state, snapshot) {
	state.position = snapshot.position;
	state.line = snapshot.line;
	state.lineStart = snapshot.lineStart;
	state.lineIndent = snapshot.lineIndent;
	state.firstTabInLine = snapshot.firstTabInLine;
	state.events.length = snapshot.eventsLength;
}
function throwError(state, message) {
	YAMLException.throwAt(state.input.slice(0, state.length), state.position, message, state.filename);
}
function isEol(c) {
	return c === 10 || c === 13;
}
function isWhiteSpace(c) {
	return c === 9 || c === 32;
}
function isWsOrEol(c) {
	return isWhiteSpace(c) || isEol(c);
}
function isWsOrEolOrEnd(c) {
	return c === 0 || isWsOrEol(c);
}
function isFlowIndicator(c) {
	return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromDecimalCode(c) {
	return c >= 48 && c <= 57 ? c - 48 : -1;
}
function fromHexCode(c) {
	if (c >= 48 && c <= 57) return c - 48;
	const lc = c | 32;
	if (lc >= 97 && lc <= 102) return lc - 97 + 10;
	return -1;
}
function escapedHexLen(c) {
	if (c === 120) return 2;
	if (c === 117) return 4;
	if (c === 85) return 8;
	return 0;
}
function isSimpleEscape(c) {
	return c === 48 || c === 97 || c === 98 || c === 116 || c === 9 || c === 110 || c === 118 || c === 102 || c === 114 || c === 101 || c === 32 || c === 34 || c === 47 || c === 92 || c === 78 || c === 95 || c === 76 || c === 80;
}
function consumeLineBreak(state) {
	if (state.input.charCodeAt(state.position) === 10) state.position++;
	else {
		state.position++;
		if (state.input.charCodeAt(state.position) === 10) state.position++;
	}
	state.line++;
	state.lineStart = state.position;
	state.lineIndent = 0;
	state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments) {
	let lineBreaks = 0;
	let ch = state.input.charCodeAt(state.position);
	let hasSeparation = state.position === state.lineStart || isWsOrEol(state.input.charCodeAt(state.position - 1));
	while (ch !== 0) {
		while (isWhiteSpace(ch)) {
			hasSeparation = true;
			if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
			ch = state.input.charCodeAt(++state.position);
		}
		if (allowComments && hasSeparation && ch === 35) do
			ch = state.input.charCodeAt(++state.position);
		while (!isEol(ch) && ch !== 0);
		if (!isEol(ch)) break;
		consumeLineBreak(state);
		lineBreaks++;
		hasSeparation = true;
		ch = state.input.charCodeAt(state.position);
		while (ch === 32) {
			state.lineIndent++;
			ch = state.input.charCodeAt(++state.position);
		}
	}
	return lineBreaks;
}
function testDocumentSeparator(state, position = state.position) {
	const ch = state.input.charCodeAt(position);
	if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(position + 1) && ch === state.input.charCodeAt(position + 2)) {
		const following = state.input.charCodeAt(position + 3);
		return following === 0 || isWsOrEol(following);
	}
	return false;
}
function skipByteOrderMark(state) {
	if (state.position === state.lineStart && state.input.charCodeAt(state.position) === 65279) {
		state.position++;
		state.lineStart = state.position;
	}
}
function testDocumentBoundary(state) {
	if (state.position !== state.lineStart) return false;
	if (testDocumentSeparator(state)) return true;
	if (state.input.charCodeAt(state.position) !== 65279) return false;
	const snapshot = snapshotState(state);
	skipByteOrderMark(state);
	skipSeparationSpace(state, true);
	const ch = state.input.charCodeAt(state.position);
	const result = state.position === state.lineStart && (ch === 37 || ch === 45 && testDocumentSeparator(state));
	restoreState(state, snapshot);
	return result;
}
function skipUntilLineEnd(state) {
	let ch = state.input.charCodeAt(state.position);
	while (ch !== 0 && !isEol(ch)) ch = state.input.charCodeAt(++state.position);
}
function checkPrintable(state, start, end) {
	if (PATTERN_NON_PRINTABLE.test(state.input.slice(start, end))) throwError(state, "the stream contains non-printable characters");
}
function readTagProperty(state, props, inFlow) {
	if (state.input.charCodeAt(state.position) !== 33) return false;
	if (props.tagStart !== NO_RANGE$1) throwError(state, "duplication of a tag property");
	const start = state.position;
	let isVerbatim = false;
	let isNamed = false;
	let tagHandle = "!";
	let ch = state.input.charCodeAt(++state.position);
	if (ch === 60) {
		isVerbatim = true;
		ch = state.input.charCodeAt(++state.position);
	} else if (ch === 33) {
		isNamed = true;
		tagHandle = "!!";
		ch = state.input.charCodeAt(++state.position);
	}
	let suffixStart = state.position;
	let tagName;
	if (isVerbatim) {
		while (ch !== 0 && ch !== 62) ch = state.input.charCodeAt(++state.position);
		if (ch !== 62) throwError(state, "unexpected end of the stream within a verbatim tag");
		tagName = state.input.slice(suffixStart, state.position);
		state.position++;
	} else {
		while (ch !== 0 && !isWsOrEol(ch) && !(inFlow && isFlowIndicator(ch))) {
			if (ch === 33) if (!isNamed) {
				tagHandle = state.input.slice(suffixStart - 1, state.position + 1);
				if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
				isNamed = true;
				suffixStart = state.position + 1;
			} else throwError(state, "tag suffix cannot contain exclamation marks");
			ch = state.input.charCodeAt(++state.position);
		}
		tagName = state.input.slice(suffixStart, state.position);
		if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
	}
	if (tagName && !(isVerbatim ? PATTERN_TAG_URI.test(tagName) : PATTERN_TAG_SUFFIX.test(tagName))) throwError(state, `tag name cannot contain such characters: ${tagName}`);
	if (!isVerbatim && tagHandle !== "!" && tagHandle !== "!!" && !HAS_OWN.call(state.tagHandlers, tagHandle)) throwError(state, `undeclared tag handle "${tagHandle}"`);
	props.tagStart = start;
	props.tagEnd = state.position;
	return true;
}
function readAnchorProperty(state, props) {
	if (state.input.charCodeAt(state.position) !== 38) return false;
	if (props.anchorStart !== NO_RANGE$1) throwError(state, "duplication of an anchor property");
	state.position++;
	const start = state.position;
	while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
	if (state.position === start) throwError(state, "name of an anchor node must contain at least one character");
	props.anchorStart = start;
	props.anchorEnd = state.position;
	return true;
}
function readAlias(state, props) {
	if (state.input.charCodeAt(state.position) !== 42) return false;
	if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) throwError(state, "alias node should not have any properties");
	state.position++;
	const start = state.position;
	while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
	if (state.position === start) throwError(state, "name of an alias node must contain at least one character");
	addAliasEvent(state, start, state.position);
	return true;
}
function readFlowScalarBreak(state, nodeIndent) {
	skipSeparationSpace(state, false);
	if (state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readSingleQuotedScalar(state, nodeIndent, props) {
	if (state.input.charCodeAt(state.position) !== 39) return false;
	state.position++;
	const start = state.position;
	let simple = true;
	while (state.input.charCodeAt(state.position) !== 0) {
		const ch = state.input.charCodeAt(state.position);
		if (ch === 39) {
			if (state.input.charCodeAt(state.position + 1) === 39) {
				simple = false;
				state.position += 2;
				continue;
			}
			const end = state.position;
			state.position++;
			addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.SINGLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
			return true;
		}
		if (isEol(ch)) {
			simple = false;
			readFlowScalarBreak(state, nodeIndent);
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
		else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
		else state.position++;
	}
	throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent, props) {
	if (state.input.charCodeAt(state.position) !== 34) return false;
	state.position++;
	const start = state.position;
	let simple = true;
	while (state.input.charCodeAt(state.position) !== 0) {
		const ch = state.input.charCodeAt(state.position);
		if (ch === 34) {
			const end = state.position;
			state.position++;
			addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.DOUBLE_QUOTED, CHOMPING_MODE.CLIP, -1, simple);
			return true;
		}
		if (ch === 92) {
			simple = false;
			const escaped = state.input.charCodeAt(++state.position);
			if (isEol(escaped)) readFlowScalarBreak(state, nodeIndent);
			else if (isSimpleEscape(escaped)) state.position++;
			else {
				let hexLength = escapedHexLen(escaped);
				if (hexLength === 0) throwError(state, "unknown escape sequence");
				while (hexLength-- > 0) {
					state.position++;
					if (fromHexCode(state.input.charCodeAt(state.position)) < 0) throwError(state, "expected hexadecimal character");
				}
				state.position++;
			}
		} else if (isEol(ch)) {
			simple = false;
			readFlowScalarBreak(state, nodeIndent);
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
		else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
		else state.position++;
	}
	throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readBlockScalar(state, parentIndent, props) {
	const ch = state.input.charCodeAt(state.position);
	let chomping = CHOMPING_MODE.CLIP;
	let indent = -1;
	let detectedIndent = false;
	if (ch !== 124 && ch !== 62) return false;
	const style = ch === 124 ? SCALAR_STYLE.LITERAL_BLOCK : SCALAR_STYLE.FOLDED_BLOCK;
	state.position++;
	while (state.input.charCodeAt(state.position) !== 0) {
		const current = state.input.charCodeAt(state.position);
		const digit = fromDecimalCode(current);
		if (current === 43 || current === 45) {
			if (chomping !== CHOMPING_MODE.CLIP) throwError(state, "repeat of a chomping mode identifier");
			chomping = current === 43 ? CHOMPING_MODE.KEEP : CHOMPING_MODE.STRIP;
			state.position++;
		} else if (digit >= 0) {
			if (digit === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
			if (detectedIndent) throwError(state, "repeat of an indentation width identifier");
			indent = parentIndent + digit - 1;
			detectedIndent = true;
			state.position++;
		} else break;
	}
	let hadWhitespace = false;
	while (isWhiteSpace(state.input.charCodeAt(state.position))) {
		hadWhitespace = true;
		state.position++;
	}
	if (hadWhitespace && state.input.charCodeAt(state.position) === 35) skipUntilLineEnd(state);
	if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
	else if (state.input.charCodeAt(state.position) !== 0) throwError(state, "a line break is expected");
	let contentIndent = detectedIndent ? indent : -1;
	let maxLeadingIndent = 0;
	const valueStart = state.position;
	let valueEnd = state.position;
	while (state.input.charCodeAt(state.position) !== 0) {
		const linePosition = state.position;
		let column = 0;
		while (state.input.charCodeAt(linePosition + column) === 32) column++;
		const first = state.input.charCodeAt(linePosition + column);
		if (first === 0) {
			if (contentIndent >= 0) {
				if (column > contentIndent) valueEnd = linePosition + column;
			} else if (column > 0) valueEnd = linePosition + column;
			break;
		}
		if (testDocumentBoundary(state)) break;
		if (!detectedIndent && contentIndent === -1 && isEol(first)) maxLeadingIndent = Math.max(maxLeadingIndent, column);
		if (!detectedIndent && contentIndent === -1 && !isEol(first)) {
			if (first === 9 && column < parentIndent) {
				state.position = linePosition + column;
				throwError(state, "tab characters must not be used in indentation");
			}
			if (column < maxLeadingIndent) {
				state.position = linePosition + column;
				throwError(state, "bad indentation of a mapping entry");
			}
		}
		if (contentIndent === -1 && first !== 0 && !isEol(first) && column < parentIndent) {
			state.lineIndent = column;
			state.position = linePosition + column;
			break;
		}
		if (!detectedIndent && first !== 0 && !isEol(first) && contentIndent === -1) contentIndent = column;
		const requiredIndent = contentIndent === -1 ? parentIndent + 1 : contentIndent;
		if (first !== 0 && !isEol(first) && column < requiredIndent) {
			state.lineIndent = column;
			state.position = linePosition + column;
			break;
		}
		skipUntilLineEnd(state);
		valueEnd = state.position;
		if (isEol(state.input.charCodeAt(state.position))) {
			consumeLineBreak(state);
			valueEnd = state.position;
		}
	}
	checkPrintable(state, valueStart, valueEnd);
	addScalarEvent(state, valueStart, valueEnd, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, style, chomping, contentIndent);
	return true;
}
function canStartPlainScalar(state, nodeContext) {
	const ch = state.input.charCodeAt(state.position);
	const inFlow = nodeContext === CONTEXT_FLOW_IN;
	if (ch === 0 || isWsOrEol(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96 || inFlow && isFlowIndicator(ch)) return false;
	if (ch === 63 || ch === 45) {
		const following = state.input.charCodeAt(state.position + 1);
		if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) return false;
	}
	return true;
}
function readPlainScalar(state, nodeIndent, nodeContext, props) {
	if (!canStartPlainScalar(state, nodeContext)) return false;
	const start = state.position;
	let end = state.position;
	let ch = state.input.charCodeAt(state.position);
	const inFlow = nodeContext === CONTEXT_FLOW_IN;
	let multiline = false;
	while (ch !== 0) {
		if (testDocumentBoundary(state)) break;
		if (ch === 58) {
			const following = state.input.charCodeAt(state.position + 1);
			if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) break;
		} else if (ch === 35) {
			if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
		} else if (inFlow && isFlowIndicator(ch)) break;
		else if (isEol(ch)) {
			const savedPosition = state.position;
			const savedLine = state.line;
			const savedLineStart = state.lineStart;
			const savedLineIndent = state.lineIndent;
			skipSeparationSpace(state, false);
			if (state.lineIndent >= nodeIndent) {
				multiline = true;
				ch = state.input.charCodeAt(state.position);
				continue;
			}
			state.position = savedPosition;
			state.line = savedLine;
			state.lineStart = savedLineStart;
			state.lineIndent = savedLineIndent;
			break;
		}
		if (!isWhiteSpace(ch)) end = state.position + 1;
		ch = state.input.charCodeAt(++state.position);
	}
	if (end === start) return false;
	checkPrintable(state, start, end);
	addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN, CHOMPING_MODE.CLIP, -1, !multiline);
	return true;
}
function skipFlowSeparationSpace(state, nodeIndent) {
	const startLine = state.line;
	skipSeparationSpace(state, true);
	if (state.line > startLine && state.lineIndent < nodeIndent || state.firstTabInLine !== -1 && state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readFlowCollection(state, nodeIndent, props) {
	const ch = state.input.charCodeAt(state.position);
	const isMapping = ch === 123;
	const start = state.position;
	let readNext = true;
	if (ch !== 91 && ch !== 123) return false;
	const terminator = isMapping ? 125 : 93;
	if (isMapping) addMappingEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
	else addSequenceEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.FLOW);
	state.position++;
	while (state.input.charCodeAt(state.position) !== 0) {
		skipFlowSeparationSpace(state, nodeIndent);
		let ch = state.input.charCodeAt(state.position);
		if (ch === terminator) {
			state.position++;
			addPopEvent(state);
			return true;
		} else if (!readNext) throwError(state, "missed comma between flow collection entries");
		else if (ch === 44) throwError(state, "expected the node content, but found ','");
		let isPair = false;
		let isExplicitPair = false;
		if (ch === 63 && isWsOrEol(state.input.charCodeAt(state.position + 1))) {
			isPair = isExplicitPair = true;
			state.position += 1;
			skipFlowSeparationSpace(state, nodeIndent);
		}
		const entryLine = state.line;
		const entryStart = snapshotState(state);
		const keyWasRead = parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
		skipFlowSeparationSpace(state, nodeIndent);
		ch = state.input.charCodeAt(state.position);
		if ((isMapping || isExplicitPair || state.line === entryLine) && ch === 58) {
			isPair = true;
			state.position++;
			skipFlowSeparationSpace(state, nodeIndent);
			if (!isMapping) {
				insertFlowPairMappingEvent(state, entryStart);
				if (!keyWasRead) addEmptyScalarEvent(state);
			} else if (!keyWasRead) addEmptyScalarEvent(state);
			if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) addEmptyScalarEvent(state);
			skipFlowSeparationSpace(state, nodeIndent);
			if (!isMapping) addPopEvent(state);
		} else if (isMapping && isPair) {
			if (!keyWasRead) addEmptyScalarEvent(state);
			addEmptyScalarEvent(state);
		} else if (isMapping) addEmptyScalarEvent(state);
		else if (isPair) {
			insertFlowPairMappingEvent(state, entryStart);
			if (!keyWasRead) addEmptyScalarEvent(state);
			addEmptyScalarEvent(state);
			addPopEvent(state);
		}
		ch = state.input.charCodeAt(state.position);
		if (ch === 44) {
			readNext = true;
			state.position++;
		} else readNext = false;
	}
	throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockSequence(state, nodeIndent, props) {
	if (state.firstTabInLine !== -1 || state.input.charCodeAt(state.position) !== 45 || !isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) return false;
	addSequenceEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
	while (state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
		if (state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError(state, "tab characters must not be used in indentation");
		}
		const entryLine = state.line;
		state.position++;
		const hadBreak = skipSeparationSpace(state, true) > 0;
		if (state.firstTabInLine !== -1 && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
		if (hadBreak && state.lineIndent <= nodeIndent) addEmptyScalarEvent(state);
		else parseNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
		skipSeparationSpace(state, true);
		if (state.lineIndent < nodeIndent || state.position >= state.length) break;
		if (state.lineIndent > nodeIndent) throwError(state, "bad indentation of a sequence entry");
		if (state.line === entryLine && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
	}
	addPopEvent(state);
	return true;
}
function readBlockMapping(state, nodeIndent, flowIndent, props) {
	let atExplicitKey = false;
	let detected = false;
	let mappingOpened = false;
	let pendingExplicitKey = false;
	if (state.firstTabInLine !== -1) return false;
	let ch = state.input.charCodeAt(state.position);
	while (ch !== 0) {
		if (!atExplicitKey && state.firstTabInLine !== -1) {
			state.position = state.firstTabInLine;
			throwError(state, "tab characters must not be used in indentation");
		}
		const following = state.input.charCodeAt(state.position + 1);
		const entryLine = state.line;
		if ((ch === 63 || ch === 58) && isWsOrEolOrEnd(following)) {
			if (!mappingOpened) {
				addMappingEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
				mappingOpened = true;
			}
			if (ch === 63) {
				if (atExplicitKey) addEmptyScalarEvent(state);
				detected = true;
				atExplicitKey = true;
			} else if (atExplicitKey) atExplicitKey = false;
			else {
				addEmptyScalarEvent(state);
				detected = true;
				atExplicitKey = false;
			}
			state.position += 1;
			pendingExplicitKey = true;
		} else {
			if (atExplicitKey) {
				addEmptyScalarEvent(state);
				atExplicitKey = false;
			}
			const beforeKey = snapshotState(state);
			if (!parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
			if (state.line === entryLine) {
				ch = state.input.charCodeAt(state.position);
				while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 58) {
					ch = state.input.charCodeAt(++state.position);
					if (!isWsOrEolOrEnd(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
					if (!mappingOpened) {
						restoreState(state, beforeKey);
						addMappingEvent(state, beforeKey.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, COLLECTION_STYLE.BLOCK);
						mappingOpened = true;
						parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true);
						ch = state.input.charCodeAt(state.position);
						while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
						state.position++;
					}
					detected = true;
					atExplicitKey = false;
					pendingExplicitKey = false;
				} else if (detected) throwError(state, "expected ':' after a mapping key");
				else {
					if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
						restoreState(state, beforeKey);
						return false;
					}
					return true;
				}
			} else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
			else {
				if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
					restoreState(state, beforeKey);
					return false;
				}
				return true;
			}
		}
		if (parseNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, pendingExplicitKey)) pendingExplicitKey = false;
		if (!atExplicitKey) {
			if (pendingExplicitKey) {
				addEmptyScalarEvent(state);
				pendingExplicitKey = false;
			}
		}
		skipSeparationSpace(state, true);
		ch = state.input.charCodeAt(state.position);
		if ((state.line === entryLine || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
		else if (state.lineIndent < nodeIndent) break;
	}
	if (!detected) return false;
	if (atExplicitKey) addEmptyScalarEvent(state);
	if (mappingOpened) addPopEvent(state);
	return true;
}
function parseNode(state, parentIndent, nodeContext, allowToSeek, allowCompact, allowPropertyMapping = true) {
	if (state.depth >= state.maxDepth) throwError(state, `nesting exceeded maxDepth (${state.maxDepth})`);
	state.depth++;
	let indentStatus = 1;
	let atNewLine = false;
	let hasContent = false;
	let propertyStart = null;
	const props = emptyProperties();
	let allowBlockScalars = nodeContext === CONTEXT_BLOCK_OUT || nodeContext === CONTEXT_BLOCK_IN;
	let allowBlockCollections = allowBlockScalars;
	const allowBlockStyles = allowBlockScalars;
	if (allowToSeek && skipSeparationSpace(state, true)) {
		atNewLine = true;
		if (state.lineIndent > parentIndent) indentStatus = 1;
		else if (state.lineIndent === parentIndent) indentStatus = 0;
		else indentStatus = -1;
	}
	if (indentStatus === 1) while (true) {
		const ch = state.input.charCodeAt(state.position);
		const propertyState = snapshotState(state);
		if (atNewLine && indentStatus !== 1 && (ch === 33 || ch === 38)) break;
		if (atNewLine && allowBlockStyles && (props.tagStart !== NO_RANGE$1 || props.anchorStart !== NO_RANGE$1) && (ch === 33 || ch === 38)) {
			var _state$events$fallbac;
			const fallbackState = snapshotState(state);
			const flowIndent = parentIndent + 1;
			if (readBlockMapping(state, state.position - state.lineStart, flowIndent, props) && ((_state$events$fallbac = state.events[fallbackState.eventsLength]) === null || _state$events$fallbac === void 0 ? void 0 : _state$events$fallbac.type) === EVENT_ID.MAPPING) {
				state.depth--;
				return true;
			}
			restoreState(state, fallbackState);
		}
		if (atNewLine && (ch === 33 && props.tagStart !== NO_RANGE$1 || ch === 38 && props.anchorStart !== NO_RANGE$1)) break;
		if (!readTagProperty(state, props, nodeContext === CONTEXT_FLOW_IN) && !readAnchorProperty(state, props)) break;
		if (propertyStart === null) propertyStart = propertyState;
		if (skipSeparationSpace(state, true)) {
			atNewLine = true;
			allowBlockCollections = allowBlockStyles;
			if (state.lineIndent > parentIndent) indentStatus = 1;
			else if (state.lineIndent === parentIndent) indentStatus = 0;
			else indentStatus = -1;
		} else allowBlockCollections = false;
	}
	if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
	if (indentStatus === 1 || nodeContext === CONTEXT_BLOCK_OUT) {
		const flowIndent = nodeContext === CONTEXT_FLOW_IN || nodeContext === CONTEXT_FLOW_OUT ? parentIndent : parentIndent + 1;
		const blockIndent = state.position - state.lineStart;
		if (indentStatus === 1) if (allowBlockCollections && (readBlockSequence(state, blockIndent, props) || readBlockMapping(state, blockIndent, flowIndent, props)) || readFlowCollection(state, flowIndent, props)) hasContent = true;
		else {
			const ch = state.input.charCodeAt(state.position);
			if (propertyStart !== null && allowPropertyMapping && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62) {
				var _state$events$fallbac2;
				const fallbackState = snapshotState(state);
				const propertyIndent = propertyStart.position - propertyStart.lineStart;
				restoreState(state, propertyStart);
				if (readBlockMapping(state, propertyIndent, flowIndent, emptyProperties()) && ((_state$events$fallbac2 = state.events[fallbackState.eventsLength]) === null || _state$events$fallbac2 === void 0 ? void 0 : _state$events$fallbac2.type) === EVENT_ID.MAPPING) hasContent = true;
				else restoreState(state, fallbackState);
			}
			if (!hasContent && (allowBlockScalars && readBlockScalar(state, flowIndent, props) || readSingleQuotedScalar(state, flowIndent, props) || readDoubleQuotedScalar(state, flowIndent, props) || readAlias(state, props) || readPlainScalar(state, flowIndent, nodeContext, props))) hasContent = true;
		}
		else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent, props);
	}
	allowBlockScalars = allowBlockScalars && !hasContent;
	if (!hasContent && (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1 || allowBlockScalars)) {
		addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, SCALAR_STYLE.PLAIN);
		hasContent = true;
	}
	state.depth--;
	return hasContent || props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1;
}
function readDirective(state) {
	if (state.lineIndent > 0 || state.input.charCodeAt(state.position) !== 37) return false;
	state.position++;
	const nameStart = state.position;
	while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
	const name = state.input.slice(nameStart, state.position);
	const args = [];
	if (name.length === 0) throwError(state, "directive name must not be less than one character in length");
	while (state.input.charCodeAt(state.position) !== 0 && !isEol(state.input.charCodeAt(state.position))) {
		while (isWhiteSpace(state.input.charCodeAt(state.position))) state.position++;
		if (state.input.charCodeAt(state.position) === 35 || isEol(state.input.charCodeAt(state.position)) || state.input.charCodeAt(state.position) === 0) break;
		const start = state.position;
		while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
		args.push(state.input.slice(start, state.position));
	}
	if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
	if (name === "YAML") {
		if (state.directives.some((directive) => directive.kind === "yaml")) throwError(state, "duplication of %YAML directive");
		if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
		const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
		if (match === null) throwError(state, "ill-formed argument of the YAML directive");
		if (parseInt(match[1], 10) !== 1) throwError(state, "unacceptable YAML version of the document");
		state.directives.push({
			kind: "yaml",
			version: args[0]
		});
	} else if (name === "TAG") {
		if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
		const [handle, prefix] = args;
		if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
		if (HAS_OWN.call(state.tagHandlers, handle)) throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);
		if (!PATTERN_TAG_PREFIX.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
		state.tagHandlers[handle] = prefix;
		state.directives.push({
			kind: "tag",
			handle,
			prefix
		});
	}
	return true;
}
function readDocument(state) {
	state.directives = [];
	state.tagHandlers = Object.create(null);
	let hasDirectives = false;
	skipSeparationSpace(state, true);
	while (readDirective(state)) {
		hasDirectives = true;
		skipSeparationSpace(state, true);
	}
	let explicitStart = false;
	let explicitEnd = false;
	let allowCompact = true;
	if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 3))) {
		explicitStart = true;
		const markerLine = state.line;
		state.position += 3;
		skipSeparationSpace(state, true);
		allowCompact = state.line > markerLine;
	} else if (hasDirectives) throwError(state, "directives end mark is expected");
	const documentEventIndex = state.events.length;
	if (!explicitStart && state.position === state.lineStart && state.input.charCodeAt(state.position) === 46 && testDocumentSeparator(state)) {
		state.position += 3;
		skipSeparationSpace(state, true);
		return;
	}
	addDocumentEvent(state, explicitStart, false);
	if (!parseNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, allowCompact, allowCompact)) addEmptyScalarEvent(state);
	skipSeparationSpace(state, true);
	if (state.position === state.lineStart && testDocumentSeparator(state)) {
		explicitEnd = state.input.charCodeAt(state.position) === 46;
		if (explicitEnd) {
			const markerLine = state.line;
			state.position += 3;
			skipSeparationSpace(state, true);
			if (state.line === markerLine && state.position < state.length) throwError(state, "end of the stream or a document separator is expected");
		}
	}
	const documentEvent = state.events[documentEventIndex];
	if ((documentEvent === null || documentEvent === void 0 ? void 0 : documentEvent.type) === EVENT_ID.DOCUMENT) documentEvent.explicitEnd = explicitEnd;
	addPopEvent(state);
	if (!explicitEnd && state.position < state.length && !testDocumentBoundary(state)) throwError(state, "end of the stream or a document separator is expected");
}
/**
* Parses YAML into a flat event stream referencing source text by offsets.
*
* @category Events
*/
function parseEvents(input, options) {
	const length = input.length;
	const state = _objectSpread2(_objectSpread2(_objectSpread2({}, DEFAULT_PARSER_OPTIONS), options), {}, {
		input: `${input}\0`,
		length,
		position: 0,
		line: 0,
		lineStart: 0,
		lineIndent: 0,
		firstTabInLine: -1,
		depth: 0,
		directives: [],
		tagHandlers: Object.create(null),
		events: []
	});
	const nullpos = input.indexOf("\0");
	if (nullpos !== -1) YAMLException.throwAt(input, nullpos, "null byte is not allowed in input", state.filename);
	while (state.position < state.length) {
		skipByteOrderMark(state);
		skipSeparationSpace(state, true);
		if (state.position >= state.length) break;
		const documentStart = state.position;
		readDocument(state);
		if (state.position === documentStart)
 /* c8 ignore next */
		throwError(state, "can not read a document");
	}
	return state.events;
}
//#endregion
//#region src/load.ts
var DEFAULT_LOAD_OPTIONS = _objectSpread2(_objectSpread2({}, DEFAULT_PARSER_OPTIONS), DEFAULT_CONSTRUCTOR_OPTIONS);
function loadDocuments(input, options = {}) {
	const opts = _objectSpread2(_objectSpread2({}, DEFAULT_LOAD_OPTIONS), options);
	const source = String(input);
	const PARSER_OPT_KEYS = Object.keys(DEFAULT_PARSER_OPTIONS);
	const CONSTRUCTOR_OPT_KEYS = Object.keys(DEFAULT_CONSTRUCTOR_OPTIONS);
	return constructFromEvents(parseEvents(source, pick(opts, PARSER_OPT_KEYS)), _objectSpread2(_objectSpread2({}, pick(opts, CONSTRUCTOR_OPT_KEYS)), {}, { source }));
}
function loadAll(input, iteratorOrOptions, options) {
	let iterator = null;
	if (typeof iteratorOrOptions === "function") iterator = iteratorOrOptions;
	else if (iteratorOrOptions !== null && typeof iteratorOrOptions === "object") options = iteratorOrOptions;
	const documents = loadDocuments(input, options);
	if (iterator === null) return documents;
	for (const document of documents) iterator(document);
}
/**
* Parses `string` as a single YAML document. Throws {@link YAMLException} on
* error. This function does not understand multi-document or empty sources; it
* throws an exception on those.
*
* > [!NOTE]
* > 1. When processing untrusted input, see the
* >    [security considerations](../docs/safety.md).
* > 2. All exceptions MUST be caught, not just {@link YAMLException}.
* > 3. The default {@link CORE_SCHEMA} comes without the `!!merge` tag. You can
* >    easily enable it if needed.
* > 4. The default {@link mapTag} is `{}`-object based, with known limitations
* >    (see description). For full compatibility use {@link realMapTag}
* >    instead (it uses native JS `Map`).
*
* @example
* Enable {@link mergeTag} and {@link realMapTag}:
*
* ```javascript
* import { load, CORE_SCHEMA, mergeTag, realMapTag } from 'js-yaml'
*
* try {
*   load(data, { schema: CORE_SCHEMA.withTags(mergeTag, realMapTag) })
* } catch (e) {
*   console.error(e)
* }
* ```
*
* @category Main
*/
function load(input, options) {
	const documents = loadDocuments(input, options);
	if (documents.length === 0) throw new YAMLException("expected a document, but the input is empty");
	if (documents.length === 1) return documents[0];
	throw new YAMLException("expected a single document in the stream, but found more");
}
//#endregion
//#region src/ast/from_js.ts
var INVALID = Symbol("INVALID");
function buildRepresentTypes(schema) {
	const defaultTags = new Set([
		schema.defaultScalarTag,
		schema.defaultSequenceTag,
		schema.defaultMappingTag
	].filter((t) => t !== void 0));
	const implicitScalars = schema.implicitScalarTags;
	const explicitTags = schema.tags.filter((t) => !(t.nodeKind === "scalar" && t.implicit) && !defaultTags.has(t));
	const defaultTagsLast = schema.tags.filter((t) => defaultTags.has(t));
	return [
		...implicitScalars.map((tag) => ({
			tag,
			implicitTag: true
		})),
		...explicitTags.map((tag) => ({
			tag,
			implicitTag: false
		})),
		...defaultTagsLast.map((tag) => ({
			tag,
			implicitTag: true
		}))
	];
}
function matchTag(state, object) {
	for (let index = 0, length = state.representTypes.length; index < length; index += 1) {
		const { tag, implicitTag } = state.representTypes[index];
		if (tag.identify(object)) {
			let tagName;
			if (tag.matchByTagPrefix) tagName = tag.representTagName(object);
			else tagName = tag.tagName;
			return {
				tag,
				tagName,
				implicitTag
			};
		}
	}
	return null;
}
function build(state, object) {
	if (!state.noRefs && object !== null && typeof object === "object") {
		const existing = state.refs.get(object);
		if (existing) {
			if (existing.anchor === void 0) existing.anchor = `ref_${state.refCounter++}`;
			return {
				kind: "alias",
				anchor: existing.anchor
			};
		}
	}
	const matched = matchTag(state, object);
	if (!matched) {
		if (object === void 0) return INVALID;
		if (state.skipInvalid) return INVALID;
		throw new YAMLException(`unacceptable kind of an object to dump ${Object.prototype.toString.call(object)}`);
	}
	const { tag, tagName, implicitTag } = matched;
	const nodeTagName = implicitTag ? tagName : tagNameShort(tagName);
	if (tag.nodeKind === "scalar") return {
		kind: "scalar",
		tag: nodeTagName,
		tagged: !implicitTag,
		style: SCALAR_STYLE.PLAIN,
		value: tag.represent(object)
	};
	if (tag.nodeKind === "sequence") {
		const container = tag.represent(object);
		const node = {
			kind: "sequence",
			tag: nodeTagName,
			tagged: !implicitTag,
			style: COLLECTION_STYLE.BLOCK,
			items: []
		};
		if (!state.noRefs) state.refs.set(object, node);
		for (let index = 0, length = container.length; index < length; index += 1) {
			let item = build(state, container[index]);
			if (item === INVALID && container[index] === void 0) item = build(state, null);
			if (item === INVALID) continue;
			node.items.push(item);
		}
		return node;
	}
	const map = tag.represent(object);
	const node = {
		kind: "mapping",
		tag: nodeTagName,
		tagged: !implicitTag,
		style: COLLECTION_STYLE.BLOCK,
		items: []
	};
	if (!state.noRefs) state.refs.set(object, node);
	for (const [objectKey, objectValue] of map) {
		const key = build(state, objectKey);
		if (key === INVALID) continue;
		const value = build(state, objectValue);
		if (value === INVALID) continue;
		node.items.push({
			key,
			value
		});
	}
	return node;
}
/**
* Convert JS object to AST. A JS value is one YAML document. An unrepresentable
* root becomes an empty document, which the presenter renders as an empty
* string.
*
* @category AST
*/
function jsToAst(input, schema, options = {}) {
	var _options$noRefs, _options$skipInvalid;
	const root = build({
		representTypes: buildRepresentTypes(schema),
		noRefs: (_options$noRefs = options.noRefs) !== null && _options$noRefs !== void 0 ? _options$noRefs : false,
		skipInvalid: (_options$skipInvalid = options.skipInvalid) !== null && _options$skipInvalid !== void 0 ? _options$skipInvalid : false,
		refs: /* @__PURE__ */ new Map(),
		refCounter: 0
	}, input);
	return [{
		contents: root === INVALID ? null : root,
		directives: []
	}];
}
//#endregion
//#region src/ast/visit.ts
/**
* Return from a visitor to stop the whole traversal.
*
* @category AST
*/
var VISIT_BREAK = Symbol("visit:break");
/**
* Return from a visitor to skip the current node's children.
*
* @category AST
*/
var VISIT_SKIP = Symbol("visit:skip");
function visitNode(node, visitor, ctx) {
	const control = visitor(node, ctx);
	if (control === VISIT_BREAK) return true;
	if (control === VISIT_SKIP) return false;
	const depth = ctx.depth + 1;
	switch (node.kind) {
		case "sequence":
			for (const item of node.items) if (visitNode(item, visitor, {
				depth,
				parent: node,
				isKey: false
			})) return true;
			break;
		case "mapping":
			for (const { key, value } of node.items) {
				if (visitNode(key, visitor, {
					depth,
					parent: node,
					isKey: true
				})) return true;
				if (visitNode(value, visitor, {
					depth,
					parent: node,
					isKey: false
				})) return true;
			}
			break;
	}
	return false;
}
/**
* Walk every node in the documents, calling {@link Visitor} once per
* node (pre-order).
*
* @category AST
*/
function visit(documents, visitor) {
	for (const doc of documents) if (doc.contents && visitNode(doc.contents, visitor, {
		depth: 0,
		parent: null,
		isKey: false
	})) return;
}
//#endregion
//#region src/ast/styler_defaults.ts
function hasBit(mask, bit) {
	return (mask & 1 << bit) !== 0;
}
/**
* Default scalar styling rules in application order.
* See [Scalar styling](../../docs/scalar_styling.md) for usage details.
*
* @category AST
*/
var DEFAULT_SCALAR_STYLE_RULES = {
	applyQuoteFlowKeysOption,
	doubleQuoteForInvisibles,
	doubleQuoteWhitespaceOnly,
	applyForceQuotesOption,
	tryLongOrMultilineAsBlock,
	quoteInvalidPlain,
	fallbackToDoubleQuoted
};
function _preferredQuotedStyle(layout) {
	if (layout.presenterOptions.quoteStyle === "single" && hasBit(layout.allowedStylesMask, SCALAR_STYLE.SINGLE_QUOTED)) return SCALAR_STYLE.SINGLE_QUOTED;
	return SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyQuoteFlowKeysOption(layout) {
	if (!layout.presenterOptions.quoteFlowKeys) return;
	if (!layout.isKey || !layout.flowOnly || layout.style !== SCALAR_STYLE.PLAIN) return;
	layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteForInvisibles(layout) {
	if (layout.style === SCALAR_STYLE.PLAIN && /[\t\x7F-\xA0\u2028\u2029\uFEFF\uFFFE\uFFFF]/.test(layout.node.value)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function doubleQuoteWhitespaceOnly(layout) {
	if (layout.style === SCALAR_STYLE.PLAIN && /^\s+$/.test(layout.node.value)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
function applyForceQuotesOption(layout) {
	if (!layout.presenterOptions.forceQuotes) return;
	if (layout.isKey || layout.style !== SCALAR_STYLE.PLAIN) return;
	if (layout.node.tag !== layout.presenterOptions.schema.defaultScalarTag.tagName) return;
	layout.style = layout.node.value.includes("\n") ? SCALAR_STYLE.DOUBLE_QUOTED : _preferredQuotedStyle(layout);
}
function tryLongOrMultilineAsBlock(layout) {
	if (layout.style !== SCALAR_STYLE.PLAIN || layout.isKey) return;
	const value = layout.node.value;
	const multiline = value.indexOf("\n") !== -1;
	if (!hasBit(layout.allowedStylesMask, SCALAR_STYLE.LITERAL_BLOCK)) {
		if (multiline) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
		return;
	}
	const w = layout.presenterOptions.lineWidth;
	if (w === -1) {
		if (multiline) layout.style = SCALAR_STYLE.LITERAL_BLOCK;
		return;
	}
	const availableWidth = Math.max(Math.min(w, 40), w - layout.shiftOfContent);
	let position = 0;
	let shouldFold = false;
	while (position <= value.length) {
		let lineEnd = value.length;
		const nextLineBreak = value.indexOf("\n", position);
		if (nextLineBreak !== -1) lineEnd = nextLineBreak;
		const line = value.slice(position, lineEnd);
		if (line.length > availableWidth && line[0] !== " " && / [^ \t]/.test(line)) shouldFold = true;
		if (nextLineBreak === -1) break;
		position = nextLineBreak + 1;
	}
	if (shouldFold) layout.style = SCALAR_STYLE.FOLDED_BLOCK;
	else if (multiline) layout.style = SCALAR_STYLE.LITERAL_BLOCK;
}
function quoteInvalidPlain(layout) {
	if (layout.style === SCALAR_STYLE.PLAIN && !hasBit(layout.allowedStylesMask, SCALAR_STYLE.PLAIN)) layout.style = _preferredQuotedStyle(layout);
}
function fallbackToDoubleQuoted(layout) {
	if (!hasBit(layout.allowedStylesMask, layout.style)) layout.style = SCALAR_STYLE.DOUBLE_QUOTED;
}
//#endregion
//#region src/ast/scalar_styler.ts
function setBit(mask, bit) {
	return mask | 1 << bit;
}
var SRC_C_PRINTABLE = "[\\x09\\x0A\\x0D\\x20-\\x7E\\x85\\xA0-\\uD7FF\\uE000-\\uFFFD\\u{10000}-\\u{10FFFF}]";
var SRC_B_CHAR = "[\\n\\r]";
var SRC_C_BYTE_ORDER_MARK = "\\uFEFF";
var SRC_S_WHITE = "[ \\t]";
var SRC_NB_CHAR = `(?:(?!(?:${SRC_B_CHAR}|${SRC_C_BYTE_ORDER_MARK}))${SRC_C_PRINTABLE})`;
var SRC_NS_CHAR = `(?:(?!${SRC_S_WHITE})${SRC_NB_CHAR})`;
var SRC_NB_JSON = "[\\x09\\x20-\\uD7FF\\uE000-\\uFFFF\\u{10000}-\\u{10FFFF}]";
var SRC_C_INDICATOR = "[-?:,\\[\\]{}#&*!|>'\"%@`]";
var SRC_C_FLOW_INDICATOR = "[,\\[\\]{}]";
var SRC_NS_PLAIN_SAFE_FLOW_OUT = SRC_NS_CHAR;
var SRC_NS_PLAIN_SAFE_FLOW_IN = `(?:(?!${SRC_C_FLOW_INDICATOR})${SRC_NS_CHAR})`;
var SRC_NS_PLAIN_FIRST_FLOW_OUT = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))`;
var SRC_NS_PLAIN_FIRST_FLOW_IN = `(?:(?:(?!${SRC_C_INDICATOR})${SRC_NS_CHAR})|[?:-](?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))`;
var SRC_NS_PLAIN_CHAR_FLOW_OUT = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_OUT})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_OUT}))#*`;
var SRC_NS_PLAIN_CHAR_FLOW_IN = `(?:(?:(?![:#])${SRC_NS_PLAIN_SAFE_FLOW_IN})|:(?=${SRC_NS_PLAIN_SAFE_FLOW_IN}))#*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_OUT})*`;
var SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN = `(?:${SRC_S_WHITE}*${SRC_NS_PLAIN_CHAR_FLOW_IN})*`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_OUT = `${SRC_NS_PLAIN_FIRST_FLOW_OUT}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_NS_PLAIN_ONE_LINE_FLOW_IN = `${SRC_NS_PLAIN_FIRST_FLOW_IN}#*${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_OUT;
var SRC_NS_PLAIN_ONE_LINE_FLOW_KEY = SRC_NS_PLAIN_ONE_LINE_FLOW_IN;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_OUT}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_OUT}`;
var SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN = `\\n+${SRC_NS_PLAIN_CHAR_FLOW_IN}${SRC_NB_NS_PLAIN_IN_LINE_FLOW_IN}`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT = `${SRC_NS_PLAIN_ONE_LINE_FLOW_OUT}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_OUT})*`;
var SRC_NS_PLAIN_MULTI_LINE_FLOW_IN = `${SRC_NS_PLAIN_ONE_LINE_FLOW_IN}(?:${SRC_S_NS_PLAIN_NEXT_LINE_FLOW_IN})*`;
var NS_PLAIN_FLOW_OUT = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_OUT})$`, "u");
var NS_PLAIN_FLOW_IN = new RegExp(`^(?:${SRC_NS_PLAIN_MULTI_LINE_FLOW_IN})$`, "u");
var NS_PLAIN_BLOCK_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_BLOCK_KEY})$`, "u");
var NS_PLAIN_FLOW_KEY = new RegExp(`^(?:${SRC_NS_PLAIN_ONE_LINE_FLOW_KEY})$`, "u");
var NB_SINGLE_ONE_LINE = new RegExp(`^(?:${SRC_NB_JSON})*$`, "u");
var NB_SINGLE_MULTI_LINE = new RegExp(`^(?:${SRC_NB_JSON}|\\n)*$`, "u");
var BLOCK_SCALAR_CONTENT = new RegExp(`^(?:${SRC_NB_CHAR}|\\n)*$`, "u");
var C_FORBIDDEN_FIRST_LINE = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/;
var C_FORBIDDEN_CONTENT = /^(?:---|\.\.\.)(?=$|[ \t\n\r])/m;
function canUsePlain(layout) {
	const str = layout.node.value;
	if (str !== "") {
		if (!(layout.isKey ? layout.flowOnly ? NS_PLAIN_FLOW_KEY : NS_PLAIN_BLOCK_KEY : layout.flowOnly ? NS_PLAIN_FLOW_IN : NS_PLAIN_FLOW_OUT).test(str)) return false;
		if (layout.shiftOfFirstLine === 0 && C_FORBIDDEN_FIRST_LINE.test(str)) return false;
		if (layout.shiftOfContent === 0) {
			const firstLineBreak = str.indexOf("\n");
			if (firstLineBreak !== -1) {
				const content = str.slice(firstLineBreak + 1);
				if (C_FORBIDDEN_CONTENT.test(content)) return false;
			}
		}
	}
	const resolvedTag = layout.presenterOptions.schema.resolveImplicitScalarTag(str).tag.tagName;
	if (!layout.node.tagged && resolvedTag !== layout.node.tag) return false;
	if (!layout.node.tagged && str === "=" && resolvedTag === layout.presenterOptions.schema.defaultScalarTag.tagName) return false;
	return true;
}
function canUseSingleQuoted(layout) {
	const str = layout.node.value;
	if (!(layout.isKey ? NB_SINGLE_ONE_LINE : NB_SINGLE_MULTI_LINE).test(str)) return false;
	if (/[ \t]\n|\n[ \t]/.test(str)) return false;
	if (!layout.isKey && layout.shiftOfContent === 0) {
		const firstLineBreak = str.indexOf("\n");
		if (firstLineBreak !== -1 && C_FORBIDDEN_CONTENT.test(str.slice(firstLineBreak + 1))) return false;
	}
	return true;
}
function canUseBlock(layout) {
	if (layout.flowOnly || !BLOCK_SCALAR_CONTENT.test(layout.node.value)) return false;
	const contentIndent = layout.shiftOfContent - layout.shiftOfParent;
	if (contentIndent < 1) return false;
	if (contentIndent > 9 && /^\n* /.test(layout.node.value)) return false;
	if (layout.shiftOfContent === 0 && C_FORBIDDEN_CONTENT.test(layout.node.value)) return false;
	return true;
}
function detectAllowedStyles(layout) {
	let mask = setBit(0, SCALAR_STYLE.DOUBLE_QUOTED);
	if (canUsePlain(layout)) mask = setBit(mask, SCALAR_STYLE.PLAIN);
	if (canUseSingleQuoted(layout)) mask = setBit(mask, SCALAR_STYLE.SINGLE_QUOTED);
	if (canUseBlock(layout)) mask = setBit(setBit(mask, SCALAR_STYLE.LITERAL_BLOCK), SCALAR_STYLE.FOLDED_BLOCK);
	layout.allowedStylesMask = mask;
}
function renderScalar(layout) {
	switch (layout.style) {
		case SCALAR_STYLE.PLAIN: return renderPlain(layout);
		case SCALAR_STYLE.SINGLE_QUOTED: return renderSingleQuoted(layout);
		case SCALAR_STYLE.LITERAL_BLOCK: return renderLiteralBlock(layout);
		case SCALAR_STYLE.FOLDED_BLOCK: return renderFoldedBlock(layout);
		case SCALAR_STYLE.DOUBLE_QUOTED: return renderDoubleQuoted(layout);
	}
}
function renderPlain(layout) {
	return encodeFlowBreaks(layout.node.value, layout.shiftOfContent);
}
function renderSingleQuoted(layout) {
	return `'${encodeFlowBreaks(layout.node.value, layout.shiftOfContent).replace(/'/g, "''")}'`;
}
function renderLiteralBlock(layout) {
	const value = layout.node.value;
	return "|" + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) + dropEndingNewline(indentString(value, layout.shiftOfContent));
}
function renderFoldedBlock(layout) {
	const value = layout.node.value;
	const w = layout.presenterOptions.lineWidth;
	let availableWidth = Infinity;
	if (w !== -1) availableWidth = Math.max(Math.min(w, 40), w - layout.shiftOfContent);
	return ">" + blockHeader(value, layout.shiftOfParent, layout.shiftOfContent) + dropEndingNewline(indentString(foldBlockScalar(value, availableWidth), layout.shiftOfContent));
}
function renderDoubleQuoted(layout) {
	return `"${escapeString(layout.node.value)}"`;
}
function encodeFlowBreaks(string, shiftOfContent) {
	let nextLF = string.indexOf("\n");
	if (nextLF === -1) return string;
	const pad = " ".repeat(shiftOfContent);
	let result = string.slice(0, nextLF);
	const lineRe = /(\n+)([^\n]*)/g;
	lineRe.lastIndex = nextLF;
	let match;
	while (match = lineRe.exec(string)) {
		const breaks = match[1].length;
		const line = match[2];
		result += "\n".repeat(breaks + 1) + pad + line;
	}
	return result;
}
function indentString(string, spaces) {
	const indent = " ".repeat(spaces);
	let position = 0;
	let result = "";
	const length = string.length;
	while (position < length) {
		let line;
		const next = string.indexOf("\n", position);
		if (next === -1) {
			line = string.slice(position);
			position = length;
		} else {
			line = string.slice(position, next + 1);
			position = next + 1;
		}
		if (line.length && line !== "\n") result += indent;
		result += line;
	}
	return result;
}
function needIndentIndicator(string) {
	return /^\n* /.test(string);
}
function blockHeader(string, shiftOfParent, shiftOfContent) {
	const indentIndicator = needIndentIndicator(string) ? String(shiftOfContent - shiftOfParent) : "";
	const clip = string[string.length - 1] === "\n";
	return `${indentIndicator}${clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-"}\n`;
}
function dropEndingNewline(string) {
	return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function isMoreIndented(char) {
	return char === " " || char === "	";
}
function foldLine(line, width) {
	if (line === "" || isMoreIndented(line[0])) return line;
	const breakRe = / [^ \t]/g;
	let match;
	let start = 0;
	let end;
	let curr = 0;
	let next = 0;
	let result = "";
	while (match = breakRe.exec(line)) {
		next = match.index;
		if (next - start > width) {
			end = curr > start ? curr : next;
			result += `\n${line.slice(start, end)}`;
			start = end + 1;
		}
		curr = next;
	}
	result += "\n";
	if (line.length - start > width && curr > start) result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`;
	else result += line.slice(start);
	return result.slice(1);
}
function foldBlockScalar(string, width) {
	const lineRe = /(\n+)([^\n]*)/g;
	let nextLF = string.indexOf("\n");
	if (nextLF === -1) nextLF = string.length;
	lineRe.lastIndex = nextLF;
	let result = foldLine(string.slice(0, nextLF), width);
	let prevMoreIndented = string[0] === "\n" || isMoreIndented(string[0]);
	let moreIndented;
	let match;
	while (match = lineRe.exec(string)) {
		const prefix = match[1];
		const line = match[2];
		moreIndented = line !== "" && isMoreIndented(line[0]);
		result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
		prevMoreIndented = moreIndented;
	}
	return result;
}
var CHARACTERS_TO_ESCAPE = /["\\\x00-\x1F\x7F-\xA0\u2028\u2029\uD800-\uDFFF\uFEFF\uFFFE\uFFFF]/gu;
function escapeCharacter(character) {
	switch (character) {
		case "\0": return "\\0";
		case "\x07": return "\\a";
		case "\b": return "\\b";
		case "	": return "\\t";
		case "\n": return "\\n";
		case "\v": return "\\v";
		case "\f": return "\\f";
		case "\r": return "\\r";
		case "\x1B": return "\\e";
		case "\"": return "\\\"";
		case "\\": return "\\\\";
		case "": return "\\N";
		case "\xA0": return "\\_";
		case "\u2028": return "\\L";
		case "\u2029": return "\\P";
	}
	const code = character.charCodeAt(0);
	const hex = code.toString(16).toUpperCase();
	if (code <= 255) return `\\x${"0".repeat(2 - hex.length)}${hex}`;
	return `\\u${"0".repeat(4 - hex.length)}${hex}`;
}
function escapeString(string) {
	return string.replace(CHARACTERS_TO_ESCAPE, escapeCharacter);
}
//#endregion
//#region src/ast/presenter.ts
var CHAR_LINE_FEED = 10;
var DEFAULT_PRESENTER_OPTIONS = {
	indent: 2,
	seqNoIndent: false,
	seqInlineFirst: true,
	lineWidth: 80,
	flowBracketPadding: false,
	flowSkipCommaSpace: false,
	flowSkipColonSpace: false,
	quoteFlowKeys: false,
	quoteStyle: "single",
	forceQuotes: false,
	scalarStyleRules: Object.keys(DEFAULT_SCALAR_STYLE_RULES).map((name) => Reflect.get(DEFAULT_SCALAR_STYLE_RULES, name)),
	tagBeforeAnchor: false
};
function nodeTagShort(node) {
	return node.tagged ? node.tag : tagNameShort(node.tag);
}
function createPresenterState(options) {
	const opts = _objectSpread2(_objectSpread2({}, DEFAULT_PRESENTER_OPTIONS), options);
	if (opts.flowSkipColonSpace) opts.quoteFlowKeys = true;
	return _objectSpread2(_objectSpread2({}, opts), {}, {
		defaultScalarTagName: opts.schema.defaultScalarTag.tagName,
		openEnded: false
	});
}
function generateNextLine(state, level) {
	return `\n${" ".repeat(state.indent * level)}`;
}
function scalarLayout(state, node, parent, level, isKey, flowOnly) {
	return {
		node,
		parent,
		level,
		isKey,
		flowOnly,
		shiftOfParent: level === 0 ? -1 : state.indent * (level - 1),
		shiftOfContent: state.indent * Math.max(1, level),
		shiftOfFirstLine: level === 0 ? 0 : state.indent * level,
		presenterOptions: state,
		allowedStylesMask: 0,
		style: node.style
	};
}
function writeFlowSequence(state, level, node) {
	let result = "";
	for (let index = 0, length = node.items.length; index < length; index += 1) {
		const item = writeNode(state, level, node.items[index], node, {}).text;
		if (index > 0) result += `,${!state.flowSkipCommaSpace ? " " : ""}`;
		result += item;
	}
	const pad = state.flowBracketPadding && node.items.length > 0 ? " " : "";
	return `[${pad}${result}${pad}]`;
}
function writeBlockSequence(state, level, node, compact) {
	let result = "";
	for (let index = 0, length = node.items.length; index < length; index += 1) {
		const item = writeNode(state, level + 1, node.items[index], node, {
			block: true,
			compact: state.seqInlineFirst,
			isblockseq: true
		}).text;
		if (!compact || result !== "") result += generateNextLine(state, level);
		if (item === "" || CHAR_LINE_FEED === item.charCodeAt(0)) result += "-";
		else result += "- ";
		result += item;
	}
	return result;
}
function writeFlowMapping(state, level, node) {
	let result = "";
	for (const { key, value } of node.items) {
		let pairBuffer = "";
		if (result !== "") pairBuffer += `,${!state.flowSkipCommaSpace ? " " : ""}`;
		const keyRender = writeNode(state, level, key, node, { iskey: true });
		const keyText = keyRender.text;
		const valueText = writeNode(state, level, value, node, {}).text;
		const sep = state.flowSkipColonSpace || valueText === "" ? "" : " ";
		const keyIsBareProps = key.kind === "scalar" && keyRender.noBody && (key.tagged || key.anchor !== void 0);
		const keyColonSep = key.kind === "alias" || keyIsBareProps ? " " : "";
		pairBuffer += `${keyText}${keyColonSep}:${sep}${valueText}`;
		result += pairBuffer;
	}
	const pad = state.flowBracketPadding && result !== "" ? " " : "";
	return `{${pad}${result}${pad}}`;
}
function writeBlockMapping(state, level, node, compact) {
	let result = "";
	for (let index = 0, length = node.items.length; index < length; index += 1) {
		let pairBuffer = "";
		if (!compact || result !== "") pairBuffer += generateNextLine(state, level);
		const { key, value } = node.items[index];
		const keyIsBlock = (key.kind === "mapping" || key.kind === "sequence") && key.style === COLLECTION_STYLE.BLOCK && key.items.length !== 0 || key.kind === "scalar" && (key.style === SCALAR_STYLE.LITERAL_BLOCK || key.style === SCALAR_STYLE.FOLDED_BLOCK);
		const keyRender = keyIsBlock ? writeNode(state, level + 1, key, node, {
			block: true,
			compact: true,
			isblockseq: !cannotBeCompact(state, key, level + 1)
		}) : writeNode(state, level + 1, key, node, {
			block: true,
			compact: true,
			iskey: true
		});
		const keyText = keyRender.text;
		const keyHasLineBreak = key.kind === "scalar" && key.value.indexOf("\n") !== -1;
		const keyIsTooLong = keyText.length > 1024 && /^[\s\S]{1025}/u.test(keyText);
		const explicitPair = keyIsBlock || keyHasLineBreak || keyIsTooLong;
		if (explicitPair) if (keyText && CHAR_LINE_FEED === keyText.charCodeAt(0)) pairBuffer += "?";
		else pairBuffer += "? ";
		pairBuffer += keyText;
		if (explicitPair) pairBuffer += generateNextLine(state, level);
		const valueText = writeNode(state, level + 1, value, node, {
			block: true,
			compact: explicitPair,
			isblockseq: explicitPair && !cannotBeCompact(state, value, level + 1)
		}).text;
		const keyIsBareProps = key.kind === "scalar" && keyRender.noBody && (key.tagged || key.anchor !== void 0);
		const keyColonSep = !explicitPair && (key.kind === "alias" || keyIsBareProps) ? " " : "";
		if (valueText === "" || CHAR_LINE_FEED === valueText.charCodeAt(0)) pairBuffer += `${keyColonSep}:`;
		else pairBuffer += `${keyColonSep}: `;
		pairBuffer += valueText;
		result += pairBuffer;
	}
	return result;
}
function cannotBeCompact(state, node, level) {
	if (node.kind === "alias") return true;
	return node.tagged || node.anchor !== void 0 || state.indent < 2 && level > 0;
}
function writeNode(state, level, node, parent, ctx) {
	var _ctx$compact;
	if (node.kind === "alias") {
		state.openEnded = false;
		return {
			text: `*${node.anchor}`,
			noBody: false
		};
	}
	const { block = false, iskey = false, isblockseq = false } = ctx;
	let compact = (_ctx$compact = ctx.compact) !== null && _ctx$compact !== void 0 ? _ctx$compact : false;
	const hasAnchor = node.anchor !== void 0;
	if (cannotBeCompact(state, node, level)) compact = false;
	let body;
	let shouldPrintTag = node.tagged;
	const useBlockCollection = block && (node.kind === "mapping" || node.kind === "sequence") && node.style === COLLECTION_STYLE.BLOCK && node.items.length !== 0;
	if (node.kind === "mapping") if (useBlockCollection) body = writeBlockMapping(state, level, node, compact);
	else body = writeFlowMapping(state, level, node);
	else if (node.kind === "sequence") if (useBlockCollection) if (state.seqNoIndent && !isblockseq && level > 0) body = writeBlockSequence(state, level - 1, node, compact);
	else body = writeBlockSequence(state, level, node, compact);
	else body = writeFlowSequence(state, level, node);
	else {
		const layout = scalarLayout(state, node, parent, level, iskey, !block);
		detectAllowedStyles(layout);
		for (const rule of state.scalarStyleRules) rule(layout);
		body = renderScalar(layout);
		state.openEnded = (layout.style === SCALAR_STYLE.LITERAL_BLOCK || layout.style === SCALAR_STYLE.FOLDED_BLOCK) && (node.value === "\n" || node.value.endsWith("\n\n"));
		shouldPrintTag = node.tagged || body === "" && layout.flowOnly && (parent === null || parent === void 0 ? void 0 : parent.kind) === "sequence" && !hasAnchor || layout.style !== SCALAR_STYLE.PLAIN && node.tag !== state.defaultScalarTagName;
	}
	if ((node.kind === "mapping" || node.kind === "sequence") && !useBlockCollection) state.openEnded = false;
	if (useBlockCollection && compact && level > 0 && state.indent > 2) body = `${" ".repeat(state.indent - 2)}${body}`;
	const noBody = body === "";
	let text = body;
	if (shouldPrintTag || hasAnchor) {
		const props = [];
		const tag = shouldPrintTag ? nodeTagShort(node) : null;
		const anchor = hasAnchor ? `&${node.anchor}` : null;
		if (state.tagBeforeAnchor) {
			if (tag !== null) props.push(tag);
			if (anchor !== null) props.push(anchor);
		} else {
			if (anchor !== null) props.push(anchor);
			if (tag !== null) props.push(tag);
		}
		const sep = body === "" || body.charCodeAt(0) === CHAR_LINE_FEED ? "" : " ";
		text = `${props.join(" ")}${sep}${body}`;
	}
	return {
		text,
		noBody
	};
}
function rootStartsOwnLine(node) {
	return (node.kind === "sequence" || node.kind === "mapping") && node.style === COLLECTION_STYLE.BLOCK && node.items.length !== 0 && !node.tagged && node.anchor === void 0;
}
function writeDocumentDirectives(doc) {
	let result = "";
	for (const directive of doc.directives) {
		if (directive.kind === "yaml") {
			result += `%YAML ${directive.version}\n`;
			continue;
		}
		const { handle, prefix } = directive;
		result += `%TAG ${handle} ${prefix}\n`;
	}
	return result;
}
/**
* Build YAML from AST.
*
* @category AST
*/
function present(documents, options) {
	const state = createPresenterState(options);
	let result = "";
	let previousEnded = false;
	for (let index = 0; index < documents.length; index += 1) {
		const doc = documents[index];
		state.openEnded = false;
		const directives = writeDocumentDirectives(doc);
		const hasDirectives = directives !== "";
		const marker = doc.explicitStart || hasDirectives || index > 0 && !previousEnded;
		result += directives;
		if (doc.contents === null) {
			if (marker) result += "---\n";
		} else if (marker) {
			const body = writeNode(state, 0, doc.contents, null, {
				block: true,
				compact: true
			}).text;
			const sep = body === "" ? "" : hasDirectives || rootStartsOwnLine(doc.contents) ? "\n" : " ";
			result += `---${sep}${body}\n`;
		} else result += writeNode(state, 0, doc.contents, null, {
			block: true,
			compact: true
		}).text + "\n";
		previousEnded = doc.explicitEnd || state.openEnded;
		if (previousEnded) result += "...\n";
	}
	return result;
}
//#endregion
//#region src/dump.ts
var DEFAULT_DUMP_OPTIONS = _objectSpread2(_objectSpread2({}, DEFAULT_PRESENTER_OPTIONS), {}, {
	schema: DUMP_SCHEMA,
	skipInvalid: false,
	noRefs: false,
	flowLevel: -1,
	sortKeys: false,
	transform: () => {}
});
function defaultCompareFn(a, b) {
	const x = String(a);
	const y = String(b);
	if (x < y) return -1;
	if (x > y) return 1;
	return 0;
}
/**
* Serializes JS object as a YAML document. By default it can dump every
* supported YAML type, so it throws an exception if you try to dump regexps or
* functions. However, you can disable exceptions by setting the
* {@link DumpOptions.skipInvalid} option to `true`.
*
* @category Main
*/
function dump(input, options = {}) {
	const opts = _objectSpread2(_objectSpread2({}, DEFAULT_DUMP_OPTIONS), options);
	const documents = jsToAst(input, opts.schema, {
		noRefs: opts.noRefs,
		skipInvalid: opts.skipInvalid
	});
	if (opts.flowLevel >= 0) visit(documents, (node, ctx) => {
		if (ctx.depth < opts.flowLevel) return;
		if (node.kind === "sequence" || node.kind === "mapping") node.style = COLLECTION_STYLE.FLOW;
		return VISIT_SKIP;
	});
	if (opts.sortKeys) {
		const compareFn = opts.sortKeys === true ? defaultCompareFn : opts.sortKeys;
		visit(documents, (node) => {
			if (node.kind !== "mapping") return;
			node.items.sort((a, b) => compareFn(a.key.kind === "scalar" ? a.key.value : "", b.key.kind === "scalar" ? b.key.value : ""));
		});
	}
	opts.transform(documents);
	return present(documents, _objectSpread2(_objectSpread2({}, pick(opts, Object.keys(DEFAULT_PRESENTER_OPTIONS))), {}, { schema: opts.schema }));
}
//#endregion
//#region src/ast/from_events.ts
var NO_RANGE = -1;
function eventPosition(event) {
	if ("tagStart" in event && event.tagStart !== NO_RANGE) return event.tagStart;
	if ("anchorStart" in event && event.anchorStart !== NO_RANGE) return event.anchorStart;
	if ("valueStart" in event && event.valueStart !== NO_RANGE) return event.valueStart;
	if ("start" in event) return event.start;
	return 0;
}
function rawTag(state, event) {
	return event.tagStart === NO_RANGE ? "" : state.source.slice(event.tagStart, event.tagEnd);
}
function anchorName(state, event) {
	return event.anchorStart === NO_RANGE ? void 0 : state.source.slice(event.anchorStart, event.anchorEnd);
}
function buildScalar(state, event) {
	const value = getScalarValue(state.source, event);
	const raw = rawTag(state, event);
	let tag;
	let tagged = false;
	if (raw !== "") {
		tagged = true;
		tag = raw;
	} else if (event.style === SCALAR_STYLE.PLAIN) tag = state.schema.resolveImplicitScalarTag(value).tag.tagName;
	else tag = state.schema.defaultScalarTag.tagName;
	return {
		kind: "scalar",
		tag,
		tagged,
		style: event.style,
		anchor: anchorName(state, event),
		value
	};
}
function buildCollection(state, event, defaultTagName) {
	const raw = rawTag(state, event);
	let tag;
	let tagged = false;
	if (raw === "") tag = defaultTagName;
	else {
		tag = raw;
		tagged = true;
	}
	return {
		tag,
		tagged,
		style: event.style,
		anchor: anchorName(state, event)
	};
}
function addNode(state, node) {
	const frame = state.frames[state.frames.length - 1];
	if (frame.kind === "document") frame.doc.contents = node;
	else if (frame.kind === "sequence") frame.node.items.push(node);
	else if (frame.key) {
		frame.node.items.push({
			key: frame.key,
			value: node
		});
		frame.key = null;
	} else frame.key = node;
}
/**
* Builds an AST from parser events
*
* @category AST
*/
function eventsToAst(events, options) {
	const state = {
		source: options.source,
		schema: options.schema,
		eventIndex: 0,
		position: 0,
		frames: [],
		documents: []
	};
	while (state.eventIndex < events.length) {
		const event = events[state.eventIndex++];
		state.position = eventPosition(event);
		switch (event.type) {
			case EVENT_ID.DOCUMENT: {
				const doc = {
					contents: null,
					explicitStart: event.explicitStart,
					explicitEnd: event.explicitEnd,
					directives: event.directives
				};
				state.frames.push({
					kind: "document",
					doc
				});
				break;
			}
			case EVENT_ID.SCALAR:
				addNode(state, buildScalar(state, event));
				break;
			case EVENT_ID.SEQUENCE: {
				const { tag, tagged, style, anchor } = buildCollection(state, event, "tag:yaml.org,2002:seq");
				const node = {
					kind: "sequence",
					tag,
					tagged,
					style,
					anchor,
					items: []
				};
				state.frames.push({
					kind: "sequence",
					node
				});
				break;
			}
			case EVENT_ID.MAPPING: {
				const { tag, tagged, style, anchor } = buildCollection(state, event, "tag:yaml.org,2002:map");
				const node = {
					kind: "mapping",
					tag,
					tagged,
					style,
					anchor,
					items: []
				};
				state.frames.push({
					kind: "mapping",
					node,
					key: null
				});
				break;
			}
			case EVENT_ID.ALIAS:
				addNode(state, {
					kind: "alias",
					anchor: state.source.slice(event.anchorStart, event.anchorEnd)
				});
				break;
			case EVENT_ID.POP: {
				const frame = state.frames.pop();
				if (frame.kind === "mapping" && frame.key) throw new Error("incomplete mapping pair in event stream");
				if (frame.kind === "document") state.documents.push(frame.doc);
				else addNode(state, frame.node);
				break;
			}
		}
	}
	return state.documents;
}
//#endregion
//#region src/index.ts
/** @deprecated Use `EVENT_ID.DOCUMENT` instead. @internal */
var EVENT_DOCUMENT = EVENT_ID.DOCUMENT;
/** @deprecated Use `EVENT_ID.SEQUENCE` instead. @internal */
var EVENT_SEQUENCE = EVENT_ID.SEQUENCE;
/** @deprecated Use `EVENT_ID.MAPPING` instead. @internal */
var EVENT_MAPPING = EVENT_ID.MAPPING;
/** @deprecated Use `EVENT_ID.SCALAR` instead. @internal */
var EVENT_SCALAR = EVENT_ID.SCALAR;
/** @deprecated Use `EVENT_ID.ALIAS` instead. @internal */
var EVENT_ALIAS = EVENT_ID.ALIAS;
/** @deprecated Use `EVENT_ID.POP` instead. @internal */
var EVENT_POP = EVENT_ID.POP;
/** @deprecated Use `SCALAR_STYLE.PLAIN` instead. @internal */
var SCALAR_STYLE_PLAIN = SCALAR_STYLE.PLAIN;
/** @deprecated Use `SCALAR_STYLE.SINGLE_QUOTED` instead. @internal */
var SCALAR_STYLE_SINGLE_QUOTED = SCALAR_STYLE.SINGLE_QUOTED;
/** @deprecated Use `SCALAR_STYLE.DOUBLE_QUOTED` instead. @internal */
var SCALAR_STYLE_DOUBLE_QUOTED = SCALAR_STYLE.DOUBLE_QUOTED;
/** @deprecated Use `SCALAR_STYLE.LITERAL_BLOCK` instead. @internal */
var SCALAR_STYLE_LITERAL_BLOCK = SCALAR_STYLE.LITERAL_BLOCK;
/** @deprecated Use `SCALAR_STYLE.FOLDED_BLOCK` instead. @internal */
var SCALAR_STYLE_FOLDED_BLOCK = SCALAR_STYLE.FOLDED_BLOCK;
/** @deprecated Use `COLLECTION_STYLE.BLOCK` instead. @internal */
var COLLECTION_STYLE_BLOCK = COLLECTION_STYLE.BLOCK;
/** @deprecated Use `COLLECTION_STYLE.FLOW` instead. @internal */
var COLLECTION_STYLE_FLOW = COLLECTION_STYLE.FLOW;
/** @deprecated Use `CHOMPING_MODE.CLIP` instead. @internal */
var CHOMPING_CLIP = CHOMPING_MODE.CLIP;
/** @deprecated Use `CHOMPING_MODE.STRIP` instead. @internal */
var CHOMPING_STRIP = CHOMPING_MODE.STRIP;
/** @deprecated Use `CHOMPING_MODE.KEEP` instead. @internal */
var CHOMPING_KEEP = CHOMPING_MODE.KEEP;
//#endregion
exports.CHOMPING_CLIP = CHOMPING_CLIP;
exports.CHOMPING_KEEP = CHOMPING_KEEP;
exports.CHOMPING_MODE = CHOMPING_MODE;
exports.CHOMPING_STRIP = CHOMPING_STRIP;
exports.COLLECTION_STYLE = COLLECTION_STYLE;
exports.COLLECTION_STYLE_BLOCK = COLLECTION_STYLE_BLOCK;
exports.COLLECTION_STYLE_FLOW = COLLECTION_STYLE_FLOW;
exports.CORE_SCHEMA = CORE_SCHEMA;
exports.DEFAULT_SCALAR_STYLE_RULES = DEFAULT_SCALAR_STYLE_RULES;
exports.DUMP_SCHEMA = DUMP_SCHEMA;
exports.EVENT_ALIAS = EVENT_ALIAS;
exports.EVENT_DOCUMENT = EVENT_DOCUMENT;
exports.EVENT_ID = EVENT_ID;
exports.EVENT_MAPPING = EVENT_MAPPING;
exports.EVENT_POP = EVENT_POP;
exports.EVENT_SCALAR = EVENT_SCALAR;
exports.EVENT_SEQUENCE = EVENT_SEQUENCE;
exports.FAILSAFE_SCHEMA = FAILSAFE_SCHEMA;
exports.JSON_SCHEMA = JSON_SCHEMA;
exports.NOT_RESOLVED = NOT_RESOLVED;
exports.SCALAR_STYLE = SCALAR_STYLE;
exports.SCALAR_STYLE_DOUBLE_QUOTED = SCALAR_STYLE_DOUBLE_QUOTED;
exports.SCALAR_STYLE_FOLDED_BLOCK = SCALAR_STYLE_FOLDED_BLOCK;
exports.SCALAR_STYLE_LITERAL_BLOCK = SCALAR_STYLE_LITERAL_BLOCK;
exports.SCALAR_STYLE_PLAIN = SCALAR_STYLE_PLAIN;
exports.SCALAR_STYLE_SINGLE_QUOTED = SCALAR_STYLE_SINGLE_QUOTED;
exports.Schema = Schema;
exports.VISIT_BREAK = VISIT_BREAK;
exports.VISIT_SKIP = VISIT_SKIP;
exports.YAML11_SCHEMA = YAML11_SCHEMA;
exports.YAMLException = YAMLException;
exports.binaryTag = binaryTag;
exports.boolCoreTag = boolCoreTag;
exports.boolJsonTag = boolJsonTag;
exports.boolYaml11Tag = boolYaml11Tag;
exports.constructFromEvents = constructFromEvents;
exports.defineMappingTag = defineMappingTag;
exports.defineScalarTag = defineScalarTag;
exports.defineSequenceTag = defineSequenceTag;
exports.dump = dump;
exports.eventsToAst = eventsToAst;
exports.floatCoreTag = floatCoreTag;
exports.floatJsonTag = floatJsonTag;
exports.floatYaml11Tag = floatYaml11Tag;
exports.getScalarValue = getScalarValue;
exports.intCoreTag = intCoreTag;
exports.intJsonTag = intJsonTag;
exports.intYaml11Tag = intYaml11Tag;
exports.jsToAst = jsToAst;
exports.legacyMapTag = legacyMapTag;
exports.load = load;
exports.loadAll = loadAll;
exports.mapTag = mapTag;
exports.mergeTag = mergeTag;
exports.nullCoreTag = nullCoreTag;
exports.nullJsonTag = nullJsonTag;
exports.nullYaml11Tag = nullYaml11Tag;
exports.omapTag = omapTag;
exports.pairsTag = pairsTag;
exports.parseEvents = parseEvents;
exports.present = present;
exports.realMapTag = realMapTag;
exports.seqTag = seqTag;
exports.setTag = setTag;
exports.strTag = strTag;
exports.timestampTag = timestampTag;
exports.visit = visit;

//# sourceMappingURL=js-yaml.cjs.js.map

/***/ }),

/***/ 750:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueManager = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const IssueBotUtils_1 = __nccwpck_require__(101);
const ProjectBoard_1 = __nccwpck_require__(820);
const StringUtils_1 = __nccwpck_require__(866);
const IssueLabels_1 = __nccwpck_require__(187);
const IssueAssignees_1 = __nccwpck_require__(154);
/**
 * Adds labels, assignees and comments and adds issue to a project board based on the content in the issue body.
 */
class IssueManager {
    constructor(issueNo, issueLabelConfig) {
        this.issueLabelConfig = issueLabelConfig;
        this.assignees = new Set();
        this.projectsToAdd = new Set();
        this.allProjects = new Set();
        this.labelsToAdd = new Set();
        this.labelsToRemove = new Set();
        this.issueBotUtils = new IssueBotUtils_1.IssueBotUtils(issueNo);
        this.projectBoard = new ProjectBoard_1.ProjectBoard(this.issueBotUtils);
        this.issueLabels = new IssueLabels_1.IssueLabels(this.issueBotUtils);
        this.issueAssignees = new IssueAssignees_1.IssueAssignees(this.issueBotUtils);
    }
    /**
     * Main entry function. Calls all the helper functions to perform specific tasks on the issue
     * @param issueBody
     */
    async updateIssue(issueBody) {
        await this.parseIssue(issueBody);
        await this.updateIssueLabels();
        await this.assignUsersToIssue();
        await this.updateIssueProjects();
    }
    /**
     * Parse the issue to determine what labels need to be added/removed, users assigned and projects the issue should belong to
     * @param issueBody
     */
    async parseIssue(issueBody) {
        const issueContent = StringUtils_1.StringUtils.getIssueSections(issueBody);
        Object.entries(this.issueLabelConfig).forEach(([header, value]) => {
            const headerContent = issueContent.get(header) || "";
            if (headerContent.trim() === "") {
                core.info(`No Content found for header: ${header}`);
                return;
            }
            core.info(`${header} Content: ${headerContent}`);
            const labels = value.labels;
            let labelFoundForHeader = false;
            // Iterate through the label config to determine what labels should be added/removed
            Object.entries(labels).forEach(([label, labelConfig]) => {
                core.info(`Checking label: ${label}`);
                const labelMatched = labelConfig.searchStrings.some(searchString => {
                    // For each search string in the config determine if a selection was made on the issue with [x]
                    core.info(`Searching string: ${searchString}`);
                    if (headerContent.includes(searchString)) {
                        core.info(`Found ${searchString}`);
                        return true;
                    }
                    return false;
                });
                // If a search string was found and selected, add the relevant label to the issue
                if (labelMatched) {
                    core.info("Found!");
                    labelFoundForHeader = true;
                    this.labelsToAdd.add(label);
                    if (labelConfig.assignees) {
                        labelConfig.assignees.forEach((username) => {
                            this.assignees.add(username);
                        });
                    }
                    if (labelConfig.project) {
                        this.projectsToAdd.add(labelConfig.project);
                    }
                }
                else {
                    // If for a given label, none of it's search strings were found or selected, remove the label from the issue (if present)
                    core.info(`Not Found!`);
                    this.labelsToRemove.add(label);
                }
                if (labelConfig.project) {
                    // If a project is configured for this label, add it to the set of all projects
                    this.allProjects.add(labelConfig.project);
                }
            });
        });
    }
    /**
     * Update the issue labels. Ensure labelsToAdd are present and labelsToRemove are not
     */
    async updateIssueLabels() {
        await this.issueLabels.updateLabels(this.labelsToAdd, this.labelsToRemove);
    }
    /**
     * Assign users to issue based on configuration and selections
     */
    async assignUsersToIssue() {
        await this.issueAssignees.assignUsersToIssue(this.assignees);
    }
    /**
     * Add issue to project board based on configuration and selections
     */
    async updateIssueProjects() {
        const projects = Array.from(this.allProjects);
        const issueId = await this.projectBoard.getIssueId();
        if (!issueId) {
            core.info(`No issue id found!`);
            return;
        }
        const promises = projects.map(async (project) => {
            if (this.projectsToAdd.has(project)) {
                await this.projectBoard.addIssueToProject(project, issueId);
            }
            else {
                await this.projectBoard.removeIssueFromProject(project, issueId);
            }
        });
        await Promise.all(promises);
    }
}
exports.IssueManager = IssueManager;


/***/ }),

/***/ 638:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TemplateEnforcer = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const IssueBotUtils_1 = __nccwpck_require__(101);
const IssueLabels_1 = __nccwpck_require__(187);
const RepoFiles_1 = __nccwpck_require__(692);
const IssueComments_1 = __nccwpck_require__(790);
const StringUtils_1 = __nccwpck_require__(866);
/**
 * Checks that a template was used and completely filled out (except optional sections)
 */
class TemplateEnforcer {
    constructor(issueNo, action) {
        this.action = action || "edited";
        this.issueBotUtils = new IssueBotUtils_1.IssueBotUtils(issueNo);
        this.issueLabels = new IssueLabels_1.IssueLabels(this.issueBotUtils);
        this.issueComments = new IssueComments_1.IssueComments(this.issueBotUtils);
        this.repoFiles = new RepoFiles_1.RepoFiles(this.issueBotUtils);
    }
    /**
     * Attempts to determine what issue template was used based on the current labels and content in the issue
     * Based on configuration leaves a comment or closes the issue if the issue did not use a template at all or did not fill it out
     * @param issueBody
     * @param config
     */
    async enforceTemplate(issueBody, config) {
        const currentLabels = await this.issueLabels.getCurrentLabels();
        const templateMap = await this.repoFiles.getIssueTemplates();
        const templateUsed = await this.getTemplate(issueBody, templateMap, currentLabels);
        let isTemplateComplete = false;
        if (templateUsed) {
            isTemplateComplete = this.didIssueFillOutTemplate(issueBody, templateUsed);
        }
        await this.commentOnIssue(config, !!templateUsed, isTemplateComplete);
        // Add/remove enforcement label if the user needs to edit their issue
        if (config.enforceTemplate && config.templateEnforcementLabel) {
            const issueLabels = new IssueLabels_1.IssueLabels(this.issueBotUtils);
            if (isTemplateComplete) {
                const currentLabels = await issueLabels.getCurrentLabels();
                await issueLabels.removeLabels([config.templateEnforcementLabel], currentLabels);
            }
            else {
                await issueLabels.addLabels([config.templateEnforcementLabel]);
            }
        }
        if (config.noTemplateClose && !templateUsed) {
            core.info("Closing issue due to no template used");
            await this.issueBotUtils.closeIssue();
            // Return true if template was not used and issue is closed
            return true;
        }
        // Return false if template was used
        return false;
    }
    /**
     * Matches the content of the issue to the best template match. If the issue was just opened, attempt to match based on the labels + headers.
     * If the issue was edited, match only based on headers. Returns the matching template content.
     * @param issueBody
     * @param templateMap
     * @param currentLabels
     */
    async getTemplate(issueBody, templateMap, currentLabels) {
        let templateName = null;
        if (this.action === "opened") {
            templateName = this.matchByLabel(templateMap, currentLabels);
            if (templateName) {
                // To verify the chosen template was at least partially used
                const chosenTemplate = new Map();
                chosenTemplate.set(templateName, templateMap.get(templateName));
                templateName = this.matchBySection(chosenTemplate, issueBody);
                if (templateName) {
                    return templateMap.get(templateName);
                }
            }
        }
        templateName = this.matchBySection(templateMap, issueBody);
        if (!templateName) {
            core.info("No matching template found!");
            return null;
        }
        return templateMap.get(templateName);
    }
    /**
     * Leaves a comment on the issue if information is missing or removes a previous warning if the issue was edited to fill in missing information
     * @param config
     * @param isTemplateUsed
     * @param isIssueFilled
     */
    async commentOnIssue(config, isTemplateUsed, isIssueFilled) {
        const baseComment = "Invalid Issue Template:";
        if (!config.incompleteTemplateMessage && !config.noTemplateMessage) {
            return;
        }
        const lastCommentId = await this.issueComments.getLastCommentId(baseComment);
        // Template used and complete, remove previous warning comment
        if (isIssueFilled) {
            if (lastCommentId) {
                core.info("Removing last comment from bot");
                await this.issueComments.removeComment(lastCommentId);
            }
            return;
        }
        let comment = baseComment + "\n";
        // No Template Used
        if (!isTemplateUsed && config.noTemplateMessage) {
            comment += config.noTemplateMessage;
        }
        else if (isTemplateUsed && config.incompleteTemplateMessage) {
            // Template used but incomplete
            comment += config.incompleteTemplateMessage;
        }
        else {
            return;
        }
        if (!lastCommentId) {
            await this.issueComments.addComment(comment);
            return;
        }
        else {
            await this.issueComments.updateComment(lastCommentId, comment);
            return;
        }
    }
    /**
     * Given the issue content and the matching template determine if all required sections have been filled out.
     * Returns boolean denoting whether or not the issue completed the template.
     * @param issueBody
     * @param template
     * @param optionalSections
     */
    didIssueFillOutTemplate(issueBody, template) {
        const requiredSections = StringUtils_1.StringUtils.getRequiredTemplateSections(template);
        const issueSections = StringUtils_1.StringUtils.getIssueSections(issueBody);
        return requiredSections.every((sectionHeader) => {
            if (!issueSections.has(sectionHeader)) {
                core.info(`Does not have header: ${sectionHeader}`);
                return false;
            }
            const issueContent = StringUtils_1.StringUtils.normalizeString(issueSections.get(sectionHeader));
            core.info(`Checking Header: ${sectionHeader}`);
            if (!issueContent.trim()) {
                core.info(`Content is empty for section ${sectionHeader}`);
                return false;
            }
            return true;
        });
    }
    /**
     * Finds the best template match based on the labels applied to the issue during creation
     * @param templateMap
     * @param currentLabels
     */
    matchByLabel(templateMap, currentLabels) {
        let largestMatch = 0;
        let templateName = null;
        templateMap.forEach((contents, filename) => {
            const templateLabels = StringUtils_1.StringUtils.getLabelsFromTemplate(contents);
            core.info(`${filename} is configured with labels: ${templateLabels.join(", ")}`);
            const templateMatch = templateLabels.every(templateLabel => {
                return currentLabels.includes(templateLabel);
            });
            if (templateMatch && largestMatch < templateLabels.length) {
                templateName = filename;
                largestMatch = templateLabels.length;
            }
        });
        core.info(`Best Possible Template Match: ${templateName}`);
        return templateName;
    }
    /**
     * Determines the best template match based on the headers included in the issue content.
     * If all headers in a template are present in an issue, it is a full match, otherwise if one or more are present it is a partial.
     * The full match with the highest number of matching headers is considered the best match. If no full matches exist, the partial match with the highest number of matching headers is considered the best match.
     * @param templateMap
     * @param issueBody
     */
    matchBySection(templateMap, issueBody) {
        let largestFullMatch = 0;
        let largestPartialMatch = 0;
        let fullMatchTemplateName = null;
        let partialMatchTemplateName = null;
        const issueSections = StringUtils_1.StringUtils.getIssueSections(issueBody);
        templateMap.forEach((contents, filename) => {
            core.info(`Checking: ${filename}`);
            const templateHeaders = StringUtils_1.StringUtils.getRequiredTemplateSections(contents);
            let sectionsMatched = 0;
            templateHeaders.forEach((sectionHeader) => {
                if (issueSections.has(sectionHeader)) {
                    sectionsMatched += 1;
                }
            });
            if (sectionsMatched === templateHeaders.length && sectionsMatched > largestFullMatch) {
                core.info(`Full Match with ${sectionsMatched} sections!`);
                largestFullMatch = sectionsMatched;
                fullMatchTemplateName = filename;
            }
            else if (sectionsMatched < templateHeaders.length && sectionsMatched > largestPartialMatch) {
                core.info(`Partial Match with ${sectionsMatched} sections!`);
                largestPartialMatch = sectionsMatched;
                partialMatchTemplateName = filename;
            }
        });
        if (largestFullMatch > 0) {
            core.info(`Best Possible Template Match: ${fullMatchTemplateName}`);
            return fullMatchTemplateName;
        }
        else {
            core.info(`Best Possible Template Match: ${partialMatchTemplateName}`);
            return partialMatchTemplateName;
        }
    }
}
exports.TemplateEnforcer = TemplateEnforcer;


/***/ }),

/***/ 829:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventNames = exports.ConfigParams = exports.Constants = void 0;
var Constants;
(function (Constants) {
    Constants["TEMPLATE_DIRECTORY"] = ".github/ISSUE_TEMPLATE";
    Constants["GITHUB_BOT_USERNAME"] = "github-actions[bot]";
})(Constants || (exports.Constants = Constants = {}));
;
var ConfigParams;
(function (ConfigParams) {
    ConfigParams["TOKEN"] = "token";
    ConfigParams["PATH"] = "config_path";
})(ConfigParams || (exports.ConfigParams = ConfigParams = {}));
;
var EventNames;
(function (EventNames) {
    EventNames["ISSUES"] = "issues";
})(EventNames || (exports.EventNames = EventNames = {}));


/***/ }),

/***/ 101:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueBotUtils = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const github = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/github'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class IssueBotUtils {
    constructor(issueNo) {
        const token = core.getInput("token");
        this.issueNo = issueNo;
        this.repoParams = {
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        };
        this.octokit = github.getOctokit(token);
    }
    /**
     * Closes the issue
     */
    async closeIssue() {
        const request = this.addRepoParams({
            issue_number: this.issueNo,
            state: "closed"
        });
        await this.octokit.issues.update(request);
    }
    ;
    /**
     * Appends the owner and repo to request object
     * @param request
     */
    addRepoParams(request) {
        return {
            ...this.repoParams,
            ...request
        };
    }
}
exports.IssueBotUtils = IssueBotUtils;


/***/ }),

/***/ 866:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StringUtils = void 0;
class StringUtils {
    /**
     * Returns a list of labels configured on a template
     * @param templateBody
     */
    static getLabelsFromTemplate(templateBody) {
        return templateBody["labels"] || [];
    }
    /**
     * Parses the template and returns an array of required sections on the template
     * @param template
     */
    static getRequiredTemplateSections(template) {
        const sections = [];
        const body = template["body"];
        if (!body) {
            return [];
        }
        body.forEach((item) => {
            if (!item["type"] || item["type"] === "markdown") {
                // Markdown does not show up in the published issue, ignore for the purposes of template matching
                return;
            }
            const validations = item["validations"];
            if (!validations) {
                return;
            }
            const required = validations["required"];
            if (!required) {
                return;
            }
            const attributes = item["attributes"];
            if (!attributes) {
                return;
            }
            const sectionName = attributes["label"];
            if (sectionName) {
                sections.push(sectionName);
            }
        });
        return sections;
    }
    ;
    /**
     * Parses the body of an issue and returns a map where the key is the heading (denoted by at least 2 #) and value is the content underneath
     * @param issueBody
     */
    static getIssueSections(issueBody) {
        const headerRegEx = RegExp("(##+\\s*(.*?\\n))(.*?)(?=##+|$)", "gs");
        let match;
        const issueContent = new Map();
        while ((match = headerRegEx.exec(issueBody)) !== null) {
            issueContent.set(match[2].trim(), match[3]);
        }
        return issueContent;
    }
    ;
    static normalizeString(rawString) {
        if (!rawString) {
            return "";
        }
        // Replace newlines and multiple whitespace characters with a single whitespace character
        return rawString.replace(/\s*[\n\r]+\s*/g, " ").trim();
    }
}
exports.StringUtils = StringUtils;


/***/ }),

/***/ 154:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueAssignees = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class IssueAssignees {
    constructor(issueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }
    /**
     * Assigns the provided users to the issue
     * @param assignees
     */
    async assignUsersToIssue(assignees) {
        const usernames = Array.from(assignees);
        if (usernames.length <= 0) {
            core.info("No Users to assign");
            return;
        }
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo,
            assignees: usernames
        });
        await this.issueBotUtils.octokit.issues.addAssignees(request);
    }
}
exports.IssueAssignees = IssueAssignees;


/***/ }),

/***/ 790:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueComments = void 0;
const Constants_1 = __nccwpck_require__(829);
class IssueComments {
    constructor(issueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }
    /**
     * Retrieve the id for the last comment on the issue
     * @param baseComment
     */
    async getLastCommentId(baseComment) {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo
        });
        const comments = await this.issueBotUtils.octokit.issues.listComments(request);
        let comment = comments.data.pop();
        while (comment) {
            if (comment.user.login === Constants_1.Constants.GITHUB_BOT_USERNAME && (!baseComment || comment.body.includes(baseComment))) {
                return comment.id;
            }
            comment = comments.data.pop();
        }
        return null;
    }
    /**
     * Post the provided comment to the issue
     * @param comment
     */
    async addComment(comment) {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo,
            body: comment
        });
        await this.issueBotUtils.octokit.issues.createComment(request);
    }
    /**
     * Update the given comment with a new comment
     * @param commentId
     * @param comment
     */
    async updateComment(commentId, comment) {
        const request = this.issueBotUtils.addRepoParams({
            comment_id: commentId,
            body: comment
        });
        await this.issueBotUtils.octokit.issues.updateComment(request);
    }
    /**
     * Delete the given comment
     * @param commentId
     */
    async removeComment(commentId) {
        const request = this.issueBotUtils.addRepoParams({
            comment_id: commentId
        });
        await this.issueBotUtils.octokit.issues.deleteComment(request);
    }
}
exports.IssueComments = IssueComments;


/***/ }),

/***/ 187:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueLabels = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class IssueLabels {
    constructor(issueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }
    /**
     * Get the labels currently applied to the issue
     */
    async getCurrentLabels() {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo
        });
        const issueLabelResponse = await this.issueBotUtils.octokit.issues.listLabelsOnIssue(request);
        const currentLabels = [];
        issueLabelResponse.data.forEach((label) => {
            currentLabels.push(label.name);
        });
        return currentLabels;
    }
    /**
     * Remove a set of labels from the issue if they are present
     * @param labelsToRemove
     * @param currentLabels
     */
    async removeLabels(labelsToRemove, currentLabels) {
        labelsToRemove.forEach(async (label) => {
            if (currentLabels.includes(label)) {
                core.info(`Attempting to remove label: ${label}`);
                const request = this.issueBotUtils.addRepoParams({
                    issue_number: this.issueBotUtils.issueNo,
                    name: label
                });
                await this.issueBotUtils.octokit.issues.removeLabel(request);
            }
        });
    }
    /**
     * Add a set of labels to the issue
     * @param labelsToAdd
     */
    async addLabels(labelsToAdd) {
        if (labelsToAdd.length > 0) {
            core.info(`Adding labels: ${Array.from(labelsToAdd).join(" ")}`);
            const request = this.issueBotUtils.addRepoParams({
                issue_number: this.issueBotUtils.issueNo,
                labels: labelsToAdd
            });
            await this.issueBotUtils.octokit.issues.addLabels(request);
        }
    }
    /**
     * Adds and removes labels to ensure that the issue contains all the labels in "labelsToAdd" and does not contain any label from "labelsToRemove"
     * @param labelsToAdd
     * @param labelsToRemove
     */
    async updateLabels(labelsToAdd, labelsToRemove) {
        const currentLabels = await this.getCurrentLabels();
        core.info(`Current Labels: ${currentLabels.join(" ")}`);
        await this.removeLabels(Array.from(labelsToRemove), currentLabels);
        const labelsToAddArray = Array.from(labelsToAdd);
        await this.addLabels(labelsToAddArray);
    }
}
exports.IssueLabels = IssueLabels;


/***/ }),

/***/ 820:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProjectBoard = void 0;
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
class ProjectBoard {
    constructor(issueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }
    /**
     * Get the project id from a project name
     * @param projectName
     */
    async getProjectId(projectName) {
        const response = await this.issueBotUtils.octokit.projects.listForRepo(this.issueBotUtils.repoParams);
        const project = response.data.find((project) => {
            return project.name === projectName;
        });
        return (project && project.id) || null;
    }
    /**
     * Get the columnId for a column on a project board i.e. "Todo"
     * @param projectId
     * @param columnName
     */
    async getProjectColumnId(projectId, columnName) {
        const request = this.issueBotUtils.addRepoParams({
            project_id: projectId
        });
        const response = await this.issueBotUtils.octokit.projects.listColumns(request);
        const column = response.data.find((column) => {
            return column.name === columnName;
        });
        return (column && column.id) || null;
    }
    /**
     * Get the unique issue id (internal to github) from an issue number (external, shown on the issue page)
     */
    async getIssueId() {
        const request = this.issueBotUtils.addRepoParams({
            issue_number: this.issueBotUtils.issueNo
        });
        const response = await this.issueBotUtils.octokit.issues.get(request);
        return response.data.id || null;
    }
    /**
     * Determine if an issue exists on a project board
     */
    async isOnProject(columnId, issueId) {
        const issueCard = await this.getProjectCardId(columnId, issueId);
        return !!issueCard;
    }
    /**
     * Get the id for the issue card on a project board
     * @param columnId
     * @param issueId
     */
    async getProjectCardId(columnId, issueId) {
        const listCardsRequest = this.issueBotUtils.addRepoParams({
            column_id: columnId
        });
        const cardsResponse = await this.issueBotUtils.octokit.projects.listCards(listCardsRequest);
        const issueCard = cardsResponse.data.find(async (card) => {
            const getCardRequest = this.issueBotUtils.addRepoParams({
                card_id: card.id
            });
            const issue = await this.issueBotUtils.octokit.projects.getCard(getCardRequest);
            return issue.data.id === issueId;
        });
        return (issueCard && issueCard.id) || null;
    }
    /**
     * Add an issue to a project board
     * @param project
     * @param issueId
     */
    async addIssueToProject(project, issueId) {
        const projectId = await this.getProjectId(project.name);
        if (!projectId) {
            core.info(`No project id found for: ${project.name}`);
            return;
        }
        const columnId = await this.getProjectColumnId(projectId, project.column);
        if (!columnId) {
            core.info(`No column id found for ${project.column} on project ${project.name}`);
            return;
        }
        const isOnProject = await this.isOnProject(columnId, issueId);
        if (isOnProject) {
            core.info(`Already on project: ${project.name}`);
            return;
        }
        const request = this.issueBotUtils.addRepoParams({
            column_id: columnId,
            content_id: issueId,
            content_type: "Issue"
        });
        await this.issueBotUtils.octokit.projects.createCard(request);
    }
    /**
     * Remove an issue from a project board
     * @param project
     * @param issueId
     */
    async removeIssueFromProject(project, issueId) {
        const projectId = await this.getProjectId(project.name);
        if (!projectId) {
            core.info(`No project id found for: ${project.name}`);
            return;
        }
        const columnId = await this.getProjectColumnId(projectId, project.column);
        if (!columnId) {
            core.info(`No column id found for ${project.column} on project ${project.name}`);
            return;
        }
        const cardId = await this.getProjectCardId(columnId, issueId);
        if (!cardId) {
            core.info(`Not on project: ${project.name}`);
            return;
        }
        core.info(`Attempting to remove from project: ${project.name}`);
        const request = this.issueBotUtils.addRepoParams({
            card_id: cardId
        });
        await this.issueBotUtils.octokit.projects.deleteCard(request);
    }
}
exports.ProjectBoard = ProjectBoard;


/***/ }),

/***/ 692:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RepoFiles = void 0;
const github = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/github'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const Constants_1 = __nccwpck_require__(829);
const yaml = __nccwpck_require__(103);
class RepoFiles {
    constructor(issueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }
    /**
     * Get the contents of a file in the repo
     * @param filepath
     */
    async getFileContents(filepath) {
        const request = this.issueBotUtils.addRepoParams({
            path: filepath,
            ref: github.context.sha
        });
        const response = await this.issueBotUtils.octokit.repos.getContent(request);
        return Buffer.from(response.data.content, response.data.encoding).toString();
    }
    /**
     * Get the bot configuration
     */
    async getConfig() {
        const configPath = core.getInput(Constants_1.ConfigParams.PATH);
        const fileContents = await this.getFileContents(configPath);
        try {
            return JSON.parse(fileContents);
        }
        catch (e) {
            return null;
        }
    }
    ;
    /**
     * Get all the issue templates from the repo. Return a map where the key is the template filename and the value is the contents of the template md file.
     */
    async getIssueTemplates() {
        const request = this.issueBotUtils.addRepoParams({
            path: Constants_1.Constants.TEMPLATE_DIRECTORY,
            ref: github.context.sha
        });
        const response = await this.issueBotUtils.octokit.repos.getContent(request);
        const filenames = [];
        const templates = new Map();
        response.data.forEach((file) => {
            if (file.type === "file" && file.name.endsWith(".yml") && file.name !== "config.yml") {
                core.info(`Found template: ${file.name}`);
                filenames.push(file.name);
            }
        });
        const promises = filenames.map(async (filename) => {
            const fileContents = await this.getFileContents(`${Constants_1.Constants.TEMPLATE_DIRECTORY}/${filename}`);
            const yamlContents = yaml.load(fileContents);
            templates.set(filename, yamlContents);
        });
        await Promise.all(promises);
        return templates;
    }
}
exports.RepoFiles = RepoFiles;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/asset-relocator-loader */
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const github = __nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/github'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
const IssueBotUtils_1 = __nccwpck_require__(101);
const RepoFiles_1 = __nccwpck_require__(692);
const IssueManager_1 = __nccwpck_require__(750);
const TemplateEnforcer_1 = __nccwpck_require__(638);
/**
 * Entry point for the issue template bot
 */
async function run() {
    core.info(`Event of type: ${github.context.eventName} triggered workflow`);
    if (github.context.eventName !== "issues") {
        core.setFailed("Can only run on issues!");
        return;
    }
    const payload = github.context.payload;
    if (!payload) {
        core.setFailed("No payload!");
        return;
    }
    try {
        core.debug(`Issue Payload: ${JSON.stringify(payload)}`);
    }
    catch (e) { }
    if (payload.changes && !!payload.changes.old_issue) {
        core.info("This issue was transferred from another repository. Skipping.");
        return;
    }
    const issue = payload.issue;
    if (!issue) {
        core.setFailed("No issue on payload!");
        return;
    }
    if (issue.number && issue.body) {
        const issueBotUtils = new IssueBotUtils_1.IssueBotUtils(issue.number);
        const repoFiles = new RepoFiles_1.RepoFiles(issueBotUtils);
        // Get the issue bot config
        const config = await repoFiles.getConfig();
        if (!config) {
            core.setFailed("Unable to parse config file!");
            return;
        }
        if (config.ignoreIssuesOpenedBefore) {
            try {
                const createDate = Date.parse(issue.created_at);
                const ignoreBeforeDate = Date.parse(config.ignoreIssuesOpenedBefore);
                if (createDate < ignoreBeforeDate) {
                    core.info(`Ignoring issue due to configuration. Issue created at: ${issue.created_at}`);
                    return;
                }
            }
            catch (e) {
                core.error(`Error Occurred when parsing dates: ${e}`);
                return;
            }
        }
        // Ensure a template was used and filled out
        core.info("Start Template Enforcer");
        const templateEnforcer = new TemplateEnforcer_1.TemplateEnforcer(issue.number, payload.action);
        const closed = await templateEnforcer.enforceTemplate(issue.body, config);
        if (closed) {
            return;
        }
        // Label, assign, comment on issue based on content in the issue body
        core.info("Start Issue Manager");
        const issueManager = new IssueManager_1.IssueManager(issue.number, config.selectors);
        await issueManager.updateIssue(issue.body);
    }
    else {
        core.setFailed("No issue number or body available, cannot label issue!");
        return;
    }
}
run().catch(error => core.setFailed(`Workflow failed with error message: ${error.message}`));

})();

module.exports = __webpack_exports__;
/******/ })()
;