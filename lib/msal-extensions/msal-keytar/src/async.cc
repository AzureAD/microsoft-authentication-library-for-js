#include <string>
#include <vector>

#include "nan.h"
#include "keytar.h"
#include "async.h"

using keytar::KEYTAR_OP_RESULT;

SetPasswordWorker::SetPasswordWorker(
  const std::string& service,
  const std::string& account,
  const std::string& password,
  Nan::Callback* callback
) : AsyncWorker(callback),
    service(service),
    account(account),
    password(password) {}

SetPasswordWorker::~SetPasswordWorker() {}

void SetPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::SetPassword(service,
                                                account,
                                                password,
                                                &error);
  if (result == keytar::FAIL_ERROR) {
    SetErrorMessage(error.c_str());
  }
}



GetPasswordWorker::GetPasswordWorker(
  const std::string& service,
  const std::string& account,
  Nan::Callback* callback
) : AsyncWorker(callback),
    service(service),
    account(account) {}

GetPasswordWorker::~GetPasswordWorker() {}

void GetPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::GetPassword(service,
                                                account,
                                                &password,
                                                &error);
  if (result == keytar::FAIL_ERROR) {
    SetErrorMessage(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void GetPasswordWorker::HandleOKCallback() {
  Nan::HandleScope scope;
  v8::Local<v8::Value> val = Nan::Null();
  if (success) {
    val = Nan::New<v8::String>(password.data(),
                               password.length()).ToLocalChecked();
  }
  v8::Local<v8::Value> argv[] = {
    Nan::Null(),
    val
  };

  callback->Call(2, argv, async_resource);
}



DeletePasswordWorker::DeletePasswordWorker(
  const std::string& service,
  const std::string& account,
  Nan::Callback* callback
) : AsyncWorker(callback),
    service(service),
    account(account) {}

DeletePasswordWorker::~DeletePasswordWorker() {}

void DeletePasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::DeletePassword(service, account, &error);
  if (result == keytar::FAIL_ERROR) {
    SetErrorMessage(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void DeletePasswordWorker::HandleOKCallback() {
  Nan::HandleScope scope;
  v8::Local<v8::Boolean> val =
    Nan::New<v8::Boolean>(success);
  v8::Local<v8::Value> argv[] = {
    Nan::Null(),
    val
  };

  callback->Call(2, argv, async_resource);
}



FindPasswordWorker::FindPasswordWorker(
  const std::string& service,
  Nan::Callback* callback
) : AsyncWorker(callback),
    service(service) {}

FindPasswordWorker::~FindPasswordWorker() {}

void FindPasswordWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::FindPassword(service,
                                                 &password,
                                                 &error);
  if (result == keytar::FAIL_ERROR) {
    SetErrorMessage(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void FindPasswordWorker::HandleOKCallback() {
  Nan::HandleScope scope;
  v8::Local<v8::Value> val = Nan::Null();
  if (success) {
    val = Nan::New<v8::String>(password.data(),
                               password.length()).ToLocalChecked();
  }
  v8::Local<v8::Value> argv[] = {
    Nan::Null(),
    val
  };

  callback->Call(2, argv, async_resource);
}



FindCredentialsWorker::FindCredentialsWorker(
  const std::string& service,
  Nan::Callback* callback
) : AsyncWorker(callback),
    service(service) {}

FindCredentialsWorker::~FindCredentialsWorker() {}

void FindCredentialsWorker::Execute() {
  std::string error;
  KEYTAR_OP_RESULT result = keytar::FindCredentials(service,
                                                    &credentials,
                                                    &error);
  if (result == keytar::FAIL_ERROR) {
    SetErrorMessage(error.c_str());
  } else if (result == keytar::FAIL_NONFATAL) {
    success = false;
  } else {
    success = true;
  }
}

void FindCredentialsWorker::HandleOKCallback() {
  Nan::HandleScope scope;

  if (success) {
    v8::Local<v8::Array> val = Nan::New<v8::Array>(credentials.size());
    unsigned int idx = 0;
    std::vector<keytar::Credentials>::iterator it;
    for (it = credentials.begin(); it != credentials.end(); it++) {
      keytar::Credentials cred = *it;
      v8::Local<v8::Object> obj = Nan::New<v8::Object>();

      v8::Local<v8::String> account = Nan::New<v8::String>(
        cred.first.data(),
        cred.first.length()).ToLocalChecked();

      v8::Local<v8::String> password = Nan::New<v8::String>(
        cred.second.data(),
        cred.second.length()).ToLocalChecked();

#ifndef _WIN32
#pragma GCC diagnostic ignored "-Wunused-result"
#endif
      obj->Set(
        Nan::GetCurrentContext(),
        Nan::New("account").ToLocalChecked(),
        account);
#ifndef _WIN32
#pragma GCC diagnostic ignored "-Wunused-result"
#endif
      obj->Set(
        Nan::GetCurrentContext(),
        Nan::New("password").ToLocalChecked(),
        password);

      Nan::Set(val, idx, obj);
      ++idx;
    }

    v8::Local<v8::Value> argv[] = {
      Nan::Null(),
      val
    };
    callback->Call(2, argv, async_resource);
  } else {
    v8::Local<v8::Value> argv[] = {
      Nan::Null(),
      Nan::New<v8::Array>(0)
    };
    callback->Call(2, argv, async_resource);
  }
}
