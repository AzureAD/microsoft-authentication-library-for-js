/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

#include <napi.h>

void ProtectDataCommon(bool protect, const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();

	throw Napi::Error::New(env, "Data protection API is not available on macOs or Linux");
}
