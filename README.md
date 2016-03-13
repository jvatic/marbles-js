Marblesjs
=========

**NOTE: The API is currently still in flux, stay aware of changes before updating.**

Marbles is a JavaScript framework inspired by [Backbone.js](http://backbonejs.org) and [React](http://reactjs.org/).

There is no view component, it's recomended you use [React](http://reactjs.org/).

## Usage

### [asset-matrix-go](https://github.com/jvatic/asset-matrix-go)

Reference this repo in your compiler:

```go
package main

import (
	"log"

	matrix "github.com/jvatic/asset-matrix-go"
)

func main() {
	m := matrix.New(&matrix.Config{
		Paths: []*matrix.AssetRoot{
			{
				GitRepo:   "git://github.com/jvatic/marbles-js.git",
				GitBranch: "master",
				GitRef:    "6d5491bbc51f4454e0c605af6e7faa4e0539441a",
				Path:      "src",
			},
		},
	})
	if err := m.Build(); err != nil {
		log.Fatal(err)
	}
	m.RemoveOldAssets()
}
```

then import the modules you need:

```javascript
import { extend } from 'marbles/utils';
import HTTP from 'marbles/http':
// ...
```

### npm

```
npm install marbles
```

```javascript
var Router = require('marbles/router');
var extend = require('marbles/utils').extend;
// ...
```

### Sprockets

```ruby
# Gemfile
gem 'marbles-js', :git => 'https://github.com/jvatic/marbles-js.git'
gem 'es6-module-mapper', :git => 'https://github.com/jvatic/es6-module-mapper.git';
```

```ruby
require 'sprockets'
require 'es6-module-mapper' # or some other means of ES6 module support
require 'marbles-js'

::Sprockets::Environment.new do |env|
  # we're not using the directive processor, so unregister it
  env.unregister_preprocessor(
    'application/javascript', ::Sprockets::DirectiveProcessor)
  ::MarblesJS::Sprockets.setup(env)
end
```

## Docs

```
cd docs
python -m SimpleHTTPServer
```

and open [localhost:8000](http://localhost:8000) in your browser.

## Building

```
npm install
bundle
bundle exec rake compile
```

## Some TODOs

- Finalize API / work out inconsistencies
	- Move away from callbacks and use Dispatcher events and promises instead
- Write tests (API is nearing completion and is no longer likely to drastically change).
- Write more in-depth usage examples


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
