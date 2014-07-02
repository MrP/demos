define(['jquery', 'ramda', 'backbone', 'rottenTomatoesMovieVariables', 'rottenTomatoesChartPainter'], function($, ramda, Backbone, movieVariables, chartPainter){

	window.LoadingView = Backbone.View.extend({
		el: $("#loading")
	});
	window.VariablesView = Backbone.View.extend({
		el: $("#variables"),
		events: {
			"change .variable": "changeVariable"
		},
		changeVariable: function(){
			alert('wat');
		},
		initialize: function () {
			this.variables = new Variables( null, { view: this }); //?????
		}
	});
	window.ChartView = Backbone.View.extend({
		el: $("#chart")
	});

	var Variable = Backbone.Model.extend({
		id: null,
		label: null,
		getVariable: null,
		binningFunction: null
	});
	var Variables = Backbone.Collection.extend({
		initialize: function (models, options) {
			this.bind("add", options.view.addFriendLi);
		}
	});

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



