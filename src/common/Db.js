/**
 * IndexedDB wrapper. Simplify working with IndexedDB and organisms. It stores
 * population family tree with codes of every organism in population. This is
 * useful if you study code changes (mutations) between generations. Before
 * start working with database check this.ready promise.
 *
 * @author flatline
 */
const Dexie  = require('dexie').default;
const Config = require('./../Config');

class Db {
    constructor() {
        this._db       = null;
        this._promise  = this._createDb();
        this._buf      = new Array(Config.DB_CHUNK_SIZE);
        this._bufIndex = 0;
    }

    destroy() {
        this._db.close(); // no promise needed
        this._db  = null;
        this._buf = null;
    }

    get ready() {
        return this._promise;
    }

    /**
     * Puts array of organisms to the database. It stores organisms in a local
     * array till it reaches some limit and then put all these records to DB
     * @param {Organism} org organism we are putting
     * @param {Organism|null} parent Parent organism. null if no parent first)
     */
    put(org, parent = null) {
        if (this._bufIndex >= Config.DB_CHUNK_SIZE) {
            this._db.orgs.bulkPut(this._buf);
            this._bufIndex = 0;
        }
        this._buf[this._bufIndex++] = {id: org.id, code: org.code.slice(), parent: parent && parent.id || null, generation: org.generation};
    }

    /**
     * Creates IndexedDB database for organisms population storing
     * @return {Promise} Promise of database creation
     * @private
     */
    _createDb() {
        return new Promise((resolve, reject) => {
            const db = this._db = new Dexie('irma');
            db.version(1).stores({orgs: '&id,parent,generation'});
            try {db.orgs.clear().then(resolve).catch(reject)} catch(e) {reject(e)}
        });
    }
}

module.exports = Db;