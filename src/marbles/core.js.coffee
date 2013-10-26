if typeof global is 'undefined'
  global = window

global.Marbles = {
  VERSION: '0.0.3'
  throwAsync: (error) ->
    setTimeout (-> throw error), 0

  global: global
}
