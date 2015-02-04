/*************************************
* SANGJA PROJECT
* builder module
**************************************/

/*global $, THREE, FileReader, SANGJA*/


(function () {
    "use strict";
    
    SANGJA.builder = {
        //Property
        currentBlockColor: 0xFFFFFF,
        currentMode: undefined,
        world: new SANGJA.core.Union(),
        helperPlane: undefined,
        
        //Method
        addMode: undefined,
        updateHierarchy: undefined,
        getVoxelPosition: undefined,
        download: undefined
    };
    
    //초기화 시작
    //==========
    
    var GRID_COUNT = 15,
        
        EXPORT_SCENE_ID = 'tool-export-scene',
        IMPORT_SCENE_ID = 'tool-import-scene',
        IMPORT_UNION_ID = 'tool-import-union',
        RUN_PLAYER_ID = 'run-player',
        
        helperPlane,
        helperGuide,
        sceneImporter,
        unionImporter;
    
    //편집 중인 새로운 월드 추가
    SANGJA.builder.world.name = 'World';
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
            
            if (event.keyCode === key && (activeObj === null || activeObj.getAttribute('type') !== 'text')) {
                toolButton.click();
            }
        });
        
        //활성화된 모드가 없을 경우 초기화
        if (SANGJA.builder.currentMode === undefined) {
            toolButton.click();
        }
    };
    
    function hierarchyHtml(union) {
        var i, next, list = $('<ul>'), item = $('<li>');
        
        if (union.name && union.name !== '') {
            item.text(union.name).addClass('named');
        } else {
            item.text('Unnamed').addClass('unnamed');
        }
        
        for (i = 0; i < union.unionList.length; i += 1) {
            next = union.unionList[i];
            
            list.append(hierarchyHtml(next));
        }
        item.append(list);
        
        return item;
    }
    
    SANGJA.builder.updateHierarchy = function () {
        $('#tool-hierarchy').html($('<ul>').addClass('tree').append(hierarchyHtml(SANGJA.builder.world)));
    };
    
    SANGJA.builder.updateHierarchy();
    
    
    
    //교차점으로부터 다음 블록 위치를 결정하는 함수
    SANGJA.builder.getVoxelPosition = function (intersect) {
        var vector = new THREE.Vector3();
        vector.copy(intersect.point).add(intersect.face.normal);
        vector.divideScalar(SANGJA.core.Block.SIZE).floor();
        return vector;
    };
    
    //Import / Export 관련
    //====================
    
    sceneImporter = new FileReader();
    
    sceneImporter.onload = function (e) {
        var str, world;
        
        str = e.target.result;
        
        world = SANGJA.parser.jsonToUnion(str);
        
        SANGJA.renderer.scene.remove(SANGJA.builder.world);
        SANGJA.builder.world = world;
        SANGJA.renderer.scene.add(world);
        
        SANGJA.renderer.render();
        SANGJA.builder.updateHierarchy();
    };
    
    unionImporter = new FileReader();
    
    unionImporter.onload = function (e) {
        var str, union;
        
        str = e.target.result;
        union = SANGJA.parser.jsonToUnion(str);
        
        SANGJA.builder.world.add(union);
        
        SANGJA.renderer.render();
        SANGJA.builder.updateHierarchy();
    };
    
    $('#' + EXPORT_SCENE_ID).click(function () {
        SANGJA.parser.download(SANGJA.parser.unionToJson(SANGJA.builder.world), 'scene.world', 'text/plain');
    });
    
    $('#' + IMPORT_SCENE_ID).change(function () {
        sceneImporter.readAsText(this.files[0]);
        $(this).val('');
    });
    
    $('#' + IMPORT_UNION_ID).change(function () {
        unionImporter.readAsText(this.files[0]);
        $(this).val('');
    });
    
    //플레이어 실행
    //===========
    
    $('#' + RUN_PLAYER_ID).click(function () {
        sessionStorage.world = SANGJA.parser.unionToJson(SANGJA.builder.world);
        window.location.href = 'player.html';
    });
}());
