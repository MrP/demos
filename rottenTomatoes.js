(function(){
	var urlAPI = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
	var paramsAPI = {'apikey':'erwdg8fnngbwfw92krs7mw9w', 
		'callback':'processJsonp',
		'page_limit':'50'};
		
	var dot = wu.autoCurry(function (prop, obj){
		return obj[prop];
	});
	
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
	
	function getDataArray(movies, label, getVariable/*(movie)*/, binFn/*(variableValue, values)*/){
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
			var barLabel = bin.length==0 ? ''
				: typeof getVariable(bin[0]) === 'string' ? getVariable(bin[0])
				: _.min(bin.map(getVariable))+ ' to ' +_.max(bin.map(getVariable));
			return [barLabel].concat(_.values(ratingsBin));
		}));
		return _.compact(dataArray);
	}
	
	// Sets up the application and deals with the DOM
	// getVariable This function knows how to extract the variable to plot from the movie data structure
	// binFn The binning function knows how to handle the variable type to sort the value in the right
	//       bin
	function addVariable(movies, label, getVariable/*movie*/, binFn/*variableValue, values*/){
		var variableId = 'variable'+$('#variables input').length;
		var html = _.template($('#variableTemplate').html(), {variableId:variableId, label:label});
		$('#variables').append(html);
		$('#'+variableId).on('change', function(){
			if($(this).prop('checked', true)){
				var data = google.visualization.arrayToDataTable(getDataArray(movies, label, getVariable, binFn));
				var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
				chart.draw(data, {isStacked: true, 
						hAxis: {title: label}, 
						colors:['green', 'yellow', 'red']});
			}
		});
	}
	
	function setupApp(movies){
		addVariable(movies, 'Runtime', dot('runtime'), numberBinFn);
		addVariable(movies, 'Release month', function(movie){
			return parseInt(movie.release_dates.theater.match(/-(\d\d)-/)[1], 10);
		}, numberBinFn);
		addVariable(movies, 'MPAA rating', dot('mpaa_rating'), stringBinFn);
		addVariable(movies, 'Number of words in the title', function(movie){
			return movie.title.split(/\s/).length;
		}, numberBinFn);
		addVariable(movies, 'Number of words in the synopsis', function(movie){
			return movie.synopsis.split(/\s/).length;
		}, numberBinFn);
		addVariable(movies, 'Number of digits in the title', function(movie){
			return movie.title.replace(/\D/g,'').length;
		}, numberBinFn);
		addVariable(movies, 'First letter of the title', function(movie){
			return movie.title[0].toUpperCase();
		}, stringBinFn);
		$('#loading').remove();
		$('#variables input')[0].click();
	}
	
	//Gets the data from the server
	var movies = [];
	// this is the function that will be called from the JSONP response, automatically.  See its name in the 
	// ajax GET URL
	function processJsonp(data){
		// Get rid of movies without ratings
		movies = movies.concat(_.reject(data.movies, _.compose(_.isUndefined, dot('critics_rating'), dot('ratings'))));
		if(data.links.next && movies.length<=100){ //Limit it to not hammer the API too much
			$('#loading').text($('#loading').text()+'...');
			$.get(data.links.next, paramsAPI);
		}else{
			setupApp(movies);
		}
	}
    
	google.load("visualization", "1", {packages:["corechart"]});
	$.ajaxSetup({dataType:'jsonp'});
	$.get(urlAPI, paramsAPI);  
})();
