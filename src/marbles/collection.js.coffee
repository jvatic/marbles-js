Marbles.Collection = class Collection
  @model: Marbles.Model
  model_ids: new Array

  @instances: {
    all: {}
  }
  @id_mapping: {}
  @id_mapping_scope: ['cid']
  @_id_counter: 0

  @buildIdMappingScope: (params) ->
    scope = []
    for key in @id_mapping_scope
      return null unless params.hasOwnProperty(key)
      scope.push params[key]
    scope.join(":")

  @find: (params) ->
    id_scope = @buildIdMappingScope(params)
    if id_scope && (cid = @id_mapping[@collection_name]?[id_scope])
      params.cid = cid

    @instances.all[params.cid]

  # delete reference
  @detach: (cid) ->
    delete @instances.all[cid]

    if index = @instances[@collection_name]?.indexOf(cid)
      instances = @instances[@collection_name]
      instances = instances.slice(0, index).concat(instances.slice(index+1, instances.length))
      @instances[@collection_name] = instances

    for _id, _cid of @id_mapping
      if _cid == cid
        delete @id_mapping[_id]
        break

  @buildModel: (attrs) ->
    new @model(attrs)

  constructor: (@options = {}) ->
    @generateCid()
    @trackInstance()
    for key in @constructor.id_mapping_scope
      @on "change:#{key}", @updateIdMapping

    @resetJSON(@options.raw) if _.isArray(@options.raw)

  generateCid: =>
    unless @constructor.collection_name
      @constructor.collection_name = @constructor.model.model_name + '_collection'

    if @options.cid
      @cid = @options.cid
      delete @options.cid
    else
      @cid = "#{@constructor.collection_name}_#{@constructor._id_counter++}"

  trackInstance: =>
    @constructor.instances.all[@cid] = @
    @constructor.instances[@constructor.model_name] ?= []
    @constructor.instances[@constructor.model_name].push @cid

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

    @constructor.id_mapping[@constructor.collection_name] ?= {}
    delete @constructor.id_mapping[@constructor.collection_name][old_scope]
    @constructor.id_mapping[@constructor.collection_name][new_scope] = @cid

  detach: =>
    @constructor.detach(@cid)
    @trigger 'detach', @

  fetch: (params = {}, options = {}) =>
    throw new Error("You need to define #{@constructor.name}.prototype.fetch(params, options)!")

  empty: =>
    @model_ids = []
    @trigger('reset', [])
    []

  includes: (model) =>
    return @model_ids.indexOf(model.cid) != -1

  remove: (models...) =>
    for model in models
      cid = model.cid
      index = @model_ids.indexOf(cid)
      continue if index == -1
      @model_ids = @model_ids.slice(0, index).concat(@model_ids.slice(index+1, @model_ids.length))
    @model_ids.length

  resetJSON: (json, options = {}) =>
    @model_ids = []
    models = @appendJSON(json, silent: true)
    @trigger('reset', models) unless options.silent
    models

  resetModels: (models, options = {}) =>
    @model_ids = []
    models = @appendModels(models, silent: true)
    @trigger('reset', models) unless options.silent
    models

  appendJSON: (json, options = {}) =>
    return [] unless json?.length

    models = for attrs in json
      model = @buildModel(attrs)
      @model_ids.push(model.cid)
      model

    @trigger('append', models) unless options.silent

    models

  appendModels: (models, options = {}) =>
    return [] unless models?.length

    for model in models
      @model_ids.push(model.cid)

    @trigger('append', models) unless options.silent

    models

  appendIds: (model_cids...) =>
    @model_ids = @model_ids.concat(model_cids)

  prependJSON: (json, options = {}) =>
    return [] unless json?.length

    models = for i in [json.length-1..0]
      attrs = json[i]
      model = @buildModel(attrs)
      @model_ids.unshift(model.cid)
      model

    @trigger('prepend', models) unless options.silent

    models

  prependModels: (models, options = {}) =>
    return [] unless models?.length

    for i in [models.length-1..0]
      model = models[i]
      @model_ids.unshift(model.cid)

    @trigger('prepend', models) unless options.silent

    models

  prependIds: (model_cids...) =>
    @model_ids = model_cids.concat(@model_ids)

  first: =>
    return unless cid = @model_ids[0]
    @constructor.model.find({ cid: cid })

  last: =>
    return unless cid = _.last(@model_ids)
    @constructor.model.find({ cid: cid })

  unshift: (models...) =>
    for model in models
      @model_ids.unshift(model.cid)
    @model_ids.length

  push: (models...) =>
    for model in models
      @model_ids.push(model.cid)
    @model_ids.length

  models: (cids = @model_ids) =>
    models = []
    for cid in (cids || [])
      model = @constructor.model.find({ cid: cid })
      models.push(model) if model
    models

_.extend Collection::, Marbles.Events
_.extend Collection::, Marbles.Accessors

