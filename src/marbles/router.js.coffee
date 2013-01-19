##################################
# Inspired by Backbone.js Router #
##################################

class Marbles.Router
  @regex:
    named_param: /:\w+/g
    splat_param: /\*\w+/g
    escape_regex: /[-[\]{}()+?.,\\^$|#\s]/g

  constructor: (options) ->
    @_bindRoutes()

  route: (route, name, callback) =>
    Marbles.history ||= new Marbles.History
    unless _.isRegExp(route)
      param_names = @_routeParamNames(route)
      route = @_routeToRegExp(route)
    else
      param_names = []
    callback ?= @[name]

    Marbles.history.route route, (fragment, params) =>
      _.extend params, @_extractNamedParameters(route, fragment, param_names)
      args = [params]
      callback?.apply(@, args)
      @trigger.apply(@, ['route:' + name].concat(args))
      Marbles.history.trigger('route', @, name, args)
      @

  navigate: (fragment, options) =>
    Marbles.history.navigate(fragment, options)

  _bindRoutes: =>
    throw new Error("No routes defined for #{@constructor.name}", @) unless @routes
    for route, name of @routes
      @route(route, name, @[name])
    null

  _routeToRegExp: (route) =>
    route = route.replace(@constructor.regex.escape_regex, '\\$&')
                 .replace(@constructor.regex.named_param, '([^\/]+)')
                 .replace(@constructor.regex.splat_param, '(.*?)')
    new RegExp('^' + route + '$')

  _routeParamNames: (route) =>
    _.map route.match(@constructor.regex.named_param), (name) => name.slice(1)

  _extractNamedParameters: (route, fragment, param_names) =>
    values = _.map @_extractParameters(route, fragment), ((val) -> decodeURIComponent(val))
    params = {}
    for name, index in param_names
      params[name] = values[index]
    params

  _extractParameters: (route, fragment) =>
    route.exec(fragment).slice(1)

_.extend Marbles.Router::, Marbles.Events
