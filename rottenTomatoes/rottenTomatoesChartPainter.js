define(['ramda', 'google', 'rottenTomatoesMovieClassifier', 'rottenTomatoesMovieVariables'], function(ramda, google, movieClassifier, variables){
	var getDataArray = function(bins, label, getBinLabel/*(bin)*/){
		var bars = ramda.map(function(bin){
			return [getBinLabel(bin)].concat(ramda.values(movieClassifier.getRatingsFromBin(bin)));
		}, bins);

		var dataArray = [[label].concat(movieClassifier.ratingsLabels)].concat(bars);
		return movieClassifier.rejectUndefined(dataArray);
	};

	return {
		paintChart: ramda.curry(function(movies, elChart, variableId){
			if(variableId){
				var bins = movieClassifier.getVariableBins(movies, variables[variableId].getVariable, variables[variableId].binningFunction);
				var getBinLabel = ramda.compose(movieClassifier.getBinLabelFromValues, ramda.map(variables[variableId].getVariable));
				var data = google.visualization.arrayToDataTable(getDataArray(bins, variables[variableId].label, getBinLabel));
				var chart = new google.visualization.ColumnChart(elChart);
				chart.draw(data, {isStacked: true,
						hAxis: {title: variables[variableId].label},
						colors:['green', 'yellow', 'red']});
			}
		})
	};
});



