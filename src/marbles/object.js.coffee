#= require ./core
#= require ./accessors
#= require ./events
#= require_self

Marbles.Object = class EventedObject
  constructor: (attributes) ->
    @set(k, v) for k,v of attributes

_.extend EventedObject::, Marbles.Accessors, Marbles.Events
