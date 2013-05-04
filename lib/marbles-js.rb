require "marbles-js/version"

module MarblesJS
  module Sprockets
    ASSET_PATHS = [File.expand_path(File.join(File.expand_path(File.dirname(__FILE__)), '../src'))].freeze

    # Append asset paths to an existing Sprockets environment
    def self.setup(environment)
      ASSET_PATHS.each do |path|
        environment.append_path(path)
      end
    end
  end

  # Depricated
  def self.sprockets_setup(environment)
    puts "WARNING: MarblesJS.sprockets_setup is depricated, use MarblesJS::Sprockets.setup instead!"
    MarblesJS::Sprockets.setup(environment)
  end
end
