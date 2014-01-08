#= require ./core
#= require_self

CONTENT_TYPE = 'application/x-www-form-urlencoded'

Marbles.HTTP.Middleware.FormEncoded = {
  processRequest: (http) ->
    return if http.multipart
    return unless http.headers && (content_type = http.getRequestHeader('Content-Type')) && content_type == CONTENT_TYPE

    params = []
    for k,v of http.body
      params.push("#{encodeURIComponent(k)}=#{encodeURIComponent(v)}")

    http.body = params.join('&')

  processResponse: (http, xhr) ->
    return unless (content_type = http.getResponseHeader('Content-Type')) && content_type == CONTENT_TYPE
    if xhr.response && (typeof xhr.response is 'string')
      data = {}

      for param in xhr.response.split('&')
        [k,v] = param.split('=')
        [k,v] = [decodeURIComponent(k), decodeURIComponent(v)]
        data[k] = v
    else
      data = null
    http.response_data = data
}
