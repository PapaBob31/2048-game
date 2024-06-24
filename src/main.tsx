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


function Header({scores} : {scores: any}) {
	return (
		<header>
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
		</header>
	)
}


function GameTiles({tilesData}) {
	let renderedTiles: any[] = [
		null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null
	];

	for (let i=0; i<16; i++) {
		let data = tilesData[i];
		let key = tilesData[i].content && (`${tilesData[i].renderingIndex}-${tilesData[i].content}`);
		if (data.combinedTileData) {
			let mergedData = data.combinedTileData
			let mergedDataKey = `${mergedData.renderingIndex}-${mergedData.content}`
			renderedTiles[data.renderingIndex] = (
				<div key={key} className={`${data.classAttr} ${colors[data.content]}`}>{data.content}</div>
			)
			renderedTiles[mergedData.renderingIndex] = (
				<div key={mergedDataKey} className={`${data.classAttr} ${colors[mergedData.content]}`}>{mergedData.content}</div>
			)
		}else if (data.renderingIndex > -1) {
			renderedTiles[data.renderingIndex] = <div key={key} className={`${data.classAttr} ${colors[data.content]}`}>{data.content}</div>
		}
	}
	return <>{renderedTiles}</>
}

function moveTilesByTouch(event: TouchEvent, diffX: number, diffY: number, setUpTilesMovement: (direction: string) => void) {
	// pick the axis with the longest swipe if direction of swipe
	// is both horizontal and vertical e.g diagonal swipe
	if (Math.abs(diffX) > Math.abs(diffY)) {
		if (diffX > 20) {
			setUpTilesMovement("left");
		}else if (diffX < -15) {
			setUpTilesMovement("right");
		}
	}else if (Math.abs(diffY) > Math.abs(diffX)) {
		if (diffY > 20) {
			setUpTilesMovement("up");
		}else if (diffY < -15) {
			setUpTilesMovement("down");
		}
	}else return;
	event.preventDefault();
}

function updateTilesMovementData(direction: "up"|"down"|"left"|"right", tilesData) {
	let startingIndex: number, rowStep: number, tileStep: number;
	let changeOccured = false;

	switch (direction) {
		case "up":
			startingIndex = 0;
			rowStep = 1;
			tileStep = 4;
			break;
		case "down":
			startingIndex = 12;
			rowStep = 1;
			tileStep = -4;
			break;
		case "right":
			startingIndex = 3;
			rowStep = 4;
			tileStep = -1;
			break;
		case "left":
			startingIndex = 0;
			rowStep = 4;
			tileStep = 1;
	}

	for (let i=0; i<4; i++) {
		let edgeIndex = startingIndex;
		let n = startingIndex + tileStep; // starts iteration at position after the position at the edge
		let counter = 0;		

		while (counter < 3) {
			if (tilesData[n].content) {
				if (tilesData[edgeIndex].content === tilesData[n].content) {
					tilesData[edgeIndex].combinedTileData = {
						renderingIndex: tilesData[n].renderingIndex, 
						content: tilesData[n].content
					}
				}else {
					if (tilesData[edgeIndex].content) {
						edgeIndex+=tileStep;
					}
					tilesData[edgeIndex].renderingIndex = tilesData[n].renderingIndex;
					tilesData[edgeIndex].content = tilesData[n].content
				}
				if (edgeIndex !== n) {
					tilesData[n].renderingIndex = -1;
					tilesData[n].content = null;
					changeOccured = true;
				}
				if (tilesData[edgeIndex].combinedTileData) { 
					edgeIndex+=tileStep;
				}
			}
			counter++;
			n+=tileStep;
		}
		startingIndex += rowStep;
	}
	return [tilesData, changeOccured];
}


function generateInitialState() {
	const data = JSON.parse(localStorage.getItem('tilesData') as string)
	if (data) {
		return data
	}
	let tilesPositionsData = [];
	let htc = 1 // completes horizontal tile css class attribute
	let vtc = 1 // completes vertical tile css class attribute
	let randomNum1 = Math.floor(Math.random() * 16);
	let randomNum2 = Math.floor(Math.random() * 16);
	if (randomNum1 === randomNum2) {
		randomNum2 = (randomNum2 + 8) % 16 
	}
	let availRenderingSlot = 0;

	for (let i=0; i<16; i++) {
		if (i%4 == 0) {
			vtc = 1;
			i >= 4 && htc++;
		}
		tilesPositionsData.push({
			content: [randomNum1, randomNum2].includes(i) ? (Math.random() >= 0.2 ? 2 : 4) : null,
			classAttr: `horz-${htc} vert-${vtc}`, 
			renderingIndex: [randomNum1, randomNum2].includes(i) ? availRenderingSlot : -1,
			combinedTileData: null,
		})
		if (i === randomNum1 || i === randomNum2) {
			availRenderingSlot++;
		}
		vtc++;
	}
	return tilesPositionsData;
}

function generateNewGameState(prevGameTilesData) {
	let newTileIndexes:number[] = [];

	function getRandomIndexNotOccupied():number {
		let randomNum = Math.floor(Math.random() * 16);
		if (newTileIndexes.includes(randomNum)) {
			return getRandomIndexNotOccupied();
		}
		return randomNum
	}

	let availRenderingSlots = [0, 1];
	for (let i=0; i<16; i++) {
		if (newTileIndexes.includes(i)) continue;
		let randIndex = getRandomIndexNotOccupied();
		prevGameTilesData[i].content = null;
		prevGameTilesData[i].renderingIndex = -1;

		if (newTileIndexes.length === 2) {
			continue;
		}
		newTileIndexes.push(randIndex)
		prevGameTilesData[randIndex].content = Math.random() > 0.2 ? 2 : 4;
		prevGameTilesData[randIndex].renderingIndex = availRenderingSlots.pop();
	}
	return prevGameTilesData
}

function tilesCanStillMove(gameTilesData) {
	for (let i=0; i<16; i++) {
		if (i<12 && gameTilesData[i].content === gameTilesData[i+4].content) {
			return true;
		}
		if (i % 4 === 3) { // 3, 7, 11, 15
			continue;
		}
		if (gameTilesData[i].content === gameTilesData[i+1].content) {
			return true
		}
	}
	return false;
}


let score = localStorage.getItem("score")
let best_score = localStorage.getItem("best-score")

function Main() {
	const gameOver = useRef(false)
	const [tilesData, setTilesData] = useState(generateInitialState);
	const freeRenderingSlots = useRef<number[]>([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
	const [scores, setScores] = useState( localStorage.getItem("scores") || 
	{newScore: score !== null ? parseInt(score) : 0,
		bestScore: best_score !== null ? parseInt(best_score) : 0
	})

	useEffect(()=> {
		document.addEventListener("keyup", keyEventHandler);
		// localStorage.setItem("scores", JSON.stringify(scores));
		// localStorage.setItem("tilesData", JSON.stringify(tilesData))
		// localStorage.setItem("freeRenderingSlots", JSON.stringify(freeRenderingSlots))
		// return () => document.removeEventListener("keyup", keyEventHandler);
	}, [tilesData])

	const blockOtherEvents = useRef(false)
	// console.log(tilesData);

	const swipeStart = useRef({x: 0, y: 0})
	const playerWon = useRef(false)
	const gamePlayCount = useRef(0);

	function addNewTileData(tilesData, emptyIndexes: number[]) {
		let newTileIndex: number = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
		tilesData[newTileIndex].content = Math.random() >= 0.2 ? 2 : 4;
		tilesData[newTileIndex].renderingIndex = freeRenderingSlots.current.shift();
		if (freeRenderingSlots.current.length === 0 && !tilesCanStillMove(tilesData)) {
			gameOver.current = true;
			playerWon.current = false;
		}
		return [...tilesData];
	}

	function keyEventHandler(event: KeyboardEvent) {
		if (blockOtherEvents.current) return;
		blockOtherEvents.current = true;
		let dataChanged = false;
		let newTilesData = [];
		if (event.key === "ArrowUp") {
			[newTilesData, dataChanged] = updateTilesMovementData("up", tilesData);
		}else if (event.key === "ArrowDown") {
			[newTilesData, dataChanged] = updateTilesMovementData("down", tilesData);
		}else if (event.key === "ArrowLeft") {
			[newTilesData, dataChanged] = updateTilesMovementData("left", tilesData);
		}else if (event.key === "ArrowRight") {
			[newTilesData, dataChanged] = updateTilesMovementData("right", tilesData);
		};
		if (dataChanged) { // valid movement key was pressed and the tiles moved
			event.preventDefault();
			setTilesData([...newTilesData]);
		}else blockOtherEvents.current = false;
	}

	function touchStartHandler(event: TouchEvent) {
		swipeStart.current.x = event.changedTouches[0].clientX
		swipeStart.current.y = event.changedTouches[0].clientY
	}

	function touchEndHandler(event: TouchEvent) {
		let diffX = swipeStart.current.x - event.changedTouches[0].clientX;
		let diffY = swipeStart.current.y - event.changedTouches[0].clientY;
		// moveTilesByTouch(event, diffX, diffY, setUpTilesMovement)
	}

	// Updates tile data if at least one tile is to be added/merged to another
	function updateTileStateAfterAnimation(){
		if (!blockOtherEvents.current) return;
		let emptyTileIndexes = [];
		let newScoreObj = {...scores};
		for (let i=0; i<tilesData.length; i++) {
			if (!tilesData[i].content){
				emptyTileIndexes.push(i)
				continue;
			}
			tilesData[i].classAttr = tilesData[i].classAttr.slice(0, 13)
			if (tilesData[i].combinedTileData) {
				tilesData[i].content *= 2;
				freeRenderingSlots.current.push(tilesData[i].combinedTileData.renderingIndex);
				tilesData[i].combinedTileData = null;
				if (tilesData[i].content === 2048) {
					playerWon.current = true;
				}
				newScoreObj.newScore = newScoreObj.newScore + tilesData[i].content;
				newScoreObj.bestScore = newScoreObj.newScore > newScoreObj.bestScore ? newScoreObj.newScore : newScoreObj.bestScore
			}
		}
		let newUpdatedTilesData = addNewTileData(tilesData, emptyTileIndexes);
		blockOtherEvents.current = false;
		setScores(newScoreObj);
		setTilesData(newUpdatedTilesData);
	}
	
	function setNewGameData() {
		gameOver.current = false;
		setScores({newScore: 0, bestScore: 0});
		freeRenderingSlots.current = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
		setTilesData(generateNewGameState);
		gamePlayCount.current++;
	}

	return (
		<>
			<Header scores={scores}/>
	    <div className="container">
	    	<div id="quick-info">
					<p>Join the numbers and get to the <b>2048 tile!</b></p>
				</div>
				<button onClick={setNewGameData}>New Game</button>
			</div>
      <section onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler} onTransitionEnd={updateTileStateAfterAnimation}>
      	<div id="game-over-cover" className={gameOver.current ? "show" : ""}>
      		<p>{playerWon.current ? "You Win!" : "You Lost!"}</p>
      		<button onClick={setNewGameData}>Play again</button>
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
      	<GameTiles tilesData={tilesData} key={gamePlayCount.current}/>
      </section>
		</>
	)
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<Main/>
	</React.StrictMode>
)




/*


interface tileData {
	index: number,
	className: string,
	content: number,
	addedToIndex: number,
	mergeStatus: string
}



function createTilesHTML(gameData: tileData[], updateState: ()=>void, willMerge: {current: boolean}) {
	let addedCallback = false
	let jsx = gameData.map((data) => {
		if (!data){return null}
		const class_attr = data.className + ' ' + colors[data.content.toString()];

		if (data.addedToIndex !== -1 && !addedCallback){
			addedCallback = true;
			willMerge.current = true;
			// updateState Callback only added to one tile and the function will be called once to update all..
			// ..tiles that needs an update since all transitioning elements will finish transition at the same time
			return <div key={data.index} className={class_attr} onTransitionEnd={updateState}>{data.content}</div>
		}else {
			return <div key={data.index} className={class_attr}>{data.content}</div>
		}
	});
	return jsx;
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




function Main() {


	// Stores the index of elments containing undefined in renderedTiles state variable since removed tiles..
	// ..are set to undefined instead of actually removing it from the Array to keep renders consistent
	const emptyTileIndexes = useRef(JSON.parse(localStorage.getItem("emptyIndex") as string) || []);

	// Each element represents a specific position/cell on the grid and stores the index to a tile data in renderedTiles state variable.
	const possibleTilePos = useRef(JSON.parse(localStorage.getItem('tilePositions') as string) || Array(16));
	const swipeStart = useRef({x: 0, y: 0})
	const tilesWillMerge = useRef(false) // used to indicate that at least two tiles will merge after sliding.

	const moveEvents = useRef<"up"|"left"|"down"|"right"|null>(null);
	const gameStart = useRef(false) // Ref hook indicating initial start of game
	const playerWon = useRef(false)
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
		if (!gameOver) checkIfGameOver();
		if (gameOver) {
			localStorage.removeItem("score");
			localStorage.removeItem("tilesData")
			localStorage.removeItem("tilePositions")
			localStorage.removeItem("emptyIndexes")
		}else {
			localStorage.setItem("score", scores.newScore.toString());
			localStorage.setItem("tilesData", JSON.stringify(renderedTiles))
			localStorage.setItem("tilePositions", JSON.stringify(possibleTilePos.current))
			localStorage.setItem("emptyIndexes", JSON.stringify(emptyTileIndexes.current))
		}
		localStorage.setItem("best-score", scores.bestScore.toString());
		return () => document.removeEventListener("keyup", keyEventHandler);
	}, [renderedTiles, scores, emptyTileIndexes, possibleTilePos, gameOver])


	// Checks if there's at least two tiles left that can be merged else game over.
	function checkIfGameOver(){
		if (renderedTiles.length < 16){
			return;
		}
		if (tilesWillMerge.current){ // Some tiles content are not in their final value yet so checking them is invalid
			return;
		}
		let index: number = -1; // index of a tile. -1 is placeholder value
		let indexBefore: number = -1; // index of tile before a tile. -1 is placeholder value
		let indexUnder: number = -1; // index of tile under a tile. -1 is placeholder value
		for (let i=0; i<16; i+=4) {
			for (let j=i; j<(i+4); j++) { // loop through each horizontal row
				index = possibleTilePos.current[j]
				if (index === null || index === undefined) {return;}
				if (j !== i) { // loop isn't at the beginning of the row
					indexBefore = possibleTilePos.current[j-1]
					if (indexBefore === null || indexBefore === undefined) {return;}
					if (renderedTiles[index].content === renderedTiles[indexBefore].content) {
						return;
					}
				}
				if (j<12) {
					indexUnder = possibleTilePos.current[j+4]
					if (indexUnder === null || indexUnder === undefined) {return;}
					if (renderedTiles[index].content === renderedTiles[indexUnder].content) {
						return;
					}
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
		playerWon.current = false;
		updateTilesData(tilesData, false);
		updateTilesData(tilesData, false);
		setRenderedTiles(tilesData)
		setScores(scores => ({newScore: 0, bestScore: scores.bestScore}))
		setGameOver(false)
	}

}


*/