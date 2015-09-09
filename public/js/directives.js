'use strict';

/* Directives */
var followmeDirectives = angular.module('followmeDirectives', []);

followmeDirectives.directive('fmDraggable', function() {
	
	// Patterned after https://docs.angularjs.org/guide/directive
	function setupDrag($scope, element) {
		var hammer = Hammer(element);
		var startX = 0, startY = 0;
		
		hammer.on('dragstart', function(event) {
			event.preventDefault();
			
			if (!event.gesture) {
				return;
			}
			
			startX = event.gesture.center.pageX - $scope.itemStyle.left;
			startY = event.gesture.center.pageY - $scope.itemStyle.top;
			hammer.on('drag', drag);
			hammer.on('dragend', dragend);
		});
		
		function drag(event) {
			event.preventDefault();
			
			if (!event.gesture) {
				return;
			}
			
			$scope.$apply(function() {
				$scope.moveTowards({
					x: event.gesture.center.pageX - startX,
					y: event.gesture.center.pageY - startY
				});
			});
		}
		
		function dragend(event) {
			event.preventDefault();
			hammer.off('drag', drag);
			hammer.off('dragend', dragend);
		}
	}
	
	function setupZoom($scope, element) {
		var hammer = Hammer(element);
		
		hammer.on('pinch', function(event) {
			event.preventDefault();
			$scope.$apply(function() {
				var center = {
					x: event.gesture.center.pageX - event.target.parentElement.offsetLeft,
					y: event.gesture.center.pageY - event.target.parentElement.offsetTop,
				};
				
				var direction = event.gesture.scale < 1.0 ? 'out' : 'in';
				
				$scope.zoomTowards(center, direction);
			});
		});
	}
	
	return {
		restrict: 'A',
		link: function($scope, element, attrs) {
			setupDrag($scope, element[0]);
			setupZoom($scope, element[0]);
		}
	};
});

followmeDirectives.directive('fmGetDimensions', function() {
	return {
		restrict: 'A',
		link: function($scope, element, attrs) {
			if (element[0].tagName.toLowerCase() != 'img') {
				return;
			}
			
			element.bind('load', function() {
				$scope.$apply(function() {
					$scope.itemStyle.width = element[0].width;
					$scope.itemStyle.height = element[0].height;
					$scope.init();
				});
			});
		}
	};
});

// From http://microblog.anthonyestebe.com/2013-11-30/window-resize-event-with-angular/
followmeDirectives.directive('fmResizable', function($window) {
	return function($scope) {
		return angular.element($window).bind('resize', function() {
			$scope.$apply(function() {
				$scope.updateFollowerItemStyle();
			});
		});
	};
});