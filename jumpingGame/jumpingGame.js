require.config({
    paths: {
        jquery: '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min',
        underscore: '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min'
    },
    shim: {
        "underscore": {
            exports: "_"
        }
    }
});

require(['underscore', 'jquery', 'jumpingGameUtil', 'jumpingGameWorld', 'jumpingGameDOMRenderer', 'jumpingGameInteraction'], function(_, $, util, gameWorld, renderer, interaction){
    var updateGameState = function(gameState, dt){
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

    // var renderer = createDOMRenderer(_, $, window);
    renderer.init(gameWorld);
    gameWorld.generateLevel(gameWorld);
    renderer.initLevel(gameWorld);
    interaction.setupInteraction(gameWorld);
    var last = util.timestamp();
    var rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameWorld));
    
    $(window).on('resize', function(){
        renderer.init(gameWorld);
    });



});

