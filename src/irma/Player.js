/**
 * Canvas implementation with minimum logic for drawing colored dots.
 *
 * @author zostrum
 */
const Helper = require('./../common/Helper');
const Config = require('./../Config');

class Player {
    constructor(options) {
        this._radioStations = Config.radioStations;
        this._prevButton    = this._createPrevButton();
        this._playButton    = this._createPlayButton();
        this._nextButton    = this._createNextButton();
    }

    destroy() {
        this._radioStations = null;
        this._prevButton    = null;
        this._playButton    = null;
        this._nextButton    = null;
    }

    _createPrevButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '35px',
            left: '7px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer'
        }));

        el.innerText = '«';
        el.title = 'Prev Station';
        el.onclick = this._onPrevButton.bind(this);

        return el;
    }

    _createPlayButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '35px',
            left: '34px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer'
        }));

        el.innerText = '▷';
        el.title = 'Play Music';
        el.onclick = this._onPlayButton.bind(this);

        return el;
    }

    _createNextButton() {
        const el = document.body.appendChild(Helper.setStyles('DIV', {
            position: 'absolute',
            width: '20px',
            height: '20px',
            top: '35px',
            left: '59px',
            border: '1px #FFEB3B solid',
            backgroundSize: '8px 8px',
            borderRadius: '6px',
            backgroundColor: '#FFEB3B',
            cursor: 'pointer'
        }));
        
        el.innerText = '»';
        el.title = 'Next Station';
        el.onclick = this._onNextButton.bind(this);

        return el;
    }

    _onPrevButton() {
        alert('Prev Station');
    }

    _onPlayButton() {
        alert('Playing music');
    }

    _onNextButton() {
        alert('Next Station');
    }
}

module.exports = Player;