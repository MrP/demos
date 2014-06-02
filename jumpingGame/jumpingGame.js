(function(_, $, window){
    // Game units are arbitrary, 100% width and 1 of height each row
    var gameState = {
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
        between: function(num, left, right){
            if (left<right){
                return num>left && num<right || num+gameState.width>left && num+gameState.width<right;
            } else if (left>right){
                return num<left && num>right || num+gameState.width<left && num+gameState.width>right;
            } else {
                return num===left;
            }
        },
        collides: function(gameState, player, obj){
            var playerLeft = player.position-player.width/2;
            var playerRight = player.position+player.width/2;
            var objLeft = obj.position - obj.width/2;
            var objRight = obj.position + obj.width/2;
            return gameState.between(playerLeft, objLeft, objRight) || gameState.between(playerRight, objLeft, objRight) ||
                gameState.between(objLeft, playerLeft, playerRight) || gameState.between(objRight, playerLeft, playerRight);
        },
        surrounds: function(gameState, player, obj){
            var playerLeft = player.position-player.width/2;
            var playerRight = player.position+player.width/2;
            var objLeft = obj.position - obj.width/2;
            var objRight = obj.position + obj.width/2;
            return gameState.between(playerLeft, objLeft, objRight) && gameState.between(playerRight, objLeft, objRight);
        },
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
        timestamp: function() {
            return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
        }
    };

    var holeMakesLevelUnsolvable = function(gameState, hole){
        var holesAbove = gameState.holes.filter(function(h){return h.row===hole.row+1;});
        if(holesAbove.length===1 && holesAbove[0].speed===hole.speed) {
            if(gameState.between(holesAbove[0].position, hole.position+hole.width*hole.speed*0.1, hole.position+hole.width*hole.speed*1)){
                return true;
            }
        }
        var holesRow = gameState.holes.filter(function(h){return h.row===hole.row;});
        var holesBelow = gameState.holes.filter(function(h){return h.row===hole.row-1;});
        if(holesRow.length===1){
            return holesBelow.some(function(holeBelow){
                return holeBelow.speed===hole.speed && gameState.between(holeBelow.position, hole.position-hole.width*hole.speed*0.1, hole.position-hole.width*hole.speed*1);
            });
        }
        return false;
    };

    var generateHole = function(gameState){
        var hole = generateMovingObject(generateRandomBalancedRow(gameState.holes));
        hole.width = 10;
        while (holeMakesLevelUnsolvable(gameState, hole)) {
            var obj = generateMovingObject(hole.row);
            hole.position = obj.position;
            hole.speed = obj.speed;
        }
        return hole;
    };
    var generateCritter = function(gameState){
        var critter = generateMovingObject(generateRandomBalancedRow(gameState.critters));
        critter.width = 6;
        critter.speed *= 1.3;
        return critter;
    };

    var generateLevel = function(gameState){
        gameState.holes = [];
        gameState.critters = [];
        gameState.numRows = 5+Math.floor(gameState.level/5);
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
    };
    var generateMovingObject = function(row){
        return {
            row: row,
            position: randomPosition(),
            speed: randomSign()
        };
    };

    var generateRandomBalancedRow = function(currentObjects){
        var rows = _.pluck(currentObjects, 'row');
        var rowCounts = rows.reduce(function(memo, row){
            memo[row]++;
            return memo;
        }, _.times(gameState.numRows, _.constant(0)));
        var minRowCount = _.min(rowCounts);
        rowCounts = rowCounts.map(function(rowCount){
            return rowCount-minRowCount;
        });
        var indexesWithZero = rowCounts.reduce(function(memo, count, index){
            if(count===0){
                memo.push(index);
            }
            return memo;
        }, []);
        var index = rand(indexesWithZero.length);
        var row = indexesWithZero[index];

        return row;
    };
    var rand = function(max){
        return Math.floor(Math.random() * max);
    };
    var randomPosition = _.partial(rand, gameState.width);
    var randomSign = function(){
        return (rand(2)-0.5)*2;
    };
    var getRandomRowBalancedGenerator = function(gameState){
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
    
    var moveVertical = function(dt, obj){
        obj.verticalSpeed += gameState.gravity*dt;
        obj.verticalPosition = obj.verticalPosition + gameState.speed * obj.verticalSpeed * dt;
    };

    var maxZero = _.partial(Math.max, 0);

    var updateGameState = function(gameState, dt){
        var move = _.partial(gameState.moveObject, gameState, dt);
        var sameRowPlayer = _.partial(gameState.sameRow, gameState.player);
        var previousRowPlayer = _.partial(gameState.previousRow, gameState.player);
        var collidesPlayer = _.partial(gameState.collides, gameState, gameState.player);
        gameState.holes.forEach(move);
        gameState.critters.forEach(move);
        if(gameState.player.falling){
            moveVertical(dt, gameState.player);
            if(gameState.player.verticalPosition>=0){
                gameState.player.falling = false;
            }
        }
        if(gameState.player.jumping){
            moveVertical(dt, gameState.player);
            if(gameState.player.verticalPosition<=-1 && !gameState.player.hittingHead){
                gameState.player.row +=1;
                gameState.player.verticalPosition=0;
                gameState.player.verticalSpeed=0;
                gameState.player.jumping  = false;
                if(gameState.player.row>gameState.maxRow){
                    gameState.maxRow = gameState.player.row;
                    gameState.holes.push(generateHole(gameState));
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
            gameState.player.stunnedFor = maxZero(gameState.player.stunnedFor-dt);
        }
        if(gameState.canMove(gameState.player)){
            move(gameState.player);
        }
        if(gameState.canFall(gameState.player) && gameState.holes.filter(previousRowPlayer).some(_.partial(gameState.surrounds, gameState, gameState.player))){
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
    };
    
    var gameTick = function(renderer, gameState, now) {
        var dt = (now - last) / 1000;
        last = now;
        if(dt>1){
            gameState.paused = true;
        }
        if(!gameState.paused){
            updateGameState(gameState, dt);
        }
        renderer.renderFrame(gameState, dt);
        rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameState));
    };

    var renderer = createDOMRenderer(_, $, window);
    renderer.init(gameState);
    generateLevel(gameState);
    renderer.initLevel(gameState);
    setupInteraction(_, $, window, gameState);
    var last = gameState.timestamp();
    var rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameState));
    
    $(window).on('resize', function(){
        renderer.init(gameState);
    });



})(_, jQuery, window);

