'use strict';

/* Controllers */
var followmeControllers = angular.module('followmeControllers', []);

followmeControllers.controller('DimensionController', ['$scope',
	function ($scope, $rootScope) {
		
		$scope.shareURL = location.href + '#&room=' + UUID.get();
		
		$scope.imageURLField = 'http://www.free-sheet-music-downloads.com/freesheetmusic/behold_from_rocky_headland.gif';
		$scope.imageURL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
		
		var roomName = location.hash.replace(/^#.*?\&room=(.*?)(\&.*)?$/, '$1') || UUID.get();
		var roleName = (roomName == UUID.get() ? 'leader' : 'follower');
		
		var socket = io.connect();
		(function setupSocket(socket) {
			function updateState(data) {
				console.log('state-update', JSON.stringify(data));
				$scope.$apply(function() {
					$scope.imageURL = data.imageURL;
					$scope.imageURLField = data.imageURL;
					$scope.itemStyle = calculateElementPosition(
						$scope.getViewportSize(),
						data.percentVisible,
						data.ratio
					);
				});
			}
			
			socket.on('state-update', updateState);
			socket.on('restore-session', function(data) {
				if (data) {
					updateState(data);
				}
			});
			
			socket.on('room-count-update', function(count) {
				console.log('room-count-update', count);
			});
			
			socket.emit('subscribe', {
				uuid: UUID.get(),
				room: roomName,
				role: roleName
			});
			
			$scope.$on('$destroy', function() {
				socket.emit('unsubscribe', {
					room: roomName
				});
			});
			
			socket.emit('restore-session', {
				room: roomName
			});
		})(socket);
		
		// Initial item location
		// Width and height will be set when the image loads
		$scope.itemStyle = {
			left: 0,
			top: 0
		};
		
		$scope.init = function() {
			initItemSize();
			$scope.updateFollowerItemStyle();
		}
		
		$scope.setImageURL = function(url) {
			if (url && $scope.imageURL !== url) {
				$scope.imageURL = url;
				$scope.init();
			}
		}
		
		$scope.pxify = function(obj) {
			var pxObj = {};
			for (var i in obj) {
				pxObj[i] = obj[i] + 'px';
			}
			return pxObj;
		}
		
		var factor = 4;
		
		$scope.move = function(direction) {
			switch (direction) {
				case 'left':
					$scope.itemStyle.left += factor * 10;
					break;
				case 'right':
					$scope.itemStyle.left -= factor * 10;
					break;
				case 'up':
					$scope.itemStyle.top += factor * 10;
					break;
				case 'down':
					$scope.itemStyle.top -= factor * 10;
					break;
			}
			
			$scope.updateFollowerItemStyle();
		}
		
		$scope.zoom = function(direction) {
			var viewport = $scope.getViewportSize();
			var centerPoint = {
				x: viewport.width / 2,
				y: viewport.height / 2
			};
			
			$scope.zoomTowards(centerPoint, direction);
			$scope.updateFollowerItemStyle();
		}
		
		$scope.moveTowards = function(point) {
			var newCoordinates = limitEdges({
				left: point.x,
				top: point.y
			});
			
			$scope.itemStyle.left = newCoordinates.left;
			$scope.itemStyle.top = newCoordinates.top;
			$scope.updateFollowerItemStyle();
		}
		
		$scope.zoomTowards = function(point, direction) {
			var viewport = $scope.getViewportSize();
			var viewportPercentages = {
				x: point.x / viewport.width,
				y: point.y / viewport.height
			};
			
			var elemPosition = $scope.itemStyle;
			var newItemDimensions = getNewItemDimensions(direction);
			
			var percentagesVisible = getPercentagesVisible($scope.getViewportSize(), $scope.itemStyle);
			
			// What percentage of the item dimensions are fixed.
			// i.e. if it's {x: 0.5, y: 0.5}, then the center of the image should remain fixed for zoom.
			var fixedPercentages = {
				x: (percentagesVisible.stopX - percentagesVisible.startX) * viewportPercentages.x + percentagesVisible.startX,
				y: (percentagesVisible.stopY - percentagesVisible.startY) * viewportPercentages.y + percentagesVisible.startY
			}
			
			// How much the x value of the to-be-fixed point will shift when we zoom the image
			var xShift = fixedPercentages.x * (newItemDimensions.width - elemPosition.width);
			var yShift = fixedPercentages.y * (newItemDimensions.height - elemPosition.height);
			
			var correctedCoordinates = limitEdges({
				left: elemPosition.left - xShift,
				top: elemPosition.top - yShift
			});
			
			if (newItemDimensions.width < $scope.getViewportSize().width ||
				newItemDimensions.height < $scope.getViewportSize().height) {
				return;
			} else {
				$scope.itemStyle = {
					width: newItemDimensions.width,
					height: newItemDimensions.height,
					left: correctedCoordinates.left,
					top: correctedCoordinates.top
				};
				
				$scope.updateFollowerItemStyle();
			}
		}
		
		$scope.getViewportSize = function() {
			var e = window, a = 'inner';
			if (!('innerWidth' in window)) {
				a = 'client';
				e = document.documentElement || document.body;
			}
			
			return {
				width  : e[a+'Width'],
				height : e[a+'Height']
			};
		}
		
		function initItemSize() {
			var viewport = $scope.getViewportSize();
			
			var viewportRatio = getItemAspectRatio(viewport);
			var itemRatio = getItemAspectRatio($scope.itemStyle);
			
			if (itemRatio < viewportRatio) {
				$scope.itemStyle.width = viewport.width;
				$scope.itemStyle.height = viewport.width / itemRatio;
			} else {
				$scope.itemStyle.height = viewport.height;
				$scope.itemStyle.width = viewport.height * itemRatio;
			}
		}
		
		function getItemAspectRatio(itemStyle) {
			return itemStyle.width / itemStyle.height;
		}
		
		function getNewItemDimensions(zoomDirection) {
			var itemAspectRatio = getItemAspectRatio($scope.itemStyle);
			
			var currentWidth = $scope.itemStyle.width;
			var widthAdjust = (zoomDirection == 'in' ? 1 : -1) * factor * 10;
			
			var newWidth = currentWidth + widthAdjust;
			var newHeight = newWidth / itemAspectRatio;
			
			return {
				width: newWidth,
				height: newHeight
			};
		}
		
		function limitEdges(proposedCoordinates) {
			//return proposedCoordinates;
			
			// Don't allow dragging past the top or left edges
			var newLeft = Math.min(0, proposedCoordinates.left);
			var newTop = Math.min(0, proposedCoordinates.top);
			
			// Don't allow dragging past the bottom or right edges
			newLeft = Math.max(newLeft, -1 * ($scope.itemStyle.width - $scope.getViewportSize().width));
			newTop = Math.max(newTop, -1 * ($scope.itemStyle.height - $scope.getViewportSize().height));
			
			return {
				left: newLeft,
				top: newTop
			};
		}
		
		$scope.updateFollowerItemStyle = function() {
			if (roleName == 'follower') {
				return;
			}
			
			var percentagesVisible = getPercentagesVisible($scope.getViewportSize(), $scope.itemStyle);
			var aspectRatio = getItemAspectRatio($scope.itemStyle);
			
			socket.emit('state-update', {
				percentVisible: percentagesVisible,
				ratio: aspectRatio,
				imageURL: $scope.imageURL,
				room: roomName,
				role: roleName
			});
		}
	}
]);