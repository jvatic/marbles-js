Marbles.Collection = class Collection
  @model: Marbles.Model
  model_ids: new Array

  @buildModel: (attrs) ->
    new @model(attrs)

  constructor: (options = {}) ->
    @resetRaw(options.raw) if _.isArray(options.raw)

  fetch: (params = {}, options = {}) =>
    throw new Error("You need to define #{@constructor.name}::fetch(params, options)!")

  resetRaw: (resources_attribtues) =>
    @model_ids = []
    models = @appendRaw(resources_attribtues, silent: true)
    @trigger('reset', models)
    models

  includes: (model) =>
    return @model_ids.indexOf(model.cid) != -1

  remove: (models...) =>
    for model in models
      cid = model.cid
      index = @model_ids.indexOf(cid)
      continue if index == -1
      @model_ids = @model_ids.slice(0, index).concat(@model_ids.slice(index+1, @model_ids.length))
    @model_ids.length

  appendRaw: (resources_attribtues = [], options = {}) =>
    return [] unless resources_attribtues?.length

    models = for attrs in resources_attribtues
      model = @constructor.buildModel(attrs)
      @model_ids.push(model.cid)
      model

    @trigger('append:complete', models) unless options.silent
    models

  prependRaw: (resources_attribtues = []) =>
    return [] unless resources_attribtues?.length

    models = for i in [resources_attribtues.length-1..0]
      attrs = resources_attribtues[i]
      model = @constructor.buildModel(attrs)
      @model_ids.unshift(model.cid)
      model

    @trigger('prepend:complete', models)
    models

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

