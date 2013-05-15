Marbles.UnifiedCollection = class UnifiedCollection extends Marbles.Collection
  @collection: Marbles.Collection
  collection_ids: new Array

  options: {}

  constructor: (collections, @options = {}) ->
    for collection in collections
      @collection_ids.push(collection.cid)

  collections: =>
    _collections = []
    for cid in @collection_ids
      _c = @constructor.collection.find(cid: cid)
      _collections.push(_c) if _c
    _collections

  sortModelsBy: (model) => model.cid

  # params:
  #   {collection_cid}: params Object {}
  # options:
  #   {collection_cid}: options Object {}
  #   success: fn(models, responses, xhrs, params, options)
  #   failure: fn(responses, xhrs, params, options)
  #   complete: fn(models, responses, xhrs, params, options)
  fetch: (params = {}, options = {}) =>
    collections = @collections()
    num_pending_fetches = collections.length
    models = []
    responses = []
    xhrs = []
    is_success = false

    successFn = (collection, _models, res, xhr, _params, _options) =>
      is_success = true
      options[collection.cid]?.success?(_models, res, xhr, _params, _options)
      for model, index in _models
        continue if models.indexOf(model) != -1

        if !models[index] || (@sortModelsBy(models[index]) == @sortModelsBy(model))
          insert_at_index = index
        else if models[index] && @sortModelsBy(models[index]) > @sortModelsBy(model)
          _index = index
          while (_model = models[_index]) && @sortModelsBy(_model) > @sortModelsBy(model)
            _index += 1
          insert_at_index = _index
        else # it's less than
          _index = index
          while (_model = models[_index]) && @sortModelsBy(_model) < @sortModelsBy(model)
            _index -= 1
          insert_at_index = _index

        models = models.slice(0, insert_at_index).concat([model]).concat models.slice(insert_at_index, models.length)

    failureFn = (collection, res, xhr, _params, _options) =>
      options[collection.cid]?.failure?(res, xhr, _params, _options)

    completeFn = (collection, _models, res, xhr, _params, _options) =>
      num_pending_fetches -= 1
      options[collection.cid]?.complete?(_models, res, xhr, _params, _options)

      responses.push(res)
      xhrs.push(xhr)

      if num_pending_fetches <= 0
        if is_success
          models = @fetchSuccess(models, options)
          options.success?(models, responses, xhrs, params, options)
          @trigger('fetch:success', models, xhrs, params, options)
        else
          models = null
          options.failure?(responses, xhrs, params, options)
          @trigger('fetch:failure', responses, xhrs, params, options)

        options.complete?(models, responses, xhrs, params, options)
        @trigger('fetch:complete', models, responses, xhrs, params, options)

    for collection in collections
      do (collection) =>
        collection_params = params[collection.cid] || {}
        collection_options = _.extend {}, options[collection.cid] || {}, options, {
          success: (args...) => args.unshift(collection); successFn(args...)
          failure: (args...) => args.unshift(collection); failureFn(args...)
          complete: (args...) => args.unshift(collection); completeFn(args...)
        }
        collection.fetch(collection_params, collection_options)

  fetchSuccess: (new_models, options) =>
    models = if options.append
      @appendModels(new_models)
    else if options.prepend
      @prependModels(new_models)
    else
      @resetModels(new_models)

    models

##
# UnifiedCollection doesn't support cids
delete UnifiedCollection.instances
delete UnifiedCollection.id_mapping
delete UnifiedCollection.id_mapping_scope
delete UnifiedCollection._id_counter
delete UnifiedCollection.buildIdMappingScope
delete UnifiedCollection.detach
delete UnifiedCollection::generateCid
delete UnifiedCollection::trackInstance
delete UnifiedCollection::updateIdMapping
delete UnifiedCollection::detach

