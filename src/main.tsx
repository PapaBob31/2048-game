import * as React from "react"
import * as ReactDOM from "react-dom/client"
import {useState, useRef, useEffect} from "react"
import GameTiles from "./gameTiles"
import { updateTilesMovementData, generateInitialState, generateNewGameState, updateGameState } from "./utilities"

export interface tileData {
	content: number|null,
	classAttr: string,
	renderingIndex: number,
	combinedTileData: null|{content: number, renderingIndex: number}
}

function moveTilesByTouch(diffX: number, diffY: number, tilesData: tileData[]) {
	// pick the axis with the longest swipe if direction of swipe
	// is both horizontal and vertical e.g diagonal swipe
	let newTilesData:tileData[] = [];
	let dataChanged = false;
	if (Math.abs(diffX) > Math.abs(diffY)) {
		if (diffX > 20) {
			[newTilesData, dataChanged] = updateTilesMovementData("left", tilesData);
		}else if (diffX < -15) {
			[newTilesData, dataChanged] = updateTilesMovementData("right", tilesData);
		}
	}else if (Math.abs(diffY) > Math.abs(diffX)) {
		if (diffY > 20) {
			[newTilesData, dataChanged] = updateTilesMovementData("up", tilesData);
		}else if (diffY < -15) {
			[newTilesData, dataChanged] = updateTilesMovementData("down", tilesData);
		}
	}
	if (!dataChanged) newTilesData = []; // since empty list indicates no change in data as a result of movement
	return newTilesData;
}

interface gameScores {
	newScore: number,
	bestScore: number
}

function Header({scores} : {scores: gameScores}) {
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


function Main() {
	const gameOver = useRef(false)
	const [tilesData, setTilesData] = useState(generateInitialState);

	// possible values the renderingIndex attribute of any tilesData element can be assigned to at any time.
	const freeRenderingSlots = useRef<number[]>(
		JSON.parse(localStorage.getItem("freeRenderingSlots") as string) || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
	);
	const [scores, setScores] = useState( JSON.parse(localStorage.getItem("scores") as string) || {newScore: 0, bestScore: 0})
	const blockOtherEvents = useRef(false) // flag indicating at least one tile is moving from one position to another

	useEffect(()=> {
		document.addEventListener("keyup", keyEventHandler);
		if (!blockOtherEvents.current) {
			// save game state across browsing sessions
			localStorage.setItem("scores", JSON.stringify(scores));
			localStorage.setItem("tilesData", JSON.stringify(tilesData))
			localStorage.setItem("freeRenderingSlots", JSON.stringify(freeRenderingSlots.current))
		}
		return () => document.removeEventListener("keyup", keyEventHandler);
	}, [tilesData, blockOtherEvents.current])


	const swipeStart = useRef({x: 0, y: 0})
	const playerWon = useRef(false)
	const gamePlayCount = useRef(0); // Used to force the rerender of the GameTiles component

	function keyEventHandler(event: KeyboardEvent) {
		if (blockOtherEvents.current) return; // at least one tile is moving on screen
		blockOtherEvents.current = true; // tile movement is happening
		let dataChanged = false;
		let newTilesData:tileData[] = [];
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
		blockOtherEvents.current = true;
		let diffX = swipeStart.current.x - event.changedTouches[0].clientX;
		let diffY = swipeStart.current.y - event.changedTouches[0].clientY;
		let newData = moveTilesByTouch(diffX, diffY, tilesData);
		if (newData.length > 0) {
			setTilesData([...newData])
		}else blockOtherEvents.current = false;
		event.preventDefault();
	}

	function updateGameStateAfterAnimation(){
		if (!blockOtherEvents.current) return; // no tile movement occured so no need to update tile state
		let [newUpdatedTilesData, newScores, winState] = updateGameState(tilesData, scores, freeRenderingSlots.current)
		blockOtherEvents.current = false;
		if (winState !== null) {
			localStorage.clear();
			blockOtherEvents.current = true;
			gameOver.current = true;
		}
		if (winState === "player won") {
			playerWon.current = true;
		}else if (winState === "player lost") {
			playerWon.current = false;
		}
		setScores(newScores);
		setTilesData(newUpdatedTilesData);
	}
	
	function setNewGameData() {
		gameOver.current = false;
		setScores({newScore: 0, bestScore: 0});
		freeRenderingSlots.current = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
		setTilesData(generateNewGameState);
		gamePlayCount.current++;
		blockOtherEvents.current = false;
		localStorage.clear();
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
      <section onTouchStart={touchStartHandler} onTouchEnd={touchEndHandler} onTransitionEnd={updateGameStateAfterAnimation}>
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