import { initStartSite } from './startSite.js';
import { initAboutPage } from './aboutPage.js';
import { initHelpPage } from './helpPage.js';
import { initRulesPage } from './rulesPage.js';
import { initChooseLobby } from './chooseLobby.js';
import { initCreateGame } from './createGame.js';
import { initChangeSettings } from './changeSettings.js';
import { initLobbyHost } from "./lobby.js";
import { initJoinLobby } from "./joinLobby.js";
import { initGameplay } from "./gameplay.js";
import { startMusic } from './utils/music.js';
import { applyTranslations, setLanguage } from './utils/i18n.js';







const pageId = document.body.id;
startMusic();
setLanguage(localStorage.getItem('lang') || 'en');
applyTranslations(document);

if (pageId === 'startsite') {
    initStartSite();
}
else if(pageId === 'about'){
    initAboutPage();
}
else if(pageId === 'help-page-body'){
    initHelpPage();
}
else if(pageId === 'rules-page-body'){
    initRulesPage();
}
else if(pageId === 'chooseLobby'){
    initChooseLobby();
}
else if(pageId === 'createGame'){
    initCreateGame();
}
else if(pageId === 'changeSettings'){
    initChangeSettings();
}
else if (pageId === "lobbyHost") {
    initLobbyHost();
}
else if (pageId === "joinLobby") {
    initJoinLobby();
}
else if (pageId === "gameplay") {
    initGameplay();
}
