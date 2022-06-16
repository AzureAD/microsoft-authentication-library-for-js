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

'use restrict';

const chai = require('chai');
const expect = chai.expect;
const SessionContentHandler = require('../../lib/sessionContentHandler').SessionContentHandler; 

const TEST_TIMEOUT = 1000000; // 1000 seconds

describe('checking constructor', function() {
  this.timeout(TEST_TIMEOUT);

  it('should throw with non-integer maxAmount', function(done) {
    expect(SessionContentHandler.bind(SessionContentHandler, 1.1, 1)).
      to.throw('SessionContentHandler: maxAmount must be a positive integer');
    done();
  });

  it('should throw with negative maxAmount', function(done) {
    expect(SessionContentHandler.bind(SessionContentHandler, -1, 1)).
      to.throw('SessionContentHandler: maxAmount must be a positive integer');
    done();
  });

  it('should throw with invalid maxAge', function(done) {
    expect(SessionContentHandler.bind(SessionContentHandler, 1, -1)).
      to.throw('SessionContentHandler: maxAge must be a positive number');
    done();
  });
});

describe('checking add function', function() {
  this.timeout(TEST_TIMEOUT);

  var req = {};
  var handler = new SessionContentHandler(2, 0.1);

  it('should have the tuples we push in', function(done) {
    handler.add(req, 'key', {'state': 'state1', 'nonce': 'nonce1', 'policy': 'policy1', 'timeStamp': Date.now()});
    handler.add(req, 'key', {'state': 'state2', 'nonce': 'nonce2', 'policy': 'policy2', 'timeStamp': Date.now()});

    expect(req.session['key']['content'].length).to.equal(2);

    var tuple1 = req.session['key']['content'][0];
    expect(tuple1['state']).to.equal('state1');   
    expect(tuple1['nonce']).to.equal('nonce1');
    expect(tuple1['policy']).to.equal('policy1');

    var tuple2 = req.session['key']['content'][1];
    expect(tuple2['state']).to.equal('state2');   
    expect(tuple2['nonce']).to.equal('nonce2');
    expect(tuple2['policy']).to.equal('policy2');

    done();
  });

  it('should not exceed the maxAmount of items', function(done) {
    // we add a third item, but the maxAmount allowed is 2, so the first
    // state should be removed automatically
    handler.add(req, 'key', {'state': 'state3', 'nonce': 'nonce3', 'policy': 'policy3', 'timeStamp': Date.now()});
    expect(req.session['key']['content'].length).to.equal(2);

    var tuple1 = req.session['key']['content'][0];
    expect(tuple1['state']).to.equal('state2');   
    expect(tuple1['nonce']).to.equal('nonce2');
    expect(tuple1['policy']).to.equal('policy2');

    var tuple2 = req.session['key']['content'][1];
    expect(tuple2['state']).to.equal('state3');   
    expect(tuple2['nonce']).to.equal('nonce3');
    expect(tuple2['policy']).to.equal('policy3');

    done();
  });

  it('should removed expired items', function(done) {
    // if we call 'add' function after the maxAge, all the expired ones should be
    // removed when we can 'add' function  
    setTimeout(function() {
    handler.add(req, 'key', {'state': 'state4', 'nonce': 'nonce4', 'policy': 'policy4', 'timeStamp': Date.now()});
      expect(req.session['key']['content'].length).to.equal(1);
      expect(req.session['key']['content'][0]['state']).to.equal('state4');
      expect(req.session['key']['content'][0]['nonce']).to.equal('nonce4');
      expect(req.session['key']['content'][0]['policy']).to.equal('policy4');
      done();
    }, 200);  // maxAge is 0.1 second = 100 ms 
  });
});

describe('checking findAndDeleteTupleByState function', function() {
  this.timeout(TEST_TIMEOUT);
  
  var req = {};
  var handler = new SessionContentHandler(2, 0.1);

  it('should throw without session', function(done) {
    expect(handler.findAndDeleteTupleByState.bind(handler, req, 'key', 'test')).
      to.throw('OIDC strategy requires session support. Did you forget to use session middleware such as express-session?');
    done();
  });

  it('should find the tuple we added, tuple should be deleted after verify', function(done) {
    handler.add(req, 'key', {'state': 'state1', 'nonce': 'nonce1', 'policy': 'policy1', 'timeStamp': Date.now()});

    // should have the items we added
    var tuple = handler.findAndDeleteTupleByState(req, 'key', 'state1');
    expect(tuple['state']).to.equal('state1');

    // should be deleted after verify
    tuple = handler.findAndDeleteTupleByState(req, 'key', 'state1');
    expect(tuple).to.equal(null);
  
    done();
  });

  it('should not find the expired item', function(done) {
    handler.add(req, 'key', {'state': 'state1', 'nonce': 'nonce1', 'policy': 'policy1', 'timeStamp': Date.now()});

    setTimeout(function() {
      var tuple = handler.findAndDeleteTupleByState(req, 'key', 'state1');
      expect(tuple).to.equal(null);
      done();
    }, 200); // expire after 0.1 second = 100ms, wait a little bit longer here (for 0.2 seconds)
  });
});
