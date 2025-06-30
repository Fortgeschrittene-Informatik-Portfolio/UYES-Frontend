import { initStartSite } from './startSite.js';
import { initAboutPage } from './aboutPage.js';
import { initHelpPage } from './helpPage.js';


import { registerIntroResetButton } from './utils/intros.js';

registerIntroResetButton();

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