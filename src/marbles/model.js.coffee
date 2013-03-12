Marbles.Model = class Model
  @instances: {
    all: {}
  }
  @id_mapping: {}
  @id_mapping_scope: ['id']
  @_id_counter: 0
  @model_name: '_default'

  @buildIdMappingScope: (params) ->
    scope = []
    for key in @id_mapping_scope
      return null unless params.hasOwnProperty(key)
      scope.push params[key]
    scope.join(":")

  @find: (params, options = {}) ->
    id_scope = @buildIdMappingScope(params)
    if id_scope && (cid = @id_mapping[@model_name]?[id_scope])
      params.cid = cid

    if params.cid && instance = @instances.all[params.cid]
      if !instance.options.partial_data || params.include_partial_data || options.include_partial_data
        options?.success?(instance)
        return instance

    if params.id && (!options.hasOwnProperty('fetch') || options.fetch) && (!params.hasOwnProperty('fetch') || params.fetch)
      @fetch(params, options)

    null

  @fetch: (params, options) ->
    throw new Error("You need to define #{@name}::fetch(params, options)!")

  # delete reference
  @detach: (cid) ->
    delete @instances.all[cid]

    if index = @instances[@model_name]?.indexOf(cid)
      instances = @instances[@model_name]
      instances = instances.slice(0, index).concat(instances.slice(index+1, instances.length))
      @instances[@model_name] = instances

    for _id, _cid of @id_mapping
      if _cid == cid
        delete @id_mapping[_id]
        break

  detach: =>
    @constructor.detach(@cid)
    @trigger 'detach', @

  constructor: (attributes, @options = {}) ->
    @generateCid()
    @trackInstance()
    for key in @constructor.id_mapping_scope
      @on "change:#{key}", @updateIdMapping
    @parseAttributes(attributes)

  generateCid: =>
    @cid = "#{@constructor.model_name}_#{@constructor._id_counter++}"

  trackInstance: =>
    @constructor.instances.all[@cid] = @
    @constructor.instances[@constructor.model_name] ?= []
    @constructor.instances[@constructor.model_name].push @cid

  parseAttributes: (attributes) =>
    @set(k, v, {keypath:false}) for k,v of attributes

  updateIdMapping: (new_value, old_value, attr) =>
    old_scope = []
    new_scope = []
    for key in @constructor.id_mapping_scope
      if key == attr
        old_scope.push old_value
        new_scope.push new_value
      else
        old_scope.push @get(key)
        new_scope.push @get(key)
    old_scope = old_scope.join(":")
    new_scope = new_scope.join(":")

    @constructor.id_mapping[@constructor.model_name] ?= {}
    delete @constructor.id_mapping[@constructor.model_name][old_scope]
    @constructor.id_mapping[@constructor.model_name][new_scope] = @cid

  set: (keypath, v, options={}) =>
    return unless keypath && keypath.length
    if !options.hasOwnProperty('keypath') || options.keypath
      keys = keypath.split('.')
    else
      keys = [keypath]

    @fields ?= []
    @fields.push(keys[0]) if @fields.indexOf(keys[0]) == -1

    Marbles.Accessors.set.apply(@, arguments)

  get: (keypath, options={}) =>
    return unless keypath && keypath.length
    if !options.hasOwnProperty('keypath') || options.keypath
      keys = keypath.split('.')
    else
      keys = [keypath]

    return unless @fields?.length
    return if @fields.indexOf(keys[0]) == -1

    Marbles.Accessors.get.apply(@, arguments)

  toJSON: =>
    attrs = {}
    for k in (@fields || [])
      attrs[k] = @[k]
    attrs

_.extend Model, Marbles.Events
_.extend Model::, Marbles.Events
