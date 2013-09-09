#= require ./collection
#= require_self

Marbles.UnifiedCollection = class UnifiedCollection extends Marbles.Collection
  @collection: Marbles.Collection
  collection_ids: new Array

  options: {}

  constructor: (collections, @options = {}) ->
    for collection in collections
      @collection_ids.push(collection.cid)
    @watchModelMortality()

  collections: =>
    _collections = []
    for cid in @collection_ids
      _c = @constructor.collection.find(cid: cid)
      _collections.push(_c) if _c
    _collections

  sortModelsBy: (model) => model.cid

  # Takes an object with collection cids as keys
  # and an array of models as values:
  #
  #   {
  #     collection_cid: [models...]
  #   }
  #
  # and an optional callback which is called for
  # each collection with with collection_id and models
  #
  # Returns an array of models
  filterAndSortCollectionsModels: (models, callbacks) =>

    # Sort all collections' models seperately
    # and find the collection with the lowest value
    # for the last model

    lowest_last_value = null

    for collection_cid, _models of models
      continue unless models[collection_cid].length

      models[collection_cid] = _.sortBy(_models, @sortModelsBy)

      if lowest_last_value
        _last_value = @sortModelsBy(_.last(models[collection_cid]))
        if _last_value < lowest_last_value
          lowest_last_value = _last_value
      else
        lowest_last_value = @sortModelsBy(_.last(models[collection_cid]))

    # Discard all models with a sort value greater than
    # the lowest last value (this ensures that fetching
    # paginated results from multiple collections
    # doesn't distort the sort order)

    final_models = []

    for collection_cid, _models of models
      _models = _.filter(_models, (model) =>

        if @sortModelsBy(model) <= lowest_last_value
          true
        else
          callbacks.rejectModel?(collection_cid, model)
          false
      )

      callbacks.complete?(collection_cid, _models)

      final_models = final_models.concat(_models)

    # Sort and return the remaining models
    _.sortBy(final_models, @sortModelsBy)

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
    models = {}
    responses = {}
    xhrs = {}
    collections_params = {}
    collections_options = {}
    collections_success = {}
    is_success = false

    successFn = (collection, _models) =>
      is_success = true
      collections_success[collection.cid] = true

      for model, index in _models
        continue if models[collection.cid] && models[collection.cid].indexOf(model) != -1
        models[collection.cid] ?= []
        models[collection.cid].push(model)

    failureFn = (collection) =>
      collections_success[collection.cid] = false

    completeFn = (collection, _models, res, xhr, _params, _options) =>
      num_pending_fetches -= 1

      responses[collection.cid] = res
      xhrs[collection.cid] = xhr
      collections_params[collection.cid] = _.extend {}, _params, params[collection.cid] || {}
      collections_options[collection.cid] = _.extend {}, _options, options[collection.cid] || {}

      if num_pending_fetches <= 0
        models = @filterAndSortCollectionsModels(models,
          rejectModel: (collection_cid, model) =>
            # remove discarded models from collection
            # to prevent it from being lost in a unique filter
            @constructor.collection.find(cid: collection_cid).removeIds(model.cid)

          complete: (collection_cid, _models) =>
            if collections_success[collection_cid]
              options[collection.cid]?.success?(_models, responses[collection_cid], xhrs[collection_cid], collections_params[collection_cid], collections_options[collection_cid])
            else
              options[collection.cid]?.failure?(responses[collection_cid], xhrs[collection_cid], collections_params[collection_cid], collections_options[collection_cid])

            options[collection_cid]?.complete?(_models, responses[collection_cid], xhrs[collection_cid], collections_params[collection_cid], collections_options[collection_cid])
        )

        if is_success
          models = @fetchSuccess(models, options)
          options.success?(models, responses, xhrs, collections_params, options)
          @trigger('fetch:success', models, xhrs, collections_params, options)
        else
          models = null
          options.failure?(responses, xhrs, collections_params, options)
          @trigger('fetch:failure', responses, xhrs, collections_params, options)

        options.complete?(models, responses, xhrs, collections_params, options)
        @trigger('fetch:complete', models, responses, xhrs, collections_params, options)

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

