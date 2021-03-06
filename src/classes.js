import { addClass, removeClass, assign } from './utils';

const DEFAULT_CLASS_NAMES = {
  touched: 'touched', // the control has been blurred
  untouched: 'untouched', // the control hasn't been blurred
  valid: 'valid', // model is valid
  invalid: 'invalid', // model is invalid
  pristine: 'pristine', // control has not been interacted with
  dirty: 'dirty' // control has been interacted with
};

export default class ClassListener {
  constructor(el, validator, options = {}) {
    this.el = el;
    this.validator = validator;
    this.enabled = options.enableAutoClasses;
    this.classNames = assign({}, DEFAULT_CLASS_NAMES, options.classNames || {});
    this.component = options.component;
    this.listeners = {};
  }

  /**
   * Resets the classes state.
   */
  reset() {
    // detach all listeners.
    this.detach();

    // remove classes
    this.remove(this.classNames.dirty);
    this.remove(this.classNames.touched);
    this.remove(this.classNames.valid);
    this.remove(this.classNames.invalid);

    // listen again.
    this.attach(this.field);
  }

  /**
   * Syncs the automatic classes.
   */
  sync() {
    if (! this.enabled) return;

    this.toggle(this.classNames.dirty, this.field.flags.dirty);
    this.toggle(this.classNames.pristine, this.field.flags.pristine);
    this.toggle(this.classNames.valid, this.field.flags.valid);
    this.toggle(this.classNames.invalid, this.field.flags.invalid);
    this.toggle(this.classNames.touched, this.field.flags.touched);
    this.toggle(this.classNames.untouched, this.field.flags.untouched);
  }

  /**
   * Attach field with its listeners.
   * @param {*} field
   */
  attach(field) {
    this.field = field;
    this.add(this.classNames.pristine);
    this.add(this.classNames.untouched);

    // listen for focus event.
    this.listeners.focus = () => {
      this.remove(this.classNames.untouched);
      this.add(this.classNames.touched);
      // only needed once.
      this.el.removeEventListener('focus', this.listeners.focus);
      this.field.flags.touched = true;
      this.field.flags.untouched = false;
    };

    // listen for input.
    this.listeners.input = () => {
      this.remove(this.classNames.pristine);
      this.add(this.classNames.dirty);
      // only needed once.
      this.el.removeEventListener('input', this.listeners.input);
      this.field.flags.dirty = true;
      this.field.flags.pristine = false;
    };

    this.listeners.after = (e) => {
      this.remove(e.valid ? this.classNames.invalid : this.classNames.valid);
      this.add(e.valid ? this.classNames.valid : this.classNames.invalid);
      this.field.flags.valid = e.valid;
      this.field.flags.invalid = ! e.valid;
    };

    if (this.component) {
      this.component.$on('input', this.listeners.input);
      this.component.$on('focus', this.listeners.focus);
    } else {
      this.el.addEventListener('focus', this.listeners.focus);
      this.el.addEventListener('input', this.listeners.input);
    }
    this.validator.on('after', `${this.field.scope}.${this.field.name}`, this.listeners.after);
  }

  /**
   * Detach all listeners.
   */
  detach() {
    // TODO: Why could the field be undefined?
    if (! this.field) return;

    if (this.component) {
      this.component.$off('input', this.listeners.input);
      this.component.$off('focus', this.listeners.focus);
    } else {
      this.el.removeEventListener('focus', this.listeners.focus);
      this.el.removeEventListener('input', this.listeners.input);
    }
    this.validator.off('after', `${this.field.scope}.${this.field.name}`);
  }

  /**
   * Add a class.
   * @param {*} className
   */
  add(className) {
    if (! this.enabled) return;

    addClass(this.el, className);
  }

  /**
   * Remove a class.
   * @param {*} className
   */
  remove(className) {
    if (! this.enabled) return;

    removeClass(this.el, className);
  }

  /**
   * Toggles the class name.
   *
   * @param {String} className
   * @param {Boolean} status
   */
  toggle(className, status) {
    if (status) {
      this.add(className);
      return;
    }

    this.remove(className);
  }
}
