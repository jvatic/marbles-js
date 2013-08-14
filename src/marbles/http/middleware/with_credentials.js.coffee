#= require ./core
#= require_self

Marbles.HTTP.Middleware.WithCredentials = {
  processRequest: (request) ->
    request.request.xmlhttp.withCredentials = true
}
