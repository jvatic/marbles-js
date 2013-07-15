require "marbles-js/version"

module MarblesJS
  def self.settings
    @settings ||= {}
  end

  def self.configure(options = {})
    self.settings[:public_dir] ||= File.expand_path('../../public/assets', __FILE__) # lib/../public/assets
    unless self.settings[:asset_paths]
      self.settings[:asset_paths] = [ File.expand_path('../../src', __FILE__) ]
      self.settings[:asset_paths] << File.expand_path('../../vendor', __FILE__) if options[:vendor]
    end
  end

  module Sprockets
    # Append asset paths to an existing Sprockets environment
    def self.setup(environment, options = {})
      MarblesJS.configure(options)
      MarblesJS.settings[:asset_paths].each do |path|
        environment.append_path(path)
      end
    end

    module Helpers
      AssetNotFoundError = Class.new(StandardError)
      def asset_path(source, options = {})
        asset = environment.find_asset(source)
        raise AssetNotFoundError.new("#{source.inspect} does not exist within #{environment.paths.inspect}!") unless asset
        "./#{asset.digest_path}"
      end
    end
  end

  # Depricated
  def self.sprockets_setup(environment)
    puts "WARNING: MarblesJS.sprockets_setup is depricated, use MarblesJS::Sprockets.setup instead!"
    MarblesJS::Sprockets.setup(environment)
  end
end
