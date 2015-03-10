var TestContainer = function () {
    var _ = Object.create(Container);

    // deliberately copy the game into this container
    var gameNames = GameContainer.getGameNames();
    for (var i = 0, count = gameNames.length; i < count; ++i) {
        var gameName = gameNames[i];
        var game = GameContainer.getGame(gameName);
        _.addGame(gameName.substring(4), game);
    }

    return _;
}();
