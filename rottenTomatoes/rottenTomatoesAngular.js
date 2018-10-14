require.config({
  paths: {
    angular: '//ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.13/angular.min',
    ramda: '//cdn.jsdelivr.net/npm/ramda@0.25.0/dist/ramda.min.js',
    google: 'googlejsapi'
  },
  shim: {
    'angular' : {'exports' : 'angular'},
    'google' : {'exports' : 'google'},
  }
});

window.name = "NG_DEFER_BOOTSTRAP!";
require(['google', 'angular', 'rottenTomatoesAngularApp'],
	function(google, angular, rottenTomatoesAngularApp){
		//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
		angular.element(document.body);
		google.load("visualization", "1", {packages:["corechart"], 'callback': function(){
			angular.element().ready(function() {
				angular.resumeBootstrap([rottenTomatoesAngularApp['name']]);
			});
		}});
	}
);
