Architectural Goals
===================

The goals of the stack:

* Easy to develop on
    * Uses common languages, technologies and libraries
    * Minimal code complexity
* High-performance
    * Fast client-side rendering and reaction to changes
    * Fast server-side rendering, and cacheability
* Accessible
    * Works with current _and_ old browsers
    * Server-side rendering for SEO, screen readers, and old devices

We chose a ES6+ / node / react.js stack because:

* Javascript, because browsers use Javascript - so we must choose either the
  language itself or a language that compiles _to_ Javascript. To reduce
  barriers to entry, and to write code which is closer to the output, Javascript
  or a similar variant (Typescript, or future versions such as ES6+) are goods
  choices. Some languages and frameworks get around this by abstracting out
  direct manipulation of the UX layer (Rails / Turbolinks is one notable
  example), but that does not allow building a rich UI without also duplicating
  a large amount of code in different languages between server- and client-
  sides if one wants to provide server-side rendering. (In our case, we do.)
  Additionally, a large majority of existing Javascript libraries have chosen
  to use JS because it is "universal" within the community, so rather than
  choosing a language such as Coffeescript, Javascript itself is more
  compatible with an open-source codebase.
* ECMAScript version 6+ provides many utilities to write cleaner-looking code,
  without abstracting into another language. It is forward-facing, in that
  we are using upcoming official versions of Javascript, with future
  compatibility.
* Node.js allows you to run the same code on the server _and_ the client,
  allowing us to write easily testable libraries and minimize code duplication.
  Rather than re-implementing logic in two languages, we can use Javascript and
  write it once.
* React.js is a templating system (_not_ a full client-side stack) which allows
  building DOM output and updating it based on data changes. It uses logic to
  watch deltas in data passed into elements, which makes it easy to write
  performant DOM-update code. It has also rapidly risen in popularity, and
  internally, reddit was experimenting with React.js on most new products, so
  we went with react.js.

Anatomy of a Request
====================

tl;dr:

```
request ->
  server ->
    router -> { build properties for view }
    view -> { put properties in an html template }
    { send html to client }
  browser ->
    load html, css, and javascript
    initialize javascript, bind links to client-side router
    click link ->
      view -> { put properties in an html template }
      { render DOM updates }
```

1. A request goes to the server, which runs middleware
2. One of the middlewares is a mounted app, which responds to urls on the
  request context
3. Properties to send to the views are added to the request context
  (`context.props`)
4. A page is rendered using `context.props`, waiting for API calls to finish
  if any are listed in `context.props.data`
5. The browser gets html, then mounts a copy of the same app code that was
  mounted on the server.
6. Link clicks go through the app, and render client-side, rendering
  immediately, and progressively updating as ajax calls finish (from
  `context.props.data`, set in the route)

More detail:

1. A request is made to https://m.reddit.com
2. The request first goes through a CDN, with some logic, such as:
  * Do not cache if there is a "token" cookie;
  * Do not cache if there are cookies that manipulate view output (such as
    "compact mode")
3. If the request is not immediately returned by the CDN, the request continues
  on to AWS. It moves through a load balancer onto a web server.
4. The web server has several clustered node processes (one per core, by
  default configuration), managed by node's built-in clustering API. The
  request is then handled by a `Server` instance.
5. The `Server` is a class with an instance of `koa`, a generator-based node
  webserver. The request passes through asynchronous middleware, such as a
  function that puts some cookie values into the request context and one which sets
  a cookie for logged-out anonymous tracking ids. `Server` also has an instance
  of a `horse-react` `app`. The request is handed by `app.render` at the end of
  the middleware call stack ([see code](../blob/master/src/server/index.jsx))
6. `app.render` uses a `router` to call a function based on request url. The
  router then uses its own middleware; one such sets default properties on
  `context.props` such as (`title`, `user`, and `country`), which are later sent
  to the view for rendering. After the router middleware stack is finished, it
   matches the route (`/`, which calls `indexPage`, in our example.)
  ([see code](../blob/master/src/routes.jsx#L275))
7. The `indexPage` function then:
    1. Sets values on `context.props`, which will be passed on to the views,
    such as subreddit name, current page, and current sort.
    ([see code](../blob/master/src/routes.jsx#L280))
    2. Builds an API query for links, including data such as subreddit name
    and sort.
    ([see code](../blob/master/src/routes.jsx#L296))
    3. Adds an api call to `context.props.data` through calling `setData`.
    API calls return promises. In this case, `setData` is called rather than
    the direct API call to `api.listings.get` because we want this data to load
    from the cache - and setData will hydrate the API cache if available
    (currently only turned on client-side.) Otherwise, one could simply use
    `this.props.data.set('listings', this.props.api.listings.get(options));`.
    ([see code](../blob/master/src/routes.jsx#L307))
    4. Finally, `makeBody` is called with `IndexPage`, which is the React page
    element we want to render. `react-horse` expects `context.body` to be a
    function which accepts `props` and returns a React element; `makeBody`
    abstracts some of the logic so that you can call it with one or more
    elements.  ([see code](../blob/master/src/routes.jsx#L193))
8. Once the route is complete, the server then waits for the response from all
  promises in `context.props.data`. That data is loaded into
  `context.props.dataCache`, and the page is rendered as an html string, which
  finishes the request cycle, and the response is sent to the browser.
  (horse-react manages data and rendering;
  [see code](https://github.com/reddit/horse-react/blob/master/src/server.es6.js#L89))
9. The value of `context.props` is sent to the client-side in a `bootstrap`
  object, which allows the javascript to mount client-side with all of the data
  returned by the api, as well as shared configuration and context information
  (such as user token.)
10. The browser renders the html, CSS, and JS. The same route logic and react
  templates used on the server are sent to the browser in a javascript package.
  When the browser is ready, it runs code from `client`, instantiates an app,
  and just like the server, pushes the current URL through the app's router,
  and renders and mounts the react view. (This is a fast operation as no DOM
  changes should occur - but events, such as `onClick`, will now be bound on
  the client.) All links on the page will attempt to run through the router,
  other than those with `target=_blank`, `data-no-route=true`, or absolute urls
  with protocols - so from this stage forward, the browser never contacts the
  node server other than in special cases where it must post data that it cannot
  to the API (such as login and register.)

Anatomy of a Page
=================

A page, and its components, are Javascript classes which return React.js
markup in a `render` method. They inherit from `BasePage` or `BaseComponent`
classes, which provide common methods and configuration.

Read up in the [react.js docs](https://facebook.github.io/react/docs/component-specs.html)
to learn more about component lifecycle, but it will be discussed at some level
of detail here as well.

Structure
---------

A page has, at minimum, a render method, which returns JSX markup. A simple
page may look like:

```javascript
import React from 'react';
import BasePage from './BasePage';

class MyPage extends BasePage {
  render() {
    let { listings } = this.state.data;

    if (!listings) { return <h1>Loading</h1>; }

    return (
      <ul>
        {listings.map((l) => {
          <li>
            <a href={l.permalink}>
              {l.title}
            </a>
          </li>
        })}
      </ul>
    );
  }
}
```

In our pages, when a page gets rendered, it also inherits some things from
BasePage, and in turn, BaseComponent. BasePage:

* Reads `props.dataCache`, and sets the `state.data` for the page to the cache if
  it exists. It will exist in the case that the page is rendered server-side
  (beacuse the server completed all data promises before rendering) or if the
  page is being bootstrapped by the first client-side load (because the JSON
  was passed down to the page.) In cases where a user clicked a link and was
  routed client-side, dataCache will be empty, and the list of `props.data` promises
  will be used instead. The page will attempt to resolve all of the `props.data`
  promises, and update the page's state when they return, allowing for a
  progressive data load.
* Automatically fires a tracking pixel if a `track` getter is defined on the
  class. The BasePage will wait for the API call corresponding to the value of
  `track`, and then fire its pixel with contextual data (such as logged-out user
  id and experiments).

If your page uses data, it will be loaded into `this.state.data`, which maps
directly to the values in the `context.props.data` in the route. For example,
`context.props.data.set('comments', this.api.comments.get(options))` would
result in `this.state.data.comments` to be set. `this.state.meta.comments` also
contains any metainformation (such as tracking pixel url) sent back by the API.

The request context and `props`
-------------------------------

In a page, `this.props` maps _directly_ to the `props` returned by a route.
`this.state` is initialized by `BasePage`, which will initially contain only
`data` and `meta`.


Events
------

App includes an event emitter. `app.emit('name', 'value')` and
`app.on('name', function...)` are good ways to send events between decoupled
views. A file, `constants.js`, contains commonly used values for event names
and other constants.

Cookies
-------

Cookies are accessible server-side on the request context (`context.cookies.set`
and `context.cookies.get`, respectively. see
[koa documentation](http://koajs.com/) for more details.) On the client, it's
preferred to emit an event to change a cookie, handled in client.es6.js via
`cookies.get` and `cookies.set`. To pass in cookie values in both cases, they
should be read in during the request cycle (koa middleware on the server, or
`modifyContext` in the cilent) and passed in as page properties.


Caching and Gotchas
-------------------

While the server does no caching of its own, there a CDN may handle edge
caching. This can cause problems if you have cookies or experiments that change
the output of the page based on their value. Make sure to either add exceptions
for experiments in the CDN settings, or else you may have to have the client
display updated output and lose the benefits of server-side rendering.

