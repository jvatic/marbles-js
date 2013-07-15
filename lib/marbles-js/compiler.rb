require 'marbles-js'

module MarblesJS
  module Compiler
    extend self

    ASSET_NAMES = %w(
      marbles.js
    ).freeze

    VENDOR_ASSET_NAMES = %w(
      lodash.js
    ).freeze

    attr_accessor :sprockets_environment, :assets_dir, :compile_vendor

    def configure_app(options = {})
      return if @app_configured

      MarblesJS.configure(options)

      self.compile_vendor ||= options[:vendor]

      @app_configured = true
    end

    def configure_sprockets(options = {})
      return if @sprockets_configured

      configure_app

      # Setup Sprockets Environment
      require 'sprockets'
      self.sprockets_environment = ::Sprockets::Environment.new do |env|
        env.logger = Logger.new(options[:logfile] || STDOUT)
        env.context_class.class_eval do
          include MarblesJS::Sprockets::Helpers
        end
      end
      MarblesJS::Sprockets.setup(self.sprockets_environment, :vendor => !!compile_vendor)

      if options[:compress]
        # Setup asset compression
        require 'uglifier'
        sprockets_environment.js_compressor = Uglifier.new
      end

      self.assets_dir ||= options[:assets_dir] || MarblesJS.settings[:public_dir]

      @sprockets_configured = true
    end

    def compile_assets(options = {})
      configure_sprockets(options)

      manifest = ::Sprockets::Manifest.new(
        sprockets_environment,
        assets_dir,
        File.join(assets_dir, "manifest.json")
      )

      manifest.compile(ASSET_NAMES)
      manifest.compile(VENDOR_ASSET_NAMES) if compile_vendor
    end

    def compress_assets
      compile_assets(:compress => true)
    end

    def gzip_assets(options = {})
      options[:compress] = true unless options.has_key?(:compress)
      compile_assets(options)

      Dir["#{assets_dir}/**/*.*"].reject { |f| f =~ /\.gz\z/ }.each do |f|
        system "gzip -c #{f} > #{f}.gz" unless File.exist?("#{f}.gz")
      end
    end
  end
end

