So What's the Big Deal About Running Serverside Javascript Anyways
==================================================================

"Isomorphism", in web development, is a word that has come to describe
applications that run a majority of their code on both the server and client.
The most obvious benefit of developing an application that way is that you can
write your code once- not twice, if you had a split-language application.
Libraries for API access, validation, template rendering (and the templates
themselves) are all shared and testable in any environment.

In reddit-mobile's case, that means having, essentially, a `client.js` file and
a `server.js` file that each mount the same application code. We've chosen
libraries specificially for their sharability, and we use the same transpiler
([[babel|ECMAScript]]) on both sides.

There is a limited amount of code that only runs in one stack, outside of
`client.js` and `server.js`, which is intentionally kept to a minimum:

* For error logging, `context.env` is checked in `app-mixin`. This ensures that
  server-side errors display that the error occured on the server, rather than
  on a browser.
* The API library snoode checks `options.env` to determine whether or not it
  should use cached API responses - the server should not cache, but the client
  does.
