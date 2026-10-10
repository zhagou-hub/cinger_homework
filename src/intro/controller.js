import {events} from '../data/ai-content.js';
import {renderTimeline} from './timeline.js';
import {renderConcepts} from './concepts.js';
import {renderTasks} from './tasks.js';
import {navigateTo} from '../visual/ui.js';

export function initIntro(doc) {
  const win=doc.defaultView;
  const state={selectedEventId:'turing',highlightedMethod:'',selectedConceptId:'ai',selectedRelationId:null,selectedTaskId:'classification'};
  const render={history:()=>renderTimeline(doc,state),concepts:()=>renderConcepts(doc,state),tasks:()=>renderTasks(doc,state)};
  const showEvent=id=>{
    const event=events.find(e=>e.id===id);if(!event)return;
    state.selectedEventId=id;
    if(state.highlightedMethod&&state.highlightedMethod!==event.method)state.highlightedMethod='';
    render.history();
  };
  const selectConcept=id=>{state.selectedConceptId=id;state.selectedRelationId=null;render.concepts();};
  const selectTask=id=>{state.selectedTaskId=id;render.tasks();};
  doc.addEventListener('click',e=>{
    const t=e.target.closest('button,[data-event],[data-relation],[data-task]');if(!t)return;
    let selector;
    if(t.dataset.event){showEvent(t.dataset.event);selector=`[data-event="${t.dataset.event}"]`;}
    else if(t.hasAttribute('data-method')){
      state.highlightedMethod=t.dataset.method;
      if(state.highlightedMethod&&events.find(e=>e.id===state.selectedEventId).method!==state.highlightedMethod)
        state.selectedEventId=events.find(e=>e.method===state.highlightedMethod).id;
      render.history();selector=`[data-method="${t.dataset.method}"]`;
    }
    else if(t.dataset.concept){selectConcept(t.dataset.concept);selector=`.cloud-word[data-concept="${t.dataset.concept}"]`;}
    else if(t.dataset.relation){state.selectedRelationId=t.dataset.relation;render.concepts();selector=`[data-relation="${t.dataset.relation}"]`;}
    else if(t.dataset.task){selectTask(t.dataset.task);selector=`[data-task="${t.dataset.task}"]`;}
    else if(t.dataset.locateConcept){selectConcept(t.dataset.locateConcept);navigateTo(doc,'concepts');}
    else if(t.dataset.locateEvent){showEvent(t.dataset.locateEvent);navigateTo(doc,'history');}
    else if(t.dataset.locateTask){selectTask(t.dataset.locateTask);navigateTo(doc,'tasks');}
    else if(['event-prev','event-next'].includes(t.id)){
      const visible=state.highlightedMethod?events.filter(e=>e.method===state.highlightedMethod):events;
      const next=visible[visible.findIndex(e=>e.id===state.selectedEventId)+(t.id==='event-next'?1:-1)];
      if(next)showEvent(next.id);selector='#'+t.id;
    }
    if(selector)doc.querySelector(selector)?.focus({preventScroll:true});
  });
  let narrow=win.innerWidth<700;
  win.addEventListener('resize',()=>{if(narrow!==(win.innerWidth<700)){narrow=win.innerWidth<700;Object.values(render).forEach(fn=>fn());}});
  Object.values(render).forEach(fn=>fn());
  return {state,render,showEvent,selectConcept,selectTask};
}

