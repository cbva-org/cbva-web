# Gotchas

This document contains common errors ran into during development and how to fix them.

## Buffer is not defined

This occurs when code that should only be ran on the server is included in the client bundle and sent to the browser. The build system automatically strips server code where it is able to determine it is server only code. Server code should only be called in a when using `createServerFn`. See the "Where to call server functions" link below to understand how server functions can be called.

Server code does not need to be inside the handler callback for `createServerFn` but it is easy to accidentally include code that is only referred to in there. I've gotten bit by these so far:

- Exporting a function intended for use only on the server from a file that includes isomorphic exports. If its exported, the bundler doesn't know who uses it. This can be solved by using tanstack start's `createServerOnlyFn` or moving the function to a separate file for export.

Resources:

- [Tanstack Start's execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)
- [Where to call server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions#where-to-call-server-functions)
