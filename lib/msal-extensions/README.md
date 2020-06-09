# Microsoft Authentication Extensions for Node
The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. It gives additional support to the Microsoft Authentication Library for Node (MSAL).

MSAL Node supports an in-memory cache by default and provides the ICacheManager to perform cache serialization. Developers are required to implement their own cache persistance across multiple platforms and Microsoft Authentication Extensions makes this simpler.

The supported platforms are Windows, Mac and Linux.

Windows - DPAPI is used for encryption.

MAC - The MAC KeyChain is used.

Linux - LibSecret is used for encryption.

> Note: It is recommended to use this library for cache persistence support for Public client applications such as Desktop apps only. In web applications, this may lead to scale and performance issues. Web applications are recommended to persist the cache in session.


## Building

The extensions contain prebuild binaries. To build from source, you will need Python on you path.

- Open `msal-extensions`, run `lerna bootstrap`

On linux, the library uses `libsecret` so you may need to install it.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
