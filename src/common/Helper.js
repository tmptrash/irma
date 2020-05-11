/**
 * Global helper
 *
 * @author flatline
 */
/**
 * {Uint8Array} Shared memory peace, which may be used in different functions.
 * Size of this peace is a maximum size of copied memory.
 */
const SHARED_MEM = new Uint8Array(1024);

class Helper {
    /**
     * Overrides specified function in two ways: softly - by
     * calling new function and after that original; hardly - by
     * erasing old function by new one. It's still possible to
     * unoverride erasing by copy old function from fn.fn property.
     * @param {Object} obj Destination object, we want to override
     * @param {String} fnName Function name
     * @param {Function} fn Destination function
     * @param {Boolean} hard true - erase old function, false - call
     * old function and new after that.
     */
    static override(obj, fnName, fn, hard = false) {
        //
        // We need oldFn exactly in `override()`, because `fn(..args)` call removes
        // reference to fn.fn and this code crashes on line `fn.fn.apply(obj, args)`
        //
        const oldFn = fn.fn = obj[fnName];
        if (typeof oldFn === 'undefined') {throw Error(`Helper.override: Parent object doesn't contain method '${fnName}'`)}
        if (!hard) {
            obj[fnName] = (...args) => {
                const ret = fn(...args);
                oldFn.apply(obj, args);
                return ret;
            };
            return;
        }
        obj[fnName] = fn;
    }

    /**
     * Opposite to override. Removes overridden method.
     * @param {Object} obj Destination object, we want to override
     * @param {String} fnName Function name
     * @param {Function} fn Destination function
     */
    static unoverride(obj, fnName, fn) {
        obj[fnName] = fn.fn;
        delete fn.fn;
    }

    /**
     * Imports plugin module
     * @param {Array} names plugin file names without extension
     * @return {Object} Object of imported module
     */
    static requirePlugins(names) {
        const plugins = [];
        // eslint-disable-next-line global-require
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

        // eslint-disable-next-line no-restricted-syntax
        for (const style in styles) {
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
     * It calculates probability index from variable amount of components.
     * Let's imagine we have two actions: one and two. We want
     * these actions to be called randomly, but with different probabilities.
     * For example it may be [3,2]. It means that one should be called
     * in half cases, two in 1/3 cases. Probabilities should be greater then -1.
     * @param {Array} probs Probabilities array. e.g.: [3,2] or [1,3]
     * @return {Number} -1 Means that index is invalid
     */
    static probIndex(probs) {
        const len = probs.length;
        if (len < 1) {return -1}
        let sum   = probs.reduce((a, b) => a + b, 0);
        if (sum < 1) {return -1}
        const num = Helper.rand(sum) + 1;
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
 * Removes elements from Uint8Array array and returns new Uint8Array
 * @param {Number} start index for deleting items
 * @param {Number} deleted Amount of items to delete
 * @return {Uint8Array} New array
 */
Uint8Array.prototype.remove = function(start, deleted) {
    const len = this.length;
    if (start >= len || start < 0 || deleted <= 0 || deleted > len - start) {return this}
    const newArr = new Uint8Array(len - deleted);
  
    newArr.set(this.subarray(0, start));
    newArr.set(this.subarray(start + deleted), start);

    return newArr;
}

/**
 * Inserts items into Uint8Array starting from start
 * @param {Number} start index for inserting items
 * @param {Uint8Array} numbers Items to insert into start position
 * @return {Uint8Array} New array
 */
Uint8Array.prototype.insert = function(start, numbers) {
    const len = this.length;
    if (start > len || start < 0) {return this}
    const amount = numbers.length;
    const newArr  = new Uint8Array(len + amount);
  
    newArr.set(this.subarray(0, start));
    newArr.set(numbers, start);
    newArr.set(this.subarray(start), start + amount);

    return newArr;
}

/**
 * Moves items from "start" till "end" within Uint8Array into position of "target".
 * During move temporary SHARE_MEM array is used to speed up copy process. This 
 * function has limitations: It's impossible to move the block within block itself.
 * For example: [0,1,2,3,4].move(0,2,1) -> [0,1,2,3,4] // move was cancelled
 * Examples:
 *   [0,1,2,3,4].move(0,2,3) -> [2,0,1,3,4]
 *   [0,1,2,3,4].move(3,5,1) -> [0,3,4,1,2]
 *   [0,1,2,3,4].move(0,2,5) -> [2,3,4,0,1]
 * 
 * @param {Number} start index of first item to move
 * @param {Number} end Index of last item to move + 1
 * @param {Number} target Index of insertion
 */
Uint8Array.prototype.move = function(start, end, target) {
    const len = this.length;
    if (start < 0 || start > end || end > len || target < 0 || target > len) {return this}
    //
    // Scenario 1: move from right to left
    //
    if (target < start) {
        SHARED_MEM.set(this.subarray(start, end));
        this.copyWithin(target + end - start, target, start);
        this.set(SHARED_MEM.subarray(0, end - start), target);
    //
    // Scenario 2: move from left to right
    //
    } else if (target >= end) {
        SHARED_MEM.set(this.subarray(start, end));
        this.copyWithin(start, end, target);
        this.set(SHARED_MEM.subarray(0, end - start), target - end + start);
    }
}

/**
 * Analog of Array.prototype.splice(), but for Uint8Array
 * @param {Number} start index for deleting and inserting elements
 * @param {Number} deleted Amount of items to delete in 'start' index
 * @param {Uint8Array} numbers Numbers array, which will be added by 'start' index
 * @return {Uint8Array} New array
 */
Uint8Array.prototype.splice = function(start, deleted, numbers) {
    if (start > this.length || start < 0 || deleted < 0) {return this}
    const amount  = numbers && numbers.length || 0;
    if (deleted > this.length - start) {deleted = this.length - start}
    const newArr  = new Uint8Array(this.length - deleted + amount);
  
    newArr.set(this.subarray(0, start));
    amount > 0 && newArr.set(numbers, start);
    newArr.set(this.subarray(start + deleted), start + amount);

    return newArr;
}

/**
 * Array.prototype.push analog
 * @param {Uint8Array} New array with pushed items inside
 */
Uint8Array.prototype.push = function(pushedArr) {
    const newArr = new Uint8Array(this.length + pushedArr.length);

    newArr.set(this, 0);
    newArr.set(pushedArr, this.length);

    return newArr;
}

module.exports = Helper;