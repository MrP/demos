var setupInteraction = function(_, $, window, gameState){
    var leftInteraction = function(player){
        if(gameState.canMove(player)){
            player.speed = -2;
        }
    };
    var rightInteraction = function(player){
        if(gameState.canMove(player)){
            player.speed = 2;
        }
    };
    var jumpInteraction = function(gameState){
        if(gameState.canMove(gameState.player)){
            gameState.player.speed = 0;
            gameState.player.jumping = true;
            gameState.player.verticalPosition = 0;
            gameState.player.verticalSpeed = -0.2;
            var a = gameState.gravity;
            var b = gameState.player.verticalSpeed*gameState.speed;
            var c = 1-gameState.player.height;
            var timeJumpingToCeiling1 = (-b-Math.sqrt(b*b-4*a*c))/(2*a);
            var timeJumpingToCeiling2 = (-b+Math.sqrt(b*b-4*a*c))/(2*a);
            var timeJumpingToCeiling = Math.min(timeJumpingToCeiling1, timeJumpingToCeiling2);
            var sameRowHoles = gameState.holes.filter(_.partial(gameState.sameRow, gameState.player));
            sameRowHoles = _.map(sameRowHoles, _.clone);
            sameRowHoles.forEach(_.partial(gameState.moveObject, gameState, timeJumpingToCeiling));
            if(_.some(sameRowHoles, _.partial(gameState.collides, gameState, gameState.player))){
                gameState.player.hittingHead = false;
            }else{
                gameState.player.hittingHead = true;
            }
        }
    };
    var stopInteraction = function(player){
        player.speed = 0;
    };
    var setupInteraction = function(gameState){
        $(window).on("keydown", function(event){
            gameState.paused = false;
            if(event.which===37){
                leftInteraction(gameState.player);
            }else if(event.which===39){
                rightInteraction(gameState.player);
            }else if(event.which===38){
                jumpInteraction(gameState);
            }
        });
        $(window).on("keyup", function(key){
            gameState.paused = false;
            stopInteraction(gameState.player);
        });

        var pos = {x:0,y:0};
        var timeTapStart = 0;
        $(window).on("touchstart", function(event){
            gameState.paused = false;
            var e = event.originalEvent;
            if(e.touches.length===1){
                pos.x = e.touches[0].pageX;
                pos.y = e.touches[0].pageY;
                timeTapStart = gameState.timestamp();
            }
            event.preventDefault();
        });
        $(window).on("touchmove", function(event){
            gameState.paused = false;
            var e = event.originalEvent;
            var deltaX = e.touches[0].pageX-pos.x;
            var deltaY = e.touches[0].pageY-pos.y;
            if(deltaX>5){
                rightInteraction(gameState.player);
            } else if(deltaX<-5){
                leftInteraction(gameState.player);
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
                if(gameState.timestamp()-timeTapStart<100){
                    jumpInteraction(gameState);
                }else{
                    stopInteraction(gameState.player);
                }
            }
            e.preventDefault();
        });
    };

    setupInteraction(gameState);
};

