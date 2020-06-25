{
  "targets": [
    {
      "target_name": "dpapi",
      "version": "0.1.0",
      "sources": [ "./src/dpapi/dpapi.cpp" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "include"
      ],
      "libraries": [
        "-lcrypt32.lib"
      ]
    }
  ]
}
