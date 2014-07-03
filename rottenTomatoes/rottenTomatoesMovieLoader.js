define(['ramda', 'rottenTomatoesMovieClassifier'], function(ramda, movieClassifier){
	var urlAPI = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
	var urlFallback = 'in_theaters1.json';
	var useFallbackData = /https/.test(document.location.protocol);
	// From https we can't call http, and RT's API doesn't do https, so we'll load a bunch of static json files instead
	if(useFallbackData){
		urlAPI = 'in_theaters1.json';
	}
	var paramsAPI = {'apikey':'erwdg8fnngbwfw92krs7mw9w',
		'callback':'JSON_CALLBACK',
		'page_limit':'50'};

	return {
		'useFallbackData': useFallbackData,
		'url': useFallbackData?urlFallback:urlAPI,
		'getNextUrl': function(url, data){
			if(useFallbackData){
				return url.replace(/(\d)/, function(n){
					return ""+(parseInt(n, 10)+1);
				});
			}else{
				return data.links.next;
			}
		},
		'paramsAPI': paramsAPI,
		'getMovies': function(data){
			// Get rid of movies without ratings
			return ramda.reject(ramda.compose(movieClassifier.isUndefined, ramda.prop('critics_rating'), ramda.prop('ratings')), data.movies);
		},
		'shouldLoadMoreMovies': function(data, movies){
			return data.links.next && movies.length<=100; //Limit it to not hammer the API too much
		}
	};
});



