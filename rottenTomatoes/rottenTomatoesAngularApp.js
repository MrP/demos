define(['ramda', 'google', 'angular'], function(ramda, google, angular){
	var rottenTomatoesApp = angular.module('rottenTomatoesApp', []);

	rottenTomatoesApp.factory('movies', function(){
		return {'list':[]};
	});

	rottenTomatoesApp.factory('variables', function(){
		// The string bin function will have a bin for each possible value,
		// so the pool of possible values should be sensible
		var stringBinFn = function(variableValue, values){
			values.sort(function(a, b){
				return a<b?-1:(a>b?1:0); //Comparing strings! Don't replace with a substraction
			});
			return ramda.uniq(values).indexOf(variableValue);
		};

		// Then number binning function puts numbers into at most 10 equally wide bins
		var numberBinFn = function(variableValue, values){
			var max = ramda.max(values);
			var min = ramda.min(values);
			// Cap the number of bins to 10
			var numBins = Math.min(10, max-min+1);
			var binWidth = (max-min)/numBins;
			var bins = ramda.range(0, numBins /*exclusive*/);
			return ramda.reduce(function(acc, bin){
				return variableValue >= min+binWidth*bin?bin:acc;
			}, 0, bins);

		};

		return {
			'runtime' : {'label':'Runtime in minutes', 'getVariable':ramda.prop('runtime'), 'binningFunction':numberBinFn},
			'releaseMonth' : {'label':'Release month', 'getVariable':function(movie){
				return parseInt(movie.release_dates.theater.match(/-(\d\d)-/)[1], 10);
			}, 'binningFunction':numberBinFn},
			'mpaaRating' : {'label':'MPAA rating', 'getVariable':ramda.prop('mpaa_rating'), 'binningFunction':stringBinFn},
			'numberWordsTitle' : {'label':'Number of words in the title', 'getVariable':function(movie){
				return movie.title.split(/\s/).length;
			}, 'binningFunction':numberBinFn},
			'numberWordsSynopsis' : {'label':'Number of words in the synopsis', 'getVariable':function(movie){
				return movie.synopsis.split(/\s/).length;
			}, 'binningFunction':numberBinFn},
			'numberDigitsTitle' : {'label':'Number of digits in the title', 'getVariable':function(movie){
				return movie.title.replace(/\D/g,'').length;
			}, 'binningFunction':numberBinFn},
			'firstLetterTitle' : {'label':'First letter of the title', 'getVariable':function(movie){
				return movie.title[0].toUpperCase();
			}, 'binningFunction':stringBinFn}
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
		var cloneObject = ramda.omit([]);
		var getBarLabelFromBin = function(getVariable/*(movie)*/, bin){
			return bin.length===0 ? ''
				: typeof getVariable(bin[0]) === 'string' ? getVariable(bin[0])
				: ramda.min(bin.map(getVariable)) + ' to ' + ramda.max(bin.map(getVariable));
		};

		var getDataArray = function(movies, label, getVariable/*(movie)*/, binningFunction/*(variableValue, values)*/){
			var ratingsBin = {'Rotten':0, 'Fresh':0, 'Certified Fresh':0};
			var ratingsLabels = Object.keys(ratingsBin);
			var moviesWithVariable = ramda.reject(ramda.compose(angular.isUndefined, getVariable), movies);
			var movieVariables = moviesWithVariable.map(getVariable);
			var bins = ramda.reduce(function(accBins, movie){
				var bin = binningFunction(getVariable(movie), movieVariables);
				accBins[bin] = accBins[bin] || [];
				accBins[bin].push(movie);
				return accBins;
			}, [], moviesWithVariable);

			var bars = bins.map(function(bin){
				var ratingsBins = ramda.reduce(function(accRatings, movie){
					accRatings[movie.ratings.critics_rating]++;
					return accRatings;
				}, cloneObject(ratingsBin), bin);

				return [getBarLabelFromBin(getVariable, bin)].concat(ramda.values(ratingsBins));
			});

			var dataArray = [[label].concat(ratingsLabels)].concat(bars);
			return ramda.reject(angular.isUndefined, dataArray);
		};

		$scope.$watch(function(){
			return selectedVariable.id;
		}, function(id){
			var elChart = document.getElementById('chart');
			if(id){
				var data = google.visualization.arrayToDataTable(getDataArray(movies.list, variables[id].label, variables[id].getVariable, variables[id].binningFunction));
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



