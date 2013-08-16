#= require ./core
#= require ./id_counter
#= require ./accessors
#= require ./events
#= require_self

Marbles.Model = class Model
  @instances: {
    all: {}
  }
  @id_mapping: {}
  @id_mapping_scope: ['id']
  @model_name: '_default'

  @dirty_tracking_enabled: false

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

    if !params.hasOwnProperty('cid') && (!options.hasOwnProperty('fetch') || options.fetch) && (!params.hasOwnProperty('fetch') || params.fetch)
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

    @trigger('detach', cid)
    Marbles.Model.trigger('detach', cid)

  detach: =>
    @constructor.detach(@cid)
    @trigger 'detach', @

  constructor: (attributes = {}, @options = {}) ->
    @constructor._id_counter ?= Marbles.IDCounter.counterForScope(@constructor.model_name)

    @generateCid()
    @trackInstance()
    for key in @constructor.id_mapping_scope
      @on "change:#{key}", @updateIdMapping
    @parseAttributes(attributes)

    if @constructor.dirty_tracking_enabled
      @dirty_tracking = new Marbles.Object
      @on "change", @keypathChanged

  generateCid: =>
    if @options.cid
      @cid = @options.cid
      delete @options.cid
    else
      @cid = "#{@constructor.model_name}_#{@constructor._id_counter.increment()}"

  trackInstance: =>
    @constructor.instances.all[@cid] = @
    @constructor.instances[@constructor.model_name] ?= []
    @constructor.instances[@constructor.model_name].push @cid

  parseAttributes: (attributes) =>
    @set(k, v, {keypath:false, dirty:false}) for k,v of attributes

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

    Marbles.Accessors.get.apply(@, arguments)

  hasKey: (keypath, options) =>
    Marbles.Accessors.hasKey.apply(@, arguments)

  remove: (keypath, options) =>
    Marbles.Accessors.remove.apply(@, arguments)

  keypathChanged: (new_val, old_val, keypath, options) =>
    return if options.dirty == false
    if @dirty_tracking && !@dirty_tracking.hasKey(keypath)
      @dirty_tracking.set(keypath, old_val)

  isDirty: (keypath, options) =>
    @dirty_tracking?.hasKey(keypath, options)

  keypathPersisted: (keypath, options) =>
    @dirty_tracking.remove(keypath, options)

  getOriginal: (keypath, options) =>
    if @dirty_tracking?.hasKey(keypath, options)
      @dirty_tracking?.get(keypath, options)
    else
      @get(keypath, options)

  toJSON: =>
    attrs = {}
    for k in (@fields || [])
      attrs[k] = @[k]
    attrs

_.extend Model, Marbles.Events
_.extend Model::, Marbles.Events
