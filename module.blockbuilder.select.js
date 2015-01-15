/*global THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var BLOCK_SELECTION_OUTLINE_COLOR = 0x00FF00,
        
        selectedBlocks = [],
        selectionGuides = [],
        selectionEdgeGuide;
    
    selectionEdgeGuide =  new THREE.EdgesHelper(new THREE.Mesh(BlockBuilder.blockGeometry));
    selectionEdgeGuide.material.setValues({ color: BLOCK_SELECTION_OUTLINE_COLOR });
    
    function deselectAll() {
        var index;
        
        while (selectedBlocks.length > 0) {
            index = selectedBlocks.length - 1;
            selectedBlocks[index].material.setValues({ transparent: false });
            BlockBuilder.scene.remove(selectionGuides[index]);
            
            selectedBlocks.pop();
            selectionGuides.pop();
        }
        
        BlockBuilder.world.render();
    }
    
    function toggleSelection(object) {
        var blockIndex,
            newGuide;
        blockIndex = selectedBlocks.indexOf(object);
        
        if (blockIndex === -1) {
            object.material.setValues({ transparent: true, opacity: 0.8 });
            
            newGuide = selectionEdgeGuide.clone();
            newGuide.position.copy(object.position);
            newGuide.updateMatrix();
            BlockBuilder.scene.add(newGuide);
            
            selectedBlocks.push(object);
            selectionGuides.push(newGuide);
        } else {
            object.material.setValues({ transparent: false });
            
            BlockBuilder.scene.remove(selectionGuides[blockIndex]);
            
            selectedBlocks.splice(blockIndex, 1);
            selectionGuides.splice(blockIndex, 1);
        }
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.world.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(BlockBuilder.world.blockList);
            
            if (event.detail.shiftKey) {
                //shift키 클릭중
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object);
                }
            } else {
                //shift키 클릭중 아님
                deselectAll();
                
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object);
                }
            }
        }
        
        BlockBuilder.world.render();
    }
    
    //d키
    BlockBuilder.addMode('선택', 'select', 68, {
        activate: function () {
            BlockBuilder.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
        },
        deactivate: function () {
            BlockBuilder.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            deselectAll();
        }
    });
}());
