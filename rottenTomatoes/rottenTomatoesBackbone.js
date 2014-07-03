require.config({
  paths: {
    underscore: 'underscore',
    backbone: 'backbone',
    ramda: 'ramda',
    google: 'googlejsapi',
    jquery: 'jquery-2.1.1.min'
  },
  shim: {
    'underscore' : {'exports' : '_'},
    'google' : {'exports' : 'google'},
  }
});

require(['google', 'backbone', 'rottenTomatoesBackboneApp'],
	function(google, Backbone, rottenTomatoesBackboneApp){
		google.load("visualization", "1", {packages:["corechart"], 'callback': function(){
		    
		}});
	}
);
