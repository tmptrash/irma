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
        this._db           = null;
        this._promise      = this._createDb();
        this._orgBuf       = new Array(Config.DB_CHUNK_SIZE);
        this._orgBufIndex  = 0;
        this._edgeBuf      = new Array(Config.DB_CHUNK_SIZE);
        this._edgeBufIndex = 0;
    }

    destroy() {
        this._db.close(); // no promise needed
        this._db      = null;
        this._orgBuf  = null;
        this._edgeBuf = null;
        this._promise = null;
    }

    get ready() {
        return this._promise;
    }

    putOrg(org) {
        if (this._orgBufIndex >= Config.DB_CHUNK_SIZE) {
            this._db.orgs.put({orgs: this._orgBuf, edges: this._edgeBuf.slice(0, this._edgeBufIndex)});
            this._orgBufIndex  = 0;
            this._edgeBufIndex = 0;
        }
        this._orgBuf[this._orgBufIndex++] = {data: {id: org.id + '', code: org.code.slice()}};
    }

    putEdge(source, target) {
        if (this._edgeBufIndex >= Config.DB_CHUNK_SIZE) {
            this._db.orgs.put({orgs: this._orgBuf.slice(0 ,this._orgBufIndex), edges: this._edgeBuf});
            this._orgBufIndex  = 0;
            this._edgeBufIndex = 0;
        }
        this._edgeBuf[this._edgeBufIndex++] = {data: {source:  source + '', target: target + ''}};
    }

    /**
     * Creates IndexedDB database for organisms population storing
     * @return {Promise} Promise of database creation
     * @private
     */
    _createDb() {
        return new Promise((resolve, reject) => {
            const db = this._db = new Dexie('irma');
            db.version(1).stores({orgs: '++id'});
            try {db.orgs.clear().then(resolve).catch(reject)} catch(e) {reject(e)}
        });
    }
}

module.exports = Db;