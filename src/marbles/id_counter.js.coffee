#= require ./core
#= require_self

Marbles.IDCounter = class IDCounter
  @counter_scope_mapping = {}

  @counterForScope: (scope) ->
    return counter if counter = @counter_scope_mapping[scope]

    counter = new IDCounter(scope)
    @counter_scope_mapping[scope] = counter

    counter

  constructor: (@scope, @count = 0) ->

  increment: =>
    @count += 1

  nextID: =>
    @scope + '_' + @increment()

