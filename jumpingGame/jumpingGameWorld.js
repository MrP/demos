define(['underscore', 'jquery', 'jumpingGameUtil'], function(_, $, util){
    var generateMovingObject = function(gameState, row){
        return {
            row: row,
            position: util.rand(gameState.width),
            speed: util.randomSign()
        };
    };
    var generateCritter = function(gameState){
        var critter = generateMovingObject(gameState, util.generateRandomBalancedRow(gameState.numRows, gameState.critters));
        critter.width = 6;
        critter.speed *= 1.3;
        return critter;
    };
    var holeMakesLevelUnsolvable = function(gameState, hole){
        var holesAbove = gameState.holes.filter(function(h){return h.row===hole.row+1;});
        if(holesAbove.length===1 && holesAbove[0].speed===hole.speed) {
            if(util.between(gameState.width, holesAbove[0].position, hole.position+hole.width*hole.speed*0.1, hole.position+hole.width*hole.speed*1)){
                return true;
            }
        }
        var holesRow = gameState.holes.filter(function(h){return h.row===hole.row;});
        var holesBelow = gameState.holes.filter(function(h){return h.row===hole.row-1;});
        if(holesRow.length===1){
            return holesBelow.some(function(holeBelow){
                return holeBelow.speed===hole.speed && 
                util.between(gameState.width, holeBelow.position, hole.position-hole.width*hole.speed*0.1, hole.position-hole.width*hole.speed*1);
            });
        }
        return false;
    };
    var generateHole = function(gameState){
        var hole = generateMovingObject(gameState, util.generateRandomBalancedRow(gameState.numRows, gameState.holes));
        hole.width = 10;
        while (holeMakesLevelUnsolvable(gameState, hole)) {
            var obj = generateMovingObject(gameState, hole.row);
            hole.position = obj.position;
            hole.speed = obj.speed;
        }
        return hole;
    };


    // Game units are arbitrary, 100% width and 1 of height each row
    var gameWorld = {
        paused: false,
        speed: 20,
        numRows: 5,
        width: 100,
        level: 0,
        gravity: 0.2,
        player: {
            width: 4,
            height: 0.3, //relative to 1 being a row height, used to hit the ceiling
            row:0,
            position:50,
            speed:0,
            jumping: false,
            hittingHead: false,
            falling: false,
            stunnedFor: 0,
            verticalPosition:0,
            verticalSpeed: 0,
            kickUpSpeed: -0.15
        },
        maxRow:0,
        holes: [],
        critters: [],
        moveObject: function(gameState, dt, obj){
            obj.position = (obj.position + gameState.speed * obj.speed * dt + gameState.width)%gameState.width;
        },
        sameRow: function(player, obj){
            return player.row === obj.row;
        },
        previousRow: function(player, obj){
            return player.row-1 === obj.row;
        },
        canMove: function(player){
            return player.stunnedFor===0 && !player.jumping && !player.falling;
        },
        canFall: function(player){
            return !player.jumping && !player.falling && player.row > 0;
        },
        canBeBitten: function(player){
            return !player.jumping && !player.falling;
        },
        generateLevel: function(gameState){
            gameState.holes = [];
            gameState.critters = [];
            gameState.numRows = 5+Math.floor(gameState.level/5);
            gameState.speed = gameState.speed+Math.floor(gameState.level/10)*5;
            _.times(gameState.numRows+Math.floor(gameState.level/2), function(){
                gameState.holes.push(generateHole(gameState));
            });
            _.times(Math.ceil(gameState.level/2), function(){
                gameState.critters.push(generateCritter(gameState));
            });
            while(gameState.critters.filter(function(critter){return critter.row===0;}).length>2){
                gameState.critters.splice(gameState.critters.indexOf(gameState.critters.filter(function(critter){return critter.row===0;})[0]), 1);
            }
            gameState.player.jumping = false;
            gameState.player.falling = false;
            gameState.player.stunnedFor = 0;
            gameState.player.speed = 0;
            gameState.player.row = 0;
            gameState.playerverticalPosition = 0;
            gameState.playerverticalSpeed = 0;
            gameState.maxRow = 0;
        },
        generateHole: generateHole,
        moveVertical: function(gameState, dt, obj){
            obj.verticalSpeed += gameState.gravity*dt;
            obj.verticalPosition = obj.verticalPosition + gameState.speed * obj.verticalSpeed * dt;
        },
        updateGameState: function(gameState, dt){
            var move = _.partial(gameState.moveObject, gameState, dt);
            var sameRowPlayer = _.partial(gameState.sameRow, gameState.player);
            var previousRowPlayer = _.partial(gameState.previousRow, gameState.player);
            var collidesPlayer = _.partial(util.collides, gameState, gameState.player);
            gameState.holes.forEach(move);
            gameState.critters.forEach(move);
            if(gameState.player.falling){
                gameState.moveVertical(gameState, dt, gameState.player);
                if(gameState.player.verticalPosition>=0){
                    gameState.player.falling = false;
                }
            }
            if(gameState.player.jumping){
                gameState.moveVertical(gameState, dt, gameState.player);
                if(gameState.player.verticalPosition<=-1 && !gameState.player.hittingHead){
                    gameState.player.row +=1;
                    gameState.player.verticalPosition=0;
                    gameState.player.verticalSpeed=0;
                    gameState.player.jumping  = false;
                    if(gameState.player.row>gameState.maxRow){
                        gameState.maxRow = gameState.player.row;
                        gameState.holes.push(gameState.generateHole(gameState));
                    }
                    // level up
                    if(gameState.player.row>=gameState.numRows){
                        gameState.level +=1;
                        gameState.generateLevel(gameState);
                    }
                } else if(gameState.player.row>=gameState.numRows){
                    gameState.level +=1;
                    gameState.generateLevel(gameState);
                } else if(gameState.player.hittingHead && gameState.player.verticalPosition <= -(1-gameState.player.height)){
                    //Collision against ceiling
                    gameState.player.stunnedFor = 3;
                    gameState.player.falling = true;
                    gameState.player.jumping  = false;
                    gameState.player.verticalSpeed  = 0;
                    gameState.player.hittingHead = false;
                }
            }
            if(gameState.player.stunnedFor){
                gameState.player.stunnedFor = util.maxZero(gameState.player.stunnedFor-dt);
            }
            if(gameState.canMove(gameState.player)){
                move(gameState.player);
            }
            if(gameState.canFall(gameState.player) && gameState.holes.filter(previousRowPlayer).some(_.partial(util.surrounds, gameState, gameState.player))){
                gameState.player.row -=1;
                gameState.player.falling = true;
                gameState.player.speed = 0;
                gameState.player.verticalSpeed = 0;
                gameState.player.verticalPosition = -1;
                return;
            }
            if(gameState.canBeBitten(gameState.player) && gameState.critters.filter(sameRowPlayer).some(collidesPlayer)){
                gameState.player.stunnedFor = 2;
                gameState.player.speed = 0;
                return;
            }
        }
    };

    return gameWorld;

});

