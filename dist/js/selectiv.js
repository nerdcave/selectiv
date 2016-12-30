// Generated by CoffeeScript 1.11.1

/*
 selectiv v1.0.0 for Vue 2+
 (c) 2017, Jay Elaraj - http://nerdcave.com
 */

(function() {
  var OptionItem;

  OptionItem = (function() {
    function OptionItem(text1, value1, options) {
      this.text = text1;
      this.value = value1;
      if (options == null) {
        options = {};
      }
      this.isNew = !!options.isNew;
      this.isPreview = !!options.isPreview;
    }

    return OptionItem;

  })();

  Vue.component('selectiv', {
    template: '<div class="selectiv-component" @mousedown.prevent="toggleAutocomplete">\n  <select multiple v-show="false" v-if="!useStringInput" :name="name" v-model="currSelectedValues">\n    <option v-for="optionItem in selectedOptions" :value="optionItem.value">{{ optionItem.text }}</option>\n  </select>\n  <input type="hidden" v-if="useStringInput" :name="name" :value="delimitedValue">\n  <template v-if="isMultiple">\n    <ul class="selected-options">\n      <template v-for="selectedOption in selectedOptionsWithInput">\n        <li class="option-input" v-if="selectedOption.isInput">\n          <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"\n            v-model.trim="inputValue"\n            @keydown="keydown"\n            v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false"\n            :size="inputSize"\n            :placeholder="inputPlaceholder"\n            :style="inputStyles">\n        </li><li class="option" v-else>\n          <slot name="selectedOption" :text="selectedOption.text" :value="selectedOption.value">\n            <span class="option-text" v-html="selectedOption.text"></span>\n          </slot>\n          <a class="option-close" v-if="hasRemoveButton" @click="removeSelectedOption(selectedOption)" @mousedown.stop.prevent></a>\n        </li>\n      </template>\n    </ul>\n  </template>\n  <template v-else>\n    <span class="single-text" v-html="singleText" :class="{ placeholder: !isSingleValueSet }"></span>\n    <span class="single-clear" v-if="allowClear" @click="removeSelectedOption(selectedSingleOption)" @mousedown.stop.prevent>&times;</span>\n    <span class="single-arrow" :class="{ \'arrow-up\': isAutocompleteVisible, \'arrow-down\': !isAutocompleteVisible }"></span>\n  </template>\n  <div class="autocomplete-wrapper autocomplete-below"\n    v-if="isAutocompleteVisible"\n    v-set-top-position="isAutocompleteVisible">\n    <span v-if="!isMultiple" class="single-input-wrapper">\n      <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"\n        v-model.trim="inputValue"\n        @keydown="keydown"\n        @mousedown.stop\n        v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false">\n    </span>\n    <slot name="noResults" :search-text="inputValue" v-if="isNoResultsVisible">\n      <span class="no-results">No results</span>\n    </slot>\n    <ul class="autocomplete">\n      <li v-for="(option, index) in autocompleteOptions"\n        :class="{ selected: isSelected(option), \'new-option-preview\': option.isPreview, highlighted: autocompleteIndex === index }"\n        v-scroll-into-view="index === autocompleteIndex"\n        @mouseup="selectAutocompleteOption(index)"\n        @mouseover="autocompleteIndex = index"\n        @mousedown.stop.prevent>\n        <slot name="option" :text="option.text" :value="option.value" :text-marked="formatOptionText(option)" :value-marked="markOptionField(option.value)">\n          <span v-html="formatOptionText(option)"></span>\n        </slot>\n      </li>\n    </ul>\n  </div>\n</div>',
    props: {
      options: {
        type: Array,
        "default": function() {
          return [];
        }
      },
      optionsText: {
        type: String,
        "default": 'text'
      },
      optionsValue: {
        type: String,
        "default": 'value'
      },
      isMultiple: {
        type: Boolean,
        "default": false
      },
      placeholder: {
        type: String,
        "default": ''
      },
      value: [Array, String, Number],
      name: {
        "default": 'options'
      },
      allowNew: {
        type: Boolean,
        "default": false
      },
      hasAutocomplete: {
        type: Boolean,
        "default": true
      },
      restoreOnBackspace: {
        type: Boolean,
        "default": false
      },
      hasRemoveButton: {
        type: Boolean,
        "default": true
      },
      newValueFormat: {
        type: String,
        validator: function(value) {
          return value.indexOf('%value%') > -1;
        }
      },
      valueDelimiter: {
        type: String,
        "default": null
      },
      searchValue: {
        type: Boolean,
        "default": false
      }
    },
    directives: {
      'set-top-position': {
        inserted: function(el, binding) {
          var borderWidths, rect, styles, wrapper;
          if (binding.value) {
            rect = el.getBoundingClientRect();
            if (rect.top + rect.height < window.innerHeight || window.innerHeight - rect.top > rect.top) {
              return el.className = el.className.replace('autocomplete-above', 'autocomplete-below');
            } else {
              wrapper = el.parentNode;
              styles = getComputedStyle(wrapper);
              borderWidths = parseFloat(styles.getPropertyValue('border-top-width')) + parseFloat(styles.getPropertyValue('border-bottom-width'));
              el.style.bottom = wrapper.getBoundingClientRect().height - borderWidths + 'px';
              return el.className = el.className.replace('autocomplete-below', 'autocomplete-above');
            }
          } else {
            return el.style.bottom = null;
          }
        }
      },
      'scroll-into-view': {
        update: function(li, binding) {
          var liBottom, liRect, ref, ref1, totalHeight, ul, ulRect;
          if (!binding.value) {
            return;
          }
          ref = [li.parentNode, li.getBoundingClientRect()], ul = ref[0], liRect = ref[1];
          ref1 = [li.offsetTop + liRect.height, ul.getBoundingClientRect()], liBottom = ref1[0], ulRect = ref1[1];
          totalHeight = ulRect.height + ul.scrollTop;
          if (li.offsetTop < ul.scrollTop) {
            return ul.scrollTop = li.offsetTop;
          } else if (liBottom > totalHeight) {
            return ul.scrollTop += liBottom - totalHeight;
          }
        }
      },
      'focus': {
        inserted: function(el, binding) {
          if (binding.value) {
            return el.focus();
          } else {
            return el.blur();
          }
        },
        update: function(el, binding) {
          if (binding.value) {
            return el.focus();
          } else {
            return el.blur();
          }
        }
      }
    },
    data: function() {
      return {
        currSelectedValues: null,
        userAddedOptions: [],
        isFocused: false,
        isAutocompleteVisible: false,
        inputValue: '',
        autocompleteIndex: 0,
        inputIndex: 0
      };
    },
    created: function() {
      this.currSelectedValues = this.valueAsArray();
      this.validateSelectedValues();
      return this.fireChange();
    },
    computed: {
      optionItems: function() {
        var options;
        options = this.options.length > 0 ? this.options : this.valueAsArray();
        return options.concat(this.userAddedOptions).map((function(_this) {
          return function(option) {
            var ref, text, value;
            ref = typeof option === 'object' ? [option[_this.optionsText], option[_this.optionsValue]] : [option, option], text = ref[0], value = ref[1];
            return new OptionItem(text, value, {
              isNew: option.isNew,
              isPreview: option.isPreview
            });
          };
        })(this));
      },
      delimitedValue: function() {
        return this.currSelectedValues.join(this.valueDelimiter);
      },
      selectedOptions: function() {
        return this.currSelectedValues.map((function(_this) {
          return function(value) {
            return _this.findOptionBy('value', value);
          };
        })(this));
      },
      selectedOptionsWithInput: function() {
        return this.selectedOptions.slice(0, this.inputIndex).concat({
          isInput: true
        }).concat(this.selectedOptions.slice(this.inputIndex));
      },
      useStringInput: function() {
        return Boolean(this.valueDelimiter || this.currSelectedValues.length === 0);
      },
      selectedSingleOption: function() {
        return this.selectedOptions[0];
      },
      singleText: function() {
        var ref;
        return ((ref = this.selectedSingleOption) != null ? ref.text : void 0) || this.placeholder;
      },
      singleValue: function() {
        var ref;
        return (ref = this.selectedSingleOption) != null ? ref.value : void 0;
      },
      isSingleValueSet: function() {
        return Boolean(this.singleValue || this.singleValue === '');
      },
      allowClear: function() {
        return Boolean(this.placeholder && this.isSingleValueSet);
      },
      autocompleteOptions: function() {
        var options, ref, regex, substringOption, text;
        ref = [this.inputValue, new RegExp(this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')], text = ref[0], regex = ref[1];
        options = this.optionItems.filter((function(_this) {
          return function(option) {
            return option.text.search(regex) > -1 || (_this.searchValue && String(option.value).search(regex) > -1);
          };
        })(this));
        if (text !== '' && this.allowNew) {
          substringOption = options.filter(function(option) {
            return option.text === text;
          })[0];
          if (!substringOption) {
            substringOption = new OptionItem(text, this.makeNewValue(text), {
              isNew: true,
              isPreview: true
            });
            options.unshift(substringOption);
          }
        }
        return options;
      },
      isNoResultsVisible: function() {
        return !this.allowNew && this.autocompleteOptions.length === 0;
      },
      inputSize: function() {
        var length;
        length = this.inputValue === '' ? this.inputPlaceholder.length : this.inputValue.length;
        return Math.max(length, 1) + 1;
      },
      inputStyles: function() {
        if (this.inputIndex < this.currSelectedValues.length && this.inputValue === '') {
          return {
            width: '4px'
          };
        }
      },
      inputPlaceholder: function() {
        if (this.currSelectedValues.length === 0) {
          return this.placeholder;
        } else {
          return '';
        }
      },
      computedValue: function() {
        if (this.isMultiple) {
          if (this.useStringInput) {
            return this.delimitedValue;
          } else {
            return this.currSelectedValues;
          }
        } else {
          return this.singleValue;
        }
      }
    },
    methods: {
      keydown: function(event) {
        var KEYS, allow, key, option, ref;
        KEYS = {
          left: 37,
          up: 38,
          right: 39,
          down: 40,
          enter: 13,
          tab: 9,
          backspace: 8,
          esc: 27,
          comma: 188
        };
        ref = [false, event.keyCode ? event.keyCode : event.which], allow = ref[0], key = ref[1];
        if (key === KEYS.esc) {
          this.hideAutocomplete();
        } else if ((key === KEYS.left || key === KEYS.right) && this.inputValue === '') {
          this.incInputIndex(key === KEYS.left ? -1 : 1);
        } else if (key === KEYS.down && !this.isAutocompleteVisible) {
          this.showAutocomplete();
        } else if ((key === KEYS.up || key === KEYS.down) && this.isAutocompleteVisible) {
          this.incAutocompleteIndex(key === KEYS.up ? -1 : 1);
        } else if (key === KEYS.enter && this.isAutocompleteVisible) {
          this.selectAutocompleteOption();
        } else if ((key === KEYS.tab || key === KEYS.enter) || (key === KEYS.comma && !event.shiftKey)) {
          allow = !this.addFromInput() && (key !== KEYS.enter && key !== KEYS.comma);
        } else if (key === KEYS.backspace && this.isMultiple && this.inputValue === '' && this.currSelectedValues.length > 0) {
          option = this.findOptionBy('value', this.currSelectedValues[this.inputIndex - 1]);
          if (this.unselectOption(option) && this.restoreOnBackspace) {
            this.inputValue = option.text;
          }
        } else {
          allow = true;
        }
        if (!allow) {
          return event.preventDefault();
        }
      },
      validateSelectedValues: function() {
        var i, j, ref, value;
        ref = this.currSelectedValues;
        for (i = j = ref.length - 1; j >= 0; i = j += -1) {
          value = ref[i];
          if (!this.findOptionBy('value', this.currSelectedValues[i])) {
            this.currSelectedValues.splice(i, 1);
          }
        }
        if (!this.isMultiple) {
          if (!this.placeholder && this.currSelectedValues.length === 0 && this.optionItems[0]) {
            this.currSelectedValues.push(this.optionItems[0].value);
          } else if (this.currSelectedValues.length > 1) {
            this.currSelectedValues.splice(1);
          }
        }
        return this.inputIndex = this.currSelectedValues.length;
      },
      findOptionBy: function(field, value) {
        return this.optionItems.filter(function(option) {
          return option[field] === value;
        })[0];
      },
      makeNewValue: function(value) {
        if (this.newValueFormat) {
          return this.newValueFormat.replace('%value%', value);
        } else {
          return value;
        }
      },
      isSelected: function(option) {
        return this.currSelectedValues.indexOf(option.value) > -1;
      },
      removeSelectedOption: function(option) {
        this.unselectOption(option);
        this.showAutocomplete();
        return this.isFocused = true;
      },
      showAutocomplete: function() {
        var index, options, unselectedOption;
        if (!this.hasAutocomplete) {
          return;
        }
        options = this.autocompleteOptions;
        if (options.length > 0) {
          index = options[0].isPreview && options.length > 1 ? (unselectedOption = options.filter((function(_this) {
            return function(option) {
              return !option.isPreview && !_this.isSelected(option);
            };
          })(this))[0], unselectedOption ? this.findIndexByValue(options, unselectedOption.value) : void 0) : void 0;
          this.autocompleteIndex = index || 0;
        }
        return this.isAutocompleteVisible = options.length > 0 || this.isNoResultsVisible;
      },
      hideAutocomplete: function() {
        return this.isAutocompleteVisible = false;
      },
      toggleAutocomplete: function() {
        if (this.isAutocompleteVisible) {
          this.hideAutocomplete();
          if (!this.isMultiple) {
            return this.isFocused = false;
          }
        } else {
          this.showAutocomplete();
          return this.isFocused = true;
        }
      },
      selectAutocompleteOption: function(index) {
        var option;
        option = this.autocompleteOptions[index || this.autocompleteIndex];
        if (!option || (option.isPreview && !this.allowNew)) {
          return false;
        }
        option.isPreview = false;
        return this.selectOption(option);
      },
      addFromInput: function() {
        var option, text;
        text = this.inputValue;
        if (text === '') {
          return false;
        }
        option = this.findOptionBy('text', text) || new OptionItem(text, this.makeNewValue(text), {
          isNew: true
        });
        return this.selectOption(option);
      },
      selectOption: function(option) {
        if (this.isSelected(option) || (option.isNew && !this.allowNew)) {
          return false;
        }
        if (!this.isMultiple) {
          this.unselectOption(this.selectedSingleOption);
        }
        if (option.isNew) {
          this.userAddedOptions.push(option);
        }
        this.currSelectedValues.splice(this.inputIndex, 0, option.value);
        this.inputValue = '';
        this.incInputIndex();
        this.fireChange();
        Vue.nextTick((function(_this) {
          return function() {
            return _this.hideAutocomplete();
          };
        })(this));
        return true;
      },
      unselectOption: function(option) {
        var index;
        if (!option) {
          return false;
        }
        index = this.currSelectedValues.indexOf(option.value);
        this.currSelectedValues.splice(index, 1);
        if (this.inputIndex > index) {
          this.incInputIndex(-1);
        }
        if (option.isNew) {
          this.userAddedOptions.splice(this.findIndexByValue(this.userAddedOptions, option.value), 1);
        }
        this.fireChange();
        return true;
      },
      markOptionField: function(str) {
        var part, parts, regex;
        if (!this.inputValue) {
          return str;
        }
        regex = new RegExp("(" + (this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + ")", 'i');
        parts = (function() {
          var j, len, ref, results;
          ref = String(str).split(regex);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            part = ref[j];
            if (regex.test(part)) {
              results.push("<mark class=\"search-match\">" + part + "</mark>");
            } else {
              results.push(part);
            }
          }
          return results;
        })();
        return parts.join('');
      },
      formatOptionText: function(option) {
        if (option.isPreview) {
          return option.text;
        } else {
          return this.markOptionField(option.text);
        }
      },
      findIndexByValue: function(list, value) {
        return list.map(function(item) {
          return item.value;
        }).indexOf(value);
      },
      incInputIndex: function(amount) {
        var index;
        if (amount == null) {
          amount = 1;
        }
        index = Math.max(this.inputIndex + amount, 0);
        return this.inputIndex = Math.min(index, this.currSelectedValues.length);
      },
      incAutocompleteIndex: function(amount) {
        var index, ref, total;
        if (amount == null) {
          amount = 1;
        }
        ref = [this.autocompleteIndex + amount, this.autocompleteOptions.length - 1], index = ref[0], total = ref[1];
        return this.autocompleteIndex = index > total ? 0 : index <= -1 ? total : index;
      },
      fireChange: function() {
        return this.$emit('change', this.computedValue);
      },
      valueAsArray: function() {
        if (typeof this.value === 'string' && this.valueDelimiter) {
          return this.value.split(this.valueDelimiter);
        } else {
          return [].concat(this.value || []);
        }
      }
    },
    watch: {
      inputValue: 'showAutocomplete',
      options: 'validateSelectedValues',
      isFocused: function(newValue) {
        if (!newValue) {
          this.inputValue = '';
          this.inputIndex = this.currSelectedValues.length;
          return Vue.nextTick((function(_this) {
            return function() {
              return _this.hideAutocomplete();
            };
          })(this));
        }
      }
    }
  });

}).call(this);
