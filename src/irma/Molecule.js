/**
 * Container for molecule. Contains minimal fields. Code of molecules
 * should not be run in VM.
 *
 * @author flatline
 */
class Molecule {
    /**
     * Creates new, default molecule
     * @param {Number} offset Absolute coordinate
     * @param {Number} index Index of this organism in population list
     * @param {Uint8Array} code Code of organism we need to set
     */
    constructor(offset, index, code) {
        this.offset = offset;
        this.index  = index;
        this.code   = code;
    }
}

module.exports = Molecule;