// Mostly experimental; leaning on the feature tests

describe('selectiv', function() {

  function createInstance(propsData, moreProps) {
    if (moreProps) for(key in moreProps) { propsData[key] = moreProps[key] }
    return new Vue.options.components.selectiv({ propsData: propsData }).$mount()
  }

  describe('options', function() {

    describe('when strings', function() {
      var vm, props
  
      beforeEach(function() {
        props = {
          options: ['one', 'two', 'three', '']
        }
        vm = createInstance(props)
      })

      it('validates optionItems', function() {
        expect(vm.optionItems.length).toEqual(4)
        expect(vm.optionItems.every(function(optionItem, i) {
          return optionItem.text === props.options[i] && optionItem.value === props.options[i]
        })).toBe(true)
      })

      it('updates optionItems when changed', function() {
        props.options.push('four')
        expect(vm.optionItems.length).toEqual(props.options.length)
      })  
    })

    describe('when objects', function() {
      var vm, props
  
      beforeEach(function() {
        props = {
          options: [{name: 'one', id: '1'}, {name: 'two', id: 2}, {name: 'three', id: 'three'}, {name: 'blank', id: ''}],
          optionsText: 'name',
          optionsValue: 'id'
        }
        vm = createInstance(props)
      })

      it('validates optionItems', function() {
        expect(vm.optionItems.length).toEqual(props.options.length)
        expect(vm.optionItems.every(function(optionItem, i) {
          return optionItem.text !== undefined && optionItem.value !== undefined &&
            optionItem.text === props.options[i][props.optionsText] && optionItem.value === props.options[i][props.optionsValue]
        })).toBe(true)
      })

      it('updates options when changed', function() {
        var newOption = {name: 'four', id: '4'}
        props.options.push(newOption)
        expect(vm.optionItems.length).toEqual(props.options.length)
        var last = vm.optionItems.slice(-1)[0]
        expect(last.text).toEqual(newOption[props.optionsText])
        expect(last.value).toEqual(newOption[props.optionsValue])
      })
    })
  })

  describe('single mode', function() {
    var vm, props

    function expectOptionSelected(index) {
      expect(vm.selectedSingleOption).toEqual(vm.optionItems[index])
      expect(vm.isSelected(vm.selectedSingleOption)).toBe(true)
      expect(vm.singleValue).toBe(vm.optionItems[index].value)
      expect(vm.computedValue).toBe(vm.singleValue)
    }

    function expectPlaceholderSelected() {
      expect(vm.currSelectedValues.length).toEqual(0)
      expect(vm.isSingleValueSet).toBe(false)
      expect(vm.singleText).toEqual(props.placeholder)
    }

    beforeEach(function() {
      props = {
        options: [{text: 'one', value: '1'}, {text: 'two', value: 2}, {text: 'three', value: 'three'}, {text: 'nine', value: ''}]
      }
    })

    it('selects first option by default', function() {
      vm = createInstance(props)
      expect(vm.isMultiple).toBe(false)
      expect(vm.isFocused).toBe(false)
      expect(vm.isAutocompleteVisible).toBe(false)
      expectOptionSelected(0)
    })

    it('selects placeholder', function() {
      vm = createInstance(props, {placeholder: "Choose..."})
      expectPlaceholderSelected()
    })

    it('selects param value', function() {
      vm = createInstance(props, {value: props.options[1].value})
      expectOptionSelected(1)
    })

    it('selects first when invalid value', function () {
      vm = createInstance(props, {value: 'missing'})
      expectOptionSelected(0)
    })

    it('toggles autocomplete and blurs', function() {
      vm = createInstance(props)
      vm.toggleAutocomplete()
      expect(vm.isFocused).toBe(true)
      expect(vm.isAutocompleteVisible).toBe(true)
      vm.toggleAutocomplete()
      expect(vm.isFocused).toBe(false)
      expect(vm.isAutocompleteVisible).toBe(false)
    })

    describe('clearing selection', function() {
      beforeEach(function() {
        props = {
          options: props.options,
          placeholder: "Choose...",
          value: props.options[0].value
        }
      })

      it('shows clear X button', function() {
        vm = createInstance(props)
        expect(vm.allowClear).toBe(true)
      })

      it('doesnt show clear X without placeholder', function() {
        delete props.placeholder
        vm = createInstance(props)
        expect(vm.allowClear).toBe(false)
      })

      it('shows placeholder when selection cleared', function() {
        vm = createInstance(props)
        vm.removeSelectedOption(vm.selectedSingleOption)
        expect(vm.allowClear).toBe(false)
        expect(vm.isAutocompleteVisible).toBe(true)
        expectPlaceholderSelected()
      })
    })

    describe('autocomplete options', function() {
      beforeEach(function() {
        vm = createInstance(props)
      })

      it('contains all', function() {
        expect(vm.autocompleteOptions).toEqual(vm.optionItems)
      })

      it('filters by substring', function() {
        vm.inputValue = 't'
        expect(vm.autocompleteOptions).toEqual([vm.optionItems[1], vm.optionItems[2]])
        vm.inputValue = 'ne'
        expect(vm.autocompleteOptions).toEqual([vm.optionItems[0], vm.optionItems[3]])
      })

      it('shows no results for missing substring', function() {
        vm.inputValue = 'nada'
        expect(vm.autocompleteOptions).toEqual([])
        expect(vm.isNoResultsVisible).toBe(true)
      })

      it('selects option', function() {
        vm.toggleAutocomplete()
        expect(vm.isAutocompleteVisible).toBe(true)
        expect(vm.isFocused).toBe(true)
        vm.autocompleteIndex = 1
        vm.selectAutocompleteOption()
        expect(vm.selectedSingleOption).toEqual(vm.optionItems[vm.autocompleteIndex])
      })
    })

  })

  describe('multiple mode', function() {
    var vm, props

    beforeEach(function() {
      props = {
        options: [{text: 'one', value: '1'}, {text: 'two', value: 2}, {text: 'three', value: 'three'}, {text: 'blank', value: ''}],
        multiple: true
      }
    })

    it('selects nothing by default', function() {
      vm = createInstance(props)
      expect(vm.inputPlaceholder).toEqual('')
      expect(vm.isMultiple).toBe(true)
      expect(vm.currSelectedValues.length).toEqual(0)
      expect(vm.inputIndex).toEqual(0)
      expect(vm.inputStyles).toBeUndefined()
    })

    it('selects param values', function() {
      vm = createInstance(props, {value: ['1', '2', 'three', 4]})
      expect(vm.inputIndex).toEqual(2)
      expect(vm.selectedOptionsWithInput[2].isInput).toBe(true)
      expect(vm.selectedOptions).toEqual([vm.optionItems[0], vm.optionItems[2]])
    })

    it('selects edge case values', function() {
      vm = createInstance(props, {value: ['', 2, 'nada']})
      expect(vm.selectedOptions).toEqual([vm.optionItems[3], vm.optionItems[1]])
    })

    it('shows placeholder', function() {
      vm = createInstance(props, {placeholder: "Choose..."})
      expect(vm.inputPlaceholder).toEqual(props.placeholder)
    })

    it('deletes options', function() {
      vm = createInstance(props, {value: [2, '1', 'three']})
      vm.removeSelectedOption(vm.selectedOptions[1])
      expect(vm.currSelectedValues).toEqual([2, 'three'])
      expect(vm.isAutocompleteVisible).toBe(true)
      expect(vm.isFocused).toBe(true)
    })

    it('shows placeholder after deletion', function() {
      vm = createInstance(props, {value: '1', placeholder: "Choose..."})
      expect(vm.inputPlaceholder).toEqual('')
      vm.removeSelectedOption(vm.selectedOptions[0])
      expect(vm.inputPlaceholder).toEqual(props.placeholder)
    })

    it('toggles autocomplete and retains focus', function() {
      vm = createInstance(props)
      vm.toggleAutocomplete()
      expect(vm.isFocused).toBe(true)
      expect(vm.isAutocompleteVisible).toBe(true)
      vm.toggleAutocomplete()
      expect(vm.isFocused).toBe(true)
      expect(vm.isAutocompleteVisible).toBe(false)
    })

    describe('input position', function() {
      beforeEach(function() {
        vm = createInstance(props, {value: ['1', 2]})
        vm.isFocused = true
        vm.incInputIndex(-1)
      })

      it('moves left and resets on blur', function(done) {
        expect(vm.inputIndex).toEqual(1)
        expect(vm.selectedOptionsWithInput[1].isInput).toBe(true)
        expect(vm.inputStyles).toBeTruthy()
        Vue.nextTick(function() {
          vm.isFocused = false
          Vue.nextTick(function() {
            expect(vm.inputIndex).toEqual(2)
            done()
          })
        })
      })

      it('moves and inserts', function() {
        vm.selectOption(vm.optionItems[2])
        expect(vm.selectedOptions[1].value).toEqual('three')
      })

      it('deletes option before', function() {
        vm.unselectOption(vm.optionItems[0])
        expect(vm.inputIndex).toEqual(0)
      })

      it('deletes option after', function() {
        vm.unselectOption(vm.optionItems[1])
        expect(vm.inputIndex).toEqual(1)
      })

    })

    describe('allowNew', function() {
      beforeEach(function() {
        vm = createInstance(props, {allowNew: true})//, newValueFormat: '<<<%value%>>>'})
      })

      it('shows preview for new', function() {
        vm.inputValue = 'new'
        expect(vm.autocompleteOptions.length).toEqual(1)
        expect(vm.isNoResultsVisible).toBe(false)
        var newOption = { text: vm.inputValue, value: vm.inputValue, isNew: true, isPreview: true }
        expect(JSON.stringify(vm.autocompleteOptions[0])).toEqual(JSON.stringify(newOption))
        expect(vm.autocompleteIndex).toEqual(0)
      })

      it('highlights next non-preview option', function() {
        vm.inputValue = 'e'
        vm.toggleAutocomplete()
        expect(vm.isAutocompleteVisible).toBe(true)
        expect(vm.autocompleteIndex).toEqual(1)
      })

      it('selects preview option', function() {
        vm.inputValue = 'e'
        vm.autocompleteIndex = 0
        vm.selectAutocompleteOption()
        expect(vm.inputValue).toEqual('')
        expect(JSON.stringify(vm.userAddedOptions)).toEqual(JSON.stringify([{text: 'e', value: 'e', isNew: true, isPreview: false}]))
        expect(vm.optionItems.slice(-1)[0]).toEqual(vm.userAddedOptions[0])
      })

      it('validates value format', function(done) {
        vm = createInstance(props, {allowNew: true, newValueFormat: '<<<%value%>>>'})
        vm.inputValue = 'e'
        vm.addFromInput()
        Vue.nextTick(function() {
          expect(vm.computedValue).toEqual(['<<<e>>>'])
          done()          
        })
      })

      it('highlights first available unselected option', function() {
        vm.selectOption(vm.optionItems[0])
        vm.inputValue = 'e'
        vm.toggleAutocomplete()
        expect(vm.autocompleteIndex).toEqual(2)
      })
    })
  })

})