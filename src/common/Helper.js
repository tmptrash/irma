/**
 * Global helper
 *
 * @author flatline
 */
class Helper {
    /**
     * Imports plugin module
     * @param {Array} names plugin file names without extension
     * @return {Object} Object of imported module
     */
    static requirePlugins(names) {
        const plugins = [];
        names.forEach(name => plugins.push(require(`./../irma/plugins/${name}.js`)));
        return plugins;
    }
    /**
     * Creates instances of plugin classes and returns instances array
     * @param {Array} plugins Array of functions(classes) of plugins 
     * @param {Array} args Array of arguments
     * @return {Array} Instances array
     */
    static loadPlugins(plugins, args) {
        const instances = new Array(plugins.length);
        plugins.forEach((Plugin, i) => instances[i] = new Plugin(...args));
        return instances;
    }
    /**
     * Destroys plugins. Calls destroy() method of each one
     * @param {Array} plugins Array of plugin instances
     */
    static destroyPlugins(plugins) {
        plugins.forEach(plugin => plugin.destroy());
    }
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

    /**
     * It calculates probability index from variable amount of components.
     * Let's imagine we have two actions: one and two. We want
     * these actions to be called randomly, but with different probabilities.
     * For example it may be [3,2]. It means that one should be called
     * in half cases, two in 1/3 cases. Probabilities should be greater then -1.
     * @param {Array} probs Probabilities array. e.g.: [3,2] or [1,3]
     * @return {Number} -1 Means that index is invalid
     */
    static probIndex(probs) {
        let len = probs.length;
        if (len < 1) {return -1}
        let sum = probs.reduce((a, b) => a + b, 0);
        if (sum < 1) {return -1}
        let num = Helper.rand(sum) + 1;
        let i;
        //
        // This is small optimization trick. if random number in
        // a left part of all numbers sum, the we have to go to it from
        // left to right, if not - then from right to left. Otherwise,
        // going every time from left to right will be a little bit
        // slower then this approach.
        //
        if (num < sum / 2) {
            sum = 0;
            for (i = 0; i < len; i++)  {if (num <= (sum += probs[i])) {break}}
        } else {
            for (i = len-1; i>-1; i--) {if (num >  (sum -= probs[i])) {break}}
        }

        return i;
    }
}
/**
 * {Number} Global unique identifier counter
 * @private
 */
Helper._id = 0;
/**
 * Analog of Array.prototype.splice(), but for Uint8Array
 * @param {Number} start index for deleting and inserting elements
 * @param {Number} deleted Amount of items to delete in 'start' index
 * @param {Array} numbers Numbers array, which will be added by 'start' index
 * @return {Uint32Array} New array
 */
Uint8Array.prototype.splice = function splice(start, deleted, numbers) {
    if (arguments.length < 2 || start > this.length) {return this}
    const amount  = numbers && numbers.length || 0;
    if (deleted > this.length - start) {deleted = this.length - start}
    const newSize = this.length - deleted + amount;
    const newArr  = new Uint8Array(newSize);
  
    newArr.set(this.subarray(0, start));
    amount > 0 && newArr.set(numbers, start);
    newArr.set(this.subarray(start + deleted), start + amount);

    return newArr;
}
/**
 * Array.prototype.push analog
 * @param {Uint8Array} pushedArr
 */
Uint8Array.prototype.push = function push(pushedArr) {
    const newArr = new Uint8Array(this.length + pushedArr.length);

    newArr.set(this, 0);
    newArr.set(pushedArr, this.length);

    return newArr;
}

module.exports = Helper;
