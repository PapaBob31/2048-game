import * as React from "react"
import * as ReactDOM from "react-dom/client"
import {useState, useRef, useEffect} from "react"

interface colorType {
	[index: string]: string 
}

const colors: colorType = {
	"2": "color-2",
	"4": "color-4",
	"8": "color-8",
	"16": "color-16",
	"32": "color-32",
	"64": "color-64",
	"128": "color-128",
	"256": "color-256",
	"512": "color-512",
	"1024": "color-1024",
	"2048": "color-2048"
}

const classNames: string[] = [
	"horz-1 vert-1", "horz-2 vert-1", "horz-3 vert-1", "horz-4 vert-1", 
	"horz-1 vert-2", "horz-2 vert-2", "horz-3 vert-2", "horz-4 vert-2",
	"horz-1 vert-3", "horz-2 vert-3", "horz-3 vert-3", "horz-4 vert-3",
	"horz-1 vert-4", "horz-2 vert-4", "horz-3 vert-4", "horz-4 vert-4"
] // Each class name correspond to a specific cell/position a tile can be displayed in.  


interface tileData {
	index: number,
	className: string,
	content: number,
	addedToIndex: number,
}


function renderedTileData(index: number, class_name: string): tileData {
	return {
		index: index,
		className: class_name,
		content: Math.random() >= 0.2 ? 2 : 4,
		addedToIndex: -1, // index of tile it will be added to if any, else -1;
	}
}


function createTilesHTML(gameData: tileData[], updateState: ()=>void) {
	let addedCallback = false
	let jsx = gameData.map((data) => {
		if (!data){return null}
		const class_attr = data.className + ' ' + colors[data.content.toString()];

		if (data.addedToIndex !== -1 && !addedCallback){
			addedCallback = true;
			// updateState Callback only added to one tile and the function will be called once to update all..
			// ..tiles that needs an update since all transitioning elements will finish transition at the same time
			return <div key={data.index} className={class_attr} onTransitionEnd={updateState}>{data.content}</div>
		}else {
			return <div key={data.index} className={class_attr}>{data.content}</div>
		}
	});
	return jsx;
}

interface LoopData {
	i: number,
	i_end: number,
	i_incr: number, 
	n_incr: number
}

function moveTiles(loopData: LoopData, possibleTilePos: {current: (number|undefined)[]}, renderedTiles: tileData[], 
	setRenderedTiles: (data: tileData[])=>void, updateTilesData:(data: tileData[], newTile: boolean)=>void) {
	let spacesInRow: number[] = [];
	let nti: number = -1; // nearest tile index (index of the closest tile to a tile moving in a particular direction)
	let movedTiles = [...renderedTiles]
	let tilesMoved = false

	for (let i=loopData.i; i<loopData.i_end; i+=loopData.i_incr) { // loop through each row
		nti = -1;
		spacesInRow = [];

		for (let n=i,j=0; j<4; n+=loopData.n_incr,j++) { // loop through each tile data in row
			if (typeof possibleTilePos.current[n] === "number") {
				if (nti > -1) {
					let curr_index = possibleTilePos.current[n];
					if (movedTiles[nti].content === movedTiles[curr_index].content) {
						movedTiles[curr_index].className = movedTiles[nti].className; // Makes curr_index tile bump into nti tile when rendered
						movedTiles[curr_index].addedToIndex = nti;
						possibleTilePos.current[n] = undefined;
						spacesInRow.push(n);
						nti = -1;
						tilesMoved = true;
						continue;
					}else {nti = curr_index;}
				}
				if (spacesInRow.length > 0) {
					let esi = spacesInRow[0]; // empty space index (index of the nearest empty cell to a tile in a particular direction)
					let t_i = possibleTilePos.current[n];
					movedTiles[t_i].className = classNames[esi];
					possibleTilePos.current[esi] = movedTiles[t_i].index;
					possibleTilePos.current[n] = undefined;
					if (nti === -1) {
						nti = possibleTilePos.current[esi];
					}
					spacesInRow.shift();
					spacesInRow.push(n);
					tilesMoved = true;
				}else if (nti === -1) {
					nti = possibleTilePos.current[i];
				}
			}else{
				spacesInRow.push(n);
			}
		}
	}
	if (tilesMoved) {
		updateTilesData(movedTiles, true)
		setRenderedTiles(movedTiles);
	}
}

let score = localStorage.getItem("score")
let best_score = localStorage.getItem("best-score")

function Main() {
	// Stores the index of elments containing undefined in renderedTiles state variable since removed tiles..
	// ..are set to undefined instead of actually removing it from the Array to keep renders consistent
	const emptyTileIndexes = useRef(JSON.parse(localStorage.getItem("emptyIndex") as string) || []);

	// Each element represents a specific position/cell on the grid and stores the index to a tile data in renderedTiles state variable.
	const possibleTilePos = useRef(JSON.parse(localStorage.getItem('tilePositions') as string) || Array(16));
	const swipeStart = useRef({x: 0, y: 0})

	const moveEvents = useRef<"up"|"left"|"down"|"right"|null>(null);
	const gameStart = useRef(false)
	let tilesData = JSON.parse(localStorage.getItem('tilesData') as string) || [];

	function updateTilesData(tiles_data: tileData[], newTile: boolean) {
		let spaces = [];
		for (let i=0; i<possibleTilePos.current.length; i++) {
			if (possibleTilePos.current[i] === null || possibleTilePos.current[i] === undefined) {
				spaces.push(i)
			}
		}
		let rand_index: number = spaces[Math.floor(Math.random() * spaces.length)]
		let nextFreeIndex = undefined;
		if (emptyTileIndexes.current.length > 0) {
			nextFreeIndex = emptyTileIndexes.current[0];
			emptyTileIndexes.current.shift();
		}else {
		 	nextFreeIndex = tiles_data.push(undefined) - 1; // Array.push method returns new Array length
		}
		// "new" should be part of the html class of any new tile after the first two tiles generated at gane start
		let newTileObj = renderedTileData(nextFreeIndex, newTile ? classNames[rand_index] + " new" : classNames[rand_index])
		tiles_data[nextFreeIndex] = newTileObj;
		possibleTilePos.current[rand_index] = nextFreeIndex;
		gameStart.current = true;
	}

	if (!gameStart.current && tilesData.length === 0) {
		updateTilesData(tilesData, false);
		updateTilesData(tilesData, false);
	}
	
	const [renderedTiles, setRenderedTiles] = useState(tilesData);
	const [scores, setScores] = useState({
		newScore: score !== null ? parseInt(score) : 0,
		bestScore: best_score !== null ? parseInt(best_score) : 0
	})
	const [gameOver, setGameOver] = useState(false)

	useEffect(()=> {
		document.addEventListener("keyup", keyEventHandler);
		checkIfGameOver();
		localStorage.setItem("score", scores.newScore.toString());
		localStorage.setItem("best-score", scores.bestScore.toString());
		localStorage.setItem("tilesData", JSON.stringify(renderedTiles))
		localStorage.setItem("tilePositions", JSON.stringify(possibleTilePos.current))
		localStorage.setItem("emptyIndexes", JSON.stringify(emptyTileIndexes.current))
		return () => document.removeEventListener("keyup", keyEventHandler);
	}, [renderedTiles, scores, emptyTileIndexes, possibleTilePos])


	function checkIfGameOver(){
		if (renderedTiles.length < 16){
			return;
		}
		let index: number = -1;
		let indexBefore: number = -1;
		let indexUnder: number = -1;
		for (let i=0; i<16; i++) {
			index = possibleTilePos.current[i]
			
			if (index === null || index === undefined) {return;}
			if (i !== 0) {
				indexBefore = possibleTilePos.current[i-1]
				if (indexBefore === null || indexBefore === undefined) {return;}
				if (renderedTiles[index].content === renderedTiles[indexBefore].content) {
					return;
				}
			}
			if (i<12) {
				indexUnder = possibleTilePos.current[i+4]
				if (indexUnder === null || indexUnder === undefined) {return;}
				if (renderedTiles[index].content === renderedTiles[indexUnder].content) {
					return;
				}
			}
		}
		setGameOver(true)
	}

	function setNewGameData() {
		const tilesData: tileData[] = [];
		possibleTilePos.current = Array(16);
		emptyTileIndexes.current = [];
		moveEvents.current = null;
		updateTilesData(tilesData, false);
		updateTilesData(tilesData, false);
		setRenderedTiles(tilesData)
		setScores(scores => ({newScore: 0, bestScore: scores.bestScore}))
		setGameOver(false)
	}

	function touchStartHandler(event: TouchEvent) {
		swipeStart.current.x = event.changedTouches[0].clientX
		swipeStart.current.y = event.changedTouches[0].clientY
	}

	function touchEndHandler(event: TouchEvent) {
		let movement_direction: "up"|"left"|"down"|"right"|undefined = undefined;
		let diffX = swipeStart.current.x - event.changedTouches[0].clientX;
		let diffY = swipeStart.current.y - event.changedTouches[0].clientY; 

		// pick the axis with the longest swipe if direction of swipe
		// is both horizontal and vertical e.g diagonal swipe
		if (Math.abs(diffX) > Math.abs(diffY)) {
			if (diffX > 20) {
				movement_direction = "left"
			}else if (diffX < -15) {
				movement_direction = "right"
			}
		}else if (Math.abs(diffY) > Math.abs(diffX)) {
			if (diffY > 20) {
				movement_direction = "up"
			}else if (diffY < -15) {
				movement_direction = "down"
			}
		}

		if (!movement_direction) {return;}

		if (!moveEvents.current) {
			moveEvents.current = movement_direction
			setUpTilesMovement(moveEvents.current)
			setTimeout(()=>{ // Prevents touch input from working until after all tiles are done moving
				moveEvents.current = null;
			}, 250)
		}
		
	}

	function keyEventHandler(event: KeyboardEvent){
		event.preventDefault();
		let movement_direction: "up"|"left"|"down"|"right"|undefined = undefined;
		if (event.key === "ArrowUp") {
			movement_direction = "up";
		}else if (event.key === "ArrowDown") {
			movement_direction = "down";
		}else if (event.key === "ArrowLeft") {
			movement_direction = "left";
		}else if (event.key === "ArrowRight") {
			movement_direction = "right";
		}else return;

		if (!moveEvents.current) {
			moveEvents.current = movement_direction
			setUpTilesMovement(moveEvents.current)
			setTimeout(()=>{ // Prevents keyboard input from working until after all tiles are done moving
				moveEvents.current = null;
			}, 250)
		}
	}

	function setUpTilesMovement(direction: "up"|"left"|"down"|"right") {
		if (gameOver) {
			return;
		}
		const directions = { // data to use in loops moving tiles in a specified direction
			up: {i: 0, i_end: 4, i_incr: 1, n_incr: 4},
			left: {i: 0, i_end: 16, i_incr: 4, n_incr: 1},
			down: {i: 12, i_end: 16, i_incr: 1, n_incr: -4},
			right: {i: 3, i_end: 16, i_incr: 4, n_incr: -1}
		}
		moveTiles(directions[direction], possibleTilePos, renderedTiles, setRenderedTiles, updateTilesData);
	}
	
	// Updates tile data if at least one tile is to be added/merged to another
	function updateTileState(){
		let newData = [...renderedTiles]
		for (let i=0; i<newData.length; i++) {
			if (!newData[i]) continue;
			if (newData[i].addedToIndex !== -1) {
				let tileToBeDoubledIndex = newData[i].addedToIndex;
				newData[tileToBeDoubledIndex].content *= 2;
				newData[i] = undefined;
				emptyTileIndexes.current.push(i);
				
				setScores((scores) => {
					let new_score = scores.newScore + newData[tileToBeDoubledIndex].content
					let newScoreObj = {
						newScore: new_score,
						bestScore: new_score > scores.bestScore ? new_score : scores.bestScore
					}
					return newScoreObj;
				})
			}
		}
		setRenderedTiles(newData);
	}

	return (
		<>
			<div className="heading">
		    <h1>2048</h1>
		    <div className="container">
			    <div className="small-container">
			    	<b>SCORE</b>
			    	<b>{scores.newScore}</b>
			    </div>
			    <div className="small-container">
			    	<b>BEST</b>
			    	<b>{scores.bestScore}</b>
			    </div>
			  </div>
	    </div>
	    <div className="container">
	    	<div id="quick-info">
					<p>Join the numbers and get to the <b>2048 tile!</b></p>
				</div>
				<button onClick={setNewGameData}>New Game</button>
			</div>
      <section onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler}>
      	<div id="game-over-cover" className={gameOver ? "show" : ""}>
      		<p>Game Over!</p>
      		<button onClick={setNewGameData}>Try again</button>
      	</div>
	      <span className="horz-1 vert-1"></span>
	      <span className="horz-2 vert-1"></span>
	      <span className="horz-3 vert-1"></span>
	      <span className="horz-4 vert-1"></span>
	      <span className="horz-1 vert-2"></span>
	      <span className="horz-2 vert-2"></span> 
	      <span className="horz-3 vert-2"></span>
	      <span className="horz-4 vert-2"></span>
	      <span className="horz-1 vert-3"></span>
	      <span className="horz-2 vert-3"></span>
	      <span className="horz-3 vert-3"></span>
	      <span className="horz-4 vert-3"></span>
	      <span className="horz-1 vert-4"></span>
	      <span className="horz-2 vert-4"></span>
	      <span className="horz-3 vert-4"></span>
	      <span className="horz-4 vert-4"></span>
      	{createTilesHTML(renderedTiles, updateTileState)}
      </section>
      <article>
      	<p>
      		<b>HOW TO PLAY:</b> Use your arrow keys or swipe with your fingers to move the tiles. 
      		When two tiles with the same number touch, they merge into one. Keep merging till
      		you reach <b>2048!</b>
      	</p>
      	<p>
	        If you beat the game and would like to master it, try to finish with a smaller score. 
	        That would mean that you finished with less moves.
	      </p>
	      <p>
	      	Based on <a href="https://play2048.co/">2048</a> by <a href="http://gabrielecirulli.com/">Gabriele Cirulli</a>
	      </p>
      </article>
		</>
	)
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<Main/>
	</React.StrictMode>
)
