define(['underscore', 'jquery', 'ramda', 'google', 'angular'], function(_, $, ramda, google, angular){
	var rottenTomatoesApp = angular.module('rottenTomatoesApp', []);

	rottenTomatoesApp.factory('movies', function(){
		return {'list':[]};
	});

	rottenTomatoesApp.factory('variables', function(){
		// The string bin function will have a bin for each possible value,
		// so the pool of possible values should be sensible
		var stringBinFn = function(variableValue, values){
			values.sort(function(a, b){
				return a<b?-1:(a>b?1:0);
			});
			return _.uniq(values).indexOf(variableValue);
		};

		// Then number binning function puts numbers into at most 10 equally wide bins
		var numberBinFn = function(variableValue, values){
			var max = _.max(values);
			var min = _.min(values);
			// Cap the number of bins to 10
			var numBins = Math.min(10, max-min+1);
			var currentBin = 0;
			var binWidth = (max-min)/numBins;
			for(var bin=0;bin<numBins;++bin){
				if(variableValue >= min+binWidth*bin){
					currentBin = bin;
				}
			}
			return currentBin;
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

	rottenTomatoesApp.controller('VariableListCtrl', ['$scope', '$rootScope', 'variables', 'selectedVariable', function ($scope, $rootScope, variables, selectedVariable) {
		$scope.variables = variables;
		$scope.selectedVariableId = Object.keys(variables)[0];
		$scope.change = function(variableId){
			selectedVariable.id = variableId;
			// $rootScope.$digest();
		};
		$scope.$watch(function(){return $scope.selectedVariableId;}, function(newValue, oldValue){
			if(newValue!==oldValue){
				selectedVariable.id = newValue;
			}
		});
	}]);



	rottenTomatoesApp.controller('LoadingCtrl', ['$scope', '$rootScope', 'movies', 'variables', 'selectedVariable', function ($scope, $rootScope, movies, variables, selectedVariable) {
		var urlAPI = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
		var useFallbackData = /https/.test(document.location.protocol);
		if(useFallbackData){
			urlAPI = 'in_theaters1.json';
		}
		var paramsAPI = {'apikey':'erwdg8fnngbwfw92krs7mw9w',
			'callback':'processJsonp',
			'page_limit':'50'};

		$scope.loader = '';

		//Gets the data from the server
		// this is the function that will be called from the JSONP response, automatically.  See its name in the
		// ajax GET URL
		var processJsonp = function(data){
			// Get rid of movies without ratings
			movies.list = movies.list.concat(_.reject(data.movies, _.compose(_.isUndefined, ramda.prop('critics_rating'), ramda.prop('ratings'))));
			if(data.links.next && movies.list.length<=100){ //Limit it to not hammer the API too much
				$scope.loader += '...';
				if(useFallbackData){
					$.get(urlAPI.replace(/(\d)/, function(n){return ""+(parseInt(n, 10)+1);}));
				}else{
					$.get(data.links.next, paramsAPI);
				}
			}else{
				$('#loading').remove();
				// selectedVariable.id = Object.keys(variables)[0];
			}
			$rootScope.$digest();
		};

		if(useFallbackData){
			$.ajaxSetup({dataType:'json', success:processJsonp});
			$.get(urlAPI);
		}else{
			$.ajaxSetup({dataType:'jsonp', success:processJsonp});
			$.get(urlAPI, paramsAPI);
		}

	}]);

	rottenTomatoesApp.controller('ChartCtrl', ['$scope', 'movies', 'variables', 'selectedVariable', function ($scope, movies, variables, selectedVariable) {
		var getDataArray = function(movies, label, getVariable/*(movie)*/, binFn/*(variableValue, values)*/){
			var validMovies = _.reject(movies, _.compose(_.isUndefined, getVariable));
			var bins = [];
			validMovies.forEach(function(movie){
				var b = binFn(getVariable(movie), validMovies.map(getVariable));
				bins[b] = bins[b] || [];
				bins[b].push(movie);
			});
			var ratings = ['Rotten', 'Fresh', 'Certified Fresh'];
			var dataArray = [[label].concat(ratings)].concat(bins.map(function(bin){
				var ratingsBin = _.object(ratings, [0,0,0]);
				bin.forEach(function(m){
					ratingsBin[m.ratings.critics_rating]++;
				});
				var barLabel = bin.length===0 ? ''
					: typeof getVariable(bin[0]) === 'string' ? getVariable(bin[0])
					: _.min(bin.map(getVariable))+ ' to ' +_.max(bin.map(getVariable));
				return [barLabel].concat(_.values(ratingsBin));
			}));
			return _.compact(dataArray);
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



