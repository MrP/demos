define(['ramda', 'rottenTomatoesMovieClassifier'], function(ramda, movieClassifier){
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



