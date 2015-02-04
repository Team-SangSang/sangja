/*************************************
* SANGJA PROJECT
* core module
**************************************/

/*global THREE, console*/

var SANGJA = {};

(function () {
    "use strict";
    
    SANGJA.core = {
        //Class
        Block: undefined,
        Union: undefined
    };
    
    //기존 클래스에 메서드 추가
    //=====================
    
    Array.prototype.findAndRemove = function (target) {
        var index = this.indexOf(target);
        
        if (index !== -1) {
            this.splice(index, 1);
        }
        
        return index;
    };
    
    THREE.Object3D.prototype.ascendTo = function (level) {
        if (this.parent === undefined) {
            console.error('THREE.Object3D.ascendTo: Cannot ascend to ', level);
        } else if (this.parent === level) {
            return this;
        } else {
            return this.parent.ascendTo(level);
        }
    };
    
    //외곽선 관련 메서드
    THREE.Object3D.prototype.showGuideBox = function (color) {
        if (this.guideBox === undefined) {
            this.guideBox = new THREE.BoundingBoxHelper(this);
            this.guideEdge = new THREE.BoxHelper();
            
            this.guideBox.visible = false;
            this.parent.add(this.guideBox);
            this.parent.add(this.guideEdge);
        }
        this.guideEdge.material.setValues({ color: color });
        this.guideEdge.visible = true;
        
        this.guideBox.update();
        this.guideEdge.update(this.guideBox);
    };

    THREE.Object3D.prototype.hideGuideBox = function () {
        if (this.guideEdge !== undefined) {
            this.guideEdge.visible = false;
        }
    };
    
    
    //커스텀 클래스 구현
    //===============
    
    //블록 클래스
    SANGJA.core.Block = (function () {
        var blockGeometry;
        
        function Block(setting) {
            THREE.Mesh.call(this, blockGeometry, new THREE.MeshLambertMaterial(setting));
            
            this.type = 'Block';
        }
        
        Block.SIZE = 10;
        
        Block.prototype = Object.create(THREE.Mesh.prototype);
        Block.prototype.constructor = Block;
        
        blockGeometry = new THREE.BoxGeometry(Block.SIZE, Block.SIZE, Block.SIZE);
        
        Block.prototype.setOpacity = function (opacity) {
            if (opacity === 1.0) {
                this.material.setValues({ transparent: false });
            } else {
                this.material.setValues({ transparent: true, opacity: opacity });
            }
        };
        
        return Block;
    }());
    
    //유니온 클래스
    SANGJA.core.Union = (function () {
        function Union() {
            THREE.Object3D.call(this);
            
            this.type = 'Union';
            
            this.objectList = []; //blocks + unions
            this.blockList = []; //only blocks
            this.unionList = []; //only unions
        }
        
        Union.prototype = Object.create(THREE.Object3D.prototype);
        Union.prototype.constructor = Union;
        
        //복셀 정수 좌표를 실제 THREE.js 좌표로 변환
        Union.prototype.convertVoxelPosition = function (vector) {
            var result = new THREE.Vector3().copy(vector);
            result.multiplyScalar(SANGJA.core.Block.SIZE).addScalar(SANGJA.core.Block.SIZE * 0.5);
            
            return result;
        };
        
        Union.prototype.add = function (target, interactable) {
            interactable = interactable === undefined ? true : interactable;
            
            if (interactable) {
                if (target instanceof SANGJA.core.Block) {
                    this.objectList.push(target);
                    this.blockList.push(target);
                } else if (target instanceof SANGJA.core.Union) {
                    this.objectList.push(target);
                    this.unionList.push(target);
                }
            }
            
            THREE.Object3D.prototype.add.call(this, target);
        };
        
        Union.prototype.remove = function (target, interactable) {
            interactable = interactable === undefined ? true : interactable;
            
            if (interactable) {
                if (target instanceof SANGJA.core.Block) {
                    this.objectList.findAndRemove(target);
                    this.blockList.findAndRemove(target);
                } else if (target instanceof SANGJA.core.Union) {
                    this.objectList.findAndRemove(target);
                    this.unionList.findAndRemove(target);
                }
            }
            
            THREE.Object3D.prototype.remove.call(this, target);
        };
        
        Union.prototype.createBlock = function (vector, setting) {
            var block = new SANGJA.core.Block(setting);
            
            block.position.copy(this.convertVoxelPosition(vector));
            
            this.add(block);
        };
        
        Union.prototype.createUnion = function (array) {
            var union, i;
            
            union = new SANGJA.core.Union();
            
            for (i = 0; i < array.length; i += 1) {
                if (array[i] instanceof SANGJA.core.Block || array[i] instanceof SANGJA.core.Union) {
                    if (array[i].parent === this) {
                        union.add(array[i]);
                    } else {
                        console.error('BlockBuilder.Union.createUnion: ', array[i], ' is not a child of ', this);
                    }
                } else {
                    console.error('BlockBuilder.Union.createUnion: ', array[i], ' is not an instance of BlockBuilder.Block or BlockBuilder.Union');
                    return;
                }
            }
            
            this.add(union);
        };
        
        Union.prototype.setOpacity = function (opacity) {
            var i, object;
            
            for (i = 0; i < this.objectList.length; i += 1) {
                object = this.objectList[i];
                object.setOpacity(opacity);
            }
        };
        
        //TODO clone 구현
        
        return Union;
    }());
}());