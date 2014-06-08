define(['underscore', 'jquery', 'jumpingGameUtil'], function(_, $, util){
    var leftInteraction = function(gameState){
        if(gameState.canMove(gameState.player)){
            gameState.player.speed = -2;
        }
    };
    var rightInteraction = function(gameState){
        if(gameState.canMove(gameState.player)){
            gameState.player.speed = 2;
        }
    };
    var jumpInteraction = function(gameState){
        if(gameState.canMove(gameState.player)){
            gameState.player.speed = 0;
            gameState.player.jumping = true;
            gameState.player.verticalPosition = 0;
            gameState.player.verticalSpeed = gameState.player.kickUpSpeed;
            var a = gameState.gravity;
            var b = gameState.player.verticalSpeed*gameState.speed;
            var c = 1-gameState.player.height;
            var timeJumpingToCeiling1 = (-b-Math.sqrt(b*b-4*a*c))/(2*a);
            var timeJumpingToCeiling2 = (-b+Math.sqrt(b*b-4*a*c))/(2*a);
            var timeJumpingToCeiling = Math.min(timeJumpingToCeiling1, timeJumpingToCeiling2);
            var sameRowHoles = gameState.holes.filter(_.partial(gameState.sameRow, gameState.player));
            sameRowHoles = _.map(sameRowHoles, _.clone);
            sameRowHoles.forEach(_.partial(gameState.moveObject, gameState, timeJumpingToCeiling));
            if(_.some(sameRowHoles, _.partial(util.collides, gameState.width, gameState.player))){
                gameState.player.hittingHead = false;
            }else{
                gameState.player.hittingHead = true;
            }
        }
    };
    var stopInteraction = function(gameState){
        gameState.player.speed = 0;
    };
    var setupInteraction = function(gameState){
        $(window).on("keydown", function(event){
            gameState.paused = false;
            if(event.which===37){
                leftInteraction(gameState);
            }else if(event.which===39){
                rightInteraction(gameState);
            }else if(event.which===38){
                jumpInteraction(gameState);
            }
        });
        $(window).on("keyup", function(key){
            gameState.paused = false;
            stopInteraction(gameState);
        });

        var pos = {x:0,y:0};
        var timeTapStart = 0;
        $(window).on("touchstart", function(event){
            gameState.paused = false;
            var e = event.originalEvent;
            if(e.touches.length===1){
                pos.x = e.touches[0].pageX;
                pos.y = e.touches[0].pageY;
                timeTapStart = util.timestamp();
            }
            event.preventDefault();
        });
        $(window).on("touchmove", function(event){
            gameState.paused = false;
            var e = event.originalEvent;
            var deltaX = e.touches[0].pageX-pos.x;
            var deltaY = e.touches[0].pageY-pos.y;
            if(deltaX>5){
                rightInteraction(gameState);
            } else if(deltaX<-5){
                leftInteraction(gameState);
            }
            if(deltaY<-30){
                jumpInteraction(gameState);
            }
            pos.x = e.touches[0].pageX;
            pos.y = e.touches[0].pageY;

            event.preventDefault();
        });
        $(window).on("touchend", function(event){
            gameState.paused = false;
            var e = event.originalEvent;
            if(e.touches.length===0){
                if(util.timestamp()-timeTapStart<100){
                    jumpInteraction(gameState);
                }else{
                    stopInteraction(gameState);
                }
            }
            e.preventDefault();
        });
        $(window).on('resize', function(){
            gameState.paused = true;
        });
    };

    return {setupInteraction: setupInteraction};
});

