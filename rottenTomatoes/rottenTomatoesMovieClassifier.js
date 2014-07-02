define(['ramda', 'rottenTomatoesMovieClassifier'], function(ramda){
	var isUndefined = function(value){return typeof value === 'undefined';};
	var cloneObject = ramda.omit([]);
	var initialRatings = {'Rotten':0, 'Fresh':0, 'Certified Fresh':0};
	var ratingsLabels = Object.keys(initialRatings);
	var rejectUndefined = ramda.reject(isUndefined);

	var getVariableBins = function(movies, getVariable/*(movie)*/, binningFunction/*(variableValue, values)*/){
		var moviesWithVariable = ramda.reject(ramda.compose(isUndefined, getVariable), movies);
		var movieVariables = moviesWithVariable.map(getVariable);
		var bins = ramda.reduce(function(accBins, movie){
			var bin = binningFunction(getVariable(movie), movieVariables);
			accBins[bin] = accBins[bin] || [];
			accBins[bin].push(movie);
			return accBins;
		}, [], moviesWithVariable);
		return rejectUndefined(bins);
	};

	var getBinLabelFromValues = function(binValues){
		if(binValues.length===0){
			return '';
		}else if(typeof binValues[0] === 'string'){
			return binValues[0];
		}else{
			var min = ramda.min(binValues);
			var max = ramda.max(binValues);
			if(min===max){
				return '' + min;
			}else{
				return min + ' to ' + max;
			}
		}
	};

	var getRatingsFromBin = function(bin){
		return ramda.reduce(function(accRatings, movie){
			accRatings[movie.ratings.critics_rating]++;
			return accRatings;
		}, cloneObject(initialRatings), bin);
	};

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
		'getRatingsFromBin': getRatingsFromBin,
		'getBinLabelFromValues': getBinLabelFromValues,
		'getVariableBins': getVariableBins,
		'ratingsLabels': ratingsLabels,
		'stringBinFn': stringBinFn,
		'numberBinFn': numberBinFn,
		'isUndefined': isUndefined,
		'rejectUndefined': rejectUndefined
	};
});



