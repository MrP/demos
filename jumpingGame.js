(function(_, $, window){
    var gameState = {
        speed: 50,
        numRows: 6,
        width: 320,
        height: 400,
        level: 0,
        livesLeft: 3,
        player: {
            width: 35,
            height: 30,
            row:0,
            position:160,
            jumpingFor: 0,
            fallingFor: 0,
            stunnedFor: 0,
            speed:0
        },
        maxRow:0,
        holes: [],
        critters: [],
        rowHeight: 64
    };
    
    var holeMakesLevelUnsolvable = function(gameState, hole){
        var holesAbove = gameState.holes.filter(function(h){return h.row===hole.row+1;});
        if(holesAbove.length===1 && holesAbove[0].speed===hole.speed) {
            if(between(holesAbove[0].position, hole.position+hole.width*hole.speed*0.25, hole.position+hole.width*hole.speed*0.75)){
                return true;
            }
        }
        var holesBelow = gameState.holes.filter(function(h){return h.row===hole.row-1;});
        if(holesBelow.length===1 && holesBelow[0].speed===hole.speed){
            if(between(holesBelow[0].position, hole.position-hole.width*hole.speed*0.25, hole.position-hole.width*hole.speed*0.75)){
                return true;
            }
        }
        return false;
    };
    
    var generateLevel = function(gameState){
        gameState.holes = [];
        gameState.critters = [];
        gameState.generateHole = function(){
            var hole = generateMovingObjectForHoleInBalancedRow();
            hole.width = 32;
            hole.height = 64;
            if (!holeMakesLevelUnsolvable(gameState, hole)) {
                return hole;
            }
            return gameState.generateHole();
        };
        gameState.generateCritter = function(){
            var critter = generateMovingObjectForCritterInBalancedRow();
            critter.width = 35;
            critter.height = 30;
            critter.speed *= 1.3;
            return critter;
        };
        for(var i=0;i<gameState.numRows+gameState.level;i+=1){
            gameState.holes.push(gameState.generateHole());
        }
        for(i=0;i<gameState.level;i+=1){
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
            speed: randomSign()
        };
    };
    var rand = function(max){
        return Math.floor(Math.random() * max);
    };
    var randomPosition = _.partial(rand, gameState.width);
    var randomSign = function(){
        return (rand(2)-0.5)*2;
    };
    var getRandomRowBalancedGenerator = function(){
        var exceptedRows = [];
        var ret = function(){
            var r = rand(gameState.numRows-exceptedRows.length);
            for(var i=0;i<gameState.numRows;i+=1){
                if(exceptedRows.indexOf(i) !== -1){
                    r+=1;
                }
                if(exceptedRows.indexOf(r) === -1){
                    exceptedRows.push(r);
                    if(exceptedRows.length>=gameState.numRows){
                        exceptedRows = [];
                    }
                    return r;
                }
            }
        };
        return ret;
    };
    var generateMovingObjectForHoleInBalancedRow = _.partial(generateMovingObject, getRandomRowBalancedGenerator());
    var generateMovingObjectForCritterInBalancedRow = _.partial(generateMovingObject, getRandomRowBalancedGenerator());
    var timestamp = function() {
        return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
    };
    
    var moveObject = function(dt, obj){
        obj.position = (obj.position + gameState.speed * obj.speed * dt + gameState.width)%gameState.width;
    };
    
    var maxZero = _.partial(Math.max, 0);
    
    var updateGameState = function(gameState, dt){
        var move = _.partial(moveObject, dt);
        var sameRowPlayer = _.partial(sameRow, gameState.player);
        var previousRowPlayer = _.partial(previousRow, gameState.player);
        var collidesPlayer = _.partial(collides, gameState.player);
        gameState.holes.forEach(move);
        gameState.critters.forEach(move);
        if(gameState.player.fallingFor > 0){
            gameState.player.fallingFor = maxZero(gameState.player.fallingFor-dt);
        }
        if(gameState.player.jumpingFor > 0){
            gameState.player.jumpingFor = maxZero(gameState.player.jumpingFor-dt);
            if(gameState.player.jumpingFor===0){
                gameState.player.row +=1;
                if(gameState.player.row>gameState.maxRow){
                    gameState.maxRow = gameState.player.row;
                    gameState.holes.push(gameState.generateHole());
                }
                // level up
                if(gameState.player.row>=gameState.numRows){
                    gameState.level +=1;
                    generateLevel(gameState);
                }
            } else
            if(gameState.player.row>=gameState.numRows){
                gameState.level +=1;
                generateLevel(gameState);
            } else if(between(gameState.player.jumpingFor, 0.6, 0.8) && !gameState.holes.filter(sameRowPlayer).some(collidesPlayer)){
                //check collision against ceiling
                gameState.player.stunnedFor = 3;
                gameState.player.fallingFor = 1-gameState.player.jumpingFor;
                gameState.player.jumpingFor = 0;
            }
        }
        if(gameState.player.stunnedFor){
            gameState.player.stunnedFor = maxZero(gameState.player.stunnedFor-dt);
        }
        if(canMove(gameState.player)){
            move(gameState.player);
        }
        if(canFall(gameState.player) && gameState.holes.filter(previousRowPlayer).some(collidesPlayer)){
            gameState.player.row -=1;
            gameState.player.fallingFor = 1;
            gameState.player.speed = 0;
            return;
        }
        if(canBeBitten(gameState.player) && gameState.critters.filter(sameRowPlayer).some(collidesPlayer)){
            gameState.player.stunnedFor = 2;
            gameState.player.speed = 0;
            return;
        }
    };
    var sameRow = function(player, obj){
        return player.row === obj.row;
    };
    var previousRow = function(player, obj){
        return player.row-1 === obj.row;
    };
    var between = function(num, left, right){
        if (left<right){
            return num>left && num<right;
        } else if (left>right){
            return num<left && num>right;
        } else {
            return num===left;
        }
    };
    var collides = function(player, obj){
        return between(player.position, obj.position - obj.width/2, obj.position + obj.width/2);
    };
    var canMove = function(player){
        return player.stunnedFor===0 && player.jumpingFor===0 && player.fallingFor===0;
    };
    var canFall = function(player){
        return player.jumpingFor===0 && player.fallingFor===0 && player.row > 0;
    };
    var canBeBitten = function(player){
        return player.jumpingFor===0 && player.fallingFor===0;
    };
    var leftInteraction = function(player){
        if(canMove(player)){
            player.speed = -2;
        }
    };
    var rightInteraction = function(player){
        if(canMove(player)){
            player.speed = 2;
        }
    };
    var jumpInteraction = function(player){
        if(canMove(player)){
            player.speed = 0;
            player.jumpingFor = 1;
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
    
    var gameTick = function(renderer, gameState, now) {
      var dt = Math.min(1, (now - last) / 1000);
      updateGameState(gameState, dt);
      renderer.renderFrame(gameState, dt);
      last = now;
      rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameState));
    };
    
    var renderer = createDOMRenderer(_, $, window);
    renderer.init(gameState);
    generateLevel(gameState);
    renderer.initLevel(gameState);
    setupInteraction();
    var last = timestamp();
    var rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameState));
    
    
})(_, jQuery, window);

