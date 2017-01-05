###
 selectiv v1.0.0 for Vue 2+
 (c) 2017, Jay Elaraj - http://nerdcave.com
###

class OptionItem
  constructor: (@text, @value, options = {}) ->
    @isNew = !!options.isNew
    @isPreview = !!options.isPreview

Vue.component 'selectiv',
  template: '''
    <div class="selectiv-component" @mousedown.prevent="toggleAutocomplete">
      <select multiple v-show="false" v-if="!useStringInput" :name="name" v-model="currSelectedValues">
        <option v-for="optionItem in selectedOptions" :value="optionItem.value">{{ optionItem.text }}</option>
      </select>
      <input type="hidden" v-if="useStringInput" :name="name" :value="delimitedValue">
      <template v-if="isMultiple">
        <ul class="selected-options">
          <template v-for="selectedOption in selectedOptionsWithInput">
            <li class="option-input" v-if="selectedOption.isInput">
              <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
                v-model.trim="inputValue"
                @keydown="keydown"
                v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false"
                :size="inputSize"
                :placeholder="inputPlaceholder"
                :style="inputStyles">
            </li><li class="option" v-else>
              <slot name="selectedOption" :text="selectedOption.text" :value="selectedOption.value">
                <span class="option-text" v-html="selectedOption.text"></span>
              </slot>
              <a class="option-close" v-if="hasRemoveButton" @click="removeSelectedOption(selectedOption)" @mousedown.stop.prevent></a>
            </li>
          </template>
        </ul>
      </template>
      <template v-else>
        <span class="single-text" v-html="singleText" :class="{ placeholder: !isSingleValueSet }"></span>
        <span class="single-clear" v-if="allowClear" @click="removeSelectedOption(selectedSingleOption)" @mousedown.stop.prevent>&times;</span>
        <span class="single-arrow" :class="{ 'arrow-up': isAutocompleteVisible, 'arrow-down': !isAutocompleteVisible }"></span>
      </template>
      <div class="autocomplete-wrapper autocomplete-below"
        v-if="isAutocompleteVisible"
        v-set-top-position="isAutocompleteVisible">
        <span v-if="!isMultiple" class="single-input-wrapper">
          <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            v-model.trim="inputValue"
            @keydown="keydown"
            @mousedown.stop
            v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false">
        </span>
        <slot name="noResults" :search-text="inputValue" v-if="isNoResultsVisible">
          <span class="no-results">No results</span>
        </slot>
        <ul class="autocomplete">
          <li v-for="(option, index) in autocompleteOptions"
            :class="{ selected: isSelected(option), 'new-option-preview': option.isPreview, highlighted: autocompleteIndex === index }"
            v-scroll-into-view="index === autocompleteIndex"
            @mouseup="selectAutocompleteOption(index)"
            @mouseover="autocompleteIndex = index"
            @mousedown.stop.prevent>
            <slot name="option" :text="option.text" :value="option.value" :text-marked="formatOptionText(option)" :value-marked="markOptionField(option.value)">
              <span v-html="formatOptionText(option)"></span>
            </slot>
          </li>
        </ul>
      </div>
    </div>
  '''

  props:
    options:
      type: Array
      default: -> []
    optionsText:
      type: String
      default: 'text'
    optionsValue:
      type: String
      default: 'value'
    multiple:
      type: Boolean
      default: false
    placeholder:
      type: String
      default: ''
    value: [Array, String, Number]
    name:
      default: 'options'
    allowNew:
      type: Boolean
      default: false
    hasAutocomplete:
      type: Boolean
      default: true
    restoreOnBackspace:
      type: Boolean
      default: false
    hasRemoveButton:
      type: Boolean
      default: true
    newValueFormat:
      type: String
      validator: (value) -> value.indexOf('%value%') > -1
    valueDelimiter:
      type: String
      default: null
    searchValue:
      type: Boolean
      default: false

  directives:
    'set-top-position':
      inserted: (el, binding) ->
        if binding.value
          rect = el.getBoundingClientRect()
          if rect.top + rect.height < window.innerHeight || window.innerHeight - rect.top > rect.top
            el.className = el.className.replace('autocomplete-above', 'autocomplete-below')
          else
            wrapper = el.parentNode
            styles = getComputedStyle(wrapper)
            borderWidths = parseFloat(styles.getPropertyValue('border-top-width')) + parseFloat(styles.getPropertyValue('border-bottom-width'))
            el.style.bottom = wrapper.getBoundingClientRect().height - borderWidths + 'px'
            el.className = el.className.replace('autocomplete-below', 'autocomplete-above')
        else
          el.style.bottom = null
    'scroll-into-view':
      update: (li, binding) ->
        return unless binding.value
        [ul, liRect] = [li.parentNode, li.getBoundingClientRect()]
        [liBottom, ulRect] = [li.offsetTop + liRect.height, ul.getBoundingClientRect()]
        totalHeight = ulRect.height + ul.scrollTop
        if li.offsetTop < ul.scrollTop
          ul.scrollTop = li.offsetTop
        else if liBottom > totalHeight
          ul.scrollTop += liBottom - totalHeight
    'focus':
      inserted: (el, binding) ->
        if binding.value then el.focus() else el.blur()
      update: (el, binding) ->
        if binding.value then el.focus() else el.blur()

  data: ->
    currSelectedValues: null
    userAddedOptions: []
    isFocused: false
    isAutocompleteVisible: false
    inputValue: ''
    autocompleteIndex: 0
    inputIndex: 0

  created: ->
    @currSelectedValues = @valueAsArray()
    @validateSelectedValues()
    @fireChange()

  computed:
    optionItems: ->
      options = if @options.length > 0 then @options else @valueAsArray()
      options.concat(@userAddedOptions).map (option) =>
        [text, value] = if typeof option is 'object'
          [option[@optionsText], option[@optionsValue]]
        else
          [option, option]
        new OptionItem(text, value, {isNew: option.isNew, isPreview: option.isPreview})
    isMultiple: ->
      @multiple
    delimitedValue: ->
      @currSelectedValues.join(@valueDelimiter)
    selectedOptions: ->
      @currSelectedValues.map (value) => @findOptionBy('value', value)
    selectedOptionsWithInput: ->
      @selectedOptions.slice(0, @inputIndex).concat({isInput: true}).concat(@selectedOptions.slice(@inputIndex))
    useStringInput: ->
      Boolean(@valueDelimiter || @currSelectedValues.length is 0)
    selectedSingleOption: ->
      @selectedOptions[0]
    singleText: ->
      @selectedSingleOption?.text || @placeholder
    singleValue: ->
      @selectedSingleOption?.value
    isSingleValueSet: ->
      Boolean(@singleValue || @singleValue is '')
    allowClear: ->
      Boolean(@placeholder && @isSingleValueSet)
    autocompleteOptions: ->
      [text, regex] = [@inputValue, new RegExp(@inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')]
      options = @optionItems.filter (option) =>
        option.text.search(regex) > -1 || (@searchValue && String(option.value).search(regex) > -1)
      if text isnt '' && @allowNew
        substringOption = options.filter((option) -> option.text is text)[0]
        unless substringOption
          substringOption = new OptionItem(text, @makeNewValue(text), { isNew: true, isPreview: true })
          options.unshift(substringOption)
      options
    isNoResultsVisible: ->
      !@allowNew && @autocompleteOptions.length is 0
    inputSize: ->
      length = if @inputValue is '' then @inputPlaceholder.length else @inputValue.length
      Math.max(length, 1) + 1
    inputStyles: ->
      { width: '4px' } if @inputIndex < @currSelectedValues.length && @inputValue is ''
    inputPlaceholder: ->
      if @currSelectedValues.length is 0 then @placeholder else ''
    computedValue: ->
      if @isMultiple
        if @useStringInput then @delimitedValue else @currSelectedValues
      else
        @singleValue

  methods:
    keydown: (event) ->
      # todo: move this somewhere "global"
      KEYS = { left: 37, up: 38, right: 39, down: 40, enter: 13, tab: 9, backspace: 8, esc: 27, comma: 188 }
      [allow, key] = [false, if event.keyCode then event.keyCode else event.which]
      if key is KEYS.esc
        @hideAutocomplete()
      else if key in [KEYS.left, KEYS.right] && @inputValue is ''
        @incInputIndex(if key is KEYS.left then -1 else 1)
      else if key is KEYS.down && !@isAutocompleteVisible
        @showAutocomplete()
      else if key in [KEYS.up, KEYS.down] && @isAutocompleteVisible
        @incAutocompleteIndex(if key is KEYS.up then -1 else 1)
      else if key is KEYS.enter && @isAutocompleteVisible
        @selectAutocompleteOption()
      else if key in [KEYS.tab, KEYS.enter] || (key is KEYS.comma && !event.shiftKey)
        allow = !@addFromInput() && key !in [KEYS.enter, KEYS.comma]
      else if key is KEYS.backspace && @isMultiple && @inputValue is '' && @currSelectedValues.length > 0
        option = @findOptionBy('value', @currSelectedValues[@inputIndex - 1])
        @inputValue = option.text if @unselectOption(option) && @restoreOnBackspace
      else
        allow = true
      event.preventDefault() unless allow
    validateSelectedValues: ->
      # remove invalid selectedValues
      for value, i in @currSelectedValues by -1
        @currSelectedValues.splice(i, 1) if !@findOptionBy('value', @currSelectedValues[i])

      unless @isMultiple
        # if no value, set to first
        if !@placeholder && @currSelectedValues.length is 0 && @optionItems[0]
          @currSelectedValues.push(@optionItems[0].value)
        else if @currSelectedValues.length > 1
          @currSelectedValues.splice(1)
      @inputIndex = @currSelectedValues.length
    findOptionBy: (field, value) ->
      @optionItems.filter((option) -> option[field] is value)[0]
    makeNewValue: (value) ->
      if @newValueFormat then @newValueFormat.replace('%value%', value) else value
    isSelected: (option) ->
      @currSelectedValues.indexOf(option.value) > -1
    removeSelectedOption: (option) ->
      @unselectOption(option)
      @showAutocomplete()
      @isFocused = true # when clearing single
    showAutocomplete: ->
      return unless @hasAutocomplete

      options = @autocompleteOptions
      if options.length > 0
        # if first option is a preview, set index to first unselected option
        index = if options[0].isPreview && options.length > 1
          unselectedOption = options.filter((option) => !option.isPreview && !@isSelected(option))[0]
          @findIndexByValue(options, unselectedOption.value) if unselectedOption
        @autocompleteIndex = index || 0

      @isAutocompleteVisible = options.length > 0 || @isNoResultsVisible
    hideAutocomplete: ->
      @isAutocompleteVisible = false
    toggleAutocomplete: ->
      if @isAutocompleteVisible
        @hideAutocomplete()
        @isFocused = false unless @isMultiple
      else
        @showAutocomplete()
        @isFocused = true
    selectAutocompleteOption: (index) ->
      option = @autocompleteOptions[index || @autocompleteIndex]
      return false if !option || (option.isPreview && !@allowNew)
      option.isPreview = false
      @selectOption(option)
    addFromInput: ->
      text = @inputValue
      return false if text is ''
      option = @findOptionBy('text', text) || new OptionItem(text, @makeNewValue(text), { isNew: true });
      @selectOption(option)
    selectOption: (option) ->
      return false if @isSelected(option) || (option.isNew && !@allowNew)
      @unselectOption(@selectedSingleOption) if !@isMultiple
      @userAddedOptions.push(option) if option.isNew
      @currSelectedValues.splice(@inputIndex, 0, option.value)
      @inputValue = ''
      @incInputIndex()
      @fireChange()
      Vue.nextTick => @hideAutocomplete()
      true
    unselectOption: (option) ->
      return false unless option
      index = @currSelectedValues.indexOf(option.value)
      @currSelectedValues.splice(index, 1)
      @incInputIndex(-1) if @inputIndex > index
      @userAddedOptions.splice(@findIndexByValue(@userAddedOptions, option.value), 1) if option.isNew
      @fireChange()
      true
    markOptionField: (str) ->
      return str if !@inputValue
      regex = new RegExp("(#{@inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})", 'i')
      parts = for part in String(str).split(regex)
        if regex.test(part) then "<mark class=\"search-match\">#{part}</mark>" else part
      parts.join('')
    formatOptionText: (option) ->
      if option.isPreview then option.text else @markOptionField(option.text)
    findIndexByValue: (list, value) ->
      list.map((item) -> item.value).indexOf(value)
    incInputIndex: (amount = 1) ->
      index = Math.max(@inputIndex + amount, 0)
      @inputIndex = Math.min(index, @currSelectedValues.length)
    incAutocompleteIndex: (amount = 1) ->
      [index, total] = [@autocompleteIndex + amount, @autocompleteOptions.length - 1]
      @autocompleteIndex = if index > total then 0 else if index <= -1 then total else index
    fireChange: ->
      @$emit('change', @computedValue)
    valueAsArray: ->
      if typeof @value is 'string' && @valueDelimiter
        @value.split(@valueDelimiter)
      else
        [].concat(@value || [])

  watch:
    inputValue: 'showAutocomplete'
    options: 'validateSelectedValues'
    isFocused: (newValue) ->
      unless newValue
        @inputValue = ''
        @inputIndex = @currSelectedValues.length
        Vue.nextTick => @hideAutocomplete()
