window.KEYS = { left: 37, up: 38, right: 39, down: 40, enter: 13, tab: 9, backspace: 8, esc: 27, comma: 188 }

window.triggerEvent = function triggerEvent(target, event, other) {
  var e = document.createEvent('Event')
  if (event.match(/^key/)) e.keyCode = other
  e.initEvent(event, true, true)
  target.dispatchEvent(e)
}

describe('selectiv view', function() {

  function createInstance(propsData, moreProps) {
    if (moreProps) for(key in moreProps) { propsData[key] = moreProps[key] }
    var vm = new Vue.options.components.selectiv({ propsData: propsData }).$mount()
    vm.$ = function() { return vm.$el.querySelector.apply(vm.$el, arguments) }
    vm.$all = function() { return Array.prototype.slice.call(vm.$el.querySelectorAll.apply(vm.$el, arguments)) }
    return vm
  }

  describe('options', function() {
    var vm, props

    it('renders hidden input from strings', function() {
      props = {
        options: ['one', 'two', 'three', '']
      }
      vm = createInstance(props)
      expect(vm.$all('select[multiple] > option').every(function(option, i) {
        return option.value === String(props.options[i]) && option.innerText === props.options[i]
      })).toBe(true)
    })

    it('renders hidden input objects', function() {
      props = {
        options: [{name: 'one', id: '1'}, {name: 'two', id: 2}, {name: 'three', id: 'three'}, {name: 'blank', id: ''}],
        optionsText: 'name',
        optionsValue: 'id'
      }
      vm = createInstance(props)
      expect(vm.$all('select[multiple] > option').every(function(option, i) {
        return option.value === String(props.options[i][props.optionsValue]) &&
          option.text === String(props.options[i][props.optionsText])
      })).toBe(true)
    })
  })

  describe('single mode', function() {
    var vm, props

    beforeEach(function() {
      props = {
        options: [{text: 'one', value: '1'}, {text: 'two', value: 2}, {text: 'three', value: 'three'}, {text: 'blank', value: ''}]
      }
    })

    it('selects first option by default', function() {
      vm = createInstance(props)
      expect(vm.$('.single-text').textContent).toEqual('one')
      expect(vm.$('span.arrow-down')).toBeTruthy()
      expect(vm.$('.single-clear')).toBeNull()
    })

    it('selects placeholder by default', function() {
      vm = createInstance(props, {placeholder: "Choose..."})
      expect(vm.$('.single-text.placeholder').textContent).toEqual(props.placeholder)
    })

    it('selects from param', function() {
      vm = createInstance(props, {value: 'three'})
      expect(vm.$('.single-text').textContent).toEqual('three')
    })

    it('selects first when invalid param', function() {
      vm = createInstance(props, {value: 'missing'})
      expect(vm.$('.single-text').textContent).toEqual('one')
    })

    describe('autocomplete', function() {
      beforeEach(function() {
        vm = createInstance(props)
        triggerEvent(vm.$el, 'mousedown')
      })

      it('shows with items', function(done) {
        Vue.nextTick(function() {
          expect(vm.$all('.single-arrow.arrow-up, div.autocomplete-wrapper, .single-input-wrapper > input').length).toBe(3)
          expect(vm.$('li.selected.highlighted').textContent).toEqual('one')
          expect(vm.$all('.autocomplete > li').every(function(li, i) {
            return li.textContent === String(props.options[i].text)
          })).toBe(true)
          done()
        })
      })

      it('highlights an item', function(done) {
        vm.autocompleteIndex = 2
        Vue.nextTick(function() {
          expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('three')
          done()
        })
      })

      it('selects next item and closes', function(done) {
        vm.autocompleteIndex = 1
        Vue.nextTick(function() {
          triggerEvent(vm.$('.autocomplete > li.highlighted'), 'mouseup')
          Vue.nextTick(function() {
            expect(vm.$('.single-text').textContent).toEqual('two')
            Vue.nextTick(function() {
              expect(vm.$('.single-arrow.arrow-down')).toBeTruthy()
              expect(vm.$all('div.autocomplete-wrapper, .single-input-wrapper').length).toBe(0)
              done()
            })
          })
        })
      })

      it('closes when root clicked', function(done) {
        triggerEvent(vm.$el, 'mousedown')
        Vue.nextTick(function() {
          expect(vm.$('.single-arrow.arrow-down')).toBeTruthy()
          expect(vm.$all('div.autocomplete-wrapper, .single-input-wrapper').length).toBe(0)
          done()
        })
      })

      it('filters substring text property', function(done) {
        vm.inputValue = 'T'
        Vue.nextTick(function() {
          expect(vm.$all('.autocomplete > li').map(function(li) { return li.textContent })).toEqual(['two', 'three'])
          expect(vm.$all('.autocomplete > li mark').map(function(li) { return li.textContent })).toEqual(['t', 't'])
          done()
        })
      })

      it('filters substring value property', function(done) {
        vm = createInstance(props, { searchValue: true })
        triggerEvent(vm.$el, 'mousedown')
        vm.inputValue = '1'
        Vue.nextTick(function() {
          expect(vm.$all('.autocomplete > li').map(function(li) { return li.textContent })).toEqual(['one'])
          done()
        })
      })

      it('shows no results for missing substring', function(done) {
        vm.inputValue = 'nada'
        Vue.nextTick(function() {
          expect(vm.$all('.autocomplete-wrapper > li').length).toEqual(0)
          expect(vm.$('.no-results').textContent).toEqual('No results')
          done()
        })
      })
    })

    describe('with placeholder', function() {
      beforeEach(function() {
        props = {
          options: props.options,
          placeholder: "Choose...",
          value: props.options[0].value
        }
      })

      it('shows clear button', function() {
        vm = createInstance(props)
        expect(vm.$('.single-text + .single-clear')).toBeTruthy()
      })

      it('shows placeholder when cleared', function(done) {
        vm = createInstance(props)
        triggerEvent(vm.$('.single-clear'), 'click')
        Vue.nextTick(function() {
          expect(vm.$('.single-text.placeholder')).toBeTruthy()
          done()
        })
      })
    })

  })

  describe('multiple mode', function() {
    var vm, props

    beforeEach(function() {
      props = {
        options: [{text: 'one', value: '1'}, {text: 'two', value: 2}, {text: 'three', value: 'three'}, {text: 'blank', value: ''}],
        isMultiple: true
      }
    })

    it('selects nothing by default', function() {
      vm = createInstance(props)
      expect(vm.$('.single-text, .arrow-down')).toBeNull()
      expect(vm.$all('.selected-options > li').length).toEqual(1)
      expect(vm.$('.selected-options > li.option-input > input[placeholder=""]')).toBeTruthy()
      expect(vm.$('input[name=' + vm.name + ']')).toBeTruthy()
    })


    describe('selected param', function() {
      it('selects from param', function() {
        vm = createInstance(props, {value: ['', '1', '2', 'three']})
        expect(vm.$all('.selected-options > li.option').map(function(li) {
          return li.textContent.trim()
        })).toEqual(['blank', 'one', 'three'])
      })

      it('parses string delimiter values', function() {
        vm = createInstance(props, {value: '1,2,three', valueDelimiter: ','})
        expect(vm.$all('.selected-options > li.option').map(function(li) {
          return li.textContent.trim()
        })).toEqual(['one', 'three'])
      })

      it('shows remove button', function() {
        vm = createInstance(props, {hasRemoveButton: true, value: ['1']})
        expect(vm.$('.option-close')).toBeTruthy()
      })

      it('hides remove button', function() {
        vm = createInstance(props, {hasRemoveButton: false, value: ['1']})
        expect(vm.$('input[name=' + vm.name + ']')).toBeNull()
        expect(vm.$('.option-close')).toBeNull()
      })
    })

    it('joins values with delimiter', function() {
      vm = createInstance(props, {valueDelimiter: ':', value: ['1', 'three']})
      expect(vm.$('input[name=' + vm.name + ']').value).toEqual('1:three')
    })

    it('shows placeholder', function() {
      vm = createInstance(props, {placeholder: "Placeholder"})
      expect(vm.$('li.option-input > input[placeholder="' + props.placeholder + '"]')).toBeTruthy()
    })

    it('shows autocomplete on down and highlights first', function(done) {
      vm = createInstance(props)
      triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.down)
      Vue.nextTick(function() {
        expect(vm.$('.autocomplete-wrapper')).toBeTruthy()
        expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('one')
        done()
      })
    })

    describe('autocomplete', function() {
      beforeEach(function() {
        vm = createInstance(props)
        triggerEvent(vm.$el, 'mousedown')
      })

      it('shows and highlights first', function(done) {
        Vue.nextTick(function() {
          expect(vm.$('.autocomplete-wrapper')).toBeTruthy()
          expect(vm.$('.autocomplete > li.selected')).toBeNull()
          expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('one')
          done()
        })
      })

      it('closes on mousdown root', function(done) {
        Vue.nextTick(function() {
          triggerEvent(vm.$el, 'mousedown')
          Vue.nextTick(function() {
            expect(vm.$('.autocomplete-wrapper')).toBeNull()
            done()
          })
        })
      })

      it('highlights option on mouseover', function(done) {
        Vue.nextTick(function() {
          triggerEvent(vm.$all('.autocomplete > li')[2], 'mouseover')
          Vue.nextTick(function() {
            expect(vm.$('li.highlighted').textContent).toEqual('three')
            done()
          })
        })
      })

      it('selects option on mouseup and closes', function(done) {
        Vue.nextTick(function() {
          var li = vm.$all('.autocomplete > li')[2]
          triggerEvent(li, 'mouseup')
          Vue.nextTick(function() {
            expect(vm.$('.selected-options > li.option').textContent).toMatch(/^three/)
            Vue.nextTick(function() {
              expect(vm.$('.autocomplete-wrapper')).toBeNull()
              done()
            })
          })
        })
      })

      it('wont select already selected', function(done) {
        vm.selectOption(vm.optionItems[1])
        Vue.nextTick(function() {
          expect(vm.$('.autocomplete li.selected').textContent).toEqual('two')
          triggerEvent(vm.$('.autocomplete > li.selected'), 'mouseup')
          Vue.nextTick(function() {
            var options = vm.$all('.selected-options > li.option')
            expect(options.length).toEqual(1)
            expect(options[0].textContent).toMatch(/^two/)
            done()
          })
        })
      })

      it('closes with ESC', function(done) {
        Vue.nextTick(function() {
          triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.esc)
          Vue.nextTick(function() {
            expect(vm.$('.autocomplete-wrapper')).toBeNull()
            done()
          })
        })
      })

      it('highlights items on up/down', function(done) {
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.down)
        Vue.nextTick(function() {
          expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('two')
          triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.up)
          Vue.nextTick(function() {
            expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('one')
            done()
          })
        })
      })

      it('selects item on enter and closes', function(done) {
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.enter)
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li.option').textContent).toMatch(/^one/)
          Vue.nextTick(function() {
            expect(vm.$('.autocomplete-wrapper')).toBeNull()
            done()
          })
        })
      })

    })

    describe('input position', function() {
      beforeEach(function() {
        vm = createInstance(props, {value: ['1', 'three']})
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.left)
      })

      it('moves left', function(done) {
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(2)').className).toEqual('option-input')
          done()
        })
      })

      it('moves left and resets on blur', function(done) {
        triggerEvent(vm.$('.option-input > input'), 'focus')
        Vue.nextTick(function() {
          triggerEvent(vm.$('.option-input > input'), 'blur')
          Vue.nextTick(function() {
            expect(vm.$('.selected-options > li:nth-child(3)').className).toEqual('option-input')
            done()
          })
        })
      })

      it('moves left and inserts', function(done) {
        vm.selectOption(vm.optionItems[1])
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(2)').textContent).toMatch(/^two/)
          expect(vm.$('.selected-options > li:nth-child(3)').className).toEqual('option-input')
          done()
        })
      })

      it('cant move left past min', function(done) {
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.left)
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.left)
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(1)').className).toEqual('option-input')
          done()
        })
      })

      it('cant move right past max', function(done) {
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.right)
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.right)
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(3)').className).toEqual('option-input')
          done()
        })
      })

      it('moves left when deleting option before', function(done) {
        triggerEvent(vm.$('.selected-options > li:nth-child(1) a.option-close'), 'click')
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(1)').className).toEqual('option-input')
          expect(vm.$all('.selected-options > li.option').length).toEqual(1)
          done()
        })
      })

      it('stays put when deleting option after', function(done) {
        triggerEvent(vm.$('.selected-options > li:nth-child(2) a.option-close'), 'click')
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li:nth-child(2)').className).toEqual('option-input')
          expect(vm.$all('.selected-options > li.option').length).toEqual(1)
          done()
        })
      })

    })

    describe('allowNew', function() {
      beforeEach(function() {
        vm = createInstance(props, {allowNew:true})
      })

      it('adds new from input on enter', function(done) {
        vm.inputValue = 'new'
        triggerEvent(vm.$('.option-input > input'), 'keydown', KEYS.comma)
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li.option').textContent).toMatch(/^new/)
          done()
        })
      })

      it('shows preview for new and highlights', function(done) {
        vm.inputValue = 'new'
        Vue.nextTick(function() {
          var liTags = vm.$all('.autocomplete > li')
          expect(liTags.length).toEqual(1)
          expect(liTags[0].textContent).toEqual('new')
          expect(liTags[0].className).toEqual('new-option-preview highlighted')
          done()
        })
      })

      it('selects preview option', function(done) {
        vm.inputValue = 'new'
        Vue.nextTick(function() {
          triggerEvent(vm.$('.autocomplete > li.new-option-preview'), 'mouseup')
          Vue.nextTick(function() {
            expect(vm.$('.selected-options > li').textContent).toMatch(/^new/)
            done()
          })
        })
      })

      it('highlights first available unselected option', function(done) {
        vm.selectOption(vm.optionItems[0])
        vm.inputValue = 'e'
        Vue.nextTick(function() {
          expect(vm.$('.autocomplete > li.highlighted').textContent).toEqual('three')
          done()
        })
      })

    })

    describe('deleting', function() {
      it('removes option by clicking X', function(done) {
        vm = createInstance(props, {hasRemoveButton: true, value: ['three', '1']})
        triggerEvent(vm.$('.selected-options > li.option a.option-close'), 'click')
        Vue.nextTick(function() {
          var liTags = vm.$all('.selected-options > li.option')
          expect(liTags.length).toBe(1)
          expect(liTags[0].textContent).toMatch(/^one/)
          done()
        })
      })

      it('remove option on backspace', function(done) {
        vm = createInstance(props, {value: ['three']})
        triggerEvent(vm.$('li.option-input > input'), 'keydown', KEYS.backspace)
        Vue.nextTick(function() {
          expect(vm.$('.selected-options > li.option')).toBeNull()
          expect(vm.$('.option-input > input').value).toBe('')
          done()
        })
      })

      it('removes option on backspace and restores input', function(done) {
        vm = createInstance(props, {restoreOnBackspace: true, value: ['three']})
        triggerEvent(vm.$('li.option-input > input'), 'keydown', KEYS.backspace)
        Vue.nextTick(function() {
          expect(vm.$('.option-input > input').value).toEqual('three')
          done()
        })
      })
    })

  })


})