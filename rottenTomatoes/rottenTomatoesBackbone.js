require.config({
  paths: {
    underscore: 'underscore',
    backbone: 'backbone',
    ramda: 'ramda',
    google: 'googlejsapi'
    jquery: 'jquery-2.1.1.min'
  },
  shim: {
    'underscore' : {'underscore' : '_'},
    'google' : {'exports' : 'google'},
  }
});

require(['google', 'backbone', 'rottenTomatoesBackboneApp'],
	function(google, backbone, rottenTomatoesAngularApp){
		//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
// 		window.name = "NG_DEFER_BOOTSTRAP!";
// 		angular.element(document.body);
		google.load("visualization", "1", {packages:["corechart"], 'callback': function(){
// 			angular.element().ready(function() {
// 				angular.resumeBootstrap([rottenTomatoesAngularApp['name']]);
// 			});
		}});
	}
);
