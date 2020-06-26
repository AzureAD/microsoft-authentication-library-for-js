{
  "targets": [
    {
      'target_name': 'dpapi',
      'version': '0.1.0',
      'sources': [
        'src/dpapi/main.cpp',
        'src/dpapi/dpapi_addon.h'
      ],
      'include_dirs': [
                "<!(node -e \"require('nan')\")",
                "include"
       ],
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'src/dpapi/dpapi_win.cpp',
          ],
          'libraries': [
                '-lcrypt32.lib'
            ],
        }],
        ['OS not in ["win"]', {
            'sources': [ 'src/dpapi/dpapi_not_supported.ccp' ]
        }]
      ]
    }
  ]
}
