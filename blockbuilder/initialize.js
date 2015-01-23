/*************************************
* SANGJA PROJECT
* module.blockbuilder
**************************************/

/*global $, THREE*/

//블록 빌더 초기화
var BlockBuilder = {
    BLOCK_SIZE: 10,
    currentBlockColor: 0xFFFFFF,
    
    util: {} //utility functions
};

(function () {
    "use strict";
    
    BlockBuilder.blockGeometry = new THREE.BoxGeometry(BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE);
    
    Array.prototype.findAndRemove = function (target) {
        var index = this.indexOf(target);
        
        if (index !== -1) {
            this.splice(index, 1);
        }
        
        return index;
    };
    
    //블록 클래스
    BlockBuilder.Block = (function () {
        function Block(setting) {
            THREE.Mesh.call(this, BlockBuilder.blockGeometry, new THREE.MeshLambertMaterial(setting));
            
            this.type = 'Block';
        }
        
        Block.prototype = Object.create(THREE.Mesh.prototype);
        Block.prototype.constructor = Block;
        
        return Block;
    }());
    
    //유니온 클래스
    BlockBuilder.Union = (function () {
        function Union() {
            THREE.Object3D.call(this);
            
            this.type = 'Union';
            
            this.objectList = []; //blocks + unions
            this.blockList = []; //only blocks
        }
        
        Union.prototype = Object.create(THREE.Object3D.prototype);
        Union.prototype.constructor = Union;
        
        Union.prototype.convertVoxelPosition = function (vector) {
            var result = new THREE.Vector3().copy(vector);
            result.multiplyScalar(BlockBuilder.BLOCK_SIZE).addScalar(BlockBuilder.BLOCK_SIZE * 0.5);
            
            return result;
        };
        
        Union.prototype.createBlock = function (vector, setting) {
            var block = new BlockBuilder.Block(setting);
            
            block.position.copy(this.convertVoxelPosition(vector));
            
            this.objectList.push(block);
            this.blockList.push(block);
            
            this.add(block);
        };
        
        Union.prototype.removeBlock = function (block) {
            this.objectList.findAndRemove(block);
            this.blockList.findAndRemove(block);
            
            this.remove(block);
        };
        
        //TODO clone 구현
        
        return Union;
    }());
    
    //가이드 외곽선 관련 메서드 추가
    THREE.Mesh.prototype.showGuideEdge = function (color) {
        if (this.guideEdge === undefined) {
            this.guideEdge = new THREE.EdgesHelper(this.clone());
            this.guideEdge.position.copy(new THREE.Vector3());
            this.guideEdge.updateMatrix();
            this.add(this.guideEdge);
        }
        this.guideEdge.material.setValues({ color: color });
        this.guideEdge.visible = true;
    };
    
    THREE.Mesh.prototype.hideGuideEdge = function () {
        if (this.guideEdge !== undefined) {
            this.guideEdge.visible = false;
        }
    };
    
    //상수 선언
    var ANTIALIAS = true,
        GRID_COUNT = 15,
        
        CANVAS_BACKGROUND_COLOR = 0xF0F0F0,
        
        CLICK_WITHOUT_MOVE_TOLERANCE = 5,
        
        //사용자 UI 관련
        canvas = document.getElementById('canvas'),
        canvasX,
        canvasY,
        
        //3D 관련
        scene,
        camera,
        renderer,
        controls,
        
        //마우스 이벤트 처리 관련
        lastMouseDown;
    
    //초기화 관련 함수 선언
    //==================
    
    function createStage() {
        var guideGrid,
            ambientLight,
            directionalLight,
            
            planeGeometry,
            plane;
        
        //3D UI 초기화
        scene = new THREE.Scene();
        
        renderer = new THREE.WebGLRenderer({ antialias: ANTIALIAS });
        renderer.setClearColor(CANVAS_BACKGROUND_COLOR);
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        
        canvas.appendChild(renderer.domElement);
        
        camera = new THREE.PerspectiveCamera(40, canvas.offsetWidth / canvas.offsetHeight, 1, 20000);
        camera.position.set(100, 100, 100);
        camera.lookAt(new THREE.Vector3());
        scene.add(camera);
        
        controls = new THREE.OrbitControls(camera, canvas);
        
        //보조선
        guideGrid = new THREE.GridHelper(GRID_COUNT * BlockBuilder.BLOCK_SIZE, BlockBuilder.BLOCK_SIZE);
        scene.add(guideGrid);
        
        //광원
        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(-1, -0.75, -0.5).normalize();
        scene.add(directionalLight);
        
        //가상 평면(기준면)
        planeGeometry = new THREE.PlaneBufferGeometry(GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2, GRID_COUNT * BlockBuilder.BLOCK_SIZE * 2);
        planeGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
        plane = new THREE.Mesh(planeGeometry);
        plane.visible = false;
        scene.add(plane);
        
        BlockBuilder.plane = plane;
    }
    
    function render() {
        renderer.render(scene, camera);
    }
    
    function initialize() {
        createStage();
        
        $('#color-picker').on('change.spectrum', function (event, tinycolor) {
            BlockBuilder.currentBlockColor = parseInt(tinycolor.toHex(), 16);
            render();
        });
        controls.addEventListener('change', render);
    }
    
    function animate() {
        window.requestAnimationFrame(animate);
        controls.update();
    }
    
    //기타 초기화
    //=========
    
    //화면 리사이즈 핸들링
    function onWindowResize() {
        var canvasPosition = $('#canvas').offset();
        
        canvasX = canvasPosition.left;
        canvasY = canvasPosition.top;
        
        renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
        camera.updateProjectionMatrix();
        
        render();
    }
    
    window.addEventListener('resize', onWindowResize);
    
    //같은 자리에서 클릭 이벤트 구현
    function onCanvasMouseDown(event) {
        lastMouseDown = event;
    }
    
    function onCanvasMouseUp(event) {
        var diffX, diffY, customEvent;
        
        if (lastMouseDown !== null) {
            diffX = lastMouseDown.clientX - event.clientX;
            diffY = lastMouseDown.clientY - event.clientY;
            
            if (Math.abs(diffX) < CLICK_WITHOUT_MOVE_TOLERANCE && Math.abs(diffY) < CLICK_WITHOUT_MOVE_TOLERANCE && lastMouseDown.button === event.button) {
                customEvent = new window.CustomEvent('clickWithoutMove', {
                    detail: {
                        clientX: event.clientX,
                        clientY: event.clientY,
                        pageX: event.pageX,
                        pageY: event.pageY,
                        ctrlKey: event.ctrlKey,
                        shiftKey: event.shiftKey,
                        altKey: event.altKey,
                        button: event.button
                    }
                });
                canvas.dispatchEvent(customEvent);
            }
        }
    }
    
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    
    //초기화 함수 호출
    //=============
    
    initialize();
    onWindowResize();
    render();
    animate();
    
    //BlockBuilder 초기화
    //==================
    
    BlockBuilder.canvas = canvas;
    BlockBuilder.render = render;
    
    BlockBuilder.world = new BlockBuilder.Union();
    scene.add(BlockBuilder.world);
    
    BlockBuilder.currentMode = null;
    
    //BlockBuilder 모드 추가 함수
    BlockBuilder.addMode = function (label, key, mode, html) {
        var DEFAULT_HTML = 'No menu for this tool', buttonId, menuId, toolButton;
        
        html = html === undefined ? DEFAULT_HTML : html;
        
        buttonId = 'toolbox-' + mode.id;
        menuId = 'toolmenu-' + mode.id;
        
        $('#toolbox').append('<label id="' + buttonId + '" class="btn btn-default navbar-btn"><input type="radio" name="options">' + label + '</label>');
        $('#tool-menu').append('<div id="' + menuId + '">' + html + '</div>');
        $('#' + menuId).css('display', 'none');
        
        //모드 변경 처리
        toolButton = document.getElementById(buttonId);
        
        toolButton.addEventListener('click', function () {
            if (BlockBuilder.currentMode !== null) {
                $('#toolmenu-' + BlockBuilder.currentMode.id).css('display', 'none');
                BlockBuilder.currentMode.deactivate();
            }
            
            BlockBuilder.currentMode = mode;
            
            $('#toolmenu-' + mode.id).css('display', '');
            mode.activate();
            
            render();
        });
        
        document.addEventListener('keydown', function (event) {
            if (event.keyCode === key) {
                toolButton.click();
            }
        });
        
        //활성화된 모드가 없을 경우 초기화
        if (BlockBuilder.currentMode === null) {
            toolButton.click();
        }
    };
    
    //유틸리티 함수 추가
    //================
    
    //마우스 이벤트에서 RayCaster 가져오는 함수
    BlockBuilder.util.getMouseRaycaster = function (event) {
        var mouse3D, raycaster;
        
        mouse3D = new THREE.Vector3(
            ((event.clientX - canvasX) / canvas.offsetWidth) * 2 - 1,
            -((event.clientY - canvasY) / canvas.offsetHeight) * 2 + 1,
            0.5
        );
        mouse3D.unproject(camera);
        
        raycaster = new THREE.Raycaster(camera.position, mouse3D.sub(camera.position).normalize());
        
        return raycaster;
    };
}());
