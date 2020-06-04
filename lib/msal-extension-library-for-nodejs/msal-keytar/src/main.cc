#include "nan.h"
#include "async.h"

namespace {

NAN_METHOD(SetPassword) {
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("Parameter 'service' must be a string");
    return;
  }

  Nan::Utf8String serviceNan(info[0]);
  std::string service(*serviceNan, serviceNan.length());

  if (!info[1]->IsString()) {
    Nan::ThrowTypeError("Parameter 'username' must be a string");
    return;
  }

  Nan::Utf8String usernameNan(info[1]);
  std::string username(*usernameNan, usernameNan.length());

  if (!info[2]->IsString()) {
    Nan::ThrowTypeError("Parameter 'password' must be a string");
    return;
  }

  Nan::Utf8String passwordNan(info[2]);
  std::string password(*passwordNan, passwordNan.length());

  SetPasswordWorker* worker = new SetPasswordWorker(
    service,
    username,
    password,
    new Nan::Callback(info[3].As<v8::Function>()));
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(GetPassword) {
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("Parameter 'service' must be a string");
    return;
  }

  Nan::Utf8String serviceNan(info[0]);
  std::string service(*serviceNan, serviceNan.length());

  if (!info[1]->IsString()) {
    Nan::ThrowTypeError("Parameter 'username' must be a string");
    return;
  }

  Nan::Utf8String usernameNan(info[1]);
  std::string username(*usernameNan, usernameNan.length());

  GetPasswordWorker* worker = new GetPasswordWorker(
    service,
    username,
    new Nan::Callback(info[2].As<v8::Function>()));
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(DeletePassword) {
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("Parameter 'service' must be a string");
    return;
  }

  Nan::Utf8String serviceNan(info[0]);
  std::string service(*serviceNan, serviceNan.length());

  if (!info[1]->IsString()) {
    Nan::ThrowTypeError("Parameter 'username' must be a string");
    return;
  }

  Nan::Utf8String usernameNan(info[1]);
  std::string username(*usernameNan, usernameNan.length());

  DeletePasswordWorker* worker = new DeletePasswordWorker(
    service,
    username,
    new Nan::Callback(info[2].As<v8::Function>()));
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(FindPassword) {
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("Parameter 'service' must be a string");
    return;
  }

  Nan::Utf8String serviceNan(info[0]);
  std::string service(*serviceNan, serviceNan.length());

  FindPasswordWorker* worker = new FindPasswordWorker(
    service,
    new Nan::Callback(info[1].As<v8::Function>()));
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(FindCredentials) {
  if (!info[0]->IsString()) {
    Nan::ThrowTypeError("Parameter 'service' must be a string");
    return;
  }

  Nan::Utf8String serviceNan(info[0]);
  std::string service(*serviceNan, serviceNan.length());

  FindCredentialsWorker* worker = new FindCredentialsWorker(
    service,
    new Nan::Callback(info[1].As<v8::Function>()));
  Nan::AsyncQueueWorker(worker);
}

NAN_MODULE_INIT(Init) {
  Nan::SetMethod(target, "getPassword", GetPassword);
  Nan::SetMethod(target, "setPassword", SetPassword);
  Nan::SetMethod(target, "deletePassword", DeletePassword);
  Nan::SetMethod(target, "findPassword", FindPassword);
  Nan::SetMethod(target, "findCredentials", FindCredentials);
}

}  // namespace

#if NODE_MAJOR_VERSION >= 10
NAN_MODULE_WORKER_ENABLED(keytar, Init)
#else
NODE_MODULE(keytar, Init)
#endif
