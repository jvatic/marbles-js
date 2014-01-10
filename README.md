# Marbles.js

**NOTE: The API is currently being refactored for consistancy and to remove dependence on LoDash/Underscore. It's not quite ready for production use.**

`Marbles.View` and most of `Marbles.DOM` (except for event binding) have been removed in favor of [React](http://facebook.github.io).

Designed with the assumption you

- Write JavaScript, not jQuery (but it's okay if you do)
- Build real web applications
- Need the option to pick and choose the parts you want
- Want a framework to do the heavy lifting without becoming opaque
- Are human and sometimes need to debug things

There are five major components to make your life easier when working with the HTTP requests, data, and routing.

## `Marbles.HTTP`

Sometimes your application needs to generically process requests and responses before they are sent and received. The optional middleware stack gives you the power of manipulation, allowing you to sign requests and verify response signatures, handle data serialization however you see fit, etc.

Because servers are sometimes unreliable, `GET` and `HEAD` requests are retried a few times when service is unavailable or the server explodes with a 5xx status (you may disable this feature by simply setting `Marbles.HTTP.prototype.MAX_NUM_RETRIES = 0` or on the individual requests).

Multi-part requests are first-class citizens, allowing you to push those binary blobs and JSON together with ease.

If you need to add the same middleware to multiple requests and don't want to set them all up individually, `HTTP.Client` provides a small abstraction to do just that.

It also includes a small but powerful URI parsing library.

But if you don't need all that, the core of the lib may be used on it's own for a small sugar coating atop the native API.

## `Marbles.Model`

Standard getters and setters with keypath support, dirty tracking, change events (supports exact keypaths, no bubbling), and designed to avoid duplication of data through global instance tracking.

It's opinionated as to how you manage your data locally, but doesn't do more than give you a method signature for fetching it.

## `Marbles.Collection`

A powerful tool for managing feeds involving a single model type.

## `Marbles.UnifiedCollection`

Ever need to merge data from multiple sources into a single view without loosing sort order? The `UnifiedCollection` is not for everyday use, but is there when you need it.

## `Marbles.Router`

Sort of like the Backbone router but with a few notable differences:

1. The named params of the route are combined with those of the URL query and presented to your callback as an Object instead of separate arguments.
2. It's pushState or nothing. URL fragments are for jumping to a page section, not a fallback for pushSate routing. As a result your app will be slightly slower in the few browsers in use today that don't support pushState as it will have to reload for each route.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
