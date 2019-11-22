/**
 * Implementation of array-like class for storing custom objects. Main goal in 
 * fast items access during iteration, fast add and remove. The algorithm of
 * working is the following:
 *   - size of array is static (at least in first version) and allocated on
 *     class creation in a constructor
 *   - all items of array are always at the beginning. Tail items just empty
 *   - iteration through items should stop on first empty (null) element
 *   - adding item means adding it after last not empty item (in the tail)
 *   - removing item means: get last not empty item and set it into removed
 *     one. So the length of not empty items will be shorter on 1
 *   - class contain private field with not empty items amount
 * 
 * @author flatline
 */
class FastArray {
    /**
     * Creates array instance. Size is a maximum amount of items
     * @param {Number} size Max elements in array
     */
    constructor(size) {
        /**
         * {Array} Container for custom objects
         */
        this._arr   = new Array(size).fill(null);
        /**
         * {Number} Allocated size of array. This is maximum amount
         * of items, which may be stored in FastArray
         */
        this._size  = size;
        /**
         * {Number} Amount of not empty items in array
         */
        this._items = 0;
    }

    destroy() {
        delete this._arr;
        delete this._size;
        delete this._items; 
    }

    /**
     * Amount of not empty items in array
     * @return {Number}
     */
    get items() {return this._items}

    /**
     * Returns allocated size (amount of cells)
     * @returns {Number}
     */
    get size() {return this._size}

    /**
     * Checks if array is full of items and you can't call add() on it
     * @return {Boolean}
     */
    get full() {return this._items >= this._size}

    /**
     * Returns next free index in FastArrays or undefined if there is no free index
     * @returns {Number}
     */
    get freeIndex() {return this._items}

    /**
     * Adds one item into array at the end. To keep adding fast it doesn't check
     * if it's full or not
     * @param {*} value Any value to add
     */
    add(value) {this._arr[this._items++] = value}

    /**
     * Returns value by index
     * @param {Number} i Value index
     * @returns {*|null} null - if cell is empty, undefined - if index out of bounds, * - value
     */
    get(i) {return this._arr[i]}

    /**
     * Returns reference to this._arr for fast access to the items
     * @return {Array} Data array
     */
    ref() {return this._arr}

    /**
     * Removes value by index. To keep this class fast we dont check if
     * index is correct and amount of items > 0
     * @param {Number} i Value index
     * @return {*} Moved value or undefined
     */
    del(i) {
        if (this._arr[i] === null) {return}
        this._arr[i] = this._arr[--this._items];
        this._arr[this._items] = null;
        return this._arr[i];
    }
}

module.exports = FastArray;