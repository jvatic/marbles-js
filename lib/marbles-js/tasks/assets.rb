require 'marbles-js/compiler'

namespace :assets do
  task :compile do
    MarblesJS::Compiler.compile_assets
  end

  task :gzip do
    MarblesJS::Compiler.gzip_assets
  end

  task :precompile => :gzip
end
