ES7+: The Future of Javascript
==============================

Javascript's come a long way in the last few years. To take advantage of that,
and to write code that's clean and easy to read, we're using many features from
ES6 (current officialish version) and ES7 (next version, mostly stable.) We
transpile our code so that it works in modern and older browsers using
[Babel](babeljs.io), which has an
[excellent overview](http://babeljs.io/docs/learn-es2015/) on what's new.

Some of the features we use heavily are:

Import / Export
---------------

`import` and `export` replace the old `require()` of node.js. You can read up
on various usages in the [babeljs docs](http://babeljs.io/docs/learn-es2015/#modules).
Of note: we're still using babel 5.x, so the syntax has changed slightly.

Classes
-------

Classes are the backbone of React views. You'll be seeing this a lot:

```javascript
class MyView {
  constructor (props) {
    this.props = props;
  }

  render () {
    return; //...
  }
}
```

Template Strings
----------------

Template strings are super duper.

```javascript
const name = 'Jack';
const myStr = `my name is ${name}`;
```

While we're at it...

let / const
-----------

`let` is lexical scoping, while `const` provides lexical scoping _and_
immutability. We're still converting our old code, but we prefer `const`
everywhere possible, and `let` where necessary - never `var`.


```javascript
function f() {
  {
    let x;
    {
      // okay, block scoped name
      const x = "sneaky";
      // error, const
      x = "foo";
    }
    // okay, declared with `let`
    x = "bar";
    // error, already declared in block
    let x = "inner";
  }
}
```

Generators (ES6) and Async / Await (ES7)
----------------------------------------

All koa and koa-router middleware are generators, which lets you do neat things
like:

```javascript
function * requestTimings (next) {
  console.log(`Request started at ${Date.now()}`);
  yield* next;
  console.log(`Request ended at ${Date.now()}`);
}

koa.use(requestTimings);
```

This code logs, then yields to all of the other middleware (including the
render!), and then logs again.

Async/await are nice ways to handle UI elements that update the API, such as:

```javascript

class DeleteButton {
  render () {
    return <button onClick={delete.bind(this, this.props.link.id)} />
  }

  async function delete(id, e) {
    e.preventDefault();

    try {
      await this.props.api.delete(id);
      this.setState({ deleted: true });
    } catch (e) {
      console.log('There was an error deleting.');
    }
  }
}
```

Rather than writing promise-handling code with nested `then` and error
statements, we can use `await` to wait for a promise response before continuing
code execution.
