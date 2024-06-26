import type { tileData } from "./main"

export function updateTilesMovementData(direction: "up"|"down"|"left"|"right", tilesData: tileData[]): [tileData[], boolean] {
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
	let loopCount=0, edgeIndex=startingIndex, n=startingIndex + tileStep;

	while (true) {
		if (loopCount !== 0 && loopCount % 3 === 0) {
			startingIndex += rowStep;
			edgeIndex = startingIndex;
			n = startingIndex + tileStep; // starts iteration at position after the position at the edge
		}

		if (tilesData[n].content) {
			if (tilesData[edgeIndex].content === tilesData[n].content) {
				tilesData[edgeIndex].combinedTileData = {
					renderingIndex: tilesData[n].renderingIndex, 
					content: tilesData[n].content as number
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
		loopCount++;
		n+=tileStep;
		if (loopCount === 12) break;
	}
	return [tilesData, changeOccured];
}


// generates initial game state i.e creates rendering data for 2 random tile
export function generateInitialState() {
	const data = JSON.parse(localStorage.getItem('tilesData') as string)
	if (data) {
		return data
	}
	let tilesPositionsData:tileData[] = [];
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
			classAttr: `horz-${htc} vert-${vtc}`, // css class name
			renderingIndex: [randomNum1, randomNum2].includes(i) ? availRenderingSlot : -1, // index of the tile when rendered in an array. also indicates tile will be rendered
			combinedTileData: null,
		})
		if (i === randomNum1 || i === randomNum2) {
			availRenderingSlot++;
		}
		vtc++;
	}
	return tilesPositionsData;
}


// generates new game state i.e creates rendering data for 2 random tiles and 
// removes every other tile data besides the two just created
export function generateNewGameState(prevGameTilesData: tileData[]) {
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
		prevGameTilesData[randIndex].renderingIndex = availRenderingSlots.pop() as number;
	}
	return prevGameTilesData
}

// checks if there are adjacent tiles with the same content
function tilesCanStillMove(gameTilesData: tileData[]) {
	for (let i=0; i<16; i++) {
		if (i<12 && gameTilesData[i].content === gameTilesData[i+4].content) { // 2 adjacent tiles on the same column have same content
			return true;
		}
		if (i % 4 === 3) { // 3, 7, 11, 15. Tiles at the right edge of the grid
			continue; // prevents checking edge tiles against tiles on another row
		}
		if (gameTilesData[i].content === gameTilesData[i+1].content) { // 2 adjacent tiles on the same row have same content
			return true
		}
	}
	return false;
}

type combinedTileData = {content: number, renderingIndex: number};
function ensureUniqueKeyForNewTile(tilesData: tileData[], newTileIndex: number, removedTiles: combinedTileData[]) {
	removedTiles.forEach(tile => {
		if (tile.renderingIndex === tilesData[newTileIndex].renderingIndex) {
			let newContent = tilesData[newTileIndex].content
			if (newContent === tile.content && newContent === 2){
				tilesData[newTileIndex].content = 4
			}else if (newContent === tile.content && newContent === 4) {
				tilesData[newTileIndex].content = 2
			}
		}
	})
	return tilesData;
}

// Updates tile data if at least one tile is to be added/merged to another
export function updateGameState(tilesData: tileData[], currGameScores: gameScores, emptyRenderSlots: number[]){
	let emptyTileIndexes = [];
	let newScoreObj = {...currGameScores};
	let removedTilesData:combinedTileData[] = [];
	let winState:string|null = null

	for (let i=0; i<tilesData.length; i++) {
		if (!tilesData[i].content){
			emptyTileIndexes.push(i)
			continue;
		}
		tilesData[i].classAttr = tilesData[i].classAttr.slice(0, 13)
		if (tilesData[i].combinedTileData !== null) {
			(tilesData[i].content as number) *= 2;
			emptyRenderSlots.push((tilesData[i].combinedTileData as combinedTileData).renderingIndex);
			removedTilesData.push(tilesData[i].combinedTileData as combinedTileData)
			tilesData[i].combinedTileData = null;
			if (tilesData[i].content === 2048) {
				winState = "player won"
			}
			newScoreObj.newScore = newScoreObj.newScore + (tilesData[i].content as number);
			newScoreObj.bestScore = newScoreObj.newScore > newScoreObj.bestScore ? newScoreObj.newScore : newScoreObj.bestScore
		}
	}
	let newUpdatedTilesData = [...tilesData]
	if (emptyTileIndexes.length > 0) {
		let newTileIndex: number = emptyTileIndexes[Math.floor(Math.random() * emptyTileIndexes.length)];
		tilesData[newTileIndex].content = Math.random() >= 0.2 ? 2 : 4;
		tilesData[newTileIndex].renderingIndex = emptyRenderSlots.shift() as number;
		newUpdatedTilesData = ensureUniqueKeyForNewTile(newUpdatedTilesData, newTileIndex, removedTilesData);
	}
	
	if (emptyRenderSlots.length === 0 && !tilesCanStillMove(tilesData)) {
		winState = "player lost"
	}

	return [newUpdatedTilesData, newScoreObj, winState]	
}