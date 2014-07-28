Marblesjs
=========

**NOTE: The API is currently still in flux, stay aware of changes before updating.**

Marbles is a JavaScript framework inspired by [Backbone.js](http://backbonejs.org) and [React](http://reactjs.org/).

There is no view component, it's recomended you use [React](http://reactjs.org/).

## Building

```
npm install
bundle
bundle exec rake compile
```

## Some TODOs

- Finalize API / work out inconsistencies
	- Move away from callbacks and use events instead
	- It may make sense to return promise objects from some methods
- Write tests (API is nearing completion and is no longer likely to drastically change).
- Write more in-depth usage examples
- Make compatible with node.js (the HTTP lib at minimum, but the router could also be useful in that context, everything else should already be compatible and just need to be made accessible)
- Look into using ES6 modules instead of sprockets directives


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
