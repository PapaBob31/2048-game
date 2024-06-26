import type { tileData } from "./main"

interface colorType {
	[index: string]: string
}

const colors:colorType = {
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

export default function GameTiles({tilesData} : {tilesData: tileData[]}) {
	let renderedTiles: any[] = [
		null, null, null, null, null, null, null, null,
		null, null, null, null, null, null, null, null
	];

	for (let i=0; i<16; i++) {
		let data = tilesData[i];
		let key = `${tilesData[i].renderingIndex}-${tilesData[i].content}`;

		if (data.combinedTileData) { // a tile has been merged with the current tile
			let mergedData = data.combinedTileData
			let mergedDataKey = `${mergedData.renderingIndex}-${mergedData.content}`
			renderedTiles[data.renderingIndex] = (
				<div key={key} className={`${data.classAttr} ${colors[data.content as number]}`}>{data.content}</div>
			)
			renderedTiles[mergedData.renderingIndex] = (
				<div key={mergedDataKey} className={`${data.classAttr} ${colors[mergedData.content]}`}>{mergedData.content}</div>
			)
		}else if (data.renderingIndex > -1) { // tile has content to be rendered but nor tile was merged with it
			renderedTiles[data.renderingIndex] = <div key={key} className={`${data.classAttr} ${colors[data.content as number]}`}>{data.content}</div>
		}
	}
	return <>{renderedTiles}</>
}
