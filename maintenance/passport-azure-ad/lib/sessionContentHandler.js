/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use restrict";

const aadutils = require("./aadutils");

/*
 * the handler for state/nonce/policy
 * @maxAmout          - the max amount of {state: x, nonce: x, policy: x, timeStamp: x} tuples you want to save in the session
 * @maxAge            - when a tuple in session expires in seconds
 */ 
function SessionContentHandler(maxAmount, maxAge) {
  if (!maxAmount || (typeof maxAmount !== "number" || maxAmount <= 0 || maxAmount % 1 !== 0))
    throw new Error("SessionContentHandler: maxAmount must be a positive integer");
  if (!maxAge || (typeof maxAge !== "number" || maxAge <= 0))
    throw new Error("SessionContentHandler: maxAge must be a positive number");
  this.maxAge = maxAge;  // seconds
  this.maxAmount = maxAmount;
}

SessionContentHandler.prototype.findAndDeleteTupleByState = function(req, sessionKey, stateToFind) {
  if (!req.session)
    throw new Error("OIDC strategy requires session support. Did you forget to use session middleware such as express-session?");

  // the array in session
  let array = req.session[sessionKey] && req.session[sessionKey]["content"];
  if (!array)
    array = [];

  // remove the expired tuples in array
  aadutils.processArray(array, this.maxAmount, this.maxAge);

  // find the tuple by state value
  const tuple = aadutils.findAndDeleteTupleByState(array, stateToFind);

  // clear empty array, and clear the session if there is nothing inside
  if (req.session[sessionKey] && array.length === 0)
    delete req.session[sessionKey]["content"];
  if (req.session[sessionKey] && Object.keys(req.session[sessionKey]).length === 0)
    delete req.session[sessionKey];

  return tuple;
};

SessionContentHandler.prototype.add = function(req, sessionKey, tupleToAdd) {
  if (!req.session)
    req.session = {};
  if (!req.session[sessionKey])
    req.session[sessionKey] = {};
  if (!req.session[sessionKey]["content"])
    req.session[sessionKey]["content"] = [];

  const array = req.session[sessionKey]["content"];
  aadutils.processArray(array, this.maxAmount-1, this.maxAge);

  array.push(tupleToAdd);
};

exports.SessionContentHandler = SessionContentHandler;
