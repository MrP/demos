define(['jquery', 'underscore', 'ramda', 'backbone', 'rottenTomatoesMovieVariables', 'rottenTomatoesChartPainter', 'rottenTomatoesMovieLoader'], function($, _, ramda, Backbone, movieVariables, chartPainter, movieLoader){

	window.VariablesView = Backbone.View.extend({
		el: $("#variables"),
		events: {
			"change .variable": "changeVariable"
		},
		changeVariable: function(){
			alert('wat');
		},
		initialize: function(){
			this.collection = new Variables();
			this.render();
		},
		render: function(){
			this.collection.models.forEach(this.renderVariable.bind(this));
		},
		renderVariable: function(variable){
	        var variableView = new window.VariableView({
	            model: variable
	        });
	        this.$el.append(variableView.render().el);
        }
	});
	window.VariableView = Backbone.View.extend({
		tagName: 'li',
	    template: _.template($('#variableTemplate').html()),
	    render: function () {
	        this.$el.html(this.template(this.model.toJSON()));
	        return this;
	    }
	});
	window.ChartView = Backbone.View.extend({
		el: $("#chart"),
		initialize: function(){
		},
		render: function(){
			if(id){
				chartPainter.paintChart(movies.list, this.el, id);
			}else{
				this.el.innerHTML = '';
			}
		}
	});

	var Variable = Backbone.Model.extend({
		id: null,
		label: null,
		getVariable: null,
		binningFunction: null
	});
	var Variables = Backbone.Collection.extend({
		model: Variable,
		initialize: function (models, options) {
			var variables = ramda.map.idx(function(id, idx, list){
				var obj = list[id];
				obj['id'] = id;
				return obj;
			}, ramda.keys(movieVariables));
			this.add(variables);
		}
	});

	window.LoadingView = Backbone.View.extend({
		el: $("#loading"),
		initialize: function(){
		}
	});

	var movies = {list:[]};

	var loadData = function(){
		// $scope.loader = 'Loading data';

		var processJsonp = ramda.curry(function(url, data){
			// movies.list = movies.list.concat(ramda.reject(ramda.compose(_.isUndefined, ramda.prop('critics_rating'), ramda.prop('ratings')), data.movies));
			movies.list = movies.list.concat(movieLoader.getMovies(data));
			if(movieLoader.shouldLoadMoreMovies(data, movies.list)){
				var urlNext = movieLoader.getNextUrl(url, data);
				// $scope.loader += '...';
				if(movieLoader.useFallbackData){
					// $.get(urlNext);
					$.get(urlNext, {}, processJsonp(movieLoader.url), 'json');
				}else{
					// $.get(urlNext, {'params':movieLoader.paramsAPI});
					$.get(urlNext, movieLoader.paramsAPI, processJsonp(movieLoader.url), 'jsonp');
				}
			}else{
				//Remove loading overlay
				// angular.element(document.getElementById('loading')).remove();
				//Auto-select one variable
				// selectedVariable.id = Object.keys(variables)[0];
			}
		});

		if(movieLoader.useFallbackData){
			// $.ajaxSetup({dataType:'json', success:processJsonp(movieLoader.url)});
			$.get(movieLoader.url, {}, processJsonp(movieLoader.url), 'json');
		}else{
			// $.ajaxSetup({dataType:'jsonp', success:processJsonp(movieLoader.url)});
			$.get(movieLoader.url, movieLoader.paramsAPI, processJsonp(movieLoader.url), 'jsonp');
		}
	};
});



