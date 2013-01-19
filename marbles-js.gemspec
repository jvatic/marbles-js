# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'marbles-js/version'

Gem::Specification.new do |gem|
  gem.name          = "marbles-js"
  gem.version       = MarblesJS::VERSION
  gem.authors       = ["Jesse Stuart"]
  gem.email         = ["jesse@jessestuart.ca"]
  gem.description   = %q{A simple Backbone.js inspired JavaScript framework.}
  gem.summary       = %q{A simple Backbone.js inspired JavaScript framework.}
  gem.homepage      = "https://github.com/jvatic/marbles-js"

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]
end
