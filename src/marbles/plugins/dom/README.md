# Marbles DOM Plugins

## Form Validation

### Basic Usage Example

```html
<form id='registration-form' action='/register' method='POST'>
  <div class='control-group'>
    <label>Username</label>
    <input name='username' type='text'>
    <span class='error-msg hidden'></span>
  </div>

  <div class='control-group'>
    <label>Passphrase</label>
    <input name='passphrase' type='password'>
    <span class='error-msg hidden'></span>
  </div>

  <div class='control-group'>
    <label>Confirm Passphrase</label>
    <input name='passphrase_confirm' type='password'>
    <span class='error-msg hidden'></span>
  </div>

  <button class='btn btn-primary' type='submit'>Register</button>
</form>
```

```coffeescript
#= require marbles/plugins/dom/form

class RegistrationForm extends Marbles.DOM.Form
  initialize: =>
    @fields.username = new UsernameField(Marbles.DOM.querySelector('[name=username]', @el))

    @fields.passphrase = new PassphraseCombinedField(
      passphrase: new FormField(Marbles.DOM.querySelector('[name=passphrase]', @el))
      confirmation: new FormField(Marbles.DOM.querySelector('[name=passphrase_confirm]', @el)
    )

class FormField extends Marbles.DOM.Form.Field
  constructor: ->
    super

    @container_el = Marbles.DOM.parentQuerySelector(@el, '.control-group')
    @error_msg_el = Marbles.DOM.querySelector('.error-msg', @container_el)

class UsernameField extends FormField
  performValidation: (callbacks) =>
    if @getValue().match(/^[-_a-z0-9]+$/)
      callbacks.success()
    else
      callbacks.failure("Invalid username")

class PassphraseCombinedField extends Marbles.DOM.Form.Field
  performValidation: (callbacks) =>
    unless @getValue('passphrase').match(/^.{6,60}$/)
      return callbacks.failure(
        passphrase: "Passphrase must be between 6 and 60 chars"
      )

    unless @getValue('confirmation') == @getValue('passphrase')
      return callbacks.failure(
        confirmation: "Confirmation must match passphrase"
      )

    callbacks.success()


new RegistrationForm(document.getElementById('registration-form'))
```
