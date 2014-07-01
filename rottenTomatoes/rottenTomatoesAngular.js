require.config({
  paths: {
    jquery: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min',
    underscore: '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min',
    angular: '//ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.13/angular.min',
    ramda: '//rawgit.com/CrossEye/ramda/master/ramda',
    google: 'googlejsapi'
  },
  shim: {
    'underscore': {exports: "_"},
    'angular' : {'exports' : 'angular'},
    'google' : {'exports' : 'google'},
  }
});

require(['underscore', 'jquery', 'ramda', 'google', 'angular', 'rottenTomatoesAngularApp'], 
	function(_, $, ramda, google, angular, rottenTomatoesAngularApp){
		google.load("visualization", "1", {packages:["corechart"], 'callback':angular.noop});

		//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
		window.name = "NG_DEFER_BOOTSTRAP!";
		angular.element(document.body);
	
		angular.element().ready(function() {
			angular.resumeBootstrap([rottenTomatoesAngularApp['name']]);
		});
	}
);
