import SGF from '../sgf/sgf.js';
import * as lazy from '../lazy-dom.js';

class GobanCanvas {
    constructor(parent) {
        this.parent = parent;

        this.container = lazy.div('gobanContainer',this.parent);
        this.goban = lazy.canvas('gobanCanvas',this.container);
        this.stones = lazy.canvas('gobanCanvas',this.container);
        this.annotations = lazy.canvas('gobanCanvas',this.container);

        this.annotations.addEventListener('mousedown',(e) => this.onMouseDown(e));
        this.annotations.addEventListener('mouseup',(e) => this.onMouseUp(e));
        lazy.resizeObserve(this.parent, () => this.update());

        this.setCanvasSize();
        this.gobanContext = this.goban.getContext('2d');
        this.stoneContext = this.stones.getContext('2d');
        this.annotationsContext = this.annotations.getContext('2d');
        this.woodColor = 'burlywood';
        this.lineColor = 'black';
        this.blackColor = 'black';
        this.whiteColor = 'white';
        this.backgroundColor = '#deb7ff';
        this.fillCanvas();

        this.mouseDownLocation = [null,null]
    }

    onMouseDown(event) {
        let [x,y] = this.mouseLocation(event.offsetX,event.offsetY);
        if (x < 0 || y < 0 || x > this.columns-1 || y > this.rows-1) {
            return;
        } else {
            this.mouseDownLocation = [x,y];
        }
    }

    onMouseUp(event) {
        let [x,y] = this.mouseLocation(event.offsetX,event.offsetY);
        if (x < 0 || y < 0 || x > this.columns-1 || y > this.rows-1) {
            return;
        } 
        if (JSON.stringify(this.mouseDownLocation) === JSON.stringify([x,y])) {
            // mouse didn't move; simple click
            console.log([x,y], this._walker.valueAtIntersection([x,y]));
            if (event.shiftKey && this._walker.getNodeAtCoordinate([x,y]) !== -1) {
                console.log('new node: node',this._walker.currentNode.id);
                this._walker.update();
            }
        } else {
            // mouse moved; click + drag
            if (this._walker.intersectionIsOccupied(this.mouseDownLocation)) {
                let stoneOrigin = this._walker.referenceNodeAtCoordinate(this.mouseDownLocation);
                if (stoneOrigin !== -1) {
                    this._walker.editCoordinate(stoneOrigin,this.mouseDownLocation,[x,y]);
                    this._walker.update();
                }
            }
        }
        this.mouseDownLocation = [null,null];
    }

    mouseLocation(offsetX,offsetY) {
        let x = Math.round(offsetX / this.lineSpacing - 1.5);
        let y = Math.round(offsetY / this.lineSpacing - 1.5);
        return [x,y]
    }

    setCanvasSize(columns=19,rows=19) {
        let parentBounds = this.parent.getBoundingClientRect();
        let parentHeight = parentBounds.bottom-parentBounds.top;
        let parentWidth = parentBounds.right-parentBounds.left;
        let length = parentHeight < parentWidth ? `${parentHeight}px` : `${parentWidth}px`;
        this.container.style.height = length;
        this.container.style.width = length;

        this.columns = columns;
        this.rows = rows;
        this.lineSpacing = this.goban

        this.bounds = this.container.getBoundingClientRect();
        let heightSpacing = (this.bounds.bottom-this.bounds.top)/(rows+2);
        let widthSpacing = (this.bounds.right-this.bounds.left)/(columns+2);
        this.lineSpacing = heightSpacing < widthSpacing ? heightSpacing : widthSpacing;

        this.goban.width = this.lineSpacing * (columns + 2);
        this.goban.height = this.lineSpacing * (rows + 2);
        this.stones.width = this.lineSpacing * (columns + 2);
        this.stones.height = this.lineSpacing * (rows + 2);
        this.annotations.width = this.lineSpacing * (columns + 2);
        this.annotations.height = this.lineSpacing * (rows + 2);
    }

    setCanvasUnits(columns,rows) {
        this.columns = columns;
        this.rows = rows;
        this.lineSpacing = this.goban.width/(columns+2);
    }

    fillCanvas() {
        this.gobanContext.fillStyle = this.woodColor;
        this.gobanContext.fillRect(0,0,this.goban.width,this.goban.height);
    }

    drawBoundingRectangle() {
        this.gobanContext.strokeStyle = this.lineColor;
        let width = this.lineSpacing/13;
        this.gobanContext.lineWidth = width > 2 ? width : 2;
        this.gobanContext.strokeRect(
            this.lineSpacing*1.5,
            this.lineSpacing*1.5,
            this.lineSpacing*(this.columns-1),
            this.lineSpacing*(this.rows-1)
        );
    }

    drawGrid() {
        this.gobanContext.strokeStyle = this.lineColor;
        let width = this.lineSpacing/25;
        this.gobanContext.lineWidth = width > 1 ? width : 1;

        this.gobanContext.beginPath();
        for (let y=1; y<this.rows-1; y++) {
            this.gobanContext.moveTo(this.lineSpacing*1.5,this.lineSpacing * (y+1.5));
            this.gobanContext.lineTo(this.lineSpacing * (this.columns+0.5),this.lineSpacing * (y+1.5));
        }
        for (let x=1; x<this.columns-1; x++) {
            this.gobanContext.moveTo(this.lineSpacing*(x+1.5),this.lineSpacing*1.5);
            this.gobanContext.lineTo(this.lineSpacing*(x+1.5),this.lineSpacing*(this.rows+0.5));
        }
        this.gobanContext.stroke();
    }

    drawStars() {
        this.stars = [];
        if (this.rows === 19 && this.columns === 19) {
            this.stars = [
                [3,3],
                [3,9],
                [3,15],
                [9,3],
                [9,9],
                [9,15],
                [15,3],
                [15,9],
                [15,15],
            ];
        } else if (this.rows === 13 && this.columns === 13) {
            this.stars = [
                [3,3],
                [3,6],
                [3,9],
                [6,3],
                [6,6],
                [6,9],
                [9,3],
                [9,6],
                [9,9],
            ];
        } else if (this.rows === 9 && this.columns === 9) {
            this.stars = [
                [2,2],
                [2,6],
                [4,4],
                [6,2],
                [6,6],
            ]
        } else if (this.rows % 2 && this.columns % 2) {
            this.stars.push([Math.floor(this.columns/2),Math.floor(this.rows/2)]);
        }
        this.gobanContext.fillStyle = this.lineColor;
        for (let star of this.stars) {
            this.gobanContext.beginPath();
            this.gobanContext.arc(
                this.lineSpacing*(star[0]+1.5),
                this.lineSpacing*(star[1]+1.5),
                this.lineSpacing/7.6,
                0,
                Math.PI*2
            );
            this.gobanContext.fill();
        }
    }

    drawCoordinates() {
        this.fontSize = this.lineSpacing-5;
        this.gobanContext.font = `${this.fontSize}px ubuntu-condensed`;
        this.gobanContext.textAlign = 'center';
        this.gobanContext.textBaseline = 'middle';
        this.gobanContext.fillStyle = this.lineColor;
        for (let i=0; i< this.columns; i++) {
            this.gobanContext.fillText(SGF.coordinates[i],this.lineSpacing*(i+1.5),(this.lineSpacing*.5));
            this.gobanContext.fillText(SGF.coordinates[i],this.lineSpacing*(i+1.5),this.lineSpacing*(this.rows+1.5))
        }
        for (let i=0; i< this.rows; i++) {
            this.gobanContext.fillText(SGF.coordinates[i],this.lineSpacing*.5,this.lineSpacing*(i+1.5));
            this.gobanContext.fillText(SGF.coordinates[i],this.lineSpacing*(this.columns+1.5),this.lineSpacing*(i+1.5));
        }
    }

    drawStones(boardState) {
        for (let y=0; y<this.rows; y++) {
            for (let x=0; x<this.columns; x++) {
                let newMove = boardState[y][x];
                switch (newMove.toUpperCase()) {
                    case 'W':
                        this.stoneContext.fillStyle = 'white';
                        this.stoneContext.strokeStyle = 'black';
                        break;
                    case 'B':
                        this.stoneContext.fillStyle = 'black';
                        this.stoneContext.strokeStyle = 'white';
                        break;
                    default:
                        continue;
                }
                this.stoneContext.beginPath();
                this.stoneContext.arc(this.lineSpacing*(x+1.5),this.lineSpacing*(y+1.5),(this.lineSpacing/2)-0.5,0,Math.PI*2);
                this.stoneContext.fill();

                // last move marker
                if (newMove.toLowerCase() === newMove) {
                    this.stoneContext.lineWidth = this.lineSpacing/12;
                    this.stoneContext.beginPath();
                    this.stoneContext.arc(this.lineSpacing*(x+1.5),this.lineSpacing*(y+1.5),this.lineSpacing/3.5,0,Math.PI*2);
                    this.stoneContext.stroke();
                }
            }
        }
    }

    drawAnnotations() {

    }

    /**
     * @param {object} walkerObject
     */
    set walker(walkerObject) {
        this._walker = walkerObject;
    }

    /**
     * 
     */
    update() {
        let boardState = this._walker.currentNode.state;
        this.setCanvasSize(boardState[0].length,boardState.length);
        this.fillCanvas();
        this.drawBoundingRectangle();
        this.drawGrid();
        this.drawStars();
        this.drawCoordinates();
        this.drawStones(boardState);
    }
}

export default GobanCanvas;