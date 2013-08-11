Marbles.Accessors = {
  set: (keypath, v, options={}) ->
    return unless keypath && keypath.length
    if !options.hasOwnProperty('keypath') || options.keypath
      keys = keypath.split('.')
    else
      keys = [keypath]
    last_key = keys.pop()

    obj = @
    for k in keys
      obj[k] ?= {}
      obj = obj[k]

    old_v = obj[last_key]
    obj[last_key] = v
    unless v == old_v
      @trigger("change", v, old_v, keypath, options)
      @trigger("change:#{keypath}", v, old_v, keypath, options)
    v

  get: (keypath, options={}) ->
    @hasKey(keypath, keypath: !(options.keypath == false), return_value: true)[1]

  remove: (keypath, options={}) ->
    return unless @hasKey(keypath, options)

    if !options.hasOwnProperty('keypath') || options.keypath
      keys = keypath.split('.')
    else
      keys = [keypath]
    last_key = keys.pop()

    if keys.length
      delete @get(keys.join('.'))[last_key]
    else
      delete @[last_key]

  hasKey: (keypath, options={}) ->
    unless keypath && keypath.length
      if options.return_value
        return [false]
      else
        return false

    if !options.hasOwnProperty('keypath') || options.keypath
      keys = keypath.split('.')
    else
      keys = [keypath]
    last_key = keys.pop()

    obj = @
    for k in keys
      break unless obj && obj.hasOwnProperty(k)
      obj = obj[k]

    _has_key = false

    if obj
      _has_key = obj.hasOwnProperty(last_key)

    if options.return_value
      [_has_key, obj?[last_key]]
    else
      _has_key
}
