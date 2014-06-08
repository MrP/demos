define(['underscore', 'jquery'], function(_, $){
    var between = function(wrapWidth, num, left, right){
        if (left<right){
            return num>left && num<right || num+wrapWidth>left && num+wrapWidth<right;
        } else if (left>right){
            return num<left && num>right || num+wrapWidth<left && num+wrapWidth>right;
        } else {
            return num===left;
        }
    };
    var rand = function(max){
        return Math.floor(Math.random() * max);
    };

    return {
        between: between,
        collides: function(wrapWidth, player, obj){
            var playerLeft = player.position-player.width/2;
            var playerRight = player.position+player.width/2;
            var objLeft = obj.position - obj.width/2;
            var objRight = obj.position + obj.width/2;
            return between(wrapWidth, playerLeft, objLeft, objRight) || between(wrapWidth, playerRight, objLeft, objRight) ||
                between(wrapWidth, objLeft, playerLeft, playerRight) || between(wrapWidth, objRight, playerLeft, playerRight);
        },
        surrounds: function(wrapWidth, player, obj){
            var playerLeft = player.position-player.width/2;
            var playerRight = player.position+player.width/2;
            var objLeft = obj.position - obj.width/2;
            var objRight = obj.position + obj.width/2;
            return between(wrapWidth, playerLeft, objLeft, objRight) && between(wrapWidth, playerRight, objLeft, objRight);
        },
        timestamp: function() {
            return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
        },
        generateRandomBalancedRow: function(numRows, currentObjects){
            var rows = _.pluck(currentObjects, 'row');
            var rowCounts = rows.reduce(function(memo, row){
                memo[row]++;
                return memo;
            }, _.times(numRows, _.constant(0)));
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
        },
        rand: rand,
        randomSign: function(){
            return (rand(2)-0.5)*2;
        },
        getRandomRowBalancedGenerator: function(gameState){
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
        },
        maxZero: _.partial(Math.max, 0)
    };
});

