/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
 // Implementation referenced from https://github.com/bradhugh/node-dpapi

#include <napi.h>
#include <uv.h>
#include <Windows.h>
#include <dpapi.h>
#include <functional>
#include <iostream>
#include <string>

Napi::Value ProtectDataCommon(bool protect, const Napi::CallbackInfo& info)
{
	Napi::Env env = info.Env();

	if (info.Length() != 3) {
		throw Napi::RangeError::New(env, "3 arguments are required");
	}

	if (info[0].IsNull() || 
		info[0].IsUndefined() || 
		!info[0].IsTypedArray() || 
		info[0].As<Napi::TypedArray>().TypedArrayType() != napi_uint8_array)
	{
		throw Napi::TypeError::New(env, "First argument, data, must be a valid Uint8Array");
	}

	if (!info[1].IsNull() && 
		(!info[1].IsTypedArray() || info[1].As<Napi::TypedArray>().TypedArrayType() != napi_uint8_array))
	{
		throw Napi::TypeError::New(env, "Second argument, optionalEntropy, must be null or an ArrayBuffer");
	}

	if (info[2].IsNull() || info[2].IsUndefined() || !info[2].IsString())
	{
		throw Napi::TypeError::New(env, "Third argument, scope, must be a string");
	}

	DWORD flags = 0;
	Napi::String strData = info[2].As<Napi::String>();
	std::string scope = strData.Utf8Value();
	if (stricmp(scope.c_str(), "LocalMachine") == 0)
	{
		flags = CRYPTPROTECT_LOCAL_MACHINE;
	}

	auto buffer = info[0].As<Napi::Buffer<char>>().Data();
	auto len = info[0].As<Napi::Buffer<char>>().ElementLength();

	DATA_BLOB entropyBlob;
	entropyBlob.pbData = nullptr;
	if (!info[1].IsNull())
	{
		entropyBlob.pbData = reinterpret_cast<BYTE*>(info[1].As<Napi::Buffer<char>>().Data());
		entropyBlob.cbData = info[1].As<Napi::Buffer<char>>().ElementLength();
	}

	DATA_BLOB dataIn;
	DATA_BLOB dataOut;

	// initialize input data
	dataIn.pbData = reinterpret_cast<BYTE*>(buffer);
	dataIn.cbData = len;

	bool success = false;

	// Call either Protect or Unprotect based on the flag
	if (protect)
	{
		success = CryptProtectData(
			&dataIn,
			nullptr, // Description string
			entropyBlob.pbData ? &entropyBlob : nullptr,
			nullptr, // reserved
			nullptr, // pass null for the prompt structure
			flags, // dwFlags
			&dataOut);
	}
	else
	{
		success = CryptUnprotectData(
			&dataIn,
			nullptr, // Description string
			entropyBlob.pbData ? &entropyBlob : nullptr,
			nullptr, // reserved
			nullptr, // pass null for the prompt structure
			flags, // dwFlags
			&dataOut);
	}

	if (!success)
	{
		DWORD errorCode = GetLastError();
		std::string errorMessage = std::string("Encryption/Decryption failed. Error code: ") + std::to_string(errorCode);
		throw Napi::Error::New(env, &errorMessage[0]);
	}

	// Copy and free the buffer
	Napi::Buffer<char> returnBuffer = Napi::Buffer<char>::Copy(env, reinterpret_cast<char*>(dataOut.pbData), dataOut.cbData);
	LocalFree(dataOut.pbData);

	return returnBuffer;
}
