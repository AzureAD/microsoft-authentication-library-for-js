/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

#include <node.h>

v8::Local<v8::String> CreateUtf8String(v8::Isolate* isolate, char* strData)
{
	return v8::String::NewFromUtf8(isolate, strData, v8::NewStringType::kNormal).ToLocalChecked();
}

void ProtectDataCommon(bool protect, Nan::NAN_METHOD_ARGS_TYPE info)
{
	v8::Isolate* isolate = info.GetIsolate();

	isolate->ThrowException(v8::Exception::Error(
		CreateUtf8String(isolate, "Data protection API is not available on macOs or Linux")));
}
