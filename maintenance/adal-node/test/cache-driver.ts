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

const async = require("async");
const util = require('./util/util');
const cp = util.commonParameters;
const testRequire = util.testRequire;

const MemoryCache = testRequire('memory-cache');
const CacheDriver = testRequire('cache-driver');

suite('CacheDriver', function() {

  function unexpectedRefreshFunction() {
    assert(false, 'Unexpected attempt to refresh a token.');
  }

  function assertEntriesEqual(expected: any, received: any, message: string) {
    if (!_.isEqual(expected, received)) {
      util.findDiffs(expected, received);
      console.log('Expected:');
      console.log(expected);
      console.log('Received');
      console.log(received);
      assert(false, message);
    }
  }

  /*
   * Compares two lists of cache entries.  The lists will be sorted before comparison and the comparison will
   * take in to account the different ways that MRRT is indicated when a cache entry is submitted to the cache
   * and once it is in the cache.
   */
  function compareInputAndCache(input: any, cache: any, numMRRTTokens: any, mrrtRefreshToken?: any) {
    var foundNumMRRTTokens = 0;
    var cacheEntries = cache._entries;
    var authority = cp.authorityTenant;
    var userId = cp.username;

    assert(input.length === cacheEntries.length, 'Input responses and cache entries lengths are not the same: ' + input.length + ',' + cacheEntries.length);

    input = _.sortBy(input, 'accessToken');
    cacheEntries = _.sortBy(cacheEntries, 'accessToken');

    for (var j = 0; j < cacheEntries.length; j++) {
      var expected = _.clone(input[j]);
      var received = _.clone(cacheEntries[j]);

      if (received.isMRRT) {
        foundNumMRRTTokens++;
        if (received._authority === authority && received.userId === userId) {
          // Everything should match except the refresh token.  We will check that below.
          delete expected['refreshToken'];
          delete received['refreshToken'];
        }
      }
      assertEntriesEqual(expected, received, 'Found a modified entry number ' + j);
    }

    if (numMRRTTokens) {
      assert(numMRRTTokens === foundNumMRRTTokens, 'Found wrong number of MRRT tokens in the cache: ' + numMRRTTokens + ',' + foundNumMRRTTokens);

      // Ensure that when the last refresh token was added that all mrrt refresh tokens were updated to contain that same
      // refresh token.
      for (var i = 0; i < cacheEntries[i].length; i++) {
        if (cacheEntries[i].isMRRT) {
          assert(cacheEntries[i]['refreshToken'] === mrrtRefreshToken, 'One of the responses refresh token was not correctly updated: ' + i);
        }
      }
    }
  }


  test('add-entry', function(done) {
    var fakeTokenRequest = util.createEmptyADALObject();

    var response = util.createResponse();
    var expectedResponse = response.cachedResponse;

    var memCache = new MemoryCache();
    var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, response.authority, response.resource, response.clientId, memCache, unexpectedRefreshFunction);

    cacheDriver.add(response.decodedResponse, function(err: any) {
      var stack = err ? err.stack : null;
      assert(!err, 'Received unexpected error: ' + stack);
      var length = memCache._entries.length;
      assert(length === 1, 'Cache after test has does not have the correct number of entries ' + length + ': ' + memCache._entries);
      assertEntriesEqual(expectedResponse, memCache._entries[0], 'The saved cache entry has been modified');
      done();
    });
  });

  test('add-entry-no-cache', function(done) {
    var fakeTokenRequest = util.createEmptyADALObject();

    var response = util.createResponse();

    var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, response.authority, response.resource, cp.clientId, null, unexpectedRefreshFunction);

    cacheDriver.add(response.decodedResponse, function(err: any) {
      var stack = err ? err.stack : null;
      assert(!err, 'Received unexpected error: ' + stack);
      done();
    });
  });

  test('add-entry-single-mrrt', function(done) {
    var fakeTokenRequest = util.createEmptyADALObject();

    var responseOptions = { mrrt : true };
    var response = util.createResponse(responseOptions);
    var expectedResponse = response.cachedResponse;
    var resource = response.resource;

    var memCache = new MemoryCache();
    var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, response.authority, resource, cp.clientId, memCache, unexpectedRefreshFunction);

    cacheDriver.add(response.decodedResponse, function(err: any) {
      var stack = err ? err.stack : null;
      assert(!err, 'Received unexpected error: ' + stack);
      var length = memCache._entries.length;
      assert(length === 1, 'Cache after test has does not have the correct number of entrie ' + length + ': ' + memCache._entries);
      assertEntriesEqual(expectedResponse, memCache._entries[0], 'The saved cache entry has been modified');
      done();
    });
  });

  /**
   * Creates a new CacheDriver with a MemoryCache and fills it with test entries.
   * @param  {int}   numEntries The total number of entries that should be in the cache
   * @param  {int}   numMrrt    The number of tokens in the cache that should be mrrt tokens.  This number must
   *                            be smaller than numEntries.
   * @param  {Function} callback   returns an object with the CacheDriver etc...
   */
  function fillCache(numEntries: any, numMrrt: any, addExpired: any, callback: any) {
    var fakeTokenRequest = util.createEmptyADALObject();

    var memCache = new MemoryCache();
    var authority = cp.authorityTenant;

    var responses: any = [];
    var divisor = Math.floor(numEntries / numMrrt);
    var finalMrrt: any;
    var expiredEntry: any;
    for (var i = 0; i < numEntries; i++) {
      var responseOptions: any = { authority : cp.authorityTenant};
      if (numMrrt && ((i + 1) % divisor) === 0) {
        responseOptions.mrrt = true;
      } else if (addExpired) {
        responseOptions.expired = expiredEntry ? false : true;
      }
      var newResponse = util.createResponse(responseOptions, i);
      finalMrrt = responseOptions.mrrt ? newResponse.refreshToken : finalMrrt;
      expiredEntry = responseOptions.expired ? newResponse : expiredEntry;
      responses.push(newResponse);
    }

    var count = 0;
    var finalRefreshToken: any;
    async.whilst(
      function() { return count < numEntries; },
      function(callback: any) {
        var resource = responses[count].resource;
        var clientId = responses[count].clientId;
        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, authority, resource, clientId, memCache, unexpectedRefreshFunction);
        var responseToAdd = _.clone(responses[count].decodedResponse);
        cacheDriver.add(responseToAdd, function(err: any) {
          count++;
          process.nextTick(function() {
            callback(err);
            return;
          });
        });
      },
      function(err: any) {
        var cachedResponses = [];
        for (var j = 0; j < responses.length; j++) {
          cachedResponses.push(responses[j].cachedResponse);
        }

        var testValues = {
          cachedResponses : cachedResponses,
          memCache : memCache,
          finalMrrt : finalMrrt,
          fakeTokenRequest : fakeTokenRequest,
          authority : authority,
          expiredEntry : expiredEntry
        };

        callback(err, testValues, finalRefreshToken);
      }
    );
  }

  test('add-multiple-entries-ensure-authority-respected', function(done) {
    var numMRRTTokens = 6;
    fillCache(20, numMRRTTokens, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens);

        var otherAuthority = 'someOtherAuthority';
        var responseOptions = { authority : otherAuthority, mrrt : true, resource : responses[0].resource };
        var differentAuthorityResponse = util.createResponse(responseOptions, 21);
        delete responseOptions.authority;
        var extraMRRTResponse = util.createResponse(responseOptions, 21);
        responses.push(extraMRRTResponse.cachedResponse);
        responses.push(differentAuthorityResponse.cachedResponse);
        numMRRTTokens += 2;

        // order is important here.  We want to ensure that when we add the second MRRT it has only updated
        // the refresh token of the entries with the same authority.
        // update: with mega refresh token(cross tenant RT), refresh token of the entry will be updated if there is a match with userId, clientId. 
        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, otherAuthority, differentAuthorityResponse.resource, differentAuthorityResponse.clientId, memCache, unexpectedRefreshFunction);
        cacheDriver.add(differentAuthorityResponse.decodedResponse, function(err: any) {
          assert(!err, 'Unexpected err adding entry with different authority.');

          var cacheDriver2 = new CacheDriver(fakeTokenRequest._callContext, cp.authorityTenant, extraMRRTResponse.resource, extraMRRTResponse.clientId, memCache, unexpectedRefreshFunction);
          cacheDriver2.add(extraMRRTResponse.decodedResponse, function(err2: any) {
            assert(!err2, 'Unexpected error adding second entry with previous authority.');

            // ensure that we only find the mrrt with the different authority.
            cacheDriver.find( { resource : differentAuthorityResponse.resource}, function(err3: any, entry: any) {
              assert(!err3, 'Unexpected error returned from find.');
              assertEntriesEqual(differentAuthorityResponse.cachedResponse, entry, 'Queried entry did not match expected indicating authority was not respected');
            });
            done();
          });
        });
      }
    });
  });

  test('add-multiple-entries-find-non-mrrt', function(done) {
    var numMRRTTokens = 6;
    fillCache(20, numMRRTTokens, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens);

        var findResponse = _.find(responses, function(entry: any) { return !entry.isMRRT; });
        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, cp.authorityTenant, findResponse.resource, findResponse.clientId, memCache, unexpectedRefreshFunction);
        cacheDriver.find({}, function(err: any, entry: any) {
          if (!err) {
            assert(entry, 'Find did not return any entry');
            assertEntriesEqual(findResponse, entry, 'Queried entry did not match expected: ' + JSON.stringify(entry));
          }
          done(err);
          return;
        });
      } else {
        done(err);
        return;
      }
    });
  });

  test('add-multiple-entries-mrrt', function(done) {
    var numMRRTTokens = 6;
    fillCache(19, numMRRTTokens, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var finalMrrt = testValues.finalMrrt;

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);
      }

      done();
      return;
    });
  });

  // This test is actually testing two different things.
  //  1. When a new MRRT is added to the cache only MRRT
  //     tokens with the same userId are updated.
  //  2. Check that url safe base64 decoding is happening
  //     correctly.
  test('add-multiple-entries-mrrt-different-users--url-safe-id_token', function(done) {
    var numMRRTTokens = 6;
    fillCache(19, numMRRTTokens, false, function(err: any, testValues: any) {
      err;
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var finalMrrt = testValues.finalMrrt;
      var fakeTokenRequest = testValues.fakeTokenRequest;

      var responseOptions = { mrrt : true, refreshedRefresh : true, urlSafeUserId : true };
      var refreshedResponse = util.createResponse(responseOptions);

      // verify that the returned response contains an id_token that will actually
      // test url safe base64 decoding.
      assert(-1 !== refreshedResponse.wireResponse['id_token'].indexOf('_'), 'No special characters in the test id_token.  ' +
        'This test is not testing one of the things it was intended to test.');

      responses.push(refreshedResponse.cachedResponse);

      var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, testValues.authority, refreshedResponse.resource, refreshedResponse.clientId, memCache, unexpectedRefreshFunction);
      cacheDriver.add(refreshedResponse.decodedResponse, function(err: any) {
        if (!err) {
          compareInputAndCache(responses, memCache, numMRRTTokens + 1, finalMrrt);
        }
        done(err);
        return;
      });
    });
  });

  test('add-multiple-entries-find-mrrt', function(done) {
    var numMRRTTokens = 6;
    fillCache(20, numMRRTTokens, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;

      var mrrtEntry: any = _.findWhere(memCache._entries, { isMRRT : true });

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens);

        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, cp.authorityTenant, mrrtEntry.resource, mrrtEntry._clientId, memCache, unexpectedRefreshFunction);
        cacheDriver.find({}, function(err: any, entry: any) {
          if (!err) {
            assert(entry, 'Find did not return any entry');
            assertEntriesEqual(mrrtEntry, entry, 'Queried entry did not match expected: ' + JSON.stringify(entry));
          }
          done(err);
          return;
        });
      } else {
        done(err);
        return;
      }
    });
  });

  function createRefreshFunction(expectedRefreshToken: any, response: any) {
    var refreshFunction = function(entry: any, resource: any, callback: any) {
      resource;
      if (expectedRefreshToken !== entry['refreshToken']) {
        console.log('RECEIVED:');
        console.log(entry.refreshToken);
        console.log('EXPECTED');
        console.log(expectedRefreshToken);
        assert(false, 'RefreshFunction received unexpected refresh token: ' + entry['refreshToken']);
      }
      assert(_.isFunction(callback), 'callback parameter is not a function');

      callback(null, response);
    };

    return refreshFunction;
  }

  test('add-multiple-entries-mrrt-find-refreshed-mrrt', function(done) {
    var numMRRTTokens = 5;
    fillCache(20, 5, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;
      var finalMrrt = testValues.finalMrrt;
      var authority = testValues.authority;

      var unknownResource = 'unknownResource';
      var responseOptions = { resource : unknownResource, mrrt : true, refreshedRefresh : true };
      var refreshedResponse = util.createResponse(responseOptions);
      var refreshedRefreshToken = refreshedResponse.refreshToken;

      var refreshFunction = createRefreshFunction(finalMrrt, refreshedResponse.decodedResponse);

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);

        responses.push(refreshedResponse.cachedResponse);
        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, authority, unknownResource, cp.clientId, memCache, refreshFunction);
        cacheDriver.find(null, function(err: any, entry: any) {
          if (!err) {
            assert(entry, 'Expected a matching entry, but none was returned.');
            assert(entry.resource === unknownResource, 'Unexpected resource returned:' + entry.resource);
            assert(refreshedRefreshToken === entry['refreshToken'], 'Returned refresh token did not match expected');
            compareInputAndCache(responses, memCache, numMRRTTokens + 1, entry.refreshToken);

            // Now ensure that the refreshed token can be successfully found in the cache.
            var query = {
              userId : entry.userId,
              clientId : cp.clientId
            };
            cacheDriver.find(query, function(err: any, recentlyCachedEntry: any) {
              if (!err) {
                assert(recentlyCachedEntry, 'Expected a returned entry but none was returned.');
                assertEntriesEqual(entry, recentlyCachedEntry, 'Token returned from cache was not the same as the one that was recently cached.');
                compareInputAndCache(responses, memCache, numMRRTTokens + 1, entry.refreshToken);
              }
              done(err);
              return;
            });
          } else {
            done(err);
            return;
          }
        });
      } else {
        done(err);
        return;
      }
    });
  });

  test('add-multiple-entries-failed-mrrt-refresh', function(done) {
    var numMRRTTokens = 5;
    fillCache(20, 5, false, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;
      var finalMrrt = testValues.finalMrrt;
      var authority = testValues.authority;

      var unknownResource = 'unknownResource';
      var refreshFunction = function(entry: any, resource: any, callback: any) { entry; resource; callback(new Error('FAILED REFRESH')); };

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);

        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, authority, unknownResource, cp.clientId, memCache, refreshFunction);
        cacheDriver.find(null, function(err: any) {
          assert(err, 'Did not receive expected error.');
          assert(-1 !== err.message.indexOf('FAILED REFRESH'), 'Error message did not contain correct text');
          compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);
          done();
          return;
        });
      } else {
        done(err);
        return;
      }
    });
  });

  function removeResponse(collection: any, response: any) {
    return _.filter(collection, function(entry) {
      if (_.isEqual(response, entry)) {
        return false;
      }
      return true;
    });
  }

  test('expired-access-token', function(done) {
    var numMRRTTokens = 5;
    fillCache(20, 5, true, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;
      var authority = testValues.authority;
      var expiredEntry = testValues.expiredEntry.cachedResponse;
      var finalMrrt = testValues.finalMrrt;

      var responseOptions = { resource : expiredEntry.resource, refreshedRefresh : true };
      var refreshedResponse = util.createResponse(responseOptions);
      var refreshedRefreshToken = refreshedResponse.refreshToken;
      var refreshFunction = createRefreshFunction(expiredEntry['refreshToken'], refreshedResponse.decodedResponse);

      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);

        responses = removeResponse(responses, expiredEntry);
        responses.push(refreshedResponse.cachedResponse);
        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, authority, expiredEntry.resource, cp.clientId, memCache, refreshFunction);
        cacheDriver.find(null, function(err: any, entry: any) {
          if (!err) {
            assert(entry, 'Expected a matching entry, but none was returned.');
            assert(entry.resource === expiredEntry.resource, 'Unexpected resource returned:' + entry.resource);
            assert(refreshedRefreshToken === entry['refreshToken'], 'Returned refresh token did not match expected');
            compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);

            // Now ensure that the refreshed token can be successfully found in the cache.
            var query = {
              userId : entry.userId,
              clientId : cp.clientId
            };
            cacheDriver.find(query, function(err: any, recentlyCachedEntry: any) {
              if (!err) {
                assert(recentlyCachedEntry, 'Expected a returned entry but none was returned.');
                assertEntriesEqual(entry, recentlyCachedEntry, 'Token returned from cache was not the same as the one that was recently cached.');
                compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);
              }
              done(err);
              return;
            });
          } else {
            done(err);
            return;
          }
        });
      } else {
        done(err);
        return;
      }
    });
  });

  test('expired-access-token-failed-refresh', function(done) {
    var numMRRTTokens = 5;
    fillCache(20, 5, true, function(err: any, testValues: any) {
      var responses = testValues.cachedResponses;
      var memCache = testValues.memCache;
      var fakeTokenRequest = testValues.fakeTokenRequest;
      var authority = testValues.authority;
      var expiredEntry = testValues.expiredEntry.cachedResponse;
      var finalMrrt = testValues.finalMrrt;

      var refreshFunction = function(entry: any, resource: any, callback: any) { entry; resource; callback(new Error('FAILED REFRESH')); };
      if (!err) {
        compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);

        var cacheDriver = new CacheDriver(fakeTokenRequest._callContext, authority, expiredEntry.resource, cp.clientId, memCache, refreshFunction);
        cacheDriver.find(null, function(err: any) {
          assert(err, 'Did not receive expected error about failed refresh.');
          assert(-1 !== err.message.indexOf('FAILED REFRESH'), 'Error message did not contain correct text');
          compareInputAndCache(responses, memCache, numMRRTTokens, finalMrrt);
          done();
          return;
        });
      } else {
        done(err);
        return;
      }
    });
  });
});