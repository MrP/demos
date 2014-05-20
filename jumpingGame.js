(function(_, $){
    var numRows = 6;
    var levelWidth = 320;
    var speed = 50;
    var holeWidth = 32;
    var critterWidth = 16;
    var playerWidth = 16
    var rowHeight = 64;

    var gameState = {
        level: 0,
        livesLeft: 3,
        player: {
            row:0,
            position:0,
            jumpingFor: 0,
            fallingFor: 0,
            stunnedFor: 0,
            speed:0
        },
        maxRow:0,
        holes: [],
        critters: [],
        
    };
    var generateLevel = function(gameState){
        gameState.holes = [];
        gameState.critters = [];
        gameState.generateHole = _.partial(generateMovingObject, getRandomRowBalancedGenerator());
        gameState.generateCritter = _.partial(generateMovingObject, getRandomRowBalancedGenerator());
        for(var i=0;i<numRows+gameState.level;i+=1){
            gameState.holes.push(gameState.generateHole());
        }
        for(i=0;i<gameState.level-1;i+=1){
            gameState.critters.push(gameState.generateCritter());
        }
        gameState.player.jumpingFor = 0;
        gameState.player.fallingFor = 0;
        gameState.player.stunnedFor = 0;
        gameState.player.speed = 0;
        gameState.player.row = 0;
        gameState.maxRow = 0;
    };
    var generateMovingObject = function(generateRowFunction){
        return {
            row: generateRowFunction(),
            position: randomPosition(),
            speed: randomSign()*speed
        };
    };
    var rand = function(max){
        return Math.floor(Math.random() * max);
    };
    var randomRow = _.partial(rand, numRows);
    var randomPosition = _.partial(rand, levelWidth);
    var randomSign = function(){
        return (rand(2)-0.5)*2;
    };
    var getRandomRowBalancedGenerator = function(){
        var exceptedRows = []
        var ret = function(){
            var r = rand(numRows-exceptedRows.length);
            for(var i=0;i<numRows;i+=1){
                if(exceptedRows.indexOf(i) !== -1){
                    r+=1;
                }
                if(exceptedRows.indexOf(r) === -1){
                    exceptedRows.push(r);
                    if(exceptedRows.length>=numRows){
                        exceptedRows = [];
                    }
                    return r;
                }
            }
        };
        return ret;
    }
    var timestamp = function() {
        return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
    };
    
    var moveObject = function(dt, obj){
        obj.position = (obj.position + obj.speed * dt + levelWidth)%levelWidth;
    };
    
    var minZero = _.partial(Math.min, 0);
    
    var updateGameState = function(dt){
        var move = _.partial(moveObject, dt);
        gameState.holes.forEach(move);
        gameState.critters.forEach(move);
        if(gameState.player.fallingFor){
            gameState.player.fallingFor = minZero(gameState.player.fallingFor-dt);
        }
        if(gameState.player.jumpingFor){
            gameState.player.jumpingFor = minZero(gameState.player.jumpingFor-dt);
            // level up
            if(gameState.player.jumpingFor===0 && gameState.player.row>=numRows){
                gameState.level +=1;
                generateLevel(gameState);
            } else if(between(gameState.player.jumpingFor, 0.4, 0.6) && !gameState.holes.some(_.partial(collidesHole, gameState.player))){
                //check collision against ceiling
                gameState.player.stunnedFor += 1;
                gameState.player.fallingFor = 1-gameState.player.jumpingFor;
                gameState.player.jumpingFor = 0;
            }
        }
        if(gameState.player.stunnedFor){
            gameState.player.stunnedFor = minZero(gameState.player.stunnedFor-dt);
        }
        if(canMove(gameState.player)){
            move(gameState.player);
        }
        if(canFall(gameState.player) && gameState.holes.some(_.partial(collidesHole, gameState.player))){
            gameState.player.fallingFor = 1;
            gameState.player.row -=1;
            return
        }
        if(canBeBitten(gameState.player) && gameState.critters.some(_.partial(collidesCritter, gameState.player))){
            gameState.player.stunnedFor += 1;
            return
        }
    };
    var between = function(num, left, right){
        return num>left && num<right;
    };
    var collides = function(width, player, obj){
        return player.row===obj.row && between(player.position, obj.position - width/2, obj.position + width/2);
    }
    var collidesHole = _.partial(collides, holeWidth);
    var collidesCritter = _.partial(collides, critterWidth);
    var canMove = function(player){
        return player.stunnedFor===0 && player.jumpingFor===0 && player.fallingFor===0;
    };
    var canFall = function(player){
        return player.jumpingFor===0 && player.fallingFor===0;
    };
    var canBeBitten = function(player){
        return player.jumpingFor===0 && player.fallingFor===0;
    };
    var playerStanding = function(player){
        return !player.jumpingFor  && !player.fallingFor;
    };
    var playerCanInteract = function(player){
        return !player.stunnedFor && playerStanding(player);
    };
    var leftInteraction = function(player){
        if(canMove(player)){
            player.speed = -speed;
        }
    };
    var rightInteraction = function(player){
        if(canMove(player)){
            player.speed = speed;
        }
    };
    var jumpInteraction = function(player){
        if(canMove(player)){
            player.speed = 0;
            player.jumpingFor = 1;
            player.row += 1;
        }
    };
    var stopInteraction = function(player){
        player.speed = 0;
    };
    var setupInteraction = function(){
        $(window).on("keydown", function(event){
            if(event.which===37){
                leftInteraction(gameState.player);
            }else if(event.which===39){
                rightInteraction(gameState.player);
            }else if(event.which===38){
                jumpInteraction(gameState.player);
            }
        });
        $(window).on("keyup", function(key){
            stopInteraction(gameState.player);
        });
    };
    
    var gameTick = function(now) {
      var dt = Math.min(1, (now - last) / 1000);
      updateGameState(dt);
      renderDOM(dt);
      last = now;
      rafID = window.requestAnimationFrame(gameTick);
    }
    
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
    
    
    var renderDOM = function(dt){
        var floorColor = "#000";
        var backgroundColor = "#fff";
        clearOurDOM();
        for(var i=0;i<numRows;i++){
            paintFloorInOurDOM(i);
        }
        gameState.holes.forEach(paintHoleInOurDOM);
        gameState.critters.forEach(paintCritterInOurDOM);
        paintPlayerInOurDOM(gameState.player);
    }
    
    var clearDOM = function(gameDiv){
        gameDiv.innerHTML = "";
    };
    var paintFloorDOM = function(gameDiv, row){
        var $floor = $('<div class="floor"></div>');
        $floor.css({top:""+rowY(row)+"px"});
        $(gameDiv).append($floor);
    };
    var paintHoleDOM = function(gameDiv, hole){
        var $hole = $('<div class="hole"></div>');
        $hole.css({top:""+holeY(hole)+"px", left:""+holeX(hole)+"px"});
        $(gameDiv).append($hole);
    };
    var paintCritterDOM = function(gameDiv, critter){
        var $critter = $('<div class="critter"></div>');
        $critter.css({bottom:""+critterY(critter)+"px", left:""+critterX(critter)+"px"});
        $(gameDiv).append($critter);
    };
    var paintPlayerDOM = function(gameDiv, player){
        var $player = $('<div id="player"></div>');
        $player.css({bottom:""+playerY(player)+"px", left:""+playerX(player)+"px"});
        $(gameDiv).append($player);
    };
    
    var gameDiv = document.getElementById("game");
    var clearOurDOM = _.partial(clearDOM, gameDiv);
    var paintFloorInOurDOM = _.partial(paintFloorDOM, gameDiv);
    var paintHoleInOurDOM = _.partial(paintHoleDOM, gameDiv);
    var paintCritterInOurDOM = _.partial(paintCritterDOM, gameDiv);
    var paintPlayerInOurDOM = _.partial(paintPlayerDOM, gameDiv);
    
    
    var rowY = _.partial(function(numRows, rowHeight, row){
        return row*rowHeight+32;
    }, numRows, rowHeight);
    var objYHeight = function(height, obj){
        return rowY(obj.row)-height;
    };
    var holeY = _.partial(objYHeight, 0);
    var critterY = _.partial(objYHeight, 30);
    var playerY = _.partial(objYHeight, 30);
    
    var objXWidth = function(width, obj){
        return obj.position-width/2;
    };
    var holeX = _.partial(objXWidth, 32);
    var critterX = _.partial(objXWidth, critterWidth);
    var playerX = _.partial(objXWidth, playerWidth);
    
    
    generateLevel(gameState);
    setupInteraction();
    var last = timestamp();
    var rafID = window.requestAnimationFrame(gameTick);    
    
    
})(_, jQuery);
