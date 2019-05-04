/**
 * Implementation of fast array. Purpose of this class is in fast access to custom
 * element of array, ability to add/remove elements. First, this class uses fixed
 * array size. Second, get(), add(), del() methods will be called must of the time,
 * then resize(). Resize is possible, but should be rare to keep it fast. Is used
 * for storing organisms population. Removing element means setting null to
 * specified index. This is how del() method works. Difference between items and
 * size is: items - returns amount of elements in a array, size - returns amount
 * of cells allocated for this array.
 *
 * @author flatline
 */
class FastArray {
    /**
     * Creates fast array instance. Size is maximum amount of elements you may access to
     * @param {Number} size Max elements in a array
     */
    constructor(size) {
        this._init(size);
    }

    destroy() {
        this._arr         = null;
        this._freeIndexes = null;
        this._size        = null;
        this._index       = -1;
    }

    /**
     * Analog of Array.length
     * @returns {Number} Amount of not empty elements in FastArray.
     * Not all cells in an array may be filled by values. 0 or less
     * then zero means no items in an array.
     */
    get items() {return this._size - this._index - 1}

    /**
     * Returns allocated size
     * @returns {Number}
     */
    get size() {return this._size}

    /**
     * Returns next free index in FastArray or undefined if there is no free index
     * @returns {Number|undefined}
     */
    get freeIndex() {
        return this._freeIndexes[this._index];
    }

    /**
     * Checks if array is full of items and you can't call add() on it
     * @return {Boolean}
     */
    get full() {
        return this._index < 0;
    }

    /**
     * Returns index of first not empty element in array
     * @return {Number}
     */
    get first() {
        return this._index + 1;
    }

    /**
     * Sets value to FastArray. You can't set value index due to
     * optimization reason. Only a value
     * @param {*|false} v Any value or false if value hasn't added
     */
    add(v) {this._index > -1 && (this._arr[this._freeIndexes[this._index--]] = v)}

    /**
     * Returns a value by index
     * @param {Number} i Value index
     * @returns {null|undefined|*} null - if cell is empty, undefined - if index out of bounds, * - value
     */
    get(i) {return this._arr[i]}

    /**
     * Returns reference to this._arr for fast access to the data
     * @return {Array} Data array
     */
    getRef() {
        return this._arr;
    }

    /**
     * Removes(sets it to null) a value by index.
     * @param {Number} i Value index
     * @param {Boolean} remove true to null cell, false - don't
     */
    del(i, remove = true) {
        if (this._arr[i] !== null) {
            remove && (this._arr[i] = null);
            this._freeIndexes[++this._index] = i;
        }
    }

    /**
     * Returns last added value by set() method
     * @returns {*|undefined} Value or undefined if there is no value
     */
    added() {
        return this._arr[this._freeIndexes[this._index + 1]];
    }

    /**
     * Resize an array. Values will not be removed during resize.
     * This method is very slow and should be called not often.
     * @param {Number} size New array size
     */
    resize(size) {
        if (size <= 0) {return}
        const oldArr  = this._arr.slice();
        const oldSize = Math.min(this._size, size);

        this._init(size);
        for (let i = 0; i < oldSize; i++) {
            oldArr[i] !== null && this.add(oldArr[i]);
        }
    }

    /**
     * We can't call constructor directly. It triggers error during
     * jasmine tests.
     * @param {Number} size Array size
     * @private
     */
    _init(size) {
        /**
         * {Array} Source container for custom objects
         */
        this._arr         = new Array(size);
        /**
         * {Array} Array of free indexes in _arr. Every time
         * user calls del() method _arr obtains hole in it.
         * Index of this hole wil be stored in this array
         */
        this._freeIndexes = new Array(size);
        /**
         * {Number} Index of last free index in _freeIndexes array
         */
        this._index       = size - 1;
        /**
         * {Number} Allocated size of array. This is maximum amount
         * of elements, which may be stored in FastArray
         */
        this._size        = size;

        for (let i = 0; i < size; i++) {
            this._freeIndexes[i] = i;
            this._arr[i]         = null;
        }
    }
}

module.exports = FastArray;