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

require(['underscore', 'jquery', 'jumpingGameUtil', 'jumpingGameWorld', 'jumpingGameDOMRenderer', 'jumpingGameInteraction'], function (_, $, util, gameWorld, renderer, interaction) {
    var gameTick = function (renderer, gameState, now) {
        var dt = (now - last) / 1000;
        last = now;
        if (dt > 1) {
            gameState.paused = true;
        }
        dt *= gameState.gameSpeed;
        if (!gameState.paused) {
            gameState.updateGameState(gameState, dt);
        }
        renderer.renderFrame(gameState, dt);
        rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameState));
    };

    // var renderer = createDOMRenderer(_, $, window);
    gameWorld.generateLevel(gameWorld);
    renderer.init(gameWorld);
    // renderer.initLevel(gameWorld);
    interaction.setupInteraction(gameWorld);
    var last = util.timestamp();
    var rafID = window.requestAnimationFrame(_.partial(gameTick, renderer, gameWorld));

    $(window).on('resize', function () {
        renderer.init(gameWorld);
    });
});
