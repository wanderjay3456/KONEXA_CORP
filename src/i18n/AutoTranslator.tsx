import { useEffect } from 'react';
import { useLocale } from './LocaleContext';
import { canApplyUiTranslation } from './translationSafety';
import { staticUiCopy } from './staticUiCopy';

type TextState={original:string;lastApplied:string};
const textStates=new WeakMap<Text,TextState>();
const attributeStates=new WeakMap<HTMLElement,Map<string,TextState>>();
const attributes=['placeholder','title','aria-label'];
function excluded(element:Element|null){return Boolean(element?.closest('[data-no-translate],script,style,code,pre,textarea,[contenteditable="true"]'));}

/** Compatibility adapter for older screens. All copy ships with the app:
 * no AI calls, translation credentials, background retry, or loading overlay.
 * Native bilingual React components and member content remain excluded. */
export default function AutoTranslator(){
  const {locale}=useLocale();
  useEffect(()=>{
    let frame:number|undefined;
    const apply=()=>{
      for(const root of document.querySelectorAll<HTMLElement>('[data-auto-translate]')){
        if(excluded(root))continue;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
        let node=walker.nextNode() as Text|null;
        while(node){
          if(!excluded(node.parentElement)){
            const current=node.textContent||'', previous=textStates.get(node);
            const source=previous&&current===previous.lastApplied?previous.original:current;
            const state={original:source,lastApplied:previous?.lastApplied||current};
            const translated=staticUiCopy(source,locale);
            if(canApplyUiTranslation({...state,source,translated,current,connected:node.isConnected,excluded:false,reviewedCopy:true})){
              if(current!==translated)node.textContent=translated;
              textStates.set(node,{original:source,lastApplied:translated});
            }
          }
          node=walker.nextNode() as Text|null;
        }
        for(const element of root.querySelectorAll<HTMLElement>('*')){
          if(excluded(element))continue;
          const states=attributeStates.get(element)||new Map<string,TextState>();
          for(const attribute of attributes){
            const current=element.getAttribute(attribute);if(!current)continue;
            const previous=states.get(attribute),source=previous&&current===previous.lastApplied?previous.original:current;
            const state={original:source,lastApplied:previous?.lastApplied||current},translated=staticUiCopy(source,locale);
            if(canApplyUiTranslation({...state,source,translated,current,connected:element.isConnected,excluded:false,reviewedCopy:true})){
              if(current!==translated)element.setAttribute(attribute,translated);
              states.set(attribute,{original:source,lastApplied:translated});
            }
          }
          attributeStates.set(element,states);
        }
      }
    };
    const schedule=()=>{if(frame!==undefined)cancelAnimationFrame(frame);frame=requestAnimationFrame(apply);};
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});
    apply();
    return()=>{observer.disconnect();if(frame!==undefined)cancelAnimationFrame(frame);};
  },[locale]);
  return null;
}

