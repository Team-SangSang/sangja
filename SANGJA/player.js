/*************************************
* SANGJA PROJECT
* builder module
**************************************/

/*global $, THREE, SANGJA*/


(function () {
    "use strict";
    
    SANGJA.player = {
        //Property
        world: undefined
    };
    
    //초기화 시작
    //=========
    
    SANGJA.player.world = SANGJA.parser.jsonToUnion(sessionStorage.world);
    
    SANGJA.renderer.scene.add(SANGJA.player.world);
    
    SANGJA.renderer.render();
}());
