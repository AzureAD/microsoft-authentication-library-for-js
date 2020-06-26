/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

#include <nan.h>
#include "dpapi_addon.h"

NAN_METHOD(protectData)
{
	ProtectDataCommon(true, info);
}

NAN_METHOD(unprotectData)
{
	ProtectDataCommon(false, info);
}

NAN_MODULE_INIT(init)
{
	Nan::Set(
		target,
		Nan::New<v8::String>("protectData").ToLocalChecked(),
		Nan::GetFunction(Nan::New<v8::FunctionTemplate>(protectData)).ToLocalChecked());

	Nan::Set(
		target,
		Nan::New<v8::String>("unprotectData").ToLocalChecked(),
		Nan::GetFunction(Nan::New<v8::FunctionTemplate>(unprotectData)).ToLocalChecked());
}

NODE_MODULE(binding, init)
