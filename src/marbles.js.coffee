#= require_self
#= require ./marbles/dom
#= require ./marbles/events
#= require ./marbles/history
#= require ./marbles/router
#= require ./marbles/accessors
#= require ./marbles/view
#= require ./marbles/http
#= require ./marbles/http/middleware
#= require ./marbles/http/client
#= require ./marbles/object
#= require ./marbles/model
#= require ./marbles/collection

window.Marbles = {
  VERSION: '0.0.3'
  throwAsync: (error) ->
    setTimeout (-> throw error), 0
}
