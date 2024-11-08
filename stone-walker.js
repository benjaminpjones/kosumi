/**
 * @module StoneWalker
 */

import SGF from './sgf-handler.js';

class StoneWalker {
    /**
     * 
     */
    constructor (gameObject) {
        this.root = gameObject;
        this.currentNode;
    }

    /**
     * Sets currentNode to node in current branch at moveNumber
     * @param {number} moveNumber 
     * @returns New currentNode, or -1 if the current node already
     * has that moveNumber or if that node does not exist
     */
    move(moveNumber) {
        if (this.currentNode.moveNumber === moveNumber) {
            return -1;
        } else {
            let currentNode = this.currentNode;
            let newNode = StoneWalker.getNodeAtMove(currentNode);
            if (newNode !== -1) {
                this.currentNode = newNode;
                return this.currentNode;
            } else {
                return -1;
            }
        }
    }

    /**
     * Sets currentNode to parent
     * @returns New currentNode, or -1 if orphan node
     */
    parentNode() {
        if (this.currentNode.hasOwnProperty('parent')) {
            this.currentNode = this.currentNode.parent;
            return this.currentNode;
        }
        return -1;
    }

    /**
     * Sets currentNode to last child
     * @returns New currentNode, or -1 if childless
     */
    lastChild() {
        if (this.currentNode.hasOwnProperty('children')) {
            let last = this.currentNode.children.length-1;
            this.currentNode = this.currentNode.children[last];
            return this.currentNode;
        }
        return -1;
    }

    /**
     * Sets currentNode to first child
     * @returns New currentNode, or -1 if childless
     */
    firstChild() {
        if (this.currentNode.hasOwnProperty('children')) {
            this.currentNode = this.currentNode.children[0];
            return this.currentNode;
        }
        return -1;
    }

    /**
     * Sets currentNode to previous sibling
     * @returns New currentNode, or -1 if only child
     */
    previousSibling() {
        if (this.currentNode.hasOwnProperty('parent')) {
            let siblings = this.currentNode.parent.children;
            let currentNode = this.currentNode;
            let currentChildIndex = siblings.indexOf(currentNode);
            if (siblings.length > 1 && currentChildIndex > 0) {
                this.currentNode = siblings[currentChildIndex-1];
                return this.currentNode;
            }
        }
        return -1;
    }

    /**
     * Sets currentNode to next sibling
     * @returns New currentNode, or -1 if only child
     */
    nextSibling() {
        if (this.currentNode.hasOwnProperty('parent')) {
            let siblings = this.currentNode.parent.children;
            let currentNode = this.currentNode;
            let currentChildIndex = siblings.indexOf(currentNode);
            if (siblings.length > 1 
                && currentChildIndex < siblings.length-1) {
                this.currentNode = siblings[currentChildIndex+1];
                return this.currentNode;
            }
        }
        return -1;
    }

    /**
     * Sets currentNode to final main node in current branch
     * @returns New currentNode, or -1 if currentNode is childless
     */
    terminalNode() {
        if (this.currentNode.hasOwnProperty('children')) {
            currentNode = this.currentNode;
            this.currentNode = StoneWalker.getTerminalNode(currentNode);
            return this.currentNode;
        }
        return -1;
    }

    /**
     * Searches down main branch from given node 
     * for terminal node
     * @param {*} node 
     * @returns Final node in current branch
     */
    static getTerminalNode(node) {
        if (node.hasOwnProperty('children')) {
            return this.getTerminalNode(node.children[0]);
        }
        return node;
    }

    /**
     * Searches game tree for node with given id
     * @param {*} gameTree 
     * @param {*} id 
     * @returns First node in gameTree with given id,
     * or -1 if id does not exist
     */
    static getNodeById(gameTree, id) { 
        //THIS FUNCTION CURRENTLY NEVER REFERENCED
        if (gameTree.id === id) {
            return gameTree;
        } else if (!gameTree.hasOwnProperty('children')) {
            return -1;
        } else {
            for (let child of gameTree.children) {
                let node = this.getNodeById(child);
                if (node !== -1) {
                    return node;
                }
            }
            return -1;
        }   
    }

    /**
     * Searches up tree from node to get root node
     * @param {*} node 
     * @returns Root node
     */
    static getRootNode(node) {
        if (!node.hasOwnProperty('parent')) {
            return node;
        } else {
            return this.getRootNode(node.parent);
        }
    }

    /**
     * Searches up/down tree from given node
     * to find node with moveNumber
     * @param {*} node 
     * @param {number} moveNumber 
     * @returns First node in active branch with moveNumber
     * or -1 if it doesn't exist.
     */
    static getNodeAtMove(node, moveNumber) {
        if (node.moveNumber === moveNumber) {
            return node;
        } else if (node.moveNumber > moveNumber 
            && node.hasOwnProperty('parent')) {
            return this.getNodeAtMove(node.parent);
        } else if (node.moveNumber < moveNumber 
            && node.hasOwnProperty('children')) {
            return this.getNodeAtMove(node.children[0]);
        } else return -1;
    }

    /**
     * Unzips all compressable properties of given node;
     * Mutates, returns nothing
     * @param {object} node Game tree node
     * @returns {number} Number of mutated properties
     */
    static decompress(node) {
    // this is insane, rewrite??
        let zipCount = 0;
        for (let key of Object.keys(node.props)) {
            if (SGF.zippableProperties.includes(key)) {
                let newValue = [];
                for (let i=0; i < node.props[key].length; i++) {
                    if (node.props[key][i].includes(':')) {
                        zipCount ++;
                        let unzipped = SGF.unzipCoords(node.props[key][i]);
                        for (let coordinate of unzipped) {
                            newValue.push(coordinate);
                        }
                    } else {
                        newValue.push(node.props[key][i]);
                    }
                }
                node.props[key] = newValue;
            }
        }
        return zipCount;
    }

    /**
     * Mutates properties of every node in game tree;
     * sets AP to Kosumi:1.0, unzips compressed points,
     * logs erroneous root props at non-root node
     * @param {object} node 
     * @returns {object} Mutated node
     */
    static formatTree(node) {
        if (!node.hasOwnProperty('parent')) {
            node.props.AP = ['Kosumi:0.1.0'];
        } else if (node.hasOwnProperty('props')) {
            for (let key of Object.keys(node.props)) {
                if (SGF.rootProperties.includes(key)) {
                    console.log(`Error: root ${key} at node ${node.id}`);
                }
            }
        }
        if (node.hasOwnProperty('props')) {
            this.decompress(node);
        }
        if (node.hasOwnProperty('children')) {
            for (let child of node.children) {
                this.formatTree(child);
            }
        }
        return node;
    }
}

export default StoneWalker;