import { initStartSite } from './startSite.js';
import { initAboutPage } from './aboutPage.js';
import { initHelpPage } from './helpPage.js';
import { initChooseLobby } from './chooseLobby.js';
import { initCreateGame } from './createGame.js';






const pageId = document.body.id;

if (pageId === 'startsite') {
    initStartSite();
}
else if(pageId === 'about'){
    initAboutPage();
}
else if(pageId === 'help-page-body'){
    initHelpPage();
}
else if(pageId === 'chooseLobby'){
    initChooseLobby();
}
else if(pageId === 'createGame'){
    initCreateGame();
}
else if (pageId === "lobbyHost") {
    initLobbyHost();
}