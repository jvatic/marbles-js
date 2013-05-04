# Marbles.js

**Disclaimer: This is still in early alpha stages and not ready for production. Use at your own risk.**

## Installation

Add this line to your application's Gemfile:

    gem 'marbles-js'

And then execute:

    $ bundle

## Usage

This gem is meant to be used in conjunction with Sprockets. Download and compile the coffee-script source files you need otherwise.

```ruby
# Assuming you have an existing Sprockets environment assigned to `assets`
MarblesJS::Sprockets.setup(assets)
```

```javascript
//= require marbles
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
