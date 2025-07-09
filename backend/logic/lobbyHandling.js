const funnyNames = [
    "U-Norris", "Taylor Swift", "UNO DiCaprio", "Cardi Bitch",
    "Elon Shuffle", "Snoop Draw Two", "Oprah Skipfrey", "Keanu Draw-Reeves",
    "Barack Ob-Draw-ma", "Harry Skipper", "Justin Blieber", "Reverse Kardashian",
    "The Rock’n’Draw", "Skipney Spears", "UNOwen Wilson", "Kim Kardashian",
    "Lady Gaga", "Ed Sheeran", "Will Smith", "UNO Clarkson",
    "Shufflon Musk", "UNOzilla", "UNOferatu", "Beyoncé Drawoncé",
    "The Weeknd Reversed", "UNOkeem Phoenix", "Kardashian West", "UNOthanos",
    "UNOmar Khaled", "UNOna Lisa", "Lil Draw-X", "Vin Unocard",
    "UNO Maccaroni", "UNOndo der Vergelter", "UNO'Neill Shaq", "UNO McGregor",
    "UNO Bieber Fever", "UNO-Tokio Drift", "UNOlectro Deluxe", "UNOzilla vs Cardzilla",
    "UNO Reloaded", "UNOmander Reversal", "Draw-cula", "Skip Dogg",
    "UNO-Kenobi", "Card-i B", "UNO-Licious", "Skip Skywalker",
    "Card Solo", "Uno-Wan Kenobi", "Draw-nado", "Skip-a-licious",
    "UNO-Mite", "Cardzilla", "The Shuffle King", "Draw Master Flash",
    "UNO-Pocalypse", "Skip-N-Go", "Reverse Ripley"
]
function getRandomName() {
    return funnyNames[Math.floor(Math.random() * funnyNames.length)];
}

export function generateGameCode() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export function createLobby({ name, settings }) {
    const gameId = generateGameCode();
    const playerName = name?.trim() || getRandomName();


    return {
        gameId,
        playerName,
        role: "host",
        settings
    };
}

