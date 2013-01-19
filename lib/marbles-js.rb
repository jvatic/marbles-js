require "marbles-js/version"

module MarblesJS
  # Append assets path to an existing Sprockets environment
  def self.sprockets_setup(environment)
    environment.append_path(File.join(File.expand_path(File.dirname(__FILE__)), '../src'))
  end
end
