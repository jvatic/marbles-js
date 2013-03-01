Marbles.Views = {}
Marbles.View = class View
  @instances: {
    all: {}
  }
  @_id_counter: 0
  @view_name: '_default'

  @find: (cid) ->
    @instances.all[cid]

  # Marbles assumes you have pre-compiled hogan templates
  # TODO: Should be able to use any templating library
  @getTemplate: (template_path) ->
    return Marbles.throwAsync new Error("Marbles.View.templates is not defined. Expected an object conatining compiled hogan (mustache) templates.") unless (@templates ?= window.HoganTemplates)
    template = @templates[template_path]
    return Marbles.throwAsync new Error("Marbles.View.templates[#{template_path}] is not defined.") unless template
    template

  @detach: (cid) ->
    delete @instances.all[cid]
    instance_cids = @instances[@view_name]
    index = instance_cids.indexOf(cid)
    return if index == -1
    instance_cids = instance_cids.slice(0, index).concat(instance_cids.slice(index + 1, instance_cids.length))
    @instances[@view_name] = instance_cids

  detach: =>
    @constructor.detach(@cid)
    @trigger 'detach', @

  constructor: (options = {}) ->
    @generateCid()
    @trackInstance()
    @initTemplates()

    for k in ['el', 'parent_view', 'container', 'render_method']
      @set(k, options[k]) if options[k]

    @on 'ready', @bindViews
    @initialize(options)

  generateCid: =>
    @cid = "#{@constructor.view_name}_#{@constructor._id_counter++}"

  trackInstance: =>
    @constructor.instances.all[@cid] = @
    @constructor.instances[@constructor.view_name] ?= []
    @constructor.instances[@constructor.view_name].push @cid

  initTemplates: =>
    @constructor.template ?= @constructor.getTemplate(@constructor.template_name) if @constructor.template_name
    if !@constructor.partials && @constructor.partial_names
      @constructor.partials = {}
      for name in @constructor.partial_names
        @constructor.partials[name] = @constructor.getTemplate(name)

  initialize: =>

  bindViews: =>
    @_child_views ?= {}
    _.each Marbles.DOM.querySelectorAll('[data-view]', (@container?.el || @el)), (el) =>
      view_class_name = Marbles.DOM.attr(el, 'data-view')

      if viewClass = Marbles.Views[view_class_name]
        _init = false
        unless el.view_cid && (view = viewClass.instances.all[el.view_cid])
          view = new viewClass el: el, parent_view: @
          _init = true
        @_child_views[view_class_name] ?= []
        @_child_views[view_class_name].push view.cid
        el.view_cid = view.cid

        view.bindViews?()

        @trigger("init:#{view_class_name}", view) if _init
        @trigger("init-view", view_class_name, view) if _init
      else
        console.warn "Marbles.Views.#{view_class_name} is not defined!"

  detachChildViews: =>
    for class_name, cids of (@_child_views || {})
      for cid in cids
        @constructor.instances.all[cid]?.detach()

    @_child_views = {}

  childViews: (view_class_name) =>
    _.map @_child_views[view_class_name], (cid) => @constructor.find(cid)

  findParentView: (view_name) =>
    key = "_parent_#{view_name}_cid"
    return view if @[key] && (view = Marbles.View.find(@[key]))

    view = @
    while view && view.constructor.view_name != view_name
      view = view.parent_view
    @[key] = view.cid if view
    view

  context: =>
    {}

  renderHTML: (context = @context()) =>
    unless @constructor.template
      console.error("template not found: #{@constructor.template_name}")
      return ""

    @constructor.template.render(context, @constructor.partials)

  render: (context = @context()) =>
    html = @renderHTML(context)

    if @container?.el
      @el = document.createElement('div')
      @el.innerHTML = html
      Marbles.DOM.replaceChildren(@container.el, @el)
    else
      if @render_method == 'replace'
        @el = Marbles.DOM.replaceWithHTML(@el, html)
      else
        @el.innerHTML = html

    @el.view_cid = @cid

    @detachChildViews()

    @trigger 'ready'

_.extend View, Marbles.Events
_.extend View::, Marbles.Events, Marbles.Accessors

