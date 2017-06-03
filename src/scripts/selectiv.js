/*
 selectiv v1.1.0 for Vue 2+
 (c) 2017, Jay Elaraj - http://nerdcave.com
*/

const SelectivComponent = {
  template: `
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
  `,
  props: {
    options: {
      type: Array,
      default: () => []
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
      validator: (value) => value.indexOf('%value%') > -1
    },
    valueDelimiter: {
      type: String,
      default: null
    },
    searchValue: {
      type: Boolean,
      default: false
    },
  },
  directives: {
    'set-top-position': {
      inserted(el, binding) {
        if (binding.value) {
          const rect = el.getBoundingClientRect();
          if (rect.top + rect.height < window.innerHeight || window.innerHeight - rect.top > rect.top) {
            el.className = el.className.replace('autocomplete-above', 'autocomplete-below');
          } else {
            const wrapper = el.parentNode;
            const styles = getComputedStyle(wrapper);
            const borderWidths = parseFloat(styles.getPropertyValue('border-top-width')) + parseFloat(styles.getPropertyValue('border-bottom-width'));
            el.style.bottom = wrapper.getBoundingClientRect().height - borderWidths + 'px';
            el.className = el.className.replace('autocomplete-below', 'autocomplete-above');
          }
        } else {
          el.style.bottom = null;
        }
      }
    },
    'scroll-into-view': {
      update(li, binding) {
        if (!binding.value) return;
        const ul = li.parentNode;
        const liRect = li.getBoundingClientRect();
        const liBottom = li.offsetTop + liRect.height;
        const ulRect = ul.getBoundingClientRect();
        const totalHeight = ulRect.height + ul.scrollTop;
        if (li.offsetTop < ul.scrollTop) {
          ul.scrollTop = li.offsetTop;
        } else if (liBottom > totalHeight) {
          ul.scrollTop += liBottom - totalHeight;
        }
      },
    },
    'focus': {
      inserted(el, binding) {
        binding.value ? el.focus() : el.blur();
      },
      update(el, binding) {
        binding.value ? el.focus() : el.blur();
      }
    }
  },
  data() {
    return {
      currSelectedValues: null,
      userAddedOptions: [],
      isFocused: false,
      isAutocompleteVisible: false,
      inputValue: '',
      autocompleteIndex: 0,
      inputIndex: 0,
    }
  },
  created() {
    this.currSelectedValues = this.valueAsArray();
    this.validateSelectedValues();
    this.fireChange();
  },
  computed: {
    optionItems() {
      let options = this.options.length > 0 ? this.options : this.valueAsArray();
      return options.concat(this.userAddedOptions).map(option => {
        const text = typeof option === 'object' ? option[this.optionText] : option;
        const value = typeof option === 'object' ? option[this.optionValue] : text;
        return new OptionItem(text, value, {isNew: option.isNew, isPreview: option.isPreview});
      });
    },
    isMultiple() {
      return this.multiple;
    },
    delimitedValue() {
      return this.currSelectedValues.join(this.valueDelimiter);
    },
    selectedOptions() {
      return this.currSelectedValues.map(value => this.findOptionBy('value', value));
    },
    selectedOptionsWithInput() {
      return this.selectedOptions.slice(0, this.inputIndex)
        .concat({isInput: true})
        .concat(this.selectedOptions.slice(this.inputIndex));
    },
    useStringInput() {
      return Boolean(this.valueDelimiter || (this.currSelectedValues.length === 0));
    },
    selectedSingleOption() {
      return this.selectedOptions[0];
    },
    singleText() {
      return (this.selectedSingleOption != null ? this.selectedSingleOption.text : undefined) || this.placeholder;
    },
    singleValue() {
      return (this.selectedSingleOption != null ? this.selectedSingleOption.value : undefined);
    },
    isSingleValueSet() {
      return Boolean(this.singleValue || (this.singleValue === ''));
    },
    allowClear() {
      return Boolean(this.placeholder && this.isSingleValueSet);
    },
    autocompleteOptions() {
      const text = this.inputValue;
      const regex = new RegExp(this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      let options = this.optionItems.filter(option => {
        return option.text.search(regex) > -1 || (this.searchValue && String(option.value).search(regex) > -1);
      });
      if (text !== '' && this.allowNew) {
        let substringOption = options.filter(option => option.text === text)[0]
        if (!substringOption) {
          substringOption = new OptionItem(text, this.makeNewValue(text), { isNew: true, isPreview: true });
          options.unshift(substringOption);
        }
      }
      return options;
    },
    isNoResultsVisible() {
      return !this.allowNew && (this.autocompleteOptions.length === 0);
    },
    inputSize() {
      const length = this.inputValue === '' ? this.inputPlaceholder.length : this.inputValue.length;
      return Math.max(length, 1) + 1;
    },
    inputStyles() {
      if (this.inputIndex < this.currSelectedValues.length && this.inputValue === '') return { width: '4px' };
    },
    inputPlaceholder() {
      return this.currSelectedValues.length === 0 ? this.placeholder : '';
    },
    computedValue() {
      if (this.isMultiple) {
        return this.useStringInput ? this.delimitedValue : this.currSelectedValues;
      } else {
        return this.singleValue;
      }
    }
  },
  KEYS: { left: 37, up: 38, right: 39, down: 40, enter: 13, tab: 9, backspace: 8, esc: 27, comma: 188 },
  methods: {
    keydown(event) {
      const KEYS = SelectivComponent.KEYS;
      let allow = false;
      const key = event.keyCode ? event.keyCode : event.which;
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
        allow = !this.addFromInput() && !(key === KEYS.enter || key === KEYS.comma);
      } else if (key === KEYS.backspace && this.isMultiple && this.inputValue === '' && this.currSelectedValues.length > 0) {
        const option = this.findOptionBy('value', this.currSelectedValues[this.inputIndex - 1]);
        if (this.unselectOption(option) && this.restoreOnBackspace) this.inputValue = option.text;
      } else {
        allow = true;
      }
      if (!allow) event.preventDefault();
    },
    validateSelectedValues() {
      // remove invalid selectedValues
      for (let i = this.currSelectedValues.length - 1; i >= 0; i--) {
        const value = this.currSelectedValues[i];
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
    findOptionBy(field, value) {
      return this.optionItems.filter(option => option[field] === value)[0];
    },
    makeNewValue(value) {
      return this.newValueFormat ? this.newValueFormat.replace('%value%', value) : value;
    },
    isSelected(option) {
      return this.currSelectedValues.indexOf(option.value) > -1;
    },
    removeSelectedOption(option) {
      this.unselectOption(option);
      this.showAutocomplete();
      this.isFocused = true; // when clearing single
    },
    showAutocomplete() {
      if (!this.hasAutocomplete) return;

      const options = this.autocompleteOptions;
      if (options.length > 0) {
        let index = 0;
        // if first option is a preview, set index to first unselected option
        if (options[0].isPreview && options.length > 1) {
          const unselectedOption = options.filter(option => !option.isPreview && !this.isSelected(option))[0];
          if (unselectedOption) index = this.findIndexByValue(options, unselectedOption.value);
        }
        this.autocompleteIndex = index;
      }
      this.isAutocompleteVisible = options.length > 0 || this.isNoResultsVisible;
    },
    hideAutocomplete() {
      this.isAutocompleteVisible = false;
    },
    toggleAutocomplete() {
      if (this.isAutocompleteVisible) {
        this.hideAutocomplete();
        if (!this.isMultiple) this.isFocused = false;
      } else {
        this.showAutocomplete();
        this.isFocused = true;
      }
    },
    selectAutocompleteOption(index) {
      const option = this.autocompleteOptions[index || this.autocompleteIndex];
      if (!option || (option.isPreview && !this.allowNew)) return false;
      option.isPreview = false;
      return this.selectOption(option);
    },
    addFromInput() {
      const text = this.inputValue;
      if (text === '') return false;
      const option = this.findOptionBy('text', text) || new OptionItem(text, this.makeNewValue(text), { isNew: true });
      return this.selectOption(option);
    },
    selectOption(option) {
      if (this.isSelected(option) || (option.isNew && !this.allowNew)) return false;
      if (!this.isMultiple) this.unselectOption(this.selectedSingleOption);
      if (option.isNew) this.userAddedOptions.push(option);
      this.currSelectedValues.splice(this.inputIndex, 0, option.value);
      this.inputValue = '';
      this.incInputIndex();
      this.fireChange();
      Vue.nextTick(() => this.hideAutocomplete());
      return true;
    },
    unselectOption(option) {
      if (!option) return false;
      const index = this.currSelectedValues.indexOf(option.value);
      this.currSelectedValues.splice(index, 1);
      if (this.inputIndex > index) this.incInputIndex(-1);
      if (option.isNew) this.userAddedOptions.splice(this.findIndexByValue(this.userAddedOptions, option.value), 1);
      this.fireChange()
      return true;
    },
    markOptionField(str) {
      if (!this.inputValue) return str;
      const regex = new RegExp('(' + this.inputValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i');
      let parts = String(str).split(regex).map(part => {
        return regex.test(part) ? `<mark class="search-match">${part}</mark>` : part;
      });
      return parts.join('');
    },
    formatOptionText(option) {
      return option.isPreview ? option.text : this.markOptionField(option.text);
    },
    findIndexByValue(list, value) {
      return list.map(item => item.value).indexOf(value);
    },
    incInputIndex(amount = 1) {
      const index = Math.max(this.inputIndex + amount, 0);
      this.inputIndex = Math.min(index, this.currSelectedValues.length);
    },
    incAutocompleteIndex(amount = 1) {
      const index = this.autocompleteIndex + amount;
      const total = this.autocompleteOptions.length - 1;
      this.autocompleteIndex = index > total ? 0 : index <= -1 ? total : index;
    },
    fireChange() {
      this.$emit('change', this.computedValue);
    },
    valueAsArray() {
      if (typeof this.value === 'string' && this.valueDelimiter) {
        return this.value.split(this.valueDelimiter);
      } else {
        return [].concat(this.value || []);
      }
    },
  },
  watch: {
    inputValue: 'showAutocomplete',
    options: 'validateSelectedValues',
    isFocused(newValue) {
      if (!newValue) {
        this.inputValue = ''
        this.inputIndex = this.currSelectedValues.length;
        Vue.nextTick(() => this.hideAutocomplete());
      }
    },
  }
}

function OptionItem(text, value, options = {}) {
  this.text = text;
  this.value = value;
  this.isNew = !!options.isNew;
  this.isPreview = !!options.isPreview;
}


Vue.component('selectiv', SelectivComponent);
