define(['ramda', 'google', 'angular', 'rottenTomatoesMovieClassifier'], function(ramda, google, angular, movieClassifier){
	var rottenTomatoesApp = angular.module('rottenTomatoesApp', []);

	rottenTomatoesApp.factory('movies', function(){
		return {'list':[]};
	});

	rottenTomatoesApp.factory('variables', function(){
		return {
			'runtime': {
				'label': 'Runtime in minutes',
				'getVariable': ramda.prop('runtime'),
				'binningFunction': movieClassifier.numberBinFn
			},
			'releaseMonth': {
				'label': 'Release month',
				'getVariable': function(movie){
					return parseInt(movie.release_dates.theater.match(/-(\d\d)-/)[1], 10);
				},
				'binningFunction': movieClassifier.numberBinFn
			},
			'mpaaRating': {
				'label': 'MPAA rating',
				'getVariable': ramda.prop('mpaa_rating'),
				'binningFunction': movieClassifier.stringBinFn
			},
			'numberWordsTitle': {
				'label': 'Number of words in the title',
				'getVariable': function(movie){
					return movie.title.split(/\s/).length;
				},
				'binningFunction': movieClassifier.numberBinFn
			},
			'numberWordsSynopsis': {
				'label': 'Number of words in the synopsis',
				'getVariable': function(movie){
					return movie.synopsis.split(/\s/).length;
				},
				'binningFunction': movieClassifier.numberBinFn
			},
			'numberDigitsTitle': {
				'label': 'Number of digits in the title',
				'getVariable': function(movie){
					return movie.title.replace(/\D/g,'').length;
				},
				'binningFunction': movieClassifier.numberBinFn
			},
			'firstLetterTitle': {
				'label': 'First letter of the title',
				'getVariable': function(movie){
					return movie.title[0].toUpperCase();
				},
				'binningFunction': movieClassifier.stringBinFn
			}
		};
	});

	rottenTomatoesApp.factory('selectedVariable', function(){
		return {'id':null};
	});

	rottenTomatoesApp.controller('VariableListCtrl', ['$scope', 'variables', 'selectedVariable', function ($scope, variables, selectedVariable) {
		$scope.variables = variables;
		$scope.selectedVariable = selectedVariable;
	}]);

	rottenTomatoesApp.controller('LoadingCtrl', ['$scope', '$http', 'movies', 'variables', 'selectedVariable', function ($scope, $http, movies, variables, selectedVariable) {
		var urlAPI = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
		var useFallbackData = /https/.test(document.location.protocol);
		// From https we can't call http, and RT's API doesn't do https, so we'll load a bunch of static json files instead
		if(useFallbackData){
			urlAPI = 'in_theaters1.json';
		}
		var paramsAPI = {'apikey':'erwdg8fnngbwfw92krs7mw9w',
			'callback':'JSON_CALLBACK',
			'page_limit':'50'};

		$scope.loader = 'Loading data';

		//Gets the data from the server
		// this is the function that will be called from the JSONP response, automatically.  See its name in the
		// ajax GET URL
		var processJsonp = function(data){
			// Get rid of movies without ratings
			movies.list = movies.list.concat(ramda.reject(ramda.compose(angular.isUndefined, ramda.prop('critics_rating'), ramda.prop('ratings')), data.movies));
			if(data.links.next && movies.list.length<=100){ //Limit it to not hammer the API too much
				$scope.loader += '...';
				if(useFallbackData){
					$http.get(urlAPI.replace(/(\d)/, function(n){return ""+(parseInt(n, 10)+1);}))
						.success(processJsonp);
				}else{
					$http.jsonp(data.links.next, {'params':paramsAPI})
						.success(processJsonp);
				}
			}else{
				//Remove loading overlay
				angular.element(document.getElementById('loading')).remove();
				//Auto-select one variable
				selectedVariable.id = Object.keys(variables)[0];
			}
		};

		if(useFallbackData){
			$http.get(urlAPI)
				.success(processJsonp);
		}else{
			$http.jsonp(urlAPI, {'params':paramsAPI})
				.success(processJsonp);
		}

	}]);



	rottenTomatoesApp.controller('ChartCtrl', ['$scope', 'movies', 'variables', 'selectedVariable', function ($scope, movies, variables, selectedVariable) {
		var getDataArray = function(bins, label, getBinLabel/*(bin)*/){
			var bars = ramda.map(function(bin){
				return [getBinLabel(bin)].concat(ramda.values(movieClassifier.getRatingsFromBin(bin)));
			}, bins);

			var dataArray = [[label].concat(movieClassifier.ratingsLabels)].concat(bars);
			return ramda.reject(angular.isUndefined, dataArray);
		};

		$scope.$watch(function(){
			return selectedVariable.id;
		}, function(id){
			var elChart = document.getElementById('chart');
			if(id){
				var bins = movieClassifier.getVariableBins(movies.list, variables[id].getVariable, variables[id].binningFunction);
				var getBinLabel = ramda.compose(movieClassifier.getBinLabelFromValues, ramda.map(variables[id].getVariable));
				var data = google.visualization.arrayToDataTable(getDataArray(bins, variables[id].label, getBinLabel));
				var chart = new google.visualization.ColumnChart(elChart);
				chart.draw(data, {isStacked: true,
						hAxis: {title: variables[id].label},
						colors:['green', 'yellow', 'red']});
			}else{
				elChart.innerHTML = '';
			}
		});

	}]);

	return rottenTomatoesApp;
});



