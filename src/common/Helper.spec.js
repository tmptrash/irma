describe("src/share/Helper", () => {
    let Helper = require('./Helper');

    beforeEach(function() {
        let newElement = {
            style : {}
        }
        global.document = {
            createElement: function () {
                return newElement;
            }
        };
    });

    afterEach(function() {
        delete global.document;
    });

    it("Checking rand(2)", () => {
        let val = Helper.rand(2);
        expect(val === 0 || val === 1).toEqual(true);
    });
    it("Checking rand(0)", () => {
        expect(Helper.rand(0)).toEqual(0);
    });
    it("Checking rand(1)", () => {
        expect(Helper.rand(1)).toEqual(0);
    });

    it("Checking setStyles() method", () => {
        let testElement = null;
        let testStyles = {};

        expect(Helper.setStyles(testElement, testStyles)).toBeNull();
    });

    it("Checking setStyles() method2", () => {
        let testElement = "DIV";
        let testStyles = {
                            position       : 'absolute',
                            width          : '20px',
                            height         : '20px',
                            top            : '7px'
                        };

        let resultElement = {position: 'absolute', width: '20px', height: '20px', top: '7px'};

        expect(Helper.setStyles(testElement, testStyles).style).toEqual(resultElement);
    });



    it("Checking setStyles() method3", () => {
        let testElement = {
            style : {}
        }
        let testStyles = {
                            top: '7px'
                         };

        let resultElement = {top: '7px'};

        expect(Helper.setStyles(testElement, testStyles).style).toEqual(resultElement);
    });

    it("Checking id() method", () => {
        expect(Helper.id()).toEqual(1);
    });
})
