var Container = function () {
    var _ = Object.create(null);

    _.addGame = function (name, game) {
        if (("games" in this) == false) {
            this.games = Object.create(null);
            this.prefix = "A".charCodeAt(0);
        }
        name = "(" + String.fromCharCode(this.prefix++) + ") " + name;
        this.games[name] = game;
    }

    _.getGameNames = function () {
        var gameNames = [];
        for (var gameName in this.games) {
            gameNames.push(gameName);
        }
        gameNames.sort();
        return gameNames;
    }

    _.getGame = function (name) {
        return this.games[name];
    }

    return _;
}();
