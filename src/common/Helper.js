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
    static rand(n) {return Math.trunc(Math.random() * n)}

    /**
     * Apply styles packed in object. key: style name, val: style value
     * @param {Element|String} el Element to apply styles or tag name to create
     * @param {Object} styles Styles object
     * @return {Element} Element with applied styles
     */
    static setStyles(el, styles) {
        if (!el || !styles) {return null}

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

    /**
     * Calculates Levenshtein distance between two numeric arrays. See this article
     * for details: https://en.wikipedia.org/wiki/Levenshtein_distance. Original code
     * obtained here: https://stackoverflow.com/a/11958496
     * @param {Array} arr1 First array
     * @param {Array} arr2 Second array
     * @returns {Number}
     */
    static distance(arr1, arr2) {
        const d = []; //2d matrix

        // Step 1
        const n = arr1.length;
        const m = arr2.length;

        if (n === 0) {return m}
        if (m === 0) {return n}

        //Create an array of arrays in javascript (a descending loop is quicker)
        for (let i = n; i >= 0; i--) {d[i] = []}

        // Step 2
        for (let i = n; i >= 0; i--) {d[i][0] = i}
        for (let j = m; j >= 0; j--) {d[0][j] = j}

        // Step 3
        for (let i = 1; i <= n; i++) {
            const s_i = arr1[i - 1];

            // Step 4
            for (let j = 1; j <= m; j++) {

                //Check the jagged ld total so far
                if (i === j && d[i][j] > 4) {return n}

                const t_j = arr2[j - 1];
                const cost = (s_i === t_j) ? 0 : 1; // Step 5

                //Calculate the minimum
                let mi = d[i - 1][j] + 1;
                const b = d[i][j - 1] + 1;
                const c = d[i - 1][j - 1] + cost;

                if (b < mi) {mi = b}
                if (c < mi) {mi = c}

                d[i][j] = mi; // Step 6

                //Damerau transposition
                if (i > 1 && j > 1 && s_i === arr2[j - 2] && arr1[i - 2] === t_j) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
                }
            }
        }

        // Step 7
        return d[n][m];
    }
}
/**
 * {Number} Global unique identifier counter
 * @private
 */
Helper._id = 0;

module.exports = Helper;
