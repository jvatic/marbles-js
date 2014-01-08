#= require ./core
#= require_self
#= require ./http/uri
#= require ./http/link_header
#= require ./http/request

Marbles.HTTP = class HTTP
  @MULTIPART_BOUNDARY: "-----------REQUEST_PART"

  @MAX_BLOB_SIZE: 2000000 # 2MB

  @RETRY_STATUS_CODES: [
    0,   # Request failed
    500, # Internal Server Error
    502, # Bad Gateway
    503, # Service Unavailable
    504, # Gateway Timeout
    522  # Connection timed out
  ]

  @active_requests: {}

  MAX_NUM_RETRIES: 3

  RETRY_METHODS: ['GET', 'HEAD']

  constructor: (args, retry_count) ->
    [@method, @url, params, @body, @headers, callback, @middleware] = [args.method.toUpperCase(), args.url, args.params, args.body, args.headers, args.callback, args.middleware || []]

    if @method in ['GET', 'HEAD']
      @key = "#{@method}:#{@url}:#{JSON.stringify(params || '{}')}"
      if request = HTTP.active_requests[@key]
        return request.callbacks.push(callback)
      else
        HTTP.active_requests[@key] = @

    @retry_count = retry_count || 0

    @retry = =>
      http = new HTTP args, @retry_count
      http.callbacks = @callbacks

    @callbacks = if callback then [callback] else []

    @request = new HTTP.Request

    uri = new HTTP.URI @url
    uri.mergeParams(params)
    @host = uri.hostname
    @path = uri.path
    @port = uri.port
    @url = uri.toString()

    @sendRequest()

  setRequestHeader: => @request.setRequestHeader(arguments...)
  setRequestHeaders: (headers) =>
    for header, value of headers
      @setRequestHeader(header, value)

  sendRequest: =>
    return unless @request

    @request.open(@method, @url)
    @setRequestHeaders(@headers) if @headers

    ##
    # Multipart Request if body is an array
    # eg. body = [['somefile', new Blob(...), 'somefile.extention'], ...]
    if @body && typeof @body is 'object' && @body.hasOwnProperty('length')
      @setRequestHeader('Content-Type', "multipart/form-data; boundary=#{@constructor.MULTIPART_BOUNDARY}")
      @multipart = true

      @buildMultipartRequestBody =>
        @runRequestMiddleware()
        @finalizeSendRequest()
    else
      @runRequestMiddleware()
      @finalizeSendRequest()

  readAsBinaryString: (blob, callback) =>
    reader = new FileReader
    reader.onload = (e) =>
      callback(e.target.result)
    reader.readAsBinaryString(blob)

  buildMultipartRequestBody: (onComplete) =>
    start_boundary = "--#{@constructor.MULTIPART_BOUNDARY}\r\n"
    close_boundary = "--#{@constructor.MULTIPART_BOUNDARY}--"
    parts = []

    num_pending_parts = @body.length
    add_part = (data) =>
      parts.push(data)
      num_pending_parts -= 1

      if num_pending_parts == 0
        @body = start_boundary
        @body += parts.join(start_boundary)
        @body += close_boundary
        onComplete()

    for part in @body
      do (part) =>
        [name, blob, filename] = part
        return add_part("") if blob.size > @constructor.MAX_BLOB_SIZE
        data = ""
        data += "Content-Disposition: form-data; name=\"#{name}\"; filename=\"#{filename}\"\r\n"
        data += "Content-Type: #{blob.type}\r\n"
        data += "Content-Length: #{blob.size}\r\n"
        data += "\r\n"
        @readAsBinaryString blob, (binary) =>
          data += "#{binary}\r\n"
          add_part(data)

  runRequestMiddleware: =>
    for middleware in @middleware
      middleware.processRequest?(@)

  finalizeSendRequest: =>
    @request.on 'complete', (xhr) =>
      delete HTTP.active_requests[@key] if @key

      if (@method in @RETRY_METHODS) && (xhr.status in @constructor.RETRY_STATUS_CODES) && (@retry_count < @MAX_NUM_RETRIES)
        @retry_count += 1
        @retry()
        return

      @response_data = xhr.response

      abort = false

      retryFn = =>
        return if @retry_count >= @MAX_NUM_RETRIES

        abort = true

        @retry_count += 1
        @retry()

      for middleware in @middleware
        break if abort
        middleware.processResponse?(@, xhr, retry: retryFn)

      return if abort

      for fn in @callbacks
        continue unless typeof fn == 'function'
        fn(@response_data, xhr)

    if @multipart
      @request.sendAsBinary(@body)
    else
      @request.send(@body)

