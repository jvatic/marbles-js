#= require ../polyfills/querySelector
#= require_self
#= require ./dom/input_selection

Marbles.DOM = DOM = {
  querySelector: (selector, el) -> (if arguments.length == 2 then el else document)?.querySelector(selector)
  querySelectorAll: (selector, el) -> (if arguments.length == 2 then el else document)?.querySelectorAll(selector) || []

  match: (el, selector) ->
    return unless el
    _.any @querySelectorAll(selector, el.parentNode), (_el) => _el == el

  attr: (el, name) ->
    return unless el
    el.attributes?.getNamedItem(name)?.value

  setAttr: (el, name, value) ->
    return unless el
    el.setAttribute(name, value)

  removeChildren: (el) ->
    el.innerHTML = ""
    el

  replaceChildren: (el, new_children...) ->
    DOM.removeChildren(el)

    for child in new_children
      el.appendChild(child)

    el

  offsetTop: (el) ->
    return unless el
    offset_top = el.offsetTop
    ref = el
    while ref = ref.offsetParent
      offset_top += ref.offsetTop
    offset_top

  offsetLeft: (el) ->
    return unless el
    offset_left = el.offsetLeft
    ref = el
    while ref = ref.offsetParent
      offset_left += ref.offsetLeft
    offset_left

  replaceWithHTML: (el, html) ->
    new_el = document.createElement('div')
    DOM.appendHTML(new_el, html)
    new_el = if new_el.childElementCount == 1
      new_el.children[0]
    else
      new_el

    DOM.replaceWith(el, new_el)

  replaceWith: (el, new_el) ->
    el.parentNode.replaceChild(new_el, el)
    new_el

  prependChild: (el, node) ->
    if el.firstChild
      el.insertBefore(node, el.firstChild)
    else
      el.appendChild(node)

  removeNode: (el) ->
    el.parentNode?.removeChild(el)

  prependHTML: (el, html) ->
    tmp_fragment = document.createDocumentFragment()
    DOM.appendHTML(tmp_fragment, html)
    child_nodes = tmp_fragment.childNodes
    for index in [(child_nodes.length-1)..0]
      node = child_nodes[index]
      continue unless node
      DOM.prependChild(el, node)
    el

  appendHTML: (el, html) ->
    tmp_el = document.createElement('div')
    tmp_el.innerHTML = html

    # Hack to make appending script tags work as expected
    for script_node in DOM.querySelectorAll('script', tmp_el)
      new_node = document.createElement('script')
      new_node.type = script_node.type
      if script_node.src
        new_node.src = script_node.src
      else
        new_node.innerHTML = script_node.innerHTML
      DOM.replaceWith(script_node, new_node)

    while node = tmp_el.firstChild
      el.appendChild(node)
    el

  insertHTMLAfter: (html, reference_el) ->
    fragment = document.createDocumentFragment()
    DOM.appendHTML(fragment, html)
    DOM.insertAfter(fragment, reference_el)

  insertBefore: (el, reference_el) ->
    reference_el.parentNode?.insertBefore(el, reference_el)

  insertAfter: (el, reference_el) ->
    DOM.insertBefore(el, reference_el)
    DOM.insertBefore(reference_el, el)
    el

  windowHeight: ->
    return window.innerHeight if window.innerHeight
    return document.body.offsetHeight if document.body.offsetHeight
    document.documentElement?.offsetHeight

  windowWidth: ->
    return window.innerWidth if window.innerWidth
    return document.body.offsetWidth if document.body.offsetWidth
    document.documentElement?.offsetWidth

  innerWidth: (el) ->
    width = parseInt @getStyle(el, 'width')
    padding = parseInt(@getStyle(el, 'padding-left'))
    padding += parseInt(@getStyle(el, 'padding-right'))
    width - padding

  addClass: (el, class_name) ->
    return unless el
    classes = el.className.split(' ')
    classes = _.uniq(classes.concat(class_name.split(' ')))
    el.className = classes.join(' ')
    el

  removeClass: (el, class_name) ->
    return unless el
    classes = el.className.split(' ')
    classes = _.without(classes, class_name.split(' ')...)
    el.className = classes.join(' ')
    el

  show: (el, options={}) ->
    return unless el
    if options.visibility
      el.style.visibility = 'visible'
    else
      el.style.display = 'block'

  hide: (el, options={}) ->
    return unless el
    if options.visibility
      el.style.visibility = 'hidden'
    else
      el.style.display = 'none'

  isVisible: (el, options={}) ->
    DOM.getStyle(el, 'display') != 'none' &&
    DOM.getStyle(el, 'visibility') != 'hidden' &&
    (!options.check_exists || DOM.exists(el))

  exists: (el) ->
    _.any(DOM.parentNodes(el), (_el) -> _el == document.body)

  getStyle: (el, name) ->
    # convert to camel case (e.g. 'padding-left' to 'paddingLeft')
    name = name.replace(/-([a-z])/ig, ((match, char) -> char.toUpperCase()))

    val = el.style[name]
    val = DOM.getComputedStyle(el, name) if !val || val.match(/^[\s\r\t\n]*$/)
    val

  getComputedStyle: (el, name) ->
    document.defaultView?.getComputedStyle(el)[name]

  setStyle: (el, name, value) ->
    el.style[name] = value

  setStyles: (el, styles) ->
    for name, value of styles
      @setStyle(el, name, value)

  setInnerText: (el, value) ->
    el.textContent = value
    el.innerText = value
    value

  parentNodes: (el) ->
    nodes = []
    node = el
    while node = node.parentNode
      nodes.push(node)
    nodes

  _events: {}
  _event_id_counter: 0
  _generateEventId: -> @_event_id_counter++

  on: (el, events, callback, capture=false) ->
    return unless el
    method = 'addEventListener' if el.addEventListener
    method ?= 'attachEvent' if el.attachEvent
    return unless method

    for event in events.split(' ')
      event_id = @_generateEventId()
      el._events ?= []
      @_events[event_id] = el[method](event, callback, capture)
      el._events.push(event_id)

  off: (el, events, callback, capture=false) ->
    return unless el
    method = 'removeEventListener' if el.removeEventListener
    method ?= 'detachEvent' if el.detachEvent
    return unless method

    for event in events.split(' ')
      el[method](event, callback, capture)

  formElementValue: (el) ->
    if el.nodeName.toLowerCase() == 'select'
      multiple = el.multiple
      value = if multiple then [] else ""
      for option in DOM.querySelectorAll('option', el)
        continue unless option.selected
        if multiple
          value.push option.value
        else
          value = option.value
          break
      value
    else
      el.value

  serializeForm: (form, options = {}) ->
    params = {}
    for el in DOM.querySelectorAll('[name]', form)
      value = if el.type == 'file'
        el.files
      else
        DOM.formElementValue(el)

      continue if el.type is 'radio' && !el.checked
      continue if el.type is 'checkbox' && !el.checked

      if options.expand_nested && el.name.match(/^([^\[]+)\[([^\[]+)\]/)
        name = RegExp.$1
        parts = []

        _name = el.name
        _offset = name.length
        while _name.slice(_offset, _name.length).match(/^\[([^\[]+)\]/)
          if _part = RegExp.$1
            _offset += _part.length + 2
            parts.push(_part)

        if options.use_keypath
          params["#{name}.#{parts.join('.')}"] = value
        else
          _obj = (params[name] ?= {})
          for _part, index in parts
            if index == parts.length-1
              _obj[_part] = value
            else
              _obj = (_obj[_part] = {})
      else
        params[el.name] = value
    params

  setElementValue: (el, val) ->
    if el.nodeName.toLowerCase() == 'select' && el.multiple
      val = [val] unless _.isArray(val)
      for option in DOM.querySelectorAll('option', el)
        option.selected = true if val.indexOf(option.value) != -1
    else
      el.value = val

  loadFormParams: (form, params) ->
    for key, val of params
      el = DOM.querySelector("[name=#{key}]")
      continue unless el
      DOM.setElementValue(el, val)

}

