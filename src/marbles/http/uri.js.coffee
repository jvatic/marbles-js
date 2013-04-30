window.Marbles ?= {}
Marbles.HTTP ?= {}
Marbles.HTTP.URI = class URI
  constructor: (@url) ->
    return @url unless @url
    return @url if @url.isURI

    m = @url.match(/^(https?:\/\/)?([^\/]+)?(.*)$/)
    h = m[2]?.split(':')
    @scheme = m[1] or (window.location.protocol + '//')
    @hostname = if h then h[0] else window.location.hostname
    @port = parseInt(h[1]) if h and h[1]
    if @hostname == window.location.hostname and window.location.port
      @port ?= parseInt(window.location.port)
    if !@port
      @port ?= if @scheme.match(/^https/) then 443 else 80
    @path = m[3]
    @base_host = _.last(@hostname.split('.'))

    @isURI = true

  toString: => @toStringWithoutSchemePort()
  toStringWithoutSchemePort: =>
    if @port in [443, 80]
      port_string = ''
    else
      port_string = ':' + @port

    (@scheme + @hostname + port_string + @path).replace(/\/$/, '')

  assertEqual: (uri_or_string) =>
    unless uri_or_string.isURI
      uri = new @constructor uri_or_string
    else
      uri = uri_or_string
    (uri.scheme == @scheme) and (uri.hostname == @hostname) and (uri.port == @port) and (uri.path == @path)

  mergeParams: (params) =>
    params = for k,v of params
      v = if typeof v is 'object' && typeof v.join is 'function'
        encodeURIComponent(v.join(','))
      else
        encodeURIComponent(v)
      "#{encodeURIComponent(k)}=#{v}"
    separator = if @path.match(/\?/) then "&" else "?"
    @path += "#{separator}#{params.join('&')}" if params.length

