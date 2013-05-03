Marbles.HTTP.Middleware.SerializeJSON = {
  processRequest: (http) ->
    return if http.multipart
    return unless (content_type = http.headers['Content-Type']) && content_type.match(/\bjson/i)
    body = if http.body then JSON.stringify(http.body) else null
    body = null if body == "{}" or body == "[]"
    console.log('processRequest', typeof body)
    http.body = body

  processResponse: (http, xhr) ->
    return unless (content_type = xhr.getResponseHeader('Content-Type')) && content_type.match(/\bjson/i)
    if xhr.response
      try
        data = JSON.parse(xhr.response)
      catch e
        data = null
    else
      data = null
    http.response_data = data
}
