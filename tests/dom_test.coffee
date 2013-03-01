describe "Marbles.DOM.querySelector", ->
  it "finds first matching element in document", ->
    el = document.createElement('div')
    el.className = 'test-div-1'
    document.body.appendChild(el)

    expect(Marbles.DOM.querySelector('.test-div-1')).toEqual(el)

  it "finds first matching element within given element", ->
    parent_el = document.createElement('div')
    control_parent_el = document.createElement('div')
    document.body.appendChild(parent_el)
    document.body.appendChild(control_parent_el)

    control_el = document.createElement('div')
    el = document.createElement('div')
    control_el.className = 'test-div-2'
    el.className = 'test-div-2'
    control_parent_el.appendChild(control_el)
    parent_el.appendChild(el)

    expect(Marbles.DOM.querySelector('.test-div-2', parent_el)).toEqual(el)
    expect(Marbles.DOM.querySelector('.test-div-2', control_parent_el)).toEqual(control_el)

describe "Marbles.DOM.querySelectorAll", ->
  it "finds all matchings elements in document", ->
    klass = 'test-div-3'
    for n in [1..5]
      el = document.createElement('div')
      el.className = klass
      document.body.appendChild(el)

    other_el = document.createElement('div')
    other_el.className = 'non-test-div'
    document.body.appendChild(other_el)

    expect(Marbles.DOM.querySelectorAll(".#{klass}").length).toEqual(5)

  it "finds all matching elements within given element", ->
    parent_el = document.createElement('div')
    control_parent_el = document.createElement('div')
    document.body.appendChild(parent_el)
    document.body.appendChild(control_parent_el)

    klass = 'test-div-4'
    for n in [1..5]
      el = document.createElement('div')
      el.className = klass
      parent_el.appendChild(el)
    for n in [1..7]
      control_el = document.createElement('div')
      control_el.className = klass
      control_parent_el.appendChild(control_el)

    expect(Marbles.DOM.querySelectorAll(".#{klass}", parent_el).length).toEqual(5)
    expect(Marbles.DOM.querySelectorAll(".#{klass}", control_parent_el).length).toEqual(7)

describe "Marbles.DOM.match", ->
  it "should return true if given selector matches given element", ->
    el = document.createElement('div')
    el.className = 'foo bar baz'
    document.body.appendChild(el)

    expect(Marbles.DOM.match(el, '.foo')).toBe(true)
    expect(Marbles.DOM.match(el, '.bar')).toBe(true)
    expect(Marbles.DOM.match(el, '.baz')).toBe(true)

  it "should return false if geven selector doesn't match given element", ->
    el = document.createElement('div')
    document.body.appendChild(el)

    expect(Marbles.DOM.match(el, '.foo')).toBe(false)
    expect(Marbles.DOM.match(el, '.bar')).toBe(false)
    expect(Marbles.DOM.match(el, '.baz')).toBe(false)

