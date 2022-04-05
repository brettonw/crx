let TestContainer = function () {
    let _ = Object.create(Container);

    // deliberately copy the game into this container
    let gameNames = GameContainer.getGameNames();
    for (let i = 0, count = gameNames.length; i < count; ++i) {
        let gameName = gameNames[i];
        let game = GameContainer.getGame(gameName);
        _.addGame(gameName.substring(4), game);
    }

    return _;
}();
