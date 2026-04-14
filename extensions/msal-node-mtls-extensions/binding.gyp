{
  "targets": [
    {
      "target_name": "msal_mtls_win",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": [ "/std:c++17" ]
        }
      },
      "sources": [
        "native/addon/msal_mtls_win_main.cpp"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include_dir\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "conditions": [
        ["OS==\"win\"", {
          "sources": [
            "native/addon/cng_key.cpp",
            "native/addon/attestation.cpp",
            "native/addon/winhttp_mtls.cpp"
          ],
          "libraries": [
            "-lncrypt.lib",
            "-lwinhttp.lib",
            "-lcrypt32.lib",
            "-lbcrypt.lib"
          ]
        }],
        ["OS!=\"win\"", {
          "sources": [
            "native/addon/not_supported.cpp"
          ]
        }]
      ]
    }
  ]
}
