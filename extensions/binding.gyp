{
  "targets": [
    {
      'target_name': 'dpapi',
      'version': '0.1.0',
      'sources': [
        'src/dpapi-addon/main.cpp',
        'src/dpapi-addon/dpapi_addon.h'
      ],
      'include_dirs': [
                "<!(node -e \"require('nan')\")",
                "include"
       ],
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'src/dpapi-addon/dpapi_win.cpp',
          ],
          'libraries': [
                '-lcrypt32.lib'
            ],
        }],
        ['OS not in ["win"]', {
            'sources': [ 'src/dpapi-addon/dpapi_not_supported.ccp' ]
        }]
      ]
    }
  ]
}
