/*************************************
* SANGJA PROJECT
* api.keyboard
**************************************/

/*global API*/

(function () {
    "use strict";
    
    API.keyboard = {
        //Properties
        keyStatus: {},
        
        //Method
        keyCodeToText: undefined,
        isDown: undefined
    };
    
    API.keyboard.keyCodeToText = function (keyCode) {
        if (keyCode === 13) {
            return 'Enter';
        } else if (keyCode === 16) {
            return 'Shift';
        } else if (keyCode === 17) {
            return 'Ctrl';
        } else if (keyCode === 18) {
            return 'Alt';
        } else if (keyCode === 32) {
            return 'Space';
        } else if (keyCode === 37) {
            return 'Left Arrow';
        } else if (keyCode === 38) {
            return 'Up Arrow';
        } else if (keyCode === 39) {
            return 'Right Arrow';
        } else if (keyCode === 40) {
            return 'Down Arrow';
        } else if (48 <= keyCode && keyCode <= 90) {
            return String.fromCharCode('0'.charCodeAt() + keyCode - 48);
        } else {
            return 'Unknown';
        }
    };
    
    API.keyboard.isDown = function (keyCode) {
        return !!API.keyboard.keyStatus[keyCode];
    };
    
    document.addEventListener('keydown', function (event) {
        API.keyboard.keyStatus[event.keyCode] = true;
    });
    
    document.addEventListener('keyup', function (event) {
        API.keyboard.keyStatus[event.keyCode] = false;
    });
}());