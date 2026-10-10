export const views=['manufacturing','agriculture','service','science'];
export function applicationView(value){return views.includes(value)?value:'manufacturing';}
export function legacyApplicationView(page,view){if(page==='value')return view==='innovation'?'science':'service';return ['manufacturing','agriculture','service'].includes(view)?view:'manufacturing';}
