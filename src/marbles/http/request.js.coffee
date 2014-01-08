Marbles.HTTP ?= {}
Marbles.HTTP.Request = class HTTPRequest
  request_headers: {}

  constructor: ->
    @callbacks = {}

    XMLHttpFactories = [
      -> new XMLHttpRequest()
      -> new ActiveXObject("Msxml2.XMLHTTP")
      -> new ActiveXObject("Msxml3.XMLHTTP")
      -> new ActiveXObject("Microsoft.XMLHTTP")
    ]

    @xmlhttp = false
    for fn in XMLHttpFactories
      try
        @xmlhttp = fn()
      catch e
        continue
      break

    @xmlhttp.onreadystatechange = @stateChanged

  stateChanged: =>
    return if @xmlhttp.readyState != 4
    @trigger 'complete'

  setRequestHeader: (key, val) =>
    @request_headers[key] = val
    @xmlhttp.setRequestHeader(key,val)

  getRequestHeader: (key) =>
    @request_headers[key]

  getResponseHeader: (key) =>
    @xmlhttp.getResponseHeader(key)

  on: (event_name, fn) =>
    @callbacks[event_name] ||= []
    @callbacks[event_name].push fn

  trigger: (event_name) =>
    @callbacks[event_name] ||= []
    for fn in @callbacks[event_name]
      if typeof fn == 'function'
        fn(@xmlhttp)
      else
        console?.warn "#{event_name} callback is not a function"
        console?.log fn

  open: (method, url) => @xmlhttp.open(method, url, true)

  sendAsBinary: (data) =>
    return @trigger('complete') if @xmlhttp.readyState == 4
    if typeof @xmlhttp.sendAsBinary is 'function'
      @xmlhttp.sendAsBinary(data)
    else
      throw new Error("#{@xmlhttp.constructor.name}.prototype.sendAsBinary is not defined!")

  send: (data) =>
    return @trigger('complete') if @xmlhttp.readyState == 4
    @xmlhttp.send(data)

XMLHttpRequest::sendAsBinary ?= (datastr) ->
  byteValue = (x) -> x.charCodeAt(0) & 0xff

  ords = Array::map.call(datastr, byteValue)
  ui8a = new Uint8Array(ords)
  @send(ui8a.buffer)
