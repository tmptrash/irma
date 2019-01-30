/**
 * Global helper
 *
 * @author flatline
 */
// TODO: remove this dependency from here and from package.json also
const _each  = require('lodash/each');

class Helper {
    /**
     * Generates random Int number in range 0:n-1
     * @param {Number} n Right number value in a range
     * @return {Number}
     */
    static rand(n) {return Math.trunc(Math.random() * n)}

    /**
     * Apply styles packed in object. key: style name, val: style value
     * @param {Element|String} el Element to apply styles or tag name to create
     * @param {Object} styles Styles object
     * @return {Element} Element with applied styles
     */
    static setStyles(el, styles) {
        el = typeof el === 'string' ? document.createElement(el) : el;
        const style = el.style;

        _each(styles, (val, name) => style[name] = val);

        return el;
    }

    /**
     * Generates unique numeric identifier. Starts from 1.
     * @return {String} Unique id
     */
    static id() {
        return ++Helper._id;
    }
}
/**
 * {Number} Global unique identifier counter
 * @private
 */
Helper._id = 0;

module.exports = Helper;