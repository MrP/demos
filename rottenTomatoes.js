	//This section massages the data to generate the charts
    var dot = wu.autoCurry(function (prop, obj){
		return obj[prop];
    });
	var stringBinFn = function(value, values){
		values.sort(function(a, b){return a<b?-1:(a>b?1:0);});
		return _.uniq(values).indexOf(value);
	};
	var numberBinFn = function(value, values){
		var max = _.max(values), min = _.min(values);
		var numBins = Math.min(10, max-min+1);
		var currentBin = 0;
		for(var bin=0;bin<numBins;++bin){
			if(value>=min+(max-min)*bin/numBins){
				currentBin = bin;
			}
		}
		return currentBin;
	};
	function getDataArray(movies, label, getVariable/*movie*/, binFn/*variableValue, values*/){
		var validMovies = _.reject(movies, _.compose(_.isUndefined, getVariable));
		var bins = [];
		validMovies.forEach(function(movie){
			var b = binFn(getVariable(movie), validMovies.map(getVariable));
			bins[b] = bins[b] || [];
			bins[b].push(movie);
		});
		var ratings = ['Rotten', 'Fresh', 'Certified Fresh'];
		var dataArray = [[label].concat(ratings)].concat(bins.map(function(bin){
			var ratingsBin=_.object(ratings, [0,0,0]);
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
	
	//This section sets up the application and deals with the DOM
	function addVariable(movies, label, getVariable/*movie*/, binFn/*variableValue, values*/){
		var variableId = 'variable'+$('#variables input').length;
		$('#variables').append('<br><input type="radio" id="'+variableId+'" name="variableRadios" /><label for="'+variableId+'">'+label+'</label>');
		$('#'+variableId).on('change', function(){
			if($(this).prop('checked', true)){
				var data = google.visualization.arrayToDataTable(getDataArray(movies, label, getVariable, binFn));
				var chart = new google.visualization.ColumnChart(document.getElementById('chart'));
				chart.draw(data, {isStacked: true, hAxis: {title: label}, colors:['green', 'yellow', 'red']});
			}
		});
	}
    function setupApp(movies){
		addVariable(movies, 'Runtime', dot('runtime'), numberBinFn);
		addVariable(movies, 'Release month', function(m){return parseInt(m.release_dates.theater.match(/-(\d\d)-/)[1], 10);}, numberBinFn);
		addVariable(movies, 'MPAA rating', dot('mpaa_rating'), stringBinFn);
		addVariable(movies, 'Number of words in the title', function(m){return m.title.split(/\s/).length;}, numberBinFn);
		addVariable(movies, 'Number of words in the synopsis', function(m){return m.synopsis.split(/\s/).length;}, numberBinFn);
		addVariable(movies, 'Number of digits in the title', function(m){return m.title.replace(/\D/g,'').length;}, numberBinFn);
		addVariable(movies, 'First letter of the title', function(m){return m.title[0].toUpperCase();}, stringBinFn);
		$('#loading').remove();
		$('#variables input')[0].click();
    }
	
	//This section gets the data from the server
    var movies = [];
    function processJsonp(data){
		movies = movies.concat(_.reject(data.movies, _.compose(_.isUndefined, dot('critics_rating'), dot('ratings'))));
        if(data.links.next && movies.length<=100){
			$('#loading').text($('#loading').text()+'...');
			$.get(data.links.next+"&callback=processJsonp&apikey=erwdg8fnngbwfw92krs7mw9w");
		}else{
			setupApp(movies);
		}
    }
	google.load("visualization", "1", {packages:["corechart"]});
    $.ajaxSetup({dataType:'jsonp'});
    $.get('http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?apikey=erwdg8fnngbwfw92krs7mw9w&callback=processJsonp&page_limit=50');  
	
