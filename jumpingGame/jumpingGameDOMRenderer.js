var createDOMRenderer = function(_, $, window){
    var $gameDiv = $("#game");
    var $gameDivHeight = $gameDiv.height();
    var lastLevel;
    var playerElementWidth = 3500/$gameDiv.width();
    var critterElementWidth = 3500/$gameDiv.width();
    var holeElementWidth = 10;
    var rowHeight = function(gameState){
        return $gameDivHeight/gameState.numRows;
    };
    var critterHeight = 30;
    var playerHeight = 30;
    

    var addToTop = function(yToAdd, obj){
        obj.$element.css("top", ""+(parseInt(obj.$element.css("top").replace(/px|%/,""), 10) + yToAdd)+"px");
        obj.$overflowElement.css("top", ""+(parseInt(obj.$overflowElement.css("top").replace(/px|%/,""), 10) + yToAdd)+"px");
    };
    var rowY = function(gameState, row){
        return (gameState.numRows-row-1)*rowHeight(gameState);
    };

    var objY = function(gameState, height, obj){
        return rowY(gameState, obj.row)+(rowHeight(gameState)-height);
    };

    var objX = function(gameState, width, obj){
        return obj.position-width/2;
    };

    var position = function(gameState, width, height, obj){
        obj.$element.css({top:""+objY(gameState, height, obj)+"px", left:""+objX(gameState, width, obj)+"%"});
        if(objectOverflowsLeft(gameState, width, obj)){
            obj.$overflowElement.css({top:""+objY(gameState, height, obj)+"px", left:""+(objX(gameState, width, obj)+gameState.width)+"%"});
        }else if(objectOverflowsRight(gameState, width, obj)){
            obj.$overflowElement.css({top:""+objY(gameState, height, obj)+"px", left:""+(objX(gameState, width, obj)-gameState.width)+"%"});
        }else{
            obj.$overflowElement.css({top:""+objY(gameState, height, obj)+"px", left:"-"+gameState.width+"%"});
        }
    };
    var objectOverflowsLeft = function(gameState, width, obj){
        return obj.position-width/2<0;
    };
    var objectOverflowsRight = function(gameState, width, obj){
        return obj.position+width/2>gameState.width;
    };

    var createElementIfNeeded = function(className, obj){
        if(!obj.$element){
            obj.$element = $('<div class="'+className+'"></div>');
            $gameDiv.append(obj.$element);
        }
        if(!obj.$overflowElement){
            obj.$overflowElement = $('<div class="'+className+' overflow"></div>');
            $gameDiv.append(obj.$overflowElement);
        }
    };
    
    var setStunnedClass = function(player){
        player.$element.toggleClass('stunned', player.stunnedFor>0);
        player.$overflowElement.toggleClass('stunned', player.stunnedFor>0);
    };
    var setJumpingClass = function(player){
        player.$element.toggleClass('jumping', player.jumping);
        player.$overflowElement.toggleClass('jumping', player.jumping);
    };
    var setFallingClass = function(player){
        player.$element.toggleClass('falling', player.falling);
        player.$overflowElement.toggleClass('falling', player.falling);
    };
    var setRunningClass = function(player){
        player.$element.toggleClass('running', player.speed!==0);
        player.$overflowElement.toggleClass('running', player.speed!==0);
    };
    var setAnimatedClass = function(player){
        player.$element.toggleClass('animated', player.stunnedFor===0 && !player.jumping && !player.falling);
        player.$overflowElement.toggleClass('animated', player.stunnedFor===0 && !player.jumping && !player.falling);
    };
    
            
    var initLevel = function(gameState){
        $gameDiv.html('');
        _.times(gameState.numRows, function(i){
            var $ceiling = $('<div class="ceiling"></div>');
            $gameDiv.append($ceiling);
            $ceiling.css("top", ""+(rowY(gameState, i))+"px");
        });
        lastLevel = gameState.level;
        $gameDiv.find(".hole").remove();
        $gameDiv.find(".critter").remove();
        $gameDiv.find(".player").remove();
        gameState.player.$element = null;
        gameState.holes.forEach(_.partial(createElementIfNeeded, 'hole'));
        gameState.critters.forEach(_.partial(createElementIfNeeded, 'critter animated'));
        gameState.critters.forEach(setDirectionClass);
        createElementIfNeeded('player', gameState.player);
    };

    var setDirectionClass = function(obj){
        obj.$element.toggleClass('left', obj.speed<0);
        obj.$overflowElement.toggleClass('left', obj.speed<0);
        obj.$element.toggleClass('right', obj.speed>0);
        obj.$overflowElement.toggleClass('right', obj.speed>0);
    };

    return {
        init: function(gameState){
            if($gameDiv.length===0){
                $(document.body).append($('<div id="game"></div>'));
                $gameDiv = $("#game");
            }
            $gameDiv.css('transform-origin','top left');
            $gameDiv.css('transform','scale(2,2)');
            lastLevel = 0;
        },
        initLevel: initLevel,
        renderFrame: function(gameState, dt){
            if(lastLevel!==gameState.level){
                initLevel(gameState);
            }
            if(gameState.paused){
                if($gameDiv.find('.paused').length===0){
                    $gameDiv.append($('<div class="paused"></div>'));
                }
            } else {
                $gameDiv.find('.paused').remove();
            }
            gameState.holes.forEach(_.partial(createElementIfNeeded, 'hole'));
            var posPlayer = _.partial(position, gameState, playerElementWidth, playerHeight);
            var posCritter = _.partial(position, gameState, critterElementWidth, critterHeight);
            var posHole = _.partial(position, gameState, holeElementWidth, rowHeight(gameState));
            
            gameState.holes.forEach(posHole);
            gameState.critters.forEach(posCritter);
            posPlayer(gameState.player);
            setStunnedClass(gameState.player);
            setJumpingClass(gameState.player);
            setFallingClass(gameState.player);
            setRunningClass(gameState.player);
            setAnimatedClass(gameState.player);
            if(gameState.player.jumping){
                addToTop(rowHeight(gameState)*gameState.player.verticalPosition, gameState.player);
            }
            if(gameState.player.falling){
                addToTop(rowHeight(gameState)*gameState.player.verticalPosition, gameState.player);
            }
            setDirectionClass(gameState.player);
        }
    };
};
