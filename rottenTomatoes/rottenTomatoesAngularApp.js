define(['ramda', 'angular', 'rottenTomatoesMovieVariables', 'rottenTomatoesChartPainter', 'rottenTomatoesMovieLoader'], function(ramda, angular, movieVariables, chartPainter, movieLoader){
	var rottenTomatoesApp = angular.module('rottenTomatoesApp', []);

	rottenTomatoesApp.factory('movies', function(){
		return {'list':[]};
	});

	rottenTomatoesApp.factory('variables', function(){
		return movieVariables;
	});

	rottenTomatoesApp.factory('selectedVariable', function(){
		return {'id':null};
	});

	rottenTomatoesApp.controller('VariableListCtrl', ['$scope', 'variables', 'selectedVariable', function ($scope, variables, selectedVariable) {
		$scope.variables = variables;
		$scope.selectedVariable = selectedVariable;
	}]);

	rottenTomatoesApp.controller('LoadingCtrl', ['$scope', '$http', 'movies', 'variables', 'selectedVariable', function ($scope, $http, movies, variables, selectedVariable) {
		$scope.loader = 'Loading data';

		var processJsonp = ramda.curry(function(url, data){
			movies.list = movies.list.concat(movieLoader.getMovies(data));

			if(movieLoader.shouldLoadMoreMovies(data, movies.list)){
				$scope.loader += '...';
				var urlNext = movieLoader.getNextUrl(url, data);
				if(movieLoader.useFallbackData){
					$http.get(urlNext).success(processJsonp(urlNext));
				}else{
					$http.jsonp(urlNext, {'params':movieLoader.paramsAPI}).success(processJsonp(urlNext));
				}
			}else{
				//Remove loading overlay
				angular.element(document.getElementById('loading')).remove();
				//Auto-select one variable
				selectedVariable.id = Object.keys(variables)[0];
			}
		});

		if(movieLoader.useFallbackData){
			$http.get(movieLoader.url).success(processJsonp(movieLoader.url));
		}else{
			$http.jsonp(movieLoader.url, {'params':movieLoader.paramsAPI}).success(processJsonp(movieLoader.url));
		}

	}]);



	rottenTomatoesApp.controller('ChartCtrl', ['$scope', 'movies', 'selectedVariable', function ($scope, movies, selectedVariable) {
		$scope.$watch(function(){
			return selectedVariable.id;
		}, function(id){
			var elChart = document.getElementById('chart');
			if(id){
				chartPainter.paintChart(movies.list, elChart, id);
			}else{
				elChart.innerHTML = '';
			}
		});
	}]);

	return rottenTomatoesApp;
});



