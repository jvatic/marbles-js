# Marbles.js

**Disclaimer: This is still in early alpha stages and not ready for production. Use at your own risk.**

Note that most components depend on LoDash (Underscore.js should also work).

## Gem

### Installation

Add this line to your application's Gemfile:

    gem 'marbles-js'

And then execute:

    $ bundle

### Usage

This gem is meant to be used in conjunction with Sprockets. Download and compile the coffee-script source files you need otherwise.

Marbles.js depends on [LoDash](http://lodash.com).

```ruby
# Assuming you have an existing Sprockets environment assigned to `assets`

MarblesJS::Sprockets.setup(assets) # doesn't expose lodash path
# OR
MarblesJS::Sprockets.setup(assets, :vendor => true) # exposes lodash path
```

```javascript
//= require lodash
//= require marbles
```

#### Compiling

```ruby
require 'marbles-js/compiler'

# Compile assets
MarblesJS::Compiler.compile_assets(
  :compress => true, # optional, defaults to false
  :logfile => '/dev/null', # optional, defaults to STDOUT
  :assets_dir => "./public/assets" # optional, defaults to {marbles-js_gem_root}/public/assets
)

# Compile and gzip assets
MarblesJS::Compiler.gzip_assets(
  :compress => true, # optional, defaults to true
  :logfile => '/dev/null', # optional, defaults to STDOUT
  :assets_dir => "./public/assets" # optional, defaults to {marbles-js_gem_root}/public/assets
)
```

OR

```ruby
# Rakefile

namespace :marbles do
  require 'marbles-js/tasks/assets'
end

namespace :assets do
  task :precompile => ['marbles:assets:precompile'] do
  end
end
```

## Components

### DOM

Light-weight library for common DOM related tasks.

### HTTP

HTTP library with support for middleware and multipart requests.

```javascript
new Marbles.HTTP({
  method: 'POST',
  url: 'https://example.org/users/new',
  params: {
    bar: 'baz'
  },
  body: {
    username: 'demo',
    passphrase: 'super-secret'
  },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  middleware: [Marbles.HTTP.Middleware.FormEncoded],
  callback: function(res, xhr) {
    if (xhr.status === 200) {
      // do stuff
    } else {
      // do stuff
    }
  }
})
```

#### Middleware

##### FormEncoded

URL encodes request `body` (must be an Object) when `Content-Type` is to `application/x-www-form-urlencoded`. It also deserializes the response body if the `Content-Type` is set appropriately.

##### SerializeJSON

JSON encodes request `body` when `Content-Type` matches `\bjson`. It also deserializes the response body if the `Content-Type` is set appropriately.

##### WithCredentials

Sets the `withCredentials` flag on the xmlhttp request object to `true` to include cookies with the request. Note that `Access-Control-Allow-Credentials` must be set to `true` on the server and `Access-Control-Allow-Origin` must be explicitly set.

#### Client

Simple wrapper around `Marbles.HTTP`.

```javascript
var client = new Marbles.HTTP.Client({
  params: {
    api_key: 'XYZ'
  },
  middleware: [Marbles.HTTP.Middleware.SerializeJSON] // middleware for all requests
  success: function(res, xhr) {}, // called when xhr.status is 200-399
  failure: function(res, xhr) {}, // called when success isn't called
  complete: function(res, xhr) {} // always called
})

client.get({ // same options you would pass to Marble.HTTP
  url: 'https://example.com/users/1',
  params: {
    foo: 'bar'
  },
  middleware: [], // merged with client middleware
  callback: {
    // may also be a function
    // callbacks specified in client constructor are also called

    success: function(res, xhr) {},
    failure: function(res, xhr) {},
    complete: function(res, xhr) {}
  }
})

client.request('GET', {
  url: 'https://example.com/users/1',
  params: {
    foo: 'bar'
  },
  middleware: [],
  callback: {
    success: function(res, xhr) {},
    failure: function(res, xhr) {},
    complete: function(res, xhr) {}
  }
})
```

### Events

Extend any object with `Marbles.Events` to add event methods:

- `on(events, callback, context [, options])`
- `once(events, callback, context [, options])`
- `off(events, callback, context)`
- `trigger(events, arg [, arg [, ...]])`

where

- `events` is a space (" ") delimited list of event names
- `callback` is a function that takes the arguments passed to `trigger`
- `context` is an object to bind the `callback` to (`this`)
- `options` is an object with a single member `args` which can be set to `false` to disable passing the arguments from `trigger` to the `callback`

```javascript
var object = {};
_.extend(object, Marbles.Events);
```

### Accessors

Extend any object with `Marbles.Accessors` to add accessor methods:

- `set(keypath, value [, options])`
- `get(keypath [, options])`
- `remove(keypath, value [, options])`
- `hasKey(keypath [, options])`

where

- `keypath` is a dot (".") delimited list of nested object members
- `value` is the value to assign to the target member
- `options` is an object with a single member `keypath` which can be set to `false` to disable parsing `keypath` as a keypath

```javascript
var object = {};
_.extend(object, Marbles.Accessors);

object.set('foo.bar', 'baz');
object.get('foo'); // { bar: 'baz' }
object.foo; // { bar: 'baz' }
```

If the object is also extended with `Marbles.Events`, a change event is fired when calling `set`:

```javascript
// ...
object.once('change', function(new_value, old_value, keypath, options) {
  // called when any keypath is changed
});

object.once('change:foo.bar', function(new_value, old_value, keypath, options) {
  // called when `foo.bar` keypath is changed (NOTE: it is not called for `foo`)
});
```

### Object

A simple class with events and accessor methods.

```javascript
var obj = new Marbles.Object({
  foo: 'bar' // you may optionally pass attributes to the constructor
});

obj.get('foo'); // 'bar'
```

### Model

`Marbles.Model` is a more complex class than `Marbles.Object`, see the source code for more information.

### Collection

`Marbles.Collection` class to handles a list of `Marbles.Model` instances, see the source code for more information.

### Unified Collection

`Marbles.UnifiedCollection` class to handles merging multiple `Marbles.Collection` instances, see the source code for more information.

### History

`Marbles.History` class to manages URL routing and pushState, see the source code for more information.

### Router

`Marbles.Router` class manages routes for `Marbles.History`, see the source code for more information.

### View

`Marbles.View` class handles client-side templates (supports both Hogan and LoDash) and view hierarchy. See the source code for more information.

## TODO

- Node.js compatibility
- Tests
- Define and expand browser compatibility
- ...

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
