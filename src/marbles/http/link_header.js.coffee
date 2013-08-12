#= require ../core
#= require_self

Marbles.HTTP ?= {}
Marbles.HTTP.LinkHeader = {
  parse: (link_header) ->
    links = []
    for link_str in link_header.split(/,[\s\r\n]*?\</)
      m = link_str.match(/<([^>]+)>((?:[\s\r\n]|.)*)/)
      continue unless m

      href = m[1]
      attrs_str = m[2]

      link = {
        href: href
      }
      for attr_str in attrs_str.split(/[\s\r\n]*;[\s\r\n]*/)
        m = attr_str.match(/([^=]+)=['"]?([^'"]+)['"]?/)
        continue unless m
        k = m[1]
        v = m[2]
        link[k] = v

      links.push(link)

    links
}
