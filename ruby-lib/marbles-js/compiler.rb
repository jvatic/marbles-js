require 'marbles-js'
require "es6-module-mapper"

module MarblesJS
  module Compiler
    extend self

    ASSET_NAMES = %w(
      marbles.js
    ).freeze

    VENDOR_ASSET_NAMES = %w(
    ).freeze

    attr_accessor :sprockets_environment, :assets_dir, :compile_vendor

    def configure_app(options = {})
      MarblesJS.configure(options)

      self.compile_vendor ||= options[:vendor]
    end

    def configure_sprockets(options = {})
      configure_app

      # Setup Sprockets Environment
      require 'sprockets'
      self.sprockets_environment = ::Sprockets::Environment.new do |env|
        env.logger = Logger.new(options[:logfile] || STDOUT)
        env.context_class.class_eval do
          include MarblesJS::Sprockets::Helpers
        end

        # we're not using the directive processor, so unregister it
        env.unregister_preprocessor(
          'application/javascript', ::Sprockets::DirectiveProcessor)
      end
      MarblesJS::Sprockets.setup(self.sprockets_environment, :vendor => !!compile_vendor)

      if options[:compress]
        # Setup asset compression
        require 'uglifier'
        sprockets_environment.js_compressor = Uglifier.new
      end

      self.assets_dir ||= options[:assets_dir] || MarblesJS.settings[:public_dir]
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

      suffix = ""
      suffix = ".min" if options[:compress]

      marblesjs_compile_path = File.expand_path(File.join(assets_dir, manifest.assets["marbles.js"]))
      system "cp #{marblesjs_compile_path} marbles#{suffix}.js"
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

