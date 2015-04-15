/*************************************
* SANGJA PROJECT
* api.union
**************************************/

/*global THREE, SANGJA, API*/

(function () {
    "use strict";
    
    API.union = {
        getObjectByName: undefined,
        setPosition: undefined,
        moveDelta: undefined,
        checkCollision: undefined,

        setVariable: undefined,
        getVariable: undefined
    };
    
    //API 함수 선언
    //============
    
    API.union.getObjectByName = function (str) {
        var i, j, k, split, current = [SANGJA.player.world], next, nameList;
        
        split = str.split('.');
        
        for (i = 0; i < split.length; i += 1) {
            next = [];
            for (j = 0; j < current.length; j += 1) {
                nameList = current[j].nameList[split[i]];
                if (nameList !== undefined) {
                    for (k = 0; k < nameList.length; k += 1) {
                        next.push(nameList[k]);
                    }
                }
            }
            
            current = next;
        }
        
        return current;
    };
    
    API.union.setPosition = function (unionList, x, y, z) {
        var i;
        for (i = 0; i < unionList.length; i += 1) {
            unionList[i].position.copy(SANGJA.core.voxelToThree(new THREE.Vector3(x, y, z)));
        }
        
        SANGJA.renderer.render();
    };
    
    API.union.moveDelta = function (unionList, x, y, z) {
        var i;
        for (i = 0; i < unionList.length; i += 1) {
            unionList[i].position.add(SANGJA.core.voxelToThree(new THREE.Vector3(x, y, z)));
        }
        
        SANGJA.renderer.render();
    };
    
    API.union.checkCollision = function (unionList, targetList) {
        var i, j;
        for (i = 0; i < unionList.length; i += 1) {
            for (j = 0; j < targetList.length; j += 1) {
                if (unionList[i].getBoundingBox().isIntersectionBox(targetList[j].getBoundingBox())) {
                    return true;
                }
            }
        }
        
        return false;
    };
    
    
    API.union.setVariable = function (unionList, name, value) {
        var i;
        for (i = 0; i < unionList.length; i += 1) {
            unionList[i].storage[name] = value;
        }
    };
    
    API.union.getVariable = function (unionList, name) {
        return unionList[0].storage[name];
    };
}());