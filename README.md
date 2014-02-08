# Marbles.js

**NOTE: The API is currently still in flux, stay aware of changes before updating.**

Marbles is a JavaScript framework inspired by [Backbone.js](http://backbonejs.org) and [React](http://reactjs.org/).

There is no view component, it's recomended you use [React](http://reactjs.org/).

## Events

`Marbles.Events` (class mixin).

Most Marbles objects are evented. The following methods are available on such objects.

**`on(String events, Function callback [, Object context [, Object options ]])`**

Takes a space delimited string of events to listen to. `callback` is called with any arguments passed to `trigger()`, and will be bound to `context` if given.

`options.args` may be set to `false` to have any arguments passed to `trigger()` ignored.

**`once(String events, Function callback [, Object context [, Object options ]])`**

The same as `on()`, except `callback` is only called once for each event (after which it is unbound with `off()`).

**`off(String events [, Function callback [, Object context ]])`**

Takes a space delimited string of events to be unbound.

If `callback` is given, only events bound to it will be unbound.

If `context` is given, only events bound to it will be unbound.

**`trigger(String events, args...)`**

**NOTE: You should avoid calling this outside the scope of the object on which it is defined.**

Takes a space delimited string of events to be fired.

Any additional arguments are passed to the callback functions.

## Router

Easily map URL patterns to functions.

```
new Marbles.Router.createClass({
  displayName: "MyRouter",

  routes: [
  	{ path: "posts/:id", handler: "postSingleton" }
  ],

  postSingleton: function (params) {
  	console.log(params);
  	//=> [{ id: "..." }]
  }
});
```

### Routes

Routes are defined as an array of route objects, each containing a `path` and `handler` member. The path may include named segments (e.g. `posts/:id` would match `/posts/foo`, `/posts/bar`, etc.) and splats (e.g. `/posts/*` would match `/posts`, `/posts/foo`, `/posts/foo/bar`, etc.).

Named segments become available to the route handler via the first object of the params array. Query params are also available in the params array.

### Params

Params are represented as an array of objects, which usually has a length of `1`, but will have more as needed to hold multiple params of the same name (this only applies to query params, named route segments must have unique names). Each param is always stored in the first object which doesn't contain a param of the same name (e.g. `?a=1&b=2` would both be found at index `0`, where as `?a=1&a=2&b=3` would be split into two objects containing the first `a` and `b`, and the second `a` respectively).

### Events

Name | Arguments | Description
---- | --------- | -----------
`route` | `route`, `params` | Handler was just called. `route` is the compiled regex, and `params` is the params array.

## History

`Marbles.History` is responsible for capturing pushState events and finding a matching route each time the URL changes.

Typically you'll only need to call `Marbles.History.start({})` which takes an optional options object as the first argument.

Available options are as follows

Property | Default | Description
-------- | ------- | -----------
`pushState` | `true` | Determines if pushState should be used. `window.location` is manipulated for triggering routes when set to `false` or pushState is not supported.
`root` | `/` | Allows specifying a path prefix if the app is not mounted at the domain root. All routes defined in a Router are relative to this path.
`trigger` | `true` | Calls any associated route handler for the initial path when `true`.

If you need to stop handling routes at any point, you may call `Marbles.history.stop()`.

`Marbles.history.navigate("", {})` may be used to load a new URL, it takes the path (relative to `root`) and an options argument.

Property | Default | Description
-------- | ------- | -----------
`trigger` | `true` | Calls any associated route handler when `true`.
`replace` | `false` | Replaces the current history item (only works if pushState is enabled/supported) when `true`.
`force` | `false` | Set to `true` if you need it to fire even when the `path` provided is the current one.

### Events

Name | Arguments | Description
---- | --------- | -----------
`start` | (none) | History started, no route handler has been called yet.
`stop` | (none) | History stopped.
`handler:before` | `handler`, `path`, `params` | Route matched, handler is about to be called. `handler` is an object containing `route` (compiled into a regex), and `callback` (the handler function).
`handler:after` | `handler`, `path`, `params` | Route matched, handle has been called.
`route` | `router`, `route`, `params` | Handler was just called. `router` is the instance of `Marbles.Router` who's route matched, `route` is the compiled regex, and `params` is the params array.


## HTTPRequest

`Marbles.HTTPRequest` provides a wrapper around `XMLHTTPRequest` with support for multipart requests and request/response middleware.

```
var request = new Marbles.HTTPRequest({
	method: "POST",
	url: "http://example.com",
	params: [{
		a: 1,
		b: 2
	}, {
		a: 3
	}],
	headers: {
		"Content-Type": "application/json"
	},
	body: "{\"a\":2}"
});
request.once('complete', function (res, xhr) {
	console.log(res, xhr);
});
request.open();
request.send();
```
```
POST http://example.com?a=1&b=2&a=3
Content-Type: application/json

{"a":2}
```

Property | Required | Default | Description
-------- | -------- | ------- | -----------
`method` | Optional | `GET` | HTTP method to be used.
`url` | Required | | URL the request is for.
`params` | Optional | `[{}]` | Array of objects representing URL parameters to be merged with `url`.
`headers` | Optional | `{}` | Object representing request headers.
`body` | Optional | | String (or any object supported by specified `middleware`) to be used as the request body. If an Array is given, it's assumed to be a collection of `Blob` objects.
`middleware` | Optional | `[]` | An array of middleware objects.

**TODO:** Add `multipart` option and require it to be set to `true` to treat `body` as multipart.

Consumable properties/methods on `HTTPRequest` instances:

Name | Type | Description
---- | ---- | -----------
`multipart` | Boolean | Indicates if the request is multipart.
`getRequestHeader(String header)` | Function | Returns the value of the request header.
`setRequestHeader(String header, String value)` | Function | Sets the request header.
`getResponseHeader(String header)` | Function | Returns the value of the response header.
`terminate(Error err)` | Function | Aborts request or causes the response to fail.
`resend([Error err])` | Function | Terminates request with given error (optional), and resends the request.
`responseData` | Any | Middleware should write to this property to override the response value in the `complete` event.
`xhr` | XMLHTTPRequest | Underlying request object.
`open()` | Function | Initializes and opens an `XMLHTTPRequest` object. It must be called before `send()`. Calling it multiple times before `send()` is called has no effect.
`send()` | Function | Sends the request. Multipart requests use `xhr.sendAsBinary()` (**TODO:** use `xhr.send()` with a `Blob` or `FormData` instead). Calling it while the request is already in progress or completed has no effect.

If you instantiate a new `HTTPRequest` using `GET` or `HEAD` methods, and a duplicate request has already been opened, the existing request will be used.

### HTTP

`Marbles.HTTP(Object options)` provides a wrapper around `Marbles.HTTPRequest`. The following is equivalent to the above example.

```
Marbles.HTTP({
	method: "POST",
	url: "http://example.com",
	params: [{
		a: 1,
		b: 2
	}, {
		a: 3
	}],
	headers: {
		"Content-Type": "application/json"
	},
	body: "{\"a\":2}",
	complete: function (res, xhr) {
		console.log(res, xhr);
	}
});
```
```
POST http://example.com?a=1&b=2&a=3
Content-Type: application/json

{"a":2}
```

`callback` is optional and is called with a response data object (either produced through middleware or taken directly from `xhr.response`) and the xhr (`XMLHTTPRequest`) object.

### Middleware

Any object with `willSendRequest(Marbles.HTTPRequest request)` and/or `didReceiveResponse(Marbles.HTTPRequest request)` methods may be used as middleware.

There are a few middleware objects provided.

#### SerializeJSON

`Marbles.HTTP.Middleware.SerializeJSON`

Calls `JSON.stringify` and `JSON.parse` on requests and responses where the `Content-Type` header matches. If `JSON.parse` throws an error, the response will be terminated with the same error.

#### FormEncoded

`Marbles.HTTP.Middleware.FormEncoded`

Serializes/deserializes the request/response when the `Content-Type` header is `application/x-www-form-urlencoded`.

Note that you may wish to use [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) instead (you may set `body` to a `FormData` object).

#### WithCredentials

`Marbles.HTTP.Middleware.WithCredentials`

Does nothing more than set `xhr.withCredentials` to `true`.

### Events

Name | Arguments | Description
---- | --------- | -----------
`open` | `method`, `url` | Fired when a new xhr request is opened.
`before:send` | (none) | Request is about to be sent (all request middleware will have been called at this point).
`after:send` | (none) | Request has just been sent.
`terminated` | `err` | Request has been terminated (usually via middleware). `err` contains the error.
`before:complete` | `xhr` | Response has been received and middleware has been called.
`success` | `res`, `xhr` | Response received with a 2xx or 3xx status.
`failure` | `res`, `xhr` | Response received with a non- 2xx or 3xx status.
`complete` | `res`, `xhr` | Response received (success or failure event has already been triggered).

**TODO:** Add event for when response status and headers are available. Also allow middleware to hook into this.

## Accessors

`Marbles.Accessors` is a class mixin and adds the following instance methods:

Method |
------ |
`set(String keypath, Object value, Object options)` |
`get(String keypath, Object options)` |
`remove(String keypath, Object options)` |
`hasKey(String keypath, Object options)` |

If `options.keypath` is set to the default value of `true`, `keypath` will be split on `.` and each segment will be treated as a property on the preceding one (starting with the instance object).

```
var myObject = new Marbles.Utils.createClass({
	mixins: [Marbles.Accessors]
});

myObject.set("a.b.c", [1, 2, 3]);

myObject.set("a.b.c", "foo", {keypath: false});

console.log(myObject["a.b.c"]);
//=> "foo"

console.log(myObject.get("a.b"));
//=> { c: [1, 2, 3] }

console.log(myObject.a.b);
//=> { c: [1, 2, 3] }

console.log(myObject.get("a.b.c.1"));
//=> 2

console.log(myObject.hasKey("foo"));
//=> false

console.log(myObject.hasKey("a.b"));
//=> true

myObject.remove("a.b");

console.log(myObject.hasKey("a.b"));
//=> false

console.log(myObject.hasKey("a"));
//=> true
```

If the object has a `trigger` method (e.g. via the `Marbles.Events` mixin), the `change` event is fired with `newValue`, `oldValue`, `keypath`, and `options`. The `change:{keypath}` event is also fired in this case with the same arguments (`keypath` is interpolated into the event name).

```
var myObject = new Marbles.Utils.createClass({
	mixins: [Marbles.Accessors, Marbles.Events]
});

myObject.on("change:a.b.c", console.log);

myObject.set("a.b.c", [1, 2, 3]);

//=> [1, 2, 3]	undefined	"a.b.c"	undefined
```

## Object

`Marbles.Object`

Very simple constructor which includes `Marbles.Accessors` and `Marbles.Events`, and takes an Object containing any initial properties as a single argument.

```
var myObject = new Marbles.Object({
  a: {
  	b: 2
  }
});

console.log(myObject.get("a.b"));
//=> 2
```

## Model

`Marbles.Model`

Similar to `Marbles.Object`, but with a few additions.

- Instances are tracked in an `instances` property of the constructor.
- Instances are also indexed by a set of properties via `cidMappingScope` on the constructor (must be set via a mixin).
- Instances have a unique `cid` property to identify them.
- Instances have a `toJSON()` method. By default it returns all properties, but `JSONKeys` may be set on the constructor (via a mixin) to an array of whitelisted properties.
- `modelName` may also be set on the constructor (via a mixin) and is used in creation of `cid`s
- Instances have a `detach()` method to un-track them.
- The constructor has a `find(Object params, Object options)` method. `params` may include properties in `cidMappingScope` or a `cid` to perform a local lookup. If `cid` is not given, and no instance is found, the `fetch()` method is called. `options` may include a `fetch` property set to `false` to prevent `fetch()` from being called.
- The constructor has a `fetch(Object params, Object options)` method. By default it throws an error, you should override this or always pass `fetch: false` to `find()`.
- The constructor has a `detach(String cid)` method.

**TODO:** Accept an Array for the `params` arg of `find()` (the first member would contain what's currently in the params Object). This would allow defining a `fetch()` method taking either an Array or Object.


## Collection

`Marbles.Collection`

Useful for working with many instances of the same `Marbles.Model`.

- Each collection instance is tracked in the same fashion as models.
- Collections only keep weak references to the models they track (via `cid`s).
- Models are automatically removed when detached.
- Collections know how to build models out of JSON.

The following methods are provided:

- `indexOf(Marbles.Model model)`
- `first()`
- `last()`
- `forEach(Function callback, Object thisArg)`
- `models()`
- `resetJSON(Object json, Object options)`
- `resetModels(Array models, Object options)`
- `reset(Object options)`
- `removeAtIndex(Number index)`
- `removeCIDs(Array cids)`
- `remove(Marbles.Model model [, Marbles.Model model2 [, ...]])`
- `prependJSON(Object json, Object options)`
- `prependModels(Array models, Object options)`
- `prependCIDs(Array cids, Object options)`
- `unshift(Marbles.Model model [, ...])`
- `appendJSON(Object json, Object options)`
- `appendModels(Array models, Object options)`
- `appendCIDs(Array cids, Object options)`
- `push(Marbles.Model model [, ...])`

### Events

Event | Arguments
----- | ---------
`reset` | `models`
`remove` | `cid`
`prepend` | `models`
`append` | `models`


## Utils

`Marbles.Utils`

### `extend(Object obj [, Object source1 [, Object source2 [, ...] ]])`

Copies all enumerable properties from all sources to the object passed as the first argument.

Returns the object being extended.

### `createClass(Object proto)`

Creates and returns a constructor function, using `proto` as the prototype.

The following properties of `proto` are special and will not be part of the prototype:

- `displayName` - sets the `displayName` property of the constructor.
- `parentClass` - another constructor to inherit from. The parent's prototype will be available via the `__super__` property of the constructor.
- `willInitialize` and `didInitialize` - called before/after generated constructor does it's thing (calling the parent constructor if there is one) with any arguments it's called with.
- `mixins` - an Array of mixin objects.

**Mixins**

Mixin objects are generally just plain objects that extend the prototype. However, when using `createClass`, mixin objects with `ctor` and/or `proto` properties will extend the constructor and/or the prototype respectively. Such mixin objects may also define `didExtendCtor` and `didExtendProto` methods to be called after extending the constructor and prototype respectively (both are passed the constructor as a single argument).

**`creteClass`** also adds a `createClass` method to the returned constructor for easily ‘sub-classing’ it. This method also ensures any mixin `didExtend...` hooks are called with the new (child) constructor.

## Some TODOs

- Write tests (API is nearing completion and is no longer likely to drastically change).
- Write proper documentation and update README to only contain basic usage examples
- Write more in-depth usage examples
- Finalize API / work out inconsistencies
	- Move away from callbacks and use events instead
	- It may make sense to return promise objects from some methods
- Make compatible with node.js (the HTTP lib at minimum, but the router could also be useful in that context, everything else should already be compatible and just need to be made accessible)
- Look into using ES6 modules instead of sprockets directives (sprockets integration is still required)


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
