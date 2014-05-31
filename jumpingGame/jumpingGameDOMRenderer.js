var createDOMRenderer = function(_, $, window){
    var $gameDiv = $("#game");
    var lastLevel;
    var percentToPixels = function(percent){
        return 3.2*percent;
    };

    var addToTop = function(yToAdd, obj){
        return obj.$element.css("top", ""+(parseInt(obj.$element.css("top").replace(/px|%/,""), 10) + yToAdd)+"px");
    };
    var rowY = function(gameState, row){
        return (gameState.numRows-row-1)*gameState.rowHeight;
    };

    var objY = function(gameState, obj){
        return rowY(gameState, obj.row)+(gameState.rowHeight-obj.height);
    };

    var objX = function(gameState, obj){
        return obj.position-obj.width/2;
    };

    var position = function(gameState, obj){
        obj.$element.css({top:""+objY(gameState, obj)+"px", left:""+objX(gameState, obj)+"%"});
    };

    var createElementIfNeeded = function(className, obj){
        if(!obj.$element){
            obj.$element = $('<div class="'+className+'"></div>');
            $gameDiv.append(obj.$element);
        }
    };

    var initLevel = function(gameState){
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
        obj.$element.toggleClass('right', obj.speed>0);
    };

    return {
        init: function(gameState){
            if($gameDiv.length===0){
                $(document.body).append($('<div id="game"></div>'));
                $gameDiv = $("#game");
            }
            $gameDiv.html("");
            lastLevel = 0;
            for(var i=0;i<gameState.numRows;i++){
                var $ceiling = $('<div class="ceiling"></div>');
                $gameDiv.append($ceiling);
                $ceiling.css("top", ""+(rowY(gameState, i)-gameState.rowHeight)+"px");
            }
            var $floor = $('<div class="ceiling"></div>');
            $gameDiv.append($floor);
            $ceiling.css("top", ""+rowY(gameState, 0)+"px");
        },
        initLevel: initLevel,
        renderFrame: function(gameState, dt){
            if(lastLevel!==gameState.level){
                initLevel(gameState);
            }
            gameState.holes.forEach(_.partial(createElementIfNeeded, 'hole'));
            var pos = _.partial(position, gameState);
            gameState.holes.forEach(pos);
            gameState.critters.forEach(pos);
            pos(gameState.player);
            gameState.player.$element.toggleClass('stunned', gameState.player.stunnedFor>0);
            gameState.player.$element.toggleClass('jumping', gameState.player.jumpingFor>0);
            gameState.player.$element.toggleClass('falling', gameState.player.fallingFor>0);
            gameState.player.$element.toggleClass('running', gameState.player.speed!==0);
            gameState.player.$element.toggleClass('animated', gameState.player.stunnedFor===0 && gameState.player.jumpingFor===0 && gameState.player.fallingFor===0);
            if(gameState.player.jumpingFor>0){
                addToTop(-gameState.rowHeight*Math.pow(1-gameState.player.jumpingFor, 0.7), gameState.player);
            }
            if(gameState.player.fallingFor>0){
                addToTop(-gameState.rowHeight*Math.pow(gameState.player.fallingFor, 0.7), gameState.player);
            }
            setDirectionClass(gameState.player);
        }
    };
};
