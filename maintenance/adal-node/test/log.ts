/*
 * @copyright
 * Copyright © Microsoft Open Technologies, Inc.
 *
 * All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 * ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A
 * PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
 *
 * See the Apache License, Version 2.0 for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';
/* Directive tells jshint that suite and test are globals defined by mocha */
/* global suite */
/* global test */

import * as _ from "underscore";
import * as assert from "assert";

const util = require('./util/util');

import * as adal from "../lib/adal";

suite('log', function() {
  test('settings-none', function(done) {
    var currentOptions = adal.Logging.getLoggingOptions();
    adal.Logging.setLoggingOptions(currentOptions);
    var options = adal.Logging.getLoggingOptions();

    var noOptionsSet = (!options ||
                        null === options ||
                        {} === options ||
                        0 === options.level);

    // Set the looging options back to what they were before this test so that
    // future tests are logged as they should be.
    adal.Logging.setLoggingOptions(currentOptions);

    assert(noOptionsSet, 'Did not expect to find any logging options set: ' + JSON.stringify(options));
    done();
  });

  test('console-settings', function(done) {
    var currentOptions = adal.Logging.getLoggingOptions();
    util.turnOnLogging();
    var options = adal.Logging.getLoggingOptions();
    var level = options.level;
    var logFunc = options.log;

    // Set the looging options back to what they were before this test so that
    // future tests are logged as they should be.
    adal.Logging.setLoggingOptions(currentOptions);

    assert(level === 3, `Logging level was not the expected value of 3: ${options.level}`);
    assert(_.isFunction(logFunc), 'Unexpected logging function: ' + logFunc);
    done();
  });
});

