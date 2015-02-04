/*************************************
* SANGJA PROJECT
* builder module
**************************************/

/*global $, THREE, SANGJA*/


(function () {
    "use strict";
    
    SANGJA.builder = {
        //Property
        currentBlockColor: 0xFFFFFF,
        currentMode: undefined,
        world: new SANGJA.core.Union(),
        helperPlane: undefined,
        
        //Method
        addMode: undefined
    };
    
    //초기화 시작
    //==========
    
    var GRID_COUNT = 15,
        
        helperPlane,
        helperGuide;
    
    //편집 중인 새로운 월드 추가
    SANGJA.renderer.scene.add(SANGJA.builder.world);
        
    //보조선
    helperGuide = new THREE.GridHelper(GRID_COUNT * SANGJA.core.Block.SIZE, SANGJA.core.Block.SIZE);
    SANGJA.renderer.scene.add(helperGuide);
    
    //가이드 평면 추가
    helperPlane = new THREE.PlaneBufferGeometry(GRID_COUNT * SANGJA.core.Block.SIZE * 2, GRID_COUNT * SANGJA.core.Block.SIZE * 2);
    helperPlane.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    helperPlane = new THREE.Mesh(helperPlane);
    helperPlane.visible = false;
    SANGJA.renderer.scene.add(helperPlane);
    
    SANGJA.builder.helperPlane = helperPlane;
    
    //색상 선택기 이벤트
    $('#color-picker').on('change.spectrum', function (event, tinycolor) {
        SANGJA.builder.currentBlockColor = parseInt(tinycolor.toHex(), 16);
        SANGJA.renderer.render();
    });
    
    //BlockBuilder 모드 추가 함수
    SANGJA.builder.addMode = function (label, key, mode, url, callback) {
        var DEFAULT_HTML = 'No menu for this tool', buttonId, menuId, toolButton;
        
        buttonId = 'toolbox-' + mode.id;
        menuId = 'toolmenu-' + mode.id;
        
        $('#toolbox').append('<label id="' + buttonId + '" class="btn btn-default navbar-btn"><input type="radio" name="options">' + label + '</label>');
        $('#tool-menu').append('<div id="' + menuId + '"></div>');
        $('#' + menuId).css('display', 'none');
        
        if (url === undefined) {
            $('#' + menuId).html(DEFAULT_HTML);
        } else {
            $('#' + menuId).load(url, callback);
        }
        
        //모드 변경 처리
        toolButton = document.getElementById(buttonId);
        
        toolButton.addEventListener('click', function () {
            if (SANGJA.builder.currentMode !== undefined) {
                $('#toolmenu-' + SANGJA.builder.currentMode.id).css('display', 'none');
                SANGJA.builder.currentMode.deactivate();
            }
            
            SANGJA.builder.currentMode = mode;
            
            $('#toolmenu-' + mode.id).css('display', '');
            mode.activate();
            
            SANGJA.renderer.render();
        });
        
        document.addEventListener('keydown', function (event) {
            var activeObj = document.activeElement;
            
            if (event.keyCode === key && (activeObj === null || activeObj.tagName === "BODY")) {
                toolButton.click();
            }
        });
        
        //활성화된 모드가 없을 경우 초기화
        if (SANGJA.builder.currentMode === undefined) {
            toolButton.click();
        }
    };
}());
