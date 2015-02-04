/*************************************
* SANGJA PROJECT
* builder.addBlock
**************************************/

/*global THREE, SANGJA*/

(function () {
    "use strict";
    
    //가이드 블록 생성 처리
    var guideBlock = new SANGJA.core.Block({ color: SANGJA.builder.currentBlockColor, transparent: true, opacity: 0.5 });
    guideBlock.visible = false;
    SANGJA.builder.world.add(guideBlock, false);
    
    //교차점으로부터 다음 블록 위치를 결정하는 함수
    function getVoxelPosition(intersect) {
        var vector = new THREE.Vector3();
        vector.copy(intersect.point).add(intersect.face.normal);
        vector.divideScalar(SANGJA.core.Block.SIZE).floor();
        return vector;
    }
    
    function onCanvasMouseMove(event) {
        var raycaster, intersects, intersect;
        
        raycaster = SANGJA.renderer.getMouseRaycaster(event);
        
        //addBox 모드에서는 가상 평면 추가
        SANGJA.builder.world.objectList.push(SANGJA.builder.helperPlane);
        intersects = raycaster.intersectObjects(SANGJA.builder.world.objectList, true);
        SANGJA.builder.world.objectList.pop();
        
        if (intersects.length > 0) {
            guideBlock.visible = true;
            intersect = intersects[0];
            
            guideBlock.material.setValues({ color: SANGJA.builder.currentBlockColor });
            guideBlock.position.copy(SANGJA.builder.world.convertVoxelPosition(getVoxelPosition(intersect)));
        } else {
            guideBlock.visible = false;
        }
        
        SANGJA.renderer.render();
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, vector;
        
        if (event.detail.button === 0) {
            raycaster = SANGJA.renderer.getMouseRaycaster(event.detail);
            
            //addBox 모드에서는 가상 평면 추가
            SANGJA.builder.world.objectList.push(SANGJA.builder.helperPlane);
            intersects = raycaster.intersectObjects(SANGJA.builder.world.objectList, true);
            SANGJA.builder.world.objectList.pop();
            
            if (intersects.length > 0) {
                intersect = intersects[0];
                
                vector = getVoxelPosition(intersect);
                
                SANGJA.builder.world.createBlock(vector, { color: SANGJA.builder.currentBlockColor });
            }
            
            SANGJA.renderer.render();
        }
    }
    
    //TODO: 기준 평면 아래(z 좌표 음수) 처리하기
    
    //a키
    SANGJA.builder.addMode('Add', 65, {
        id: 'add',
        activate: function () {
            SANGJA.renderer.canvas.addEventListener('mousemove', onCanvasMouseMove);
            SANGJA.renderer.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
        },
        deactivate: function () {
            SANGJA.renderer.canvas.removeEventListener('mousemove', onCanvasMouseMove);
            SANGJA.renderer.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            guideBlock.visible = false;
        }
    });
}());
