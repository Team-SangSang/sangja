/*************************************
* SANGJA PROJECT
* parser module
**************************************/

/*global $, THREE, parseVoxFile, vox2union, FileReader, Blob, SANGJA*/

(function () {
    "use strict";
    
    SANGJA.parser = {
        //Method
        unionToJson: undefined,
        jsonToUnion: undefined,
        download: undefined,
        importFromFile: undefined
    };
    
    //초기화 시작
    //=========
    
    function parseUnion(union) {
        var i, next, position, result = {
            name: union.name || '',
            position: [union.position.x, union.position.y, union.position.z],
            blockList: [],
            unionList: []
        };
        
        for (i = 0; i < union.blockList.length; i += 1) {
            next = union.blockList[i];
            
            position = SANGJA.core.threeToVoxel(next.position).round();
            result.blockList.push({
                position: [position.x, position.y, position.z],
                color: next.material.color.getHex()
            });
        }
        
        for (i = 0; i < union.unionList.length; i += 1) {
            next = union.unionList[i];
            
            result.unionList.push(parseUnion(next));
        }
        
        return result;
    }
    
    function parseObject(object) {
        var i, next, position, result;
        
        result = new SANGJA.core.Union();
        
        result.name = object.name;
        result.position.set(object.position[0], object.position[1], object.position[2]);
        
        for (i = 0; i < object.blockList.length; i += 1) {
            next = object.blockList[i];
            
            result.createBlock(new THREE.Vector3(next.position[0], next.position[1], next.position[2]), { color: next.color });
        }
        
        for (i = 0; i < object.unionList.length; i += 1) {
            next = object.unionList[i];
            
            result.add(parseObject(next));
        }
        
        return result;
    }
    
    SANGJA.parser.unionToJson = function (union) {
        return JSON.stringify(parseUnion(union));
        
    };
    
    SANGJA.parser.jsonToUnion = function (json) {
        return parseObject(JSON.parse(json));
    };
    
    SANGJA.parser.download = function (content, filename, contentType) {
        var a, blob;
        
        if (contentType === undefined) {
            contentType = 'application/octet-stream';
        }
        
        a = document.createElement('a');
        blob = new Blob([content], { 'type': contentType });
        
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    };
    
    SANGJA.parser.importFromFile = function (file) {
        var assetReader = new FileReader(),
            extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'vox') {
            assetReader.readAsArrayBuffer(file);
        } else {
            assetReader.readAsText(file);
        }
        
        assetReader.onload = (function (file, extension) {
            return function (e) {
                var index, vox, asset;
                
                if (extension === 'vox') {
                    index = file.name.lastIndexOf('.');
                    vox = parseVoxFile(e.target.result);
                    asset = parseObject(vox2union(vox, file.name.substring(0, index), {
                        fixCoord: true,
                        centerXZ: true,
                        centerY: false
                    }));
                    SANGJA.builder.world.add(asset);
                } else if (extension === 'world') {
                    asset = SANGJA.parser.jsonToUnion(e.target.result);
                    SANGJA.renderer.scene.remove(SANGJA.builder.world);
                    SANGJA.builder.world = asset;
                    SANGJA.renderer.scene.add(asset);
                } else if (extension === 'union') {
                    asset = SANGJA.parser.jsonToUnion(e.target.result);
                    SANGJA.builder.world.add(asset);
                }
                
                SANGJA.renderer.render();
                SANGJA.builder.updateHierarchy();
            };
        }(file, extension));
    };
}());
