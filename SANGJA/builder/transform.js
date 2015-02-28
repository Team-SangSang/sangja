/*global $, THREE, SANGJA*/

(function () {
    "use strict";
    
    var SELECT_NONE_ID = 'transform-none',
        SELECTED_ID = 'transform-selected',
        
        selected;
    
    function blurBlocks(val) {
        var i, block;
        
        SANGJA.builder.world.traverseBlock(function (block) {
            block.setOpacity(val ? 0.5 : 1.0);
        }, false);
    }
    
    function resetSelection() {
        if (selected) {
            selected.setOpacity(1.0);
            selected.ascendTo(SANGJA.builder.world).hideGuideBox();
            selected.ascendTo(SANGJA.builder.world).hideGizmo();
            selected = undefined;
        }
    }
    
    function displayMenu() {
        var selectNone = $('#' + SELECT_NONE_ID),
            selectUnion = $('#' + SELECTED_ID);
        
        $('#toolmenu-transform > div').css('display', 'none');
        
        if (selected) {
            selectUnion.css('display', '');
        } else {
            selectNone.css('display', '');
        }
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect, union, vector;
        
        if (event.detail.button === 0) {
            raycaster = SANGJA.renderer.getMouseRaycaster(event.detail);
            
            if (selected) {
                SANGJA.builder.world.blockList.push(SANGJA.builder.helperPlane);
                intersects = raycaster.intersectObjects(SANGJA.builder.world.blockList);
                SANGJA.builder.world.blockList.pop();
                
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    union = selected.ascendTo(SANGJA.builder.world);
                    
                    if (event.detail.ctrlKey) {
                        SANGJA.builder.world.add(union.clone());
                        SANGJA.builder.updateHierarchy();
                    }
                    
                    vector = SANGJA.builder.getVoxelPosition(intersect);
                    vector.sub(SANGJA.core.threeToVoxel(selected.localToWorld(new THREE.Vector3())));
                    
                    union.position.add(SANGJA.core.voxelToThree(vector));
                    
                    resetSelection();
                }
            } else {
                //선택된 유니온이 없을 경우 새롭게 선택
                intersects = raycaster.intersectObjects(SANGJA.builder.world.unionList, true);
                
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    intersect.object.ascendTo(SANGJA.builder.world).showGuideBox(0x0000FF);
                    intersect.object.ascendTo(SANGJA.builder.world).showGizmo();
                    selected = intersect.object;
                    
                    selected.setOpacity(0.7);
                }
            }
        } else if (event.detail.button === 2) {
            resetSelection();
        }
        
        displayMenu();
        SANGJA.renderer.render();
    }
    
    //f키
    SANGJA.builder.addMode('Transform', 70, {
        id: 'transform',
        activate: function () {
            blurBlocks(true);
            SANGJA.renderer.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            displayMenu();
            SANGJA.renderer.render();
        },
        deactivate: function () {
            blurBlocks(false);
            resetSelection();
            SANGJA.renderer.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            SANGJA.renderer.render();
        }
    }, './SANGJA/builder/transform.html', function () {
        $('#transform-selected-form').submit(false);
        
        $('#transform-move-x-plus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.x += SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        $('#transform-move-x-minus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.x -= SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        $('#transform-move-y-plus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.y += SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        $('#transform-move-y-minus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.y -= SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        $('#transform-move-z-plus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.z += SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        $('#transform-move-z-minus').click(function () {
            selected.ascendTo(SANGJA.builder.world).position.z -= SANGJA.core.Block.SIZE;
            SANGJA.renderer.render();
        });
        
        function rotateTarget(matrix) {
            selected.ascendTo(SANGJA.builder.world).relativeLinearTransform(matrix);
            SANGJA.renderer.render();
        }
        
        $('#transform-rotate-x-cw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(1, 0, 0, 0, 0, 1, 0, -1, 0);
            rotateTarget(matrix);
        });
        
        $('#transform-rotate-x-ccw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(1, 0, 0, 0, 0, -1, 0, 1, 0);
            rotateTarget(matrix);
        });
        
        $('#transform-rotate-y-cw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(0, 0, -1, 0, 1, 0, 1, 0, 0);
            rotateTarget(matrix);
        });
        
        $('#transform-rotate-y-ccw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(0, 0, 1, 0, 1, 0, -1, 0, 0);
            rotateTarget(matrix);
        });
        
        $('#transform-rotate-z-cw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(0, 1, 0, -1, 0, 0, 0, 0, 1);
            rotateTarget(matrix);
        });
        
        $('#transform-rotate-z-ccw').click(function () {
            var matrix = new THREE.Matrix3();
            matrix.set(0, -1, 0, 1, 0, 0, 0, 0, 1);
            rotateTarget(matrix);
        });
    });
}());
