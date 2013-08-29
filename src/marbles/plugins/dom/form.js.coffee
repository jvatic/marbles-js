#= require marbles/dom
#= require_self

Marbles.DOM.Form = class HTMLForm
  constructor: (@el) ->
    @fields = {}

    @validator = new HTMLFormValidator(@)

    @initialize?()

    Marbles.DOM.on(@el, 'submit', @handleSubmit)

  handleSubmit: (e) =>
    e.preventDefault()

    @submitWithValidation()

  submitWithValidation: (field_names = Object.keys(@fields), callbacks = {}) =>
    callbacks.success ?= @submit
    @validator.validate(field_names, callbacks)

  submit: =>
    @el.submit()

Marbles.DOM.Form.Validator = class HTMLFormValidator
  constructor: (@form) ->

  validate: (field_names, callbacks = {}) =>
    @num_pending = 0
    @num_failed = 0

    @failureFn = callbacks.failure
    @successFn = callbacks.success

    for name, field of @form.fields
      if field_names.indexOf(name) is -1
        field.clearInvalid()
        continue

      @num_pending += 1

      @validateField(field)

  validateField: (field) =>
    # wait until finished looping through fields
    # so @num_pending is accurate
    setTimeout =>
      field.validate(success: @fieldValid, failure: @fieldInvalid)
    , 0

  finally: =>
    if @num_failed > 0
      @failureFn?()
    else
      @successFn?()

    @failureFn = null
    @successFn = null
    @num_pending = null
    @num_failed = null

  fieldValid: =>
    @num_pending -= 1

    if @num_pending <= 0
      @finally()

  fieldInvalid: =>
    @num_pending -= 1
    @num_failed += 1

    if @num_pending <= 0
      @finally()

Marbles.DOM.Form.Field = class HTMLFormField
  @CSS_INVALID_CLASS: 'invalid'
  @CSS_VALID_CLASS: 'valid'
  @CSS_HIDDEN_CLASS: 'hidden'

  container_el: null
  error_msg_el: null

  constructor: (@el) ->
    @initialize?()

  getValue: =>
    @el.value

  clearInvalid: =>
    if @container_el
      Marbles.DOM.removeClass(@container_el, @constructor.CSS_INVALID_CLASS) if @container_el
      Marbles.DOM.addClass(@error_msg_el, @constructor.CSS_HIDDEN_CLASS) if @error_msg_el

  markValid: =>
    if @container_el
      Marbles.DOM.removeClass(@container_el, @constructor.CSS_INVALID_CLASS)
      Marbles.DOM.addClass(@container_el, @constructor.CSS_VALID_CLASS)
    Marbles.DOM.addClass(@error_msg_el, @constructor.CSS_HIDDEN_CLASS) if @error_msg_el

  markInvalid: (msg) =>
    if @container_el
      Marbles.DOM.removeClass(@container_el, @constructor.CSS_VALID_CLASS)
      Marbles.DOM.addClass(@container_el, @constructor.CSS_INVALID_CLASS)

    if msg && @error_msg_el
      Marbles.DOM.setInnerText(@error_msg_el, msg)
      Marbles.DOM.removeClass(@error_msg_el, @constructor.CSS_HIDDEN_CLASS)

  validate: (callbacks = {}) =>
    @performValidation?(
      success: =>
        @markValid()
        callbacks.success?()

      failure: (msg) =>
        @markInvalid(msg)
        callbacks.failure?()
    )

Marbles.DOM.Form.CombinedFields = class HTMLFormCombinedFields
  constructor: (@fields) ->
    @field_names = Object.keys(@fields)

    @initialize?()

  getValue: (name) =>
    @fields[name].getValue() if name

  clearInvalid: (field_names = @field_names) =>
    for name in field_names
      @fields[name].clearInvalid()

  markValid: (field_names = @field_names) =>
    for name in field_names
      @fields[name].markValid()

  markInvalid: (errs) =>
    for name, msg in errs
      @fields[name].markInvalid(msg)

  validate: (callbacks = {}) =>
    @performValidation?(
      success: (field_names) =>
        @markValid(field_names)
        callbacks.success?()

      failure: (errs) =>
        @markInvalid(errs)
        callbacks.failure?()
    )

