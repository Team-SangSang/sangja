/*************************************
* SANGJA PROJECT
* player module
**************************************/

/*global $, THREE, SANGJA*/
/*jslint evil: true*/

(function () {
    "use strict";
    
    SANGJA.player = {
        //Constant
        DEFAULT_FPS: 30,
        
        //Property
        world: undefined
    };
    
    //초기화 시작
    //=========
    
    function playerInit(union) {
        var i, j, next, split;
        
        union.nameList = {};
        union.storage = {};
        
        for (i = 0; i < union.unionList.length; i += 1) {
            next = union.unionList[i];
            playerInit(next);
            
            split = next.name.split(' ');
            for (j = 0; j < split.length; j += 1) {
                if (union.nameList[split[j]] === undefined) {
                    union.nameList[split[j]] = [];
                }
                union.nameList[split[j]].push(next);
            }
        }
        
        for (i = 0; i < union.scriptList.length; i += 1) {
            eval('(' + union.scriptList[i] + ')')([union]);
        }
    }
    
    if (SANGJA.core.isLocal()) {
        SANGJA.player.world = SANGJA.parser.jsonToUnion(sessionStorage.world);
        playerInit(SANGJA.player.world);

        SANGJA.renderer.scene.add(SANGJA.player.world);
        SANGJA.renderer.render();
    } else {
        $.ajax({
            method: 'GET',
            cache: false,
            url: '/app/import/' + location.search.split('?')[1],
            dataType: 'json',
            success: function (response) {
                SANGJA.player.world = SANGJA.parser.jsonToUnion(response.content);
                playerInit(SANGJA.player.world);

                SANGJA.renderer.scene.add(SANGJA.player.world);
                SANGJA.renderer.render();
            }
        });
    }
}());
