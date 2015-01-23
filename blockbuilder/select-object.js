/*global $, THREE, BlockBuilder*/

(function () {
    "use strict";
    
    var SELECTION_OUTLINE_COLOR = 0x00FF00,
        SELECT_NONE_ID = 'select-none',
        SELECTED_ID = 'select-selected',
        SELECT_UNION_ID = 'select-union',
        UNION_BUTTON_ID = 'select-create-union',
        
        selectedObjects = [];
    
    function displayMenu() {
        var selectNone = $('#' + SELECT_NONE_ID),
            selected = $('#' + SELECTED_ID),
            selectUnion = $('#' + SELECT_UNION_ID);
        
        $('#toolmenu-select > div').css('display', 'none');
        
        if (selectedObjects.length === 0) {
            selectNone.css('display', '');
        } else if (selectedObjects.length === 1 && selectedObjects[0] instanceof BlockBuilder.Union) {
            selectUnion.css('display', '');
            //TODO Union 관련 처리
        } else {
            selected.css('display', '');
            selected.children('p').text(selectedObjects.length + ' objects selected');
        }
    }
    
    function deselectAll() {
        var index;
        
        while (selectedObjects.length > 0) {
            index = selectedObjects.length - 1;
            selectedObjects[index].hideGuideBox();
            selectedObjects[index].setOpacity(1.0);
            
            selectedObjects.pop();
        }
    }
    
    function toggleSelection(object) {
        var blockIndex;
        blockIndex = selectedObjects.indexOf(object);
        
        if (blockIndex === -1) {
            object.showGuideBox(SELECTION_OUTLINE_COLOR);
            object.setOpacity(0.8);
            
            selectedObjects.push(object);
        } else {
            object.hideGuideBox();
            object.setOpacity(1.0);
            
            selectedObjects.findAndRemove(object);
        }
    }
    
    function onCanvasClickWithoutMove(event) {
        var raycaster, intersects, intersect;
        
        if (event.detail.button === 0) {
            raycaster = BlockBuilder.util.getMouseRaycaster(event.detail);
            
            intersects = raycaster.intersectObjects(BlockBuilder.world.objectList, true);
            
            if (event.detail.shiftKey) {
                //shift키 클릭중
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object.ascendTo(BlockBuilder.world));
                }
            } else {
                //shift키 클릭중 아님
                deselectAll();
                
                if (intersects.length > 0) {
                    intersect = intersects[0];
                    
                    toggleSelection(intersect.object.ascendTo(BlockBuilder.world));
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
    }, '/blockbuilder/select-object.html', function () {
        $('#' + UNION_BUTTON_ID).click(function () {
            BlockBuilder.world.createUnion(selectedObjects);
            deselectAll();
            displayMenu();
            BlockBuilder.render();
        });
    });
}());
