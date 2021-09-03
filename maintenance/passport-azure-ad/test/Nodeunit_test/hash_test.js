/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* eslint-disable no-new */

'use strict';

const utils = require('../../lib/aadutils');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

 exports.hashTest = {

  'should recognize the code and c_hash pair is valid': (test) => {
    test.expect(1);
    var code = 'OAAABAAAA0TWEUN3YUUq5vuCvmnaQiV2K0FwRHqI7u-VXhnGiX0U5u__oid-BUXdlqsWGfHTWV9cIBzYj_S5OoR06m_-b4CbNA-QMMNTCt6VUiynMIRHJvrJMgzuVzkrwnsyfbtMvvpnUoHLH1_qbdkM3dGQj0YgiN_-CcIIzzqtw5KtGmusuZQK8OYQG-KcDqxw1q56mEan2wWrS2U70gWkB0pylkJrOS09BgSmYKZrPCwO7VAco_e9RP8M1fMVP1k5bXCkBwVTCuWm23IXt1CxxJmtQGGEKxH5lETAFqRpFq_P57QDtzjhAPOy6uwM6IXbk2ZU4s3O81M_CTtm3dUlFsYKaPntCgSELZvL0X-6uv5DNXmymJY5hoxcPWlMOOofU7X6fe3U1fBlUsa4ifgaZQsaqQeQO3LR8rYRu3wBKRpGStIvsanGfF9Sdan66EwOmlsdkDhWNgxzM3v0fAvPEg6nyiD7jyfqXBuJCvlGxXdewj82M9xK32xxqB965b9ubR_Ncjki7T4vF0LiO4r85P9yuWktNc_tbnQ0kqFenzozAVQX4t33i-pCk94Me4FUrirRwLvkfwsn0Zmc_aEPa98YHes3cSvA2JZG71SqciA33dV0sTaFOjecjZgk_3_hFO2iTooI27tEBnnkhZNxDIsGpgE4dM0q1wldP-s4UT9QkRmd_LJke7WLyXsdMC9K4x2P6b8P7cngVEzc6yXwbhsq_p3tY5YFDDUecUclgTgeYy1MgAA';
    var c_hash = '4_VbjhfR5g6MSxOYZcvQdw';
    var valid = utils.checkHashValueRS256(code, c_hash);

    test.ok(valid, 'should pass with correct code and c_hash pair');
    test.done();
  },

  'should recognize the code and c_hash pair is invalid': (test) => {
    test.expect(1);
    var code = 'PAAABAAAA0TWEUN3YUUq5vuCvmnaQiV2K0FwRHqI7u-VXhnGiX0U5u__oid-BUXdlqsWGfHTWV9cIBzYj_S5OoR06m_-b4CbNA-QMMNTCt6VUiynMIRHJvrJMgzuVzkrwnsyfbtMvvpnUoHLH1_qbdkM3dGQj0YgiN_-CcIIzzqtw5KtGmusuZQK8OYQG-KcDqxw1q56mEan2wWrS2U70gWkB0pylkJrOS09BgSmYKZrPCwO7VAco_e9RP8M1fMVP1k5bXCkBwVTCuWm23IXt1CxxJmtQGGEKxH5lETAFqRpFq_P57QDtzjhAPOy6uwM6IXbk2ZU4s3O81M_CTtm3dUlFsYKaPntCgSELZvL0X-6uv5DNXmymJY5hoxcPWlMOOofU7X6fe3U1fBlUsa4ifgaZQsaqQeQO3LR8rYRu3wBKRpGStIvsanGfF9Sdan66EwOmlsdkDhWNgxzM3v0fAvPEg6nyiD7jyfqXBuJCvlGxXdewj82M9xK32xxqB965b9ubR_Ncjki7T4vF0LiO4r85P9yuWktNc_tbnQ0kqFenzozAVQX4t33i-pCk94Me4FUrirRwLvkfwsn0Zmc_aEPa98YHes3cSvA2JZG71SqciA33dV0sTaFOjecjZgk_3_hFO2iTooI27tEBnnkhZNxDIsGpgE4dM0q1wldP-s4UT9QkRmd_LJke7WLyXsdMC9K4x2P6b8P7cngVEzc6yXwbhsq_p3tY5YFDDUecUclgTgeYy1MgAA';
    var c_hash = '4_VbjhfR5g6MSxOYZcvQdw';
    var valid = utils.checkHashValueRS256(code, c_hash);

    test.ok(!valid, 'should pass with correct code and c_hash pair');
    test.done();
  },
};
