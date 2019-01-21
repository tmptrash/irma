describe("common/src/share/Helper", () => {
    let Helper = require('./Helper');

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

    // it("Checking setStyles() method", () => {
    //     let testElement = null;
    //     let testStyles = {};
    //
    //     expect(Helper.setStyles(testElement, testStyles)).toEqual(null);
    // });

    it("Checking setStyles() method2", () => {
        // let testElement = "DIV";
        // let testStyles = {width: '100px', height: '100px'};
        //
        // let resultElement = '<DIV style="width: "100px", height: "100px"">';
        //
        // expect(Helper.setStyles(testElement, testStyles)).toContainElement('DIV');

        // var dummyElement = document.createElement('div');;
        // spyOn(document, "createElement").and.returnValue(dummyElement);

        let myObject = {};
        spyOn(document, "createElement").and.returnValue(myObject);
    });

    it("Checking id() method", () => {
        expect(Helper.id()).toEqual(1);
    });

    it("Checking probIndex() method", () => {
        expect(Helper.probIndex([1])).toEqual(0);
    });
    it("Checking probIndex() method 2", () => {
        let zero = 0;
        let one = 0;

        for (let i = 0; i < 5000000; i++) {
            if (Helper.probIndex([2, 4]) === 0) {
                zero++;
            } else {
                one++;
            }
        }
        expect(Math.round(one / zero)).toEqual(2);
    });

    it("Checking probIndex() method 3", () => {
        expect(Helper.probIndex([])).toEqual(-1);
    });

    it("Checking probIndex() method 4", () => {
        expect(Helper.probIndex([0])).toEqual(-1);
    });
})
