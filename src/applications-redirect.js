import {legacyApplicationView} from './applications/routes.js';
const view=legacyApplicationView(document.body.dataset.legacyPage,new URL(location.href).searchParams.get('view'));
const url=new URL(`./applications.html?view=${view}`,location.href);
document.querySelector('[data-app-fallback]').href=url.href;
location.replace(url);
