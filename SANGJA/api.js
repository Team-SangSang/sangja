/*************************************
* SANGJA PROJECT
* API module
**************************************/

var API = {};

(function () {
    "use strict";
    
    API.event = {
        tick: undefined,
        keyboard: undefined
    };
    
    var keyboardList = [];

    API.event.tick = function (time, func) {
        setInterval(func, time);
    };

    API.event.keyboard = function (key, func) {
        document.addEventListener('keydown', function (event) {
            if (event.keyCode === key) {
                func();
            }
        });
    };
}());