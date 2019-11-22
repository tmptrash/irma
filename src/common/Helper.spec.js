/* eslint-disable global-require */
describe("src/share/Helper", () => {
    const Helper = require('./Helper');

    beforeEach(function() {
        const newElement = {style: {}}
        global.document = {
            createElement: () => newElement
        }
    });

    afterEach(function() {
        delete global.document;
    });

    describe('Checks randomizer', () => {
        it("Checking rand(2)", () => {
            const val = Helper.rand(2);
            expect(val === 0 || val === 1).toBe(true);
        });

        it("Checking rand(0)", () => {
            expect(Helper.rand(0)).toBe(0);
        });

        it("Checking rand(1)", () => {
            expect(Helper.rand(1)).toBe(0);
        });
    });

    describe('Checks adding styles to HTML elements', () => {
        it("Checking setStyles() method", () => {
            let testElement = null;
            let testStyles = {};
            expect(Helper.setStyles(testElement, testStyles)).toBeNull();
        })

        it("Checking setStyles() method2", () => {
            let testElement = "DIV";
            let testStyles = {
                position: 'absolute',
                width: '20px',
                height: '20px',
                top: '7px'
            }

            expect(Helper.setStyles(testElement, testStyles).style).toEqual(testStyles);
        });

        it("Checking setStyles() method3", () => {
            let testElement = {style: {}}
            let testStyles = {top: '7px'};
            let resultElement = {top: '7px'};

            expect(Helper.setStyles(testElement, testStyles).style).toEqual(resultElement);
        });
    });

    describe('Checks generating ids', () => {
        it("Checking id() method", () => {
            expect(Helper.id()).toBe(1);
            expect(Helper.id()).toBe(2);
            expect(Helper.id()).toBe(3);
            expect(Helper.id()).toBe(4);
            expect(Helper.id()).toBe(5);
        });
    });
})
