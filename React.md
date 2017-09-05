React.js, a UI Library
======================

React.js is the "view" layer of a traditional "MVC" pattern - it can take
objects and return a rendered view, it can update itself based on changing data.
It's worth going through the [official docs](https://facebook.github.io/react/),
especially the sections about component lifecycle, to get a good understanding
of React. Some of the patterns used in reddit-mobile are described below.

General design patterns:

* Prefer the _most correct_ HTML element- (don't use a link's `onClick` to "submit"
  an API call. Use a button on a form, and use the form's `onSubmit` method
  instead.)
* All pages should work with javascript disabled. If you write forms, then
  build a corresponding server-side `POST` route to handle it on the server
  side as well.
* Re-use CSS as much as possible, and try not to build React class-specific
  styles. Let the framework do the work - we're already using the heavily-
  documented [bootstrap v3](getbootstrap.com/components/).

Good React use generally involves composing lots of small components, rather
than building large, complex views. A simple example:

```javascript
class Link extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      highlighted: this.props.highlighted || false
    };
  }

  render () {
    return (
      <li class={this.state.highlighted ? 'highlight' : undefined }>
        this.props.link.title
      </li>
    );
  }

  highlight (e) {
    this.setState({
      highlighted: true
    });
  }
}

class LinkList extends React.Component {
  render () {
    return (
      <ul>
        {this.props.links.map((l) => {
          return <Link link={l} />
        });
      </ul>
    );
  }
}

class Page extends React.Component {
  render () {
    return (
      <LinkList links={ this.props.links } />
    );
  }
}

React.renderToString(<Page links=[{ title: 'reddit' }] />);
```

In this example, we have three elements, broken down into small, self-contained
components. However, be warned that when you need to render a _lot_ of
something- say, 5000 links- sometimes it's better to just use an `a` tag than
building a react component to wrap an `a`.


Inter-Component Communication
-----------------------------

Components often need to communicate. For example, if you add a comment from
the 'add comment' component, you need to tell the parent 'comment list' that it
should add a new element. This is achieved in one of two ways:

### Functions in Props

The following example shows how you may manage a direct child-parent response
to a change in data.

```javascript
class AddCommentBox extends React.Component {
  async save (e) {
    e.preventDefault();
    const text = this.refs.commentBox.value;

    const comment = await this.props.api.comment.save({
      text
    });

    if (this.props.onSave) {
      this.props.onSave(comment);
    }
  }
  
  render () {
    return (
      <form action='/comment' method='POST' onSubmit={ this.save.bind(this) }>
        <textarea ref='commentBox' />
        <button type='submit'>Save</button>
      </form>
    );
  }
}

class CommentList extends React.Component {
  constructor (props) {
    // We save `comments` to `state` because we expect it to change (as we add
    // new comments). `props` should be treated as immutable.
    this.state = {
      comments: props.comments
    }
  }

  onSave (comment) {
    // build a copy of the state comments - don't modify state directly!
    let comments = this.state.comments.slice();
    comments.push(comment);
    
    // set comments to the new `comments`, which will re-run render, which will
    // render the new element at the bottom of the list.
    this.setState({
      comments
    });
  }

  render () {
    <div>
      <AddCommentBox onSave={ this.onSave) />
      <ul>
        {this.state.comments.map((c) => {
          return <li>{c.text}</li>
        })}
      </ul>
    </div>
  }
}
```

### Global Events

In other cases, you may have "global" changes that trancend parent-child
relationships; for example, toggling settings, like "compact mode" in
reddit-mobile. reddit-mobile embeds an event emitter in the `app` object in
`props`, as seen here:

```javascript
class NightModeToggle extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      status: props.status
    }
  }
  async toggle (e) {
    e.preventDefault();
    const status = !this.state.status;
    this.props.app.emit('toggleNightMode', status);
  }
  
  render () {
    return (
      <button onClick={ this.toggle }>Toggle Night Mode</button>
    );
  }
}

class Layout extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      nightMode: props.nightMode
    };
  }

  componentDidMount () {
    this.props.app.on('toggleNightMode', toggleNightMode);
  }

  toggleNightMode (status) {
    this.setState({
      nightMode: status
    });
  }

  render () {
    const className = this.state.nightMode ? 'night' : 'day';
    return (
      <div className={className}>
        { this.props.children }
      </div>
    );
  }
}
```
