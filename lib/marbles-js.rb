require "marbles-js/version"

module MarblesJS
  # Append assets path to an existing Sprockets environment
  def self.sprockets_setup(environment)
    path = File.expand_path(File.join(File.expand_path(File.dirname(__FILE__)), '../src'))
    environment.append_path(path)
  end
end
