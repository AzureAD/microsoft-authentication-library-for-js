#include <node.h>
#include <nan.h>
#include <Windows.h>
#include <dpapi.h>
#include <functional>
#include <iostream>

v8::Local<v8::String> CreateUtf8String(v8::Isolate* isolate, char* strData)
{
	return v8::String::NewFromUtf8(isolate, strData, v8::NewStringType::kNormal).ToLocalChecked();
}

void ProtectDataCommon(bool protect, Nan::NAN_METHOD_ARGS_TYPE info)
{
	v8::Isolate* isolate = info.GetIsolate();

	if (info.Length() != 3) {
		isolate->ThrowException(v8::Exception::RangeError(
			CreateUtf8String(isolate, "3 arguments are required")));
	}

	if (info[0]->IsNullOrUndefined() || !info[0]->IsUint8Array())
	{
		isolate->ThrowException(v8::Exception::TypeError(
			CreateUtf8String(isolate, "First argument, data, must be a valid Uint8Array")));
	}

	if (!info[1]->IsNull() && !info[1]->IsUint8Array())
	{
		isolate->ThrowException(v8::Exception::TypeError(
			CreateUtf8String(isolate, "Second argument, optionalEntropy, must be null or an ArrayBuffer")));
	}

	if (info[2]->IsNullOrUndefined() || !info[2]->IsString())
	{
		isolate->ThrowException(v8::Exception::TypeError(
			CreateUtf8String(isolate, "Third argument, scope, must be a string")));
	}

	DWORD flags = 0;
	if (!info[2]->IsNullOrUndefined())
	{
		v8::String::Utf8Value strData(isolate, info[2]);
		std::string scope(*strData);
		if (stricmp(scope.c_str(), "LocalMachine") == 0)
		{
			flags = CRYPTPROTECT_LOCAL_MACHINE;
		}
	}

	auto buffer = node::Buffer::Data(info[0]);
	auto len = node::Buffer::Length(info[0]);

	DATA_BLOB entropyBlob;
	entropyBlob.pbData = nullptr;
	if (!info[1]->IsNull())
	{
		entropyBlob.pbData = reinterpret_cast<BYTE*>(node::Buffer::Data(info[1]));
		entropyBlob.cbData = node::Buffer::Length(info[1]);
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
		isolate->ThrowException(v8::Exception::Error(
			CreateUtf8String(isolate, "Decryption failed.")));

		return;
	}

	// Copy and free the buffer
	auto returnBuffer = Nan::CopyBuffer(reinterpret_cast<const char*>(dataOut.pbData), dataOut.cbData).ToLocalChecked();
	LocalFree(dataOut.pbData);

	info.GetReturnValue().Set(returnBuffer);
}

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
