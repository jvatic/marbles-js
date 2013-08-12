window.Marbles = {
  VERSION: '0.0.3'
  throwAsync: (error) ->
    setTimeout (-> throw error), 0
}
