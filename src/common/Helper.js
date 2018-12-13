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
}

module.exports = Helper;