Marbles.Views = {}
Marbles.View = class View
  class @Template
    @find: (template_path) ->
      unless Marbles.View.templates ?= window.HoganTemplates
        Marbles.throwAsync new Error("Marbles.View.templates is not defined. Expected an object conatining compiled Hogan (mustache) or Lo-Dash templates.")
        return null

      template = Marbles.View.templates[template_path]
      unless template
        Marbles.throwAsync new Error("Marbles.View.templates[#{template_path}] is not defined.")
        return null

      if (typeof template.render) is 'function'
        # Hogan
        template
      else
        if (typeof template) is 'function'
          # Lowdash
          new Marbles.View.Template(template)
        else
          Marbles.throwAsync new Error("Marbles.View.templates[#{template_path}] does not have a render method and is not a function. Expected either a compiled Hogan or Lo-Dash template.")
          null

    constructor: (@compiled_template) ->
    render: (context, partials = {}) =>
      context = _.extend({ partials: partials }, context)
      context.context = context
      @compiled_template.call(context, context)

  @instances: {
    all: {}
  }
  @_id_counter: 0
  @view_name: '_default' # chould be snake_case version of Marbles.Views key (e.g. Marbles.Views.MainView should be main_view)

  @find: (cid) ->
    @instances.all[cid]

  @getTemplate: (template_path) ->
    Marbles.View.Template.find(template_path)

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

    for k in ['el', 'parent_view', '_parent_view_cid', 'container', 'render_method']
      @set(k, options[k]) if options[k]

    @_parent_view_cid ?= options.parent_view?.cid

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

  bindViews: (container = (@container?.el || @el)) =>
    @_child_views ?= {}
    _.each Marbles.DOM.querySelectorAll('[data-view]', container), (el) =>
      view_class_names = Marbles.DOM.attr(el, 'data-view').split(/\s+/)

      for view_class_name in view_class_names
        if viewClass = Marbles.Views[view_class_name]
          _init = false
          el.view_cids ?= {}
          unless (_view_cid = el.view_cids[view_class_name]) && (view = viewClass.instances.all[_view_cid])
            view = new viewClass el: el, parent_view: @, _parent_view_cid: @cid
            _init = true

          @_child_views[view_class_name] ?= []
          if @_child_views[view_class_name].indexOf(view.cid) == -1
            @_child_views[view_class_name].push view.cid

          el.view_cids[view_class_name] = view.cid

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

  parentView: =>
    Marbles.View.find(@_parent_view_cid)

  findParentView: (view_name) =>
    key = "_parent_#{view_name}_cid"
    return view if @[key] && (view = Marbles.View.find(@[key]))

    view = @
    while view && view.constructor.view_name != view_name
      view = view.parentView()
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

    @el.view_cids ?= {}
    @el.view_cids[@constructor.view_name.replace(/_([a-z])/ig, (match, char) -> char.toUpperCase()).replace(/^([a-z])/, (match, char) -> char.toUpperCase())] = @cid

    @detachChildViews()

    @trigger 'ready'

_.extend View, Marbles.Events
_.extend View::, Marbles.Events, Marbles.Accessors

