/*global $, THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var BLOCK_SELECTION_OUTLINE_COLOR = 0x00FF00,
        SELECT_NONE_ID = 'select-none',
        SELECTED_ID = 'select-selected',
        
        html,
        selectedBlocks = [];
    
    html = '<div id="' + SELECT_NONE_ID + '">No blocks selected</div>' + '<div id="' + SELECTED_ID + '"></div>';
    
    function displayMenu() {
        var selectNone = $('#' + SELECT_NONE_ID),
            selected = $('#' + SELECTED_ID);
        
        selectNone.css('display', 'none');
        selected.css('display', 'none');
        
        if (selectedBlocks.length === 0) {
            selectNone.css('display', '');
        } else {
            selected.css('display', '');
            selected.html(selectedBlocks.length + ' blocks selected');
        }
    }
    
    function deselectAll() {
        var index;
        
        while (selectedBlocks.length > 0) {
            index = selectedBlocks.length - 1;
            selectedBlocks[index].hideGuideEdge();
            selectedBlocks[index].material.setValues({ transparent: false });
            
            selectedBlocks.pop();
        }
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
            
            selectedBlocks.findAndRemove(object);
        }
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.util.getMouseRaycaster(event.detail);
            
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
        
        displayMenu();
        
        BlockBuilder.render();
    }
    
    //d키
    BlockBuilder.addMode('선택', 68, {
        id: 'select',
        activate: function () {
            BlockBuilder.canvas.addEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            displayMenu();
        },
        deactivate: function () {
            BlockBuilder.canvas.removeEventListener('clickWithoutMove', onCanvasClickWithoutMove);
            deselectAll();
            BlockBuilder.render();
        }
    }, html);
}());
