/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

#include <napi.h>
#include <uv.h>
#include "dpapi_addon.h"

Napi::Value protectData(const Napi::CallbackInfo& info)
{
	return ProtectDataCommon(true, info);
}

Napi::Value unprotectData(const Napi::CallbackInfo& info)
{
	return ProtectDataCommon(false, info);
}

Napi::Object init(Napi::Env env, Napi::Object exports) {
	exports.Set(Napi::String::New(env, "protectData"),
		Napi::Function::New(env, protectData));

	exports.Set(Napi::String::New(env, "unprotectData"),
		Napi::Function::New(env, unprotectData));
	
	return exports;
}

NODE_API_MODULE(dpapi, init)
