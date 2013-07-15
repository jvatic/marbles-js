# Marbles.js

**Disclaimer: This is still in early alpha stages and not ready for production. Use at your own risk.**

## Installation

Add this line to your application's Gemfile:

    gem 'marbles-js'

And then execute:

    $ bundle

## Usage

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

### Compiling

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
