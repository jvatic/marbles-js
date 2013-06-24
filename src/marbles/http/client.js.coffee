Marbles.HTTP.Client = class HTTPClient
  constructor: (@options = {}) ->

  request: (method, args) =>
    new Marbles.HTTP(_.extend({}, args, {
      method: method
      params: _.extend({}, @options.params, args.params)
      middleware: [].concat(@options.middleware || []).concat(args.middleware || [])
      callback: (res, xhr) =>
        if xhr.status in [200...400]
          args.callback?.success?(res, xhr)
          @options.success?(res, xhr)
        else
          args.callback?.error?(res, xhr)
          @options.error?(res, xhr)

        args.callback?(res, xhr)
        args.callback?.complete?(res, xhr)
        @options.complete?(res, xhr)
    }))

for method in ['HEAD', 'GET', 'POST', 'PUT', 'DELETE']
  do (method) ->
    HTTPClient::[method.toLowerCase()] = -> @request(method, arguments...)

