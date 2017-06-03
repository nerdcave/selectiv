'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 selectiv v1.1.0 for Vue 2+
 (c) 2017, Jay Elaraj - http://nerdcave.com
*/

var SelectivComponent = {
  template: '\n    <div class="selectiv-component" @mousedown.prevent="toggleAutocomplete">\n      <select multiple v-show="false" v-if="!useStringInput" :name="name" v-model="currSelectedValues">\n        <option v-for="optionItem in selectedOptions" :value="optionItem.value">{{ optionItem.text }}</option>\n      </select>\n      <input type="hidden" v-if="useStringInput" :name="name" :value="delimitedValue">\n      <template v-if="isMultiple">\n        <ul class="selected-options">\n          <template v-for="selectedOption in selectedOptionsWithInput">\n            <li class="option-input" v-if="selectedOption.isInput">\n              <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"\n                v-model.trim="inputValue"\n                @keydown="keydown"\n                v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false"\n                :size="inputSize"\n                :placeholder="inputPlaceholder"\n                :style="inputStyles">\n            </li><li class="option" v-else>\n              <slot name="selectedOption" :text="selectedOption.text" :value="selectedOption.value">\n                <span class="option-text" v-html="selectedOption.text"></span>\n              </slot>\n              <a class="option-close" v-if="hasRemoveButton" @click="removeSelectedOption(selectedOption)" @mousedown.stop.prevent></a>\n            </li>\n          </template>\n        </ul>\n      </template>\n      <template v-else>\n        <span class="single-text" v-html="singleText" :class="{ placeholder: !isSingleValueSet }"></span>\n        <span class="single-clear" v-if="allowClear" @click="removeSelectedOption(selectedSingleOption)" @mousedown.stop.prevent>&times;</span>\n        <span class="single-arrow" :class="{ \'arrow-up\': isAutocompleteVisible, \'arrow-down\': !isAutocompleteVisible }"></span>\n      </template>\n      <div class="autocomplete-wrapper autocomplete-below"\n        v-if="isAutocompleteVisible"\n        v-set-top-position="isAutocompleteVisible">\n        <span v-if="!isMultiple" class="single-input-wrapper">\n          <input type="text" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"\n            v-model.trim="inputValue"\n            @keydown="keydown"\n            @mousedown.stop\n            v-focus="isFocused" @focus="isFocused=true" @blur="isFocused=false">\n        </span>\n        <slot name="noResults" :search-text="inputValue" v-if="isNoResultsVisible">\n          <span class="no-results">No results</span>\n        </slot>\n        <ul class="autocomplete">\n          <li v-for="(option, index) in autocompleteOptions"\n            :class="{ selected: isSelected(option), \'new-option-preview\': option.isPreview, highlighted: autocompleteIndex === index }"\n            v-scroll-into-view="index === autocompleteIndex"\n            @mouseup="selectAutocompleteOption(index)"\n            @mouseover="autocompleteIndex = index"\n            @mousedown.stop.prevent>\n            <slot name="option" :text="option.text" :value="option.value" :text-marked="formatOptionText(option)" :value-marked="markOptionField(option.value)">\n              <span v-html="formatOptionText(option)"></span>\n            </slot>\n          </li>\n        </ul>\n      </div>\n    </div>\n  ',
  props: {
    options: {
      type: Array,
      default: function _default() {
        return [];
      }
    },
    optionText: {
      type: String,
      default: 'text'
    },
    optionValue: {
      type: String,
      default: 'value'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    value: [Array, String, Number],
    name: {
      default: 'options'
    },
    allowNew: {
      type: Boolean,
      default: false
    },
    hasAutocomplete: {
      type: Boolean,
      default: true
    },
    restoreOnBackspace: {
      type: Boolean,
      default: false
    },
    hasRemoveButton: {
      type: Boolean,
      default: true
    },
    newValueFormat: {
      type: String,
      validator: function validator(value) {
        return value.indexOf('%value%') > -1;
      }
    },
    valueDelimiter: {
      type: String,
      default: null
    },
    searchValue: {
      type: Boolean,
      default: false
    }
  },
  directives: {
    'set-top-position': {
      inserted: function inserted(el, binding) {
        if (binding.value) {
          var rect = el.getBoundingClientRect();
          if (rect.top + rect.height < window.innerHeight || window.innerHeight - rect.top > rect.top) {
            el.className = el.className.replace('autocomplete-above', 'autocomplete-below');
          } else {
            var wrapper = el.parentNode;
            var styles = getComputedStyle(wrapper);
            var borderWidths = parseFloat(styles.getPropertyValue('border-top-width')) + parseFloat(styles.getPropertyValue('border-bottom-width'));
            el.style.bottom = wrapper.getBoundingClientRect().height - borderWidths + 'px';
            el.className = el.className.replace('autocomplete-below', 'autocomplete-above');
          }
        } else {
          el.style.bottom = null;
        }
      }
    },
    'scroll-into-view': {
      update: function update(li, binding) {
        if (!binding.value) return;
        var ul = li.parentNode;
        var liRect = li.getBoundingClientRect();
        var liBottom = li.offsetTop + liRect.height;
        var ulRect = ul.getBoundingClientRect();
        var totalHeight = ulRect.height + ul.scrollTop;
        if (li.offsetTop < ul.scrollTop) {
          ul.scrollTop = li.offsetTop;
        } else if (liBottom > totalHeight) {
          ul.scrollTop += liBottom - totalHeight;
        }
      }
    },
    'focus': {
      inserted: function inserted(el, binding) {
        binding.value ? el.focus() : el.blur();
      },
      update: function update(el, binding) {
        binding.value ? el.focus() : el.blur();
      }
    }
  },
  data: function data() {
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
  created: function created() {
    this.currSelectedValues = this.valueAsArray();
    this.validateSelectedValues();
    this.fireChange();
  },

  computed: {
    optionItems: function optionItems() {
      var _this = this;

      var options = this.options.length > 0 ? this.options : this.valueAsArray();
      return options.concat(this.userAddedOptions).map(function (option) {
        var text = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) === 'object' ? option[_this.optionText] : option;
        var value = (typeof option === 'undefined' ? 'undefined' : _typeof(option)) === 'object' ? option[_this.optionValue] : text;
        return new OptionItem(text, value, { isNew: option.isNew, isPreview: option.isPreview });
      });
    },
    isMultiple: function isMultiple() {
      return this.multiple;
    },
    delimitedValue: function delimitedValue() {
      return this.currSelectedValues.join(this.valueDelimiter);
    },
    selectedOptions: function selectedOptions() {
      var _this2 = this;

      return this.currSelectedValues.map(function (value) {
        return _this2.findOptionBy('value', value);
      });
    },
    selectedOptionsWithInput: function selectedOptionsWithInput() {
      return this.selectedOptions.slice(0, this.inputIndex).concat({ isInput: true }).concat(this.selectedOptions.slice(this.inputIndex));
    },
    useStringInput: function useStringInput() {
      return Boolean(this.valueDelimiter || this.currSelectedValues.length === 0);
    },
    selectedSingleOption: function selectedSingleOption() {
      return this.selectedOptions[0];
    },
    singleText: function singleText() {
      return (this.selectedSingleOption != null ? this.selectedSingleOption.text : undefined) || this.placeholder;
    },
    singleValue: function singleValue() {
      return this.selectedSingleOption != null ? this.selectedSingleOption.value : undefined;
    },
    isSingleValueSet: function isSingleValueSet() {
      return Boolean(this.singleValue || this.singleValue === '');
    },
    allowClear: function allowClear() {
      return Boolean(this.placeholder && this.isSingleValueSet);
    },
    autocompleteOptions: function autocompleteOptions() {
      var _this3 = this;

      var text = this.inputValue;
      var regex = new RegExp(this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      var options = this.optionItems.filter(function (option) {
        return option.text.search(regex) > -1 || _this3.searchValue && String(option.value).search(regex) > -1;
      });
      if (text !== '' && this.allowNew) {
        var substringOption = options.filter(function (option) {
          return option.text === text;
        })[0];
        if (!substringOption) {
          substringOption = new OptionItem(text, this.makeNewValue(text), { isNew: true, isPreview: true });
          options.unshift(substringOption);
        }
      }
      return options;
    },
    isNoResultsVisible: function isNoResultsVisible() {
      return !this.allowNew && this.autocompleteOptions.length === 0;
    },
    inputSize: function inputSize() {
      var length = this.inputValue === '' ? this.inputPlaceholder.length : this.inputValue.length;
      return Math.max(length, 1) + 1;
    },
    inputStyles: function inputStyles() {
      if (this.inputIndex < this.currSelectedValues.length && this.inputValue === '') return { width: '4px' };
    },
    inputPlaceholder: function inputPlaceholder() {
      return this.currSelectedValues.length === 0 ? this.placeholder : '';
    },
    computedValue: function computedValue() {
      if (this.isMultiple) {
        return this.useStringInput ? this.delimitedValue : this.currSelectedValues;
      } else {
        return this.singleValue;
      }
    }
  },
  KEYS: { left: 37, up: 38, right: 39, down: 40, enter: 13, tab: 9, backspace: 8, esc: 27, comma: 188 },
  methods: {
    keydown: function keydown(event) {
      var KEYS = SelectivComponent.KEYS;
      var allow = false;
      var key = event.keyCode ? event.keyCode : event.which;
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
      } else if (key === KEYS.tab || key === KEYS.enter || key === KEYS.comma && !event.shiftKey) {
        allow = !this.addFromInput() && !(key === KEYS.enter || key === KEYS.comma);
      } else if (key === KEYS.backspace && this.isMultiple && this.inputValue === '' && this.currSelectedValues.length > 0) {
        var option = this.findOptionBy('value', this.currSelectedValues[this.inputIndex - 1]);
        if (this.unselectOption(option) && this.restoreOnBackspace) this.inputValue = option.text;
      } else {
        allow = true;
      }
      if (!allow) event.preventDefault();
    },
    validateSelectedValues: function validateSelectedValues() {
      // remove invalid selectedValues
      for (var i = this.currSelectedValues.length - 1; i >= 0; i--) {
        var value = this.currSelectedValues[i];
        if (!this.findOptionBy('value', value)) this.currSelectedValues.splice(i, 1);
      }

      if (!this.isMultiple) {
        // if no value, set to first
        if (!this.placeholder && this.currSelectedValues.length === 0 && this.optionItems[0]) {
          this.currSelectedValues.push(this.optionItems[0].value);
        } else if (this.currSelectedValues.length > 1) {
          this.currSelectedValues.splice(1);
        }
      }
      this.inputIndex = this.currSelectedValues.length;
    },
    findOptionBy: function findOptionBy(field, value) {
      return this.optionItems.filter(function (option) {
        return option[field] === value;
      })[0];
    },
    makeNewValue: function makeNewValue(value) {
      return this.newValueFormat ? this.newValueFormat.replace('%value%', value) : value;
    },
    isSelected: function isSelected(option) {
      return this.currSelectedValues.indexOf(option.value) > -1;
    },
    removeSelectedOption: function removeSelectedOption(option) {
      this.unselectOption(option);
      this.showAutocomplete();
      this.isFocused = true; // when clearing single
    },
    showAutocomplete: function showAutocomplete() {
      var _this4 = this;

      if (!this.hasAutocomplete) return;

      var options = this.autocompleteOptions;
      if (options.length > 0) {
        var index = 0;
        // if first option is a preview, set index to first unselected option
        if (options[0].isPreview && options.length > 1) {
          var unselectedOption = options.filter(function (option) {
            return !option.isPreview && !_this4.isSelected(option);
          })[0];
          if (unselectedOption) index = this.findIndexByValue(options, unselectedOption.value);
        }
        this.autocompleteIndex = index;
      }
      this.isAutocompleteVisible = options.length > 0 || this.isNoResultsVisible;
    },
    hideAutocomplete: function hideAutocomplete() {
      this.isAutocompleteVisible = false;
    },
    toggleAutocomplete: function toggleAutocomplete() {
      if (this.isAutocompleteVisible) {
        this.hideAutocomplete();
        if (!this.isMultiple) this.isFocused = false;
      } else {
        this.showAutocomplete();
        this.isFocused = true;
      }
    },
    selectAutocompleteOption: function selectAutocompleteOption(index) {
      var option = this.autocompleteOptions[index || this.autocompleteIndex];
      if (!option || option.isPreview && !this.allowNew) return false;
      option.isPreview = false;
      return this.selectOption(option);
    },
    addFromInput: function addFromInput() {
      var text = this.inputValue;
      if (text === '') return false;
      var option = this.findOptionBy('text', text) || new OptionItem(text, this.makeNewValue(text), { isNew: true });
      return this.selectOption(option);
    },
    selectOption: function selectOption(option) {
      var _this5 = this;

      if (this.isSelected(option) || option.isNew && !this.allowNew) return false;
      if (!this.isMultiple) this.unselectOption(this.selectedSingleOption);
      if (option.isNew) this.userAddedOptions.push(option);
      this.currSelectedValues.splice(this.inputIndex, 0, option.value);
      this.inputValue = '';
      this.incInputIndex();
      this.fireChange();
      Vue.nextTick(function () {
        return _this5.hideAutocomplete();
      });
      return true;
    },
    unselectOption: function unselectOption(option) {
      if (!option) return false;
      var index = this.currSelectedValues.indexOf(option.value);
      this.currSelectedValues.splice(index, 1);
      if (this.inputIndex > index) this.incInputIndex(-1);
      if (option.isNew) this.userAddedOptions.splice(this.findIndexByValue(this.userAddedOptions, option.value), 1);
      this.fireChange();
      return true;
    },
    markOptionField: function markOptionField(str) {
      if (!this.inputValue) return str;
      var regex = new RegExp('(' + this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
      var parts = String(str).split(regex).map(function (part) {
        return regex.test(part) ? '<mark class="search-match">' + part + '</mark>' : part;
      });
      return parts.join('');
    },
    formatOptionText: function formatOptionText(option) {
      return option.isPreview ? option.text : this.markOptionField(option.text);
    },
    findIndexByValue: function findIndexByValue(list, value) {
      return list.map(function (item) {
        return item.value;
      }).indexOf(value);
    },
    incInputIndex: function incInputIndex() {
      var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      var index = Math.max(this.inputIndex + amount, 0);
      this.inputIndex = Math.min(index, this.currSelectedValues.length);
    },
    incAutocompleteIndex: function incAutocompleteIndex() {
      var amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

      var index = this.autocompleteIndex + amount;
      var total = this.autocompleteOptions.length - 1;
      this.autocompleteIndex = index > total ? 0 : index <= -1 ? total : index;
    },
    fireChange: function fireChange() {
      this.$emit('change', this.computedValue);
    },
    valueAsArray: function valueAsArray() {
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
    isFocused: function isFocused(newValue) {
      var _this6 = this;

      if (!newValue) {
        this.inputValue = '';
        this.inputIndex = this.currSelectedValues.length;
        Vue.nextTick(function () {
          return _this6.hideAutocomplete();
        });
      }
    }
  }
};

function OptionItem(text, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  this.text = text;
  this.value = value;
  this.isNew = !!options.isNew;
  this.isPreview = !!options.isPreview;
}

Vue.component('selectiv', SelectivComponent);