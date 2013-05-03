#= require_self
#= require ./marbles/dom
#= require ./marbles/events
#= require ./marbles/history
#= require ./marbles/router
#= require ./marbles/accessors
#= require ./marbles/view
#= require ./marbles/http
#= require ./marbles/http/uri
#= require ./marbles/http/client
#= require ./marbles/http/client/middleware
#= require ./marbles/object
#= require ./marbles/model
#= require ./marbles/collection

window.Marbles = {
  VERSION: '0.0.2'
  throwAsync: (error) ->
    setTimeout (-> throw error), 0
}
