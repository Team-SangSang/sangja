/*************************************
* SANGJA PROJECT
* API module
**************************************/

/*global SANGJA*/

var API = {};

(function () {
    "use strict";
    
    API.event = {
        tick: undefined,
        keyboard: undefined,
        hitTest: undefined
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
    
    API.event.hitTest = function (union, target, func) {
        setInterval(function () {
            var i, j, unionList, targetList, unionBox, targetBox;
            
            unionList = typeof union === 'string' ? API.union.getObjectByName(union) : union;
            targetList = typeof target === 'string' ? API.union.getObjectByName(target) : target;
            
            for (i = 0; i < unionList.length; i += 1) {
                unionBox = unionList[i].getBoundingBox().translate(unionList[i].getWorldPosition());
                for (j = 0; j < targetList.length; j += 1) {
                    targetBox = targetList[j].getBoundingBox().translate(targetList[j].getWorldPosition());
                    
                    if (unionBox.isIntersectionBox(targetBox)) {
                        func([unionList[i]], [targetList[j]]);
                    }
                }
            }
        }, 1000 / SANGJA.player.DEFAULT_FPS);
    };
}());