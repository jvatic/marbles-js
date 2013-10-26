#= require ./core
#= require_self

expandKeypath = (keypath, context, options = {}) ->
  for segment in keypath.split('.')
    return unless context

    if !context[segment] && options.create is true
      context[segment] = {}
      context = context[segment]
    else
      context = context[segment]

  context

Marbles.injectDependencyPlaceholder = (context, fn_name) ->
  context[fn_name] = ->
    throw new Error("MissingDependencyError: #{context.toString()}.#{fn_name}() was called but no implementation is defined!")

  context[fn_name].is_placeholder = true

Marbles.registerDependency = (dependency) ->
  context = expandKeypath(dependency.keypath, dependency.context, create: true)

  for fn_options in dependency.functions
    continue if typeof context[fn_options.name] is 'function'

    # Dependency is missing

    if typeof fn_options.default is 'function'
      # Default given, use that
      context[fn_options.name] = fn_options.default
    else
      # Define a placeholder
      @injectDependencyPlaceholder(context, fn_options.name)

  for property_options in dependency.properties
    continue if context.hasOwnProperty(property_options.name)

    # Dependency is missing

    throw new Error("MissingDependencyError: #{context.toString()}.#{property_options.name} is required but missing!")

