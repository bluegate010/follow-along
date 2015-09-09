/* Returns {startX, startY, stopX, stopY} as ints */
function getPointsVisible(viewport, elemPosition) {
	return {
		startX: -1 * elemPosition.left,
		startY: -1 * elemPosition.top,
		stopX:  Math.min(elemPosition.width, viewport.width - elemPosition.left),
		stopY:  Math.min(elemPosition.height, viewport.height - elemPosition.top)
	};
}

/* Returns {startX, startY, stopX, stopY} as percentages */
function getPercentagesVisible(viewport, elemPosition) {
	var pointsVisible = getPointsVisible(viewport, elemPosition);
	
	return {
		startX: pointsVisible.startX / elemPosition.width,
		startY: pointsVisible.startY / elemPosition.height,
		stopX:  pointsVisible.stopX  / elemPosition.width,
		stopY:  pointsVisible.stopY  / elemPosition.height
	};
}

/* Returns {width, height, left, top} */
function calculateElementPosition(viewport, percentagesVisible, aspectRatio) {
	var viewportRatio = viewport.width / viewport.height;
	
	var visibleHorizontalPercent = percentagesVisible.stopX - percentagesVisible.startX;
	var visibleVerticalPercent = percentagesVisible.stopY - percentagesVisible.startY;
	
	var visibleAspectRatio = (visibleHorizontalPercent / visibleVerticalPercent) * aspectRatio;
	
	if (visibleAspectRatio < viewportRatio) {
		// Extra content on sides
		var elemHeight = viewport.height / visibleVerticalPercent;
		var elemTop = -1 * elemHeight * percentagesVisible.startY;
		var elemWidth = elemHeight * aspectRatio
		
		// Assuming the viewport is wider than necessary, we readjust what percentages of the image should be visible
		var visibleHorizontalPoints = viewport.width;
		var revisedVisibleHorizontalPercent = visibleHorizontalPoints / elemWidth;
		var horizontalPercentageDiff = revisedVisibleHorizontalPercent - visibleHorizontalPercent;
		
		var revisedStartX = percentagesVisible.startX - horizontalPercentageDiff / 2;
		
		var elemLeft = -1 * elemWidth * revisedStartX;
	} else {
		// Extra content on top / bottom
		var elemWidth = viewport.width / visibleHorizontalPercent;
		var elemLeft = -1 * elemWidth * percentagesVisible.startX;
		var elemHeight = elemWidth / aspectRatio
		
		// Assuming the viewport is taller than necessary, we readjust what percentages of the image should be visible
		var visibleVerticalPoints = viewport.height;
		var revisedVisibleVerticalPercent = visibleVerticalPoints / elemHeight;
		var verticalPercentageDiff = revisedVisibleVerticalPercent - visibleVerticalPercent;
		
		var revisedStartY = percentagesVisible.startY - verticalPercentageDiff / 2;
		
		var elemTop = -1 * elemHeight * revisedStartY;
	}
	
	return {
		width: elemWidth,
		height: elemHeight,
		left: elemLeft,
		top: elemTop
	}
}