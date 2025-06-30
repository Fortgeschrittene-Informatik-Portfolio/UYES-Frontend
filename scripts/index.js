import { initStartSite } from './startSite.js';
import { initAboutPage } from './aboutPage.js';

import { registerIntroResetButton } from './utils/intros.js';

registerIntroResetButton();

const pageId = document.body.id;

if (pageId === 'startsite') {
    initStartSite();
}
else if(pageId === 'about'){
    initAboutPage();
}