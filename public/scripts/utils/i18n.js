export const translations = {
    en: {
        'start.welcome': 'Welcome to UYES!',
        'start.about': 'ABOUT',
        'start.start': 'START',
        'start.help': 'HELP',
        'help.rules': 'UYES! Rules',
        'help.readRules': 'Read the full rules on our dedicated page.',
        'help.gotoRules': 'Go to Rules',
        'help.settings': 'Volume and Language Settings',
        'help.volume': 'Volume:',
        'help.language': 'Language:',
        'join.join': 'JOIN',
        'choose.title': 'Game On!',
        'choose.create': 'CREATE',
        'choose.join': 'JOIN',
        'join.invalidCode': '❌ Please enter a valid 9-digit Game-Code',
        'join.notFound': '❌ Lobby not found',
        'lobby.notFound': '❌ Lobby not found',
        'lobby.full': '❌ Lobby is full',
        'lobby.inProgress': 'Game already in progress',
        'lobby.kicked': 'You were removed from the lobby.',
        'gameplay.loadError': '❌ Error loading lobby data',
        'gameplay.handLimit': 'Reached maximum amount of cards in hand.',
        'gameplay.playerLeft': '{player} left the game.',
        'gameplay.kicked': 'You were removed from the lobby.'
    },
    de: {
        'start.welcome': 'Willkommen bei UYES!',
        'start.about': 'ÜBER UNS',
        'start.start': 'START',
        'start.help': 'HILFE',
        'help.rules': 'UYES!-Regeln',
        'help.readRules': 'Lies die vollständigen Regeln auf unserer Seite.',
        'help.gotoRules': 'Zu den Regeln',
        'help.settings': 'Lautstärke- und Spracheinstellungen',
        'help.volume': 'Lautstärke:',
        'help.language': 'Sprache:',
        'join.join': 'BEITRETEN',
        'choose.title': 'Los geht\'s!',
        'choose.create': 'ERSTELLEN',
        'choose.join': 'BEITRETEN',
        'join.invalidCode': '❌ Bitte gib einen gültigen 9-stelligen Game-Code ein',
        'join.notFound': '❌ Lobby nicht gefunden',
        'lobby.notFound': '❌ Lobby nicht gefunden',
        'lobby.full': '❌ Lobby ist voll',
        'lobby.inProgress': 'Spiel läuft bereits',
        'lobby.kicked': 'Du wurdest aus der Lobby entfernt.',
        'gameplay.loadError': '❌ Fehler beim Laden der Lobby-Daten',
        'gameplay.handLimit': 'Maximale Kartenanzahl erreicht.',
        'gameplay.playerLeft': '{player} hat das Spiel verlassen.',
        'gameplay.kicked': 'Du wurdest aus der Lobby entfernt.'
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
    }
}

export function t(key, vars) {
    let text = translations[currentLang]?.[key] || translations.en[key] || key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            text = text.replace(`{${k}}`, v);
        }
    }
    return text;
}

export function applyTranslations(root = document) {
    setLanguage(currentLang);
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.textContent = t(key);
        }
    });
}
