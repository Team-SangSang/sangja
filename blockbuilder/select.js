/*global THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var BLOCK_SELECTION_OUTLINE_COLOR = 0x00FF00,
        
        selectedBlocks = [];
    
    function deselectAll() {
        var index;
        
        while (selectedBlocks.length > 0) {
            index = selectedBlocks.length - 1;
            selectedBlocks[index].hideGuideEdge();
            selectedBlocks[index].material.setValues({ transparent: false });
            
            selectedBlocks.pop();
        }
        
        BlockBuilder.world.render();
    }
    
    function toggleSelection(object) {
        var blockIndex;
        blockIndex = selectedBlocks.indexOf(object);
        
        if (blockIndex === -1) {
            object.showGuideEdge(BLOCK_SELECTION_OUTLINE_COLOR);
            object.material.setValues({ transparent: true, opacity: 0.8 });
            
            selectedBlocks.push(object);
        } else {
            object.hideGuideEdge();
            object.material.setValues({ transparent: false });
            
            selectedBlocks.splice(blockIndex, 1);
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
