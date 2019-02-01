/**
 * Global helper
 *
 * @author flatline
 */
class Helper {
    /**
     * Generates random Int number in range 0:n-1
     * @param {Number} n Right number value in a range
     * @return {Number}
     */
    static rand(n) {
        return Math.trunc(Math.random() * n)
    }

    /**
     * Apply styles packed in object. key: style name, val: style value
     * @param {Element|String} el Element to apply styles or tag name to create
     * @param {Object} styles Styles object
     * @return {Element} Element with applied styles
     */
    static setStyles(el, styles) {
        if (!el || !styles) {
            return null
        };

        el = typeof el === 'string' ? document.createElement(el) : el;
        const elStyle = el.style;

        for (let style in styles) {
            if (styles.hasOwnProperty(style)) {
                elStyle[style] = styles[style]
            }
        }
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
