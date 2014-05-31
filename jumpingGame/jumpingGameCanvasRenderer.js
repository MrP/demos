    var renderCanvas = function(dt){
        var floorColor = "#000";
        var backgroundColor = "#fff";
        clearOurCanvas();
        for(var i=0;i<numRows;i++){
            paintFloorInOurCanvas(rowY(i));
        }
        gameState.holes.forEach(paintHoleInOurCanvas);
        gameState.critters.forEach(paintCritterInOurCanvas);
        paintPlayerInOurCanvas(gameState.player);
    }
    
    var clearCanvas = function(canvas){
        
    };
    var paintFloor = function(canvas, height){
        
    };
    var paintHole = function(canvas, hole){
        
    };
    var paintCritter = function(canvas, critter){
        
    };
    var paintPlayer = function(canvas, player){
        
    };
    
    var canvas = document.getElementById("canvas");
    var clearOurCanvas = _.partial(clearCanvas, canvas);
    var paintFloorInOurCanvas = _.partial(paintFloor, canvas);
    var paintHoleInOurCanvas = _.partial(paintHole, canvas);
    var paintCritterInOurCanvas = _.partial(paintCritter, canvas);
    var paintPlayerInOurCanvas = _.partial(paintPlayer, canvas);
    
