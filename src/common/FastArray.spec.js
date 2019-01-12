describe('src/common/FastArray', () => {
    const FastArray = require('./FastArray');
    const size      = 10;
    let   fa;

    beforeEach(() => {fa = new FastArray(size)});
    afterEach (() => {fa.destroy(); fa = null});

    it('Checking creation', () => {
        expect(fa.size).toBe(size);
        expect(fa.items).toBe(0);
        expect(fa.freeIndex).toBe(size - 1);
        expect(fa.added()).toBe(undefined);
    });

    it('Checking destroy', () => {
        const fSize = 3;
        const fa1   = new FastArray(fSize);
        expect(fa1.size).toBe(fSize);
        fa1.destroy();
        expect(fa1.items <= 0).toBe(true);
        expect(fa1.size).toBe(null);
        fa1.add({});
        expect(fa1.items <= 0).toBe(true);
    });

    it('Checking length getter', () => {
        expect(fa.items).toBe(0);
        fa.add({});
        expect(fa.items).toBe(1);
        fa.get(size - 1);
        expect(fa.items).toBe(1);
        fa.del(size - 1);
        expect(fa.items).toBe(0);
        fa.resize(size * 2);
        expect(fa.items).toBe(0);
        fa.add({});
        expect(fa.items).toBe(1);
        fa.resize(size);
        expect(fa.items).toBe(0);
        fa.add({});
        fa.add({});
        expect(fa.items).toBe(2);
        fa.del(size - 1);
        fa.del(size - 2);
        expect(fa.items).toBe(0);
    });

    it('Checking size getter', () => {
        expect(fa.size).toBe(size);
        fa.add({});
        expect(fa.size).toBe(size);
        fa.del(size - 1);
        expect(fa.size).toBe(size);

        for (let i = 0; i < size; i++) {fa.add({})}
        expect(fa.size).toBe(size);
        fa.add([]);
        expect(fa.size).toBe(size);

        fa.resize(size - 1);
        expect(fa.size).toBe(size - 1);
    });

    it('Checking freeIndex getter', () => {
        fa.add({});
        expect(fa.freeIndex).toBe(size - 2);
        fa.del(size - 1);
        expect(fa.freeIndex).toBe(size - 1);
        for (let i = 0; i < size; i++) {fa.add({})}
        expect(fa.freeIndex).toBe(undefined);
        fa.del(size - 1);
        expect(fa.freeIndex).toBe(size - 1);
    });

    it('Checking add() and full() methods', () => {
        const obj = {};
        fa.add(obj);
        expect(fa.items).toBe(1);
        expect(fa.added()).toBe(obj);
        fa.del(size - 1);
        expect(fa.get(size - 1)).toBe(null);

        for (let i = 0; i < size; i++) {fa.add({})}
        expect(fa.items).toBe(size);
        expect(fa.full).toBe(true);
        const obj1 = {};

        fa.add(obj1);
        expect(fa.full).toBe(true);
        expect(fa.items).toBe(size);
        expect(fa.added()).not.toBe(obj1);
    });

    it('Checking get() method', () => {
        const obj = {};
        expect(fa.get(size - 1)).toBe(null);
        expect(fa.get(size - 1)).toBe(null);
        fa.add(obj);
        expect(fa.get(size - 1)).toBe(obj);
        expect(fa.get(size - 1)).toBe(obj);
        fa.del(size - 1);
        expect(fa.get(size - 1)).toBe(null);
        fa.add(obj);
        expect(fa.get(size - 1)).toBe(obj);
        fa.resize(size - 1);
        expect(fa.get(size - 1)).toBe(undefined);
    });

    it('Checking del() method', () => {
        const obj = {};
        fa.add(obj);
        expect(fa.added()).toBe(obj);
        fa.del(size - 1);
        expect(fa.added()).toBe(undefined);
        fa.del(size - 1);
        expect(fa.added()).toBe(undefined);
        fa.del(size);
        expect(fa.added()).toBe(undefined);
    });

    it('Checking added() method', () => {
        const obj = {};
        expect(fa.added()).toBe(undefined);
        fa.add(obj);
        expect(fa.added()).toBe(obj);
        expect(fa.added()).toBe(obj);
        fa.del(size - 1);
        expect(fa.added()).toBe(undefined);
        fa.add(obj);
        expect(fa.added()).toBe(obj);
        fa.resize(size + 1);
        expect(fa.added()).toBe(obj);
    });

    it('Checking resize() method', () => {
        const obj = {};
        fa.add(obj);
        expect(fa.added()).toBe(obj);
        expect(fa.items).toBe(1);
        fa.resize(size + 1);
        expect(fa.added()).toBe(obj);
        expect(fa.items).toBe(1);
        expect(fa.size).toBe(size + 1);
    });

    it('Checking resize() method with wrong size', () => {
        const obj = {};
        fa.add(obj);
        expect(fa.added()).toBe(obj);
        expect(fa.items).toBe(1);
        fa.resize(-1);
        expect(fa.items).toBe(1);
        expect(fa.size).toBe(size);
        expect(fa.added()).toBe(obj);
        fa.resize(0);
        expect(fa.items).toBe(1);
        expect(fa.size).toBe(size);
        expect(fa.added()).toBe(obj);
    });

    it('Checking loop through array items', () => {
        let sum = 0;
        for (let i = 0; i < size; i++) {
            sum += i;
            fa.add(i);
        }
        expect(fa.items).toBe(size);

        let sum1 = 0;
        for (let i = 0; i < size; i++) {
            sum1 += fa.get(i)
        }
        expect(sum).toBe(sum1);
    });

    it('Checking loop through array items with add/remove items', () => {
        for (let i = 0; i < size; i++) {fa.add(i)}
        expect(fa.items).toBe(size);

        for (let i = 0; i < size; i++) {
            fa.del(i);
            fa.add(i);
            expect(fa.get(i)).toBe(i);
        }
        expect(fa.items).toBe(size);
    });
});