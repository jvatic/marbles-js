#= require ../polyfills/querySelector
#= require ./core
#= require ./dependency_manager
#= require_self

DOM = Marbles.DOM ?= {}

##
# Dependencies
#
# Should be compatible with IE 9+, Firefox, Chrome, Safari, Opera, and all major mobile browsers.
#
# NOTE: Functions/properties available in all browsers are not listed

Marbles.registerDependency({
  keypath: "document"
  context: Marbles.global
  functions: [
    { name: "querySelector" },
    { name: "querySelectorAll" }
  ]
})

Marbles.registerDependency({
  keypath: "HTMLElement.prototype"
  context: Marbles.global
  functions: [
    { name: "querySelector" },
    { name: "querySelectorAll" }
  ]
})

Marbles.registerDependency({
  keypath: 'document.defaultView'
  context: Marbles.global
  functions: [
    { name: 'getComputedStyle' }
  ]
})

Marbles.registerDependency({
  keypath: 'Array.prototype'
  context: Marbles.global
  functions: [
    { name: 'indexOf' }
  ]
})

##
# Querying

DOM.matchesQuerySelector = (el, selector) ->
  for node in el.parentNode.querySelectorAll(selector)
    return true if node == el

  return false

DOM.parentQuerySelector = (el, selector) ->
  node = el
  while node = node.parentNode
    return node if @match(node, selector)

  return null

DOM.enumerateParentNodes = (el, callback) ->
  should_stop = false
  stopFn = ->
    should_stop = true

  node = el
  while node = node.parentNode
    callback(node, stopFn)
    break if should_stop

  return null

DOM.parentNodes = (el) ->
  nodes = []

  node = el
  while node = node.parentNode
    nodes.push(node)

  return nodes

##
# Reflection

DOM.isVisible = (el) ->
  @getStyle(el, 'display') != 'none' &&
  @getStyle(el, 'visibility') != 'hidden'

DOM.isNodeInDocument = (el) ->
  for node in @parentNodes(el)
    return true if node == document.body

  return false

DOM.getInnerText = (el) ->
  el.innerText || el.textContent

DOM.getStyle = (el, name) ->
  # convert to camel case (e.g. 'padding-left' to 'paddingLeft')
  name = name.replace(/-([a-z])/ig, ((match, char) -> char.toUpperCase()))

  val = el.style[name]
  val = @getComputedStyle(el, name) if !val || val.match(/^[\s\r\t\n]*$/)

  return val

DOM.getComputedStyle = (el, name) ->
  document.defaultView.getComputedStyle(el)[name]

DOM.absoluteOffsetTop = (el) ->
  return unless el
  offset_top = el.offsetTop
  ref = el
  while ref = ref.offsetParent
    offset_top += ref.offsetTop

  return offset_top

DOM.absoluteOffsetLeft = (el) ->
  return unless el
  offset_left = el.offsetLeft
  ref = el
  while ref = ref.offsetParent
    offset_left += ref.offsetLeft

  return offset_left

DOM.innerWidth = (el) ->
  width = parseFloat @getComputedStyle(el, 'width')
  padding = parseFloat(@getStyle(el, 'padding-left'))
  padding += parseFloat(@getStyle(el, 'padding-right'))

  return width - padding

DOM.windowHeight = ->
  if typeof window.innerHeight != undefined
    return window.innerHeight

  if typeof document.body.offsetHeight != undefined
    return document.body.offsetHeight

  return document.documentElement.offsetHeight

DOM.windowWidth = ->
  if typeof window.innerWidth != undefined
    return window.innerWidth

  if typeof document.body.offsetWidth != undefined
    return document.body.offsetWidth

  return document.documentElement.offsetWidth

##
# Contruction

DOM.createElementFromHTML = (html) ->
  el = document.createElement('div')
  @appendHTML(el, html)

  if el.childElementCount == 1
    el = el.children[0]

  return el

##
# Manipulation

DOM.addClass = (el, class_names) ->
  classes = el.className.split(' ')

  for name in class_names.split(' ')
    classes.push(name) if classes.indexOf(name) == -1

  el.className = classes.join(' ')

  return el

DOM.removeClass = (el, class_names) ->
  exclude_names = class_names.split(' ')

  classes = []

  for name in el.className.split(' ')
    continue if exclude_names.indexOf(name) != -1

    classes.push(name)

  el.className = classes.join(' ')

  return el

DOM.replaceNode = (el, new_el) ->
  el.parentNode.replaceChild(new_el, el)

DOM.removeNode = (el) ->
  el.parentNode.removeChild(el)

DOM.removeAllChildren = (el) ->
  el.innerHTML = ""

  return el

DOM.setInnerText = (el, value) ->
  el.textContent = value
  el.innerText = value

DOM.setInnerHTML = (el, html) ->
  @removeAllChildren(el)
  @appendHTML(el, html)

DOM.prependChild = (el, node) ->
  if el.firstChild
    el.insertBefore(node, el.firstChild)
  else
    el.appendChild(node)

DOM.prependHTML = (el, html) ->
  tmp_fragment = document.createDocumentFragment()

  @appendHTML(tmp_fragment, html)

  child_nodes = tmp_fragment.childNodes

  for index in [(child_nodes.length-1)..0]
    node = child_nodes[index]

    continue unless node

    @prependChild(el, node)

  return el

DOM.appendHTML = (el, html) ->
  tmp_el = document.createElement('div')
  tmp_el.innerHTML = html

  # Hack to make appending script tags work as expected
  for script_node in tmp_el.querySelectorAll('script')
    new_node = document.createElement('script')
    new_node.type = script_node.type

    if script_node.src
      new_node.src = script_node.src
    else
      new_node.innerHTML = script_node.innerHTML

    @replaceNode(script_node, new_node)

  while node = tmp_el.firstChild
    el.appendChild(node)

  return el

DOM.insertHTMLBefore = (html, reference_el) ->
  fragment = document.createDocumentFragment()
  @appendHTML(fragment, html)
  @insertBefore(fragment, reference_el)

DOM.insertHTMLAfter = (html, reference_el) ->
  fragment = document.createDocumentFragment()
  @appendHTML(fragment, html)
  @insertAfter(fragment, reference_el)

DOM.insertBefore = (el, reference_el) ->
  reference_el.parentNode.insertBefore(el, reference_el)

DOM.insertAfter = (el, reference_el) ->
  @insertBefore(el, reference_el)
  @insertBefore(reference_el, el)

  return el

##
# Events

DOM._add_event_listener_fn_name = (typeof HTMLElement.prototype.addEventListener == 'function') ? 'addEventListener' : 'attachEvent'
DOM.addEventListener = (el, events, callback, capture=false) ->
  return for event in events.split(' ')
    el[@_add_event_listener_fn_name](event, callback, capture)

DOM.addSingleFireEventListener = (el, events, callback, capture=false) ->
  _callback = ->
    callback.apply(this, arguments)

    DOM.removeEventListener(el, events, capture)

  @addEventListener(el, events, _callback, capture)

DOM._remove_event_listener_fn_name = (typeof HTMLElement.prototype.removeEventListener == 'function') ? 'removeEventListener' : 'detachEvent'
DOM.removeEventListener = (el, events, callback, capture=false) ->
  return for event in events.split(' ')
    el[@_remove_event_listener_fn_name](event, callback, capture)

##
# Form Serialization / Deserialization

DOM.getFormElementValue = (el) ->
  if el.type == 'file'
    return el.files

  if el.nodeName.toLowerCase() == 'select'
    is_multi_select = el.multiple

DOM.    value = is_multi_select ? []  = ""

    for option in el.querySelectorAll('option')
      continue unless option.selected

      if is_multi_select
        value.push(option.value)
      else
        return option.value

  else
    return el.value

DOM.setFormElementValue = (el, value) ->
  if el.nodeName.toLowerCase() == 'select' && el.multiple
    value = [value] unless typeof value == 'object' && typeof value.length is 'number'

    for option in el.querySelectorAll('option')
      continue if value.indexOf(option.value) == -1

      option.selected = true

  else
    el.value = value

  return null

DOM.serializeForm = (form_el) ->
  values = {}

  for el in form_el.querySelectorAll('[name]')
    value = @getFormElementValue(el)

    continue if el.type is 'checkbox' && !el.checked
    continue if el.type is 'radio' && !el.checked

    values[el.name] = value

  return values

DOM.deserializeForm = (form_el, values) ->
  for name, value of values
    for el in form_el.querySelectorAll("[name=#{key}]")
      @setFormElementValue(el, value)

  return null

