require.config({
  paths: {
    angular: '//ajax.googleapis.com/ajax/libs/angularjs/1.3.0-beta.13/angular.min',
    ramda: '//rawgit.com/CrossEye/ramda/master/ramda',
    google: 'googlejsapi'
  },
  shim: {
    'angular' : {'exports' : 'angular'},
    'google' : {'exports' : 'google'},
  }
});

require(['google', 'angular', 'rottenTomatoesBackboneApp'],
	function(google, angular, rottenTomatoesAngularApp){
		//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
		window.name = "NG_DEFER_BOOTSTRAP!";
		angular.element(document.body);
		google.load("visualization", "1", {packages:["corechart"], 'callback': function(){
			angular.element().ready(function() {
				angular.resumeBootstrap([rottenTomatoesAngularApp['name']]);
			});
		}});
	}
);
