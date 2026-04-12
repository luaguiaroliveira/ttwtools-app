(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(r){if(r.ep)return;r.ep=!0;const o=n(r);fetch(r.href,o)}})();var Un="";function jn(t){Un=t}function Qo(t=""){if(!Un){const e=[...document.getElementsByTagName("script")],n=e.find(i=>i.hasAttribute("data-shoelace"));if(n)jn(n.getAttribute("data-shoelace"));else{const i=e.find(o=>/shoelace(\.min)?\.js($|\?)/.test(o.src)||/shoelace-autoloader(\.min)?\.js($|\?)/.test(o.src));let r="";i&&(r=i.getAttribute("src")),jn(r.split("/").slice(0,-1).join("/"))}}return Un.replace(/\/$/,"")+(t?`/${t.replace(/^\//,"")}`:"")}var Hr=Object.defineProperty,ts=Object.defineProperties,es=Object.getOwnPropertyDescriptor,ns=Object.getOwnPropertyDescriptors,Ri=Object.getOwnPropertySymbols,is=Object.prototype.hasOwnProperty,rs=Object.prototype.propertyIsEnumerable,qr=t=>{throw TypeError(t)},Bi=(t,e,n)=>e in t?Hr(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n,Wt=(t,e)=>{for(var n in e||(e={}))is.call(e,n)&&Bi(t,n,e[n]);if(Ri)for(var n of Ri(e))rs.call(e,n)&&Bi(t,n,e[n]);return t},fn=(t,e)=>ts(t,ns(e)),p=(t,e,n,i)=>{for(var r=i>1?void 0:i?es(e,n):e,o=t.length-1,s;o>=0;o--)(s=t[o])&&(r=(i?s(e,n,r):s(r))||r);return i&&r&&Hr(e,n,r),r},Ur=(t,e,n)=>e.has(t)||qr("Cannot "+n),os=(t,e,n)=>(Ur(t,e,"read from private field"),e.get(t)),ss=(t,e,n)=>e.has(t)?qr("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),as=(t,e,n,i)=>(Ur(t,e,"write to private field"),e.set(t,n),n);/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Ve=globalThis,hi=Ve.ShadowRoot&&(Ve.ShadyCSS===void 0||Ve.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,di=Symbol(),Di=new WeakMap;let jr=class{constructor(e,n,i){if(this._$cssResult$=!0,i!==di)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=n}get styleSheet(){let e=this.o;const n=this.t;if(hi&&e===void 0){const i=n!==void 0&&n.length===1;i&&(e=Di.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Di.set(n,e))}return e}toString(){return this.cssText}};const ls=t=>new jr(typeof t=="string"?t:t+"",void 0,di),pt=(t,...e)=>{const n=t.length===1?t[0]:e.reduce((i,r,o)=>i+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+t[o+1],t[0]);return new jr(n,t,di)},cs=(t,e)=>{if(hi)t.adoptedStyleSheets=e.map(n=>n instanceof CSSStyleSheet?n:n.styleSheet);else for(const n of e){const i=document.createElement("style"),r=Ve.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=n.cssText,t.appendChild(i)}},Fi=hi?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let n="";for(const i of e.cssRules)n+=i.cssText;return ls(n)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:us,defineProperty:hs,getOwnPropertyDescriptor:ds,getOwnPropertyNames:fs,getOwnPropertySymbols:ps,getPrototypeOf:ms}=Object,St=globalThis,Vi=St.trustedTypes,gs=Vi?Vi.emptyScript:"",An=St.reactiveElementPolyfillSupport,we=(t,e)=>t,Qt={toAttribute(t,e){switch(e){case Boolean:t=t?gs:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let n=t;switch(e){case Boolean:n=t!==null;break;case Number:n=t===null?null:Number(t);break;case Object:case Array:try{n=JSON.parse(t)}catch{n=null}}return n}},fi=(t,e)=>!us(t,e),Hi={attribute:!0,type:String,converter:Qt,reflect:!1,useDefault:!1,hasChanged:fi};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),St.litPropertyMetadata??(St.litPropertyMetadata=new WeakMap);let Yt=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,n=Hi){if(n.state&&(n.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((n=Object.create(n)).wrapped=!0),this.elementProperties.set(e,n),!n.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,n);r!==void 0&&hs(this.prototype,e,r)}}static getPropertyDescriptor(e,n,i){const{get:r,set:o}=ds(this.prototype,e)??{get(){return this[n]},set(s){this[n]=s}};return{get:r,set(s){const a=r==null?void 0:r.call(this);o==null||o.call(this,s),this.requestUpdate(e,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Hi}static _$Ei(){if(this.hasOwnProperty(we("elementProperties")))return;const e=ms(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(we("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(we("properties"))){const n=this.properties,i=[...fs(n),...ps(n)];for(const r of i)this.createProperty(r,n[r])}const e=this[Symbol.metadata];if(e!==null){const n=litPropertyMetadata.get(e);if(n!==void 0)for(const[i,r]of n)this.elementProperties.set(i,r)}this._$Eh=new Map;for(const[n,i]of this.elementProperties){const r=this._$Eu(n,i);r!==void 0&&this._$Eh.set(r,n)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const n=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const r of i)n.unshift(Fi(r))}else e!==void 0&&n.push(Fi(e));return n}static _$Eu(e,n){const i=n.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(n=>this.enableUpdating=n),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(n=>n(this))}addController(e){var n;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((n=e.hostConnected)==null||n.call(e))}removeController(e){var n;(n=this._$EO)==null||n.delete(e)}_$E_(){const e=new Map,n=this.constructor.elementProperties;for(const i of n.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return cs(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(n=>{var i;return(i=n.hostConnected)==null?void 0:i.call(n)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(n=>{var i;return(i=n.hostDisconnected)==null?void 0:i.call(n)})}attributeChangedCallback(e,n,i){this._$AK(e,i)}_$ET(e,n){var o;const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){const s=(((o=i.converter)==null?void 0:o.toAttribute)!==void 0?i.converter:Qt).toAttribute(n,i.type);this._$Em=e,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(e,n){var o,s;const i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const a=i.getPropertyOptions(r),l=typeof a.converter=="function"?{fromAttribute:a.converter}:((o=a.converter)==null?void 0:o.fromAttribute)!==void 0?a.converter:Qt;this._$Em=r;const c=l.fromAttribute(n,a.type);this[r]=c??((s=this._$Ej)==null?void 0:s.get(r))??c,this._$Em=null}}requestUpdate(e,n,i,r=!1,o){var s;if(e!==void 0){const a=this.constructor;if(r===!1&&(o=this[e]),i??(i=a.getPropertyOptions(e)),!((i.hasChanged??fi)(o,n)||i.useDefault&&i.reflect&&o===((s=this._$Ej)==null?void 0:s.get(e))&&!this.hasAttribute(a._$Eu(e,i))))return;this.C(e,n,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,n,{useDefault:i,reflect:r,wrapped:o},s){i&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,s??n??this[e]),o!==!0||s!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(n=void 0),this._$AL.set(e,n)),r===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(n){Promise.reject(n)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var i;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[o,s]of this._$Ep)this[o]=s;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[o,s]of r){const{wrapped:a}=s,l=this[o];a!==!0||this._$AL.has(o)||l===void 0||this.C(o,void 0,s,l)}}let e=!1;const n=this._$AL;try{e=this.shouldUpdate(n),e?(this.willUpdate(n),(i=this._$EO)==null||i.forEach(r=>{var o;return(o=r.hostUpdate)==null?void 0:o.call(r)}),this.update(n)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(n)}willUpdate(e){}_$AE(e){var n;(n=this._$EO)==null||n.forEach(i=>{var r;return(r=i.hostUpdated)==null?void 0:r.call(i)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(n=>this._$ET(n,this[n]))),this._$EM()}updated(e){}firstUpdated(e){}};Yt.elementStyles=[],Yt.shadowRootOptions={mode:"open"},Yt[we("elementProperties")]=new Map,Yt[we("finalized")]=new Map,An==null||An({ReactiveElement:Yt}),(St.reactiveElementVersions??(St.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _e=globalThis,qi=t=>t,Ye=_e.trustedTypes,Ui=Ye?Ye.createPolicy("lit-html",{createHTML:t=>t}):void 0,Wr="$lit$",At=`lit$${Math.random().toFixed(9).slice(2)}$`,Xr="?"+At,vs=`<${Xr}>`,Vt=document,ke=()=>Vt.createComment(""),$e=t=>t===null||typeof t!="object"&&typeof t!="function",pi=Array.isArray,bs=t=>pi(t)||typeof(t==null?void 0:t[Symbol.iterator])=="function",Sn=`[ 	
\f\r]`,ce=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ji=/-->/g,Wi=/>/g,Ot=RegExp(`>|${Sn}(?:([^\\s"'>=/]+)(${Sn}*=${Sn}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Xi=/'/g,Yi=/"/g,Yr=/^(?:script|style|textarea|title)$/i,ys=t=>(e,...n)=>({_$litType$:t,strings:e,values:n}),B=ys(1),lt=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),Ki=new WeakMap,Rt=Vt.createTreeWalker(Vt,129);function Kr(t,e){if(!pi(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ui!==void 0?Ui.createHTML(e):e}const ws=(t,e)=>{const n=t.length-1,i=[];let r,o=e===2?"<svg>":e===3?"<math>":"",s=ce;for(let a=0;a<n;a++){const l=t[a];let c,u,h=-1,d=0;for(;d<l.length&&(s.lastIndex=d,u=s.exec(l),u!==null);)d=s.lastIndex,s===ce?u[1]==="!--"?s=ji:u[1]!==void 0?s=Wi:u[2]!==void 0?(Yr.test(u[2])&&(r=RegExp("</"+u[2],"g")),s=Ot):u[3]!==void 0&&(s=Ot):s===Ot?u[0]===">"?(s=r??ce,h=-1):u[1]===void 0?h=-2:(h=s.lastIndex-u[2].length,c=u[1],s=u[3]===void 0?Ot:u[3]==='"'?Yi:Xi):s===Yi||s===Xi?s=Ot:s===ji||s===Wi?s=ce:(s=Ot,r=void 0);const f=s===Ot&&t[a+1].startsWith("/>")?" ":"";o+=s===ce?l+vs:h>=0?(i.push(c),l.slice(0,h)+Wr+l.slice(h)+At+f):l+At+(h===-2?a:f)}return[Kr(t,o+(t[n]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]};class Ce{constructor({strings:e,_$litType$:n},i){let r;this.parts=[];let o=0,s=0;const a=e.length-1,l=this.parts,[c,u]=ws(e,n);if(this.el=Ce.createElement(c,i),Rt.currentNode=this.el.content,n===2||n===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(r=Rt.nextNode())!==null&&l.length<a;){if(r.nodeType===1){if(r.hasAttributes())for(const h of r.getAttributeNames())if(h.endsWith(Wr)){const d=u[s++],f=r.getAttribute(h).split(At),m=/([.?@])?(.*)/.exec(d);l.push({type:1,index:o,name:m[2],strings:f,ctor:m[1]==="."?xs:m[1]==="?"?ks:m[1]==="@"?$s:pn}),r.removeAttribute(h)}else h.startsWith(At)&&(l.push({type:6,index:o}),r.removeAttribute(h));if(Yr.test(r.tagName)){const h=r.textContent.split(At),d=h.length-1;if(d>0){r.textContent=Ye?Ye.emptyScript:"";for(let f=0;f<d;f++)r.append(h[f],ke()),Rt.nextNode(),l.push({type:2,index:++o});r.append(h[d],ke())}}}else if(r.nodeType===8)if(r.data===Xr)l.push({type:2,index:o});else{let h=-1;for(;(h=r.data.indexOf(At,h+1))!==-1;)l.push({type:7,index:o}),h+=At.length-1}o++}}static createElement(e,n){const i=Vt.createElement("template");return i.innerHTML=e,i}}function te(t,e,n=t,i){var s,a;if(e===lt)return e;let r=i!==void 0?(s=n._$Co)==null?void 0:s[i]:n._$Cl;const o=$e(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==o&&((a=r==null?void 0:r._$AO)==null||a.call(r,!1),o===void 0?r=void 0:(r=new o(t),r._$AT(t,n,i)),i!==void 0?(n._$Co??(n._$Co=[]))[i]=r:n._$Cl=r),r!==void 0&&(e=te(t,r._$AS(t,e.values),r,i)),e}class _s{constructor(e,n){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=n}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:n},parts:i}=this._$AD,r=((e==null?void 0:e.creationScope)??Vt).importNode(n,!0);Rt.currentNode=r;let o=Rt.nextNode(),s=0,a=0,l=i[0];for(;l!==void 0;){if(s===l.index){let c;l.type===2?c=new ze(o,o.nextSibling,this,e):l.type===1?c=new l.ctor(o,l.name,l.strings,this,e):l.type===6&&(c=new Cs(o,this,e)),this._$AV.push(c),l=i[++a]}s!==(l==null?void 0:l.index)&&(o=Rt.nextNode(),s++)}return Rt.currentNode=Vt,r}p(e){let n=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,n),n+=i.strings.length-2):i._$AI(e[n])),n++}}class ze{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,n,i,r){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=e,this._$AB=n,this._$AM=i,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const n=this._$AM;return n!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=n.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,n=this){e=te(this,e,n),$e(e)?e===q||e==null||e===""?(this._$AH!==q&&this._$AR(),this._$AH=q):e!==this._$AH&&e!==lt&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):bs(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==q&&$e(this._$AH)?this._$AA.nextSibling.data=e:this.T(Vt.createTextNode(e)),this._$AH=e}$(e){var o;const{values:n,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Ce.createElement(Kr(i.h,i.h[0]),this.options)),i);if(((o=this._$AH)==null?void 0:o._$AD)===r)this._$AH.p(n);else{const s=new _s(r,this),a=s.u(this.options);s.p(n),this.T(a),this._$AH=s}}_$AC(e){let n=Ki.get(e.strings);return n===void 0&&Ki.set(e.strings,n=new Ce(e)),n}k(e){pi(this._$AH)||(this._$AH=[],this._$AR());const n=this._$AH;let i,r=0;for(const o of e)r===n.length?n.push(i=new ze(this.O(ke()),this.O(ke()),this,this.options)):i=n[r],i._$AI(o),r++;r<n.length&&(this._$AR(i&&i._$AB.nextSibling,r),n.length=r)}_$AR(e=this._$AA.nextSibling,n){var i;for((i=this._$AP)==null?void 0:i.call(this,!1,!0,n);e!==this._$AB;){const r=qi(e).nextSibling;qi(e).remove(),e=r}}setConnected(e){var n;this._$AM===void 0&&(this._$Cv=e,(n=this._$AP)==null||n.call(this,e))}}class pn{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,n,i,r,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=e,this.name=n,this._$AM=r,this.options=o,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=q}_$AI(e,n=this,i,r){const o=this.strings;let s=!1;if(o===void 0)e=te(this,e,n,0),s=!$e(e)||e!==this._$AH&&e!==lt,s&&(this._$AH=e);else{const a=e;let l,c;for(e=o[0],l=0;l<o.length-1;l++)c=te(this,a[i+l],n,l),c===lt&&(c=this._$AH[l]),s||(s=!$e(c)||c!==this._$AH[l]),c===q?e=q:e!==q&&(e+=(c??"")+o[l+1]),this._$AH[l]=c}s&&!r&&this.j(e)}j(e){e===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class xs extends pn{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===q?void 0:e}}class ks extends pn{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==q)}}class $s extends pn{constructor(e,n,i,r,o){super(e,n,i,r,o),this.type=5}_$AI(e,n=this){if((e=te(this,e,n,0)??q)===lt)return;const i=this._$AH,r=e===q&&i!==q||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==q&&(i===q||r);r&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var n;typeof this._$AH=="function"?this._$AH.call(((n=this.options)==null?void 0:n.host)??this.element,e):this._$AH.handleEvent(e)}}class Cs{constructor(e,n,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=n,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){te(this,e)}}const Tn=_e.litHtmlPolyfillSupport;Tn==null||Tn(Ce,ze),(_e.litHtmlVersions??(_e.litHtmlVersions=[])).push("3.3.2");const Es=(t,e,n)=>{const i=(n==null?void 0:n.renderBefore)??e;let r=i._$litPart$;if(r===void 0){const o=(n==null?void 0:n.renderBefore)??null;i._$litPart$=r=new ze(e.insertBefore(ke(),o),o,void 0,n??{})}return r._$AI(t),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Dt=globalThis;let xe=class extends Yt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var n;const e=super.createRenderRoot();return(n=this.renderOptions).renderBefore??(n.renderBefore=e.firstChild),e}update(e){const n=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Es(n,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return lt}};var Vr;xe._$litElement$=!0,xe.finalized=!0,(Vr=Dt.litElementHydrateSupport)==null||Vr.call(Dt,{LitElement:xe});const zn=Dt.litElementPolyfillSupport;zn==null||zn({LitElement:xe});(Dt.litElementVersions??(Dt.litElementVersions=[])).push("4.2.2");var As=pt`
  :host {
    display: inline-block;
  }

  .tag {
    display: flex;
    align-items: center;
    border: solid 1px;
    line-height: 1;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  .tag__remove::part(base) {
    color: inherit;
    padding: 0;
  }

  /*
   * Variant modifiers
   */

  .tag--primary {
    background-color: var(--sl-color-primary-50);
    border-color: var(--sl-color-primary-200);
    color: var(--sl-color-primary-800);
  }

  .tag--primary:active > sl-icon-button {
    color: var(--sl-color-primary-600);
  }

  .tag--success {
    background-color: var(--sl-color-success-50);
    border-color: var(--sl-color-success-200);
    color: var(--sl-color-success-800);
  }

  .tag--success:active > sl-icon-button {
    color: var(--sl-color-success-600);
  }

  .tag--neutral {
    background-color: var(--sl-color-neutral-50);
    border-color: var(--sl-color-neutral-200);
    color: var(--sl-color-neutral-800);
  }

  .tag--neutral:active > sl-icon-button {
    color: var(--sl-color-neutral-600);
  }

  .tag--warning {
    background-color: var(--sl-color-warning-50);
    border-color: var(--sl-color-warning-200);
    color: var(--sl-color-warning-800);
  }

  .tag--warning:active > sl-icon-button {
    color: var(--sl-color-warning-600);
  }

  .tag--danger {
    background-color: var(--sl-color-danger-50);
    border-color: var(--sl-color-danger-200);
    color: var(--sl-color-danger-800);
  }

  .tag--danger:active > sl-icon-button {
    color: var(--sl-color-danger-600);
  }

  /*
   * Size modifiers
   */

  .tag--small {
    font-size: var(--sl-button-font-size-small);
    height: calc(var(--sl-input-height-small) * 0.8);
    line-height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-small);
    padding: 0 var(--sl-spacing-x-small);
  }

  .tag--medium {
    font-size: var(--sl-button-font-size-medium);
    height: calc(var(--sl-input-height-medium) * 0.8);
    line-height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-medium);
    padding: 0 var(--sl-spacing-small);
  }

  .tag--large {
    font-size: var(--sl-button-font-size-large);
    height: calc(var(--sl-input-height-large) * 0.8);
    line-height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    border-radius: var(--sl-input-border-radius-large);
    padding: 0 var(--sl-spacing-medium);
  }

  .tag__remove {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  /*
   * Pill modifier
   */

  .tag--pill {
    border-radius: var(--sl-border-radius-pill);
  }
`,Ss=pt`
  :host {
    display: inline-block;
    color: var(--sl-color-neutral-600);
  }

  .icon-button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: var(--sl-border-radius-medium);
    font-size: inherit;
    color: inherit;
    padding: var(--sl-spacing-x-small);
    cursor: pointer;
    transition: var(--sl-transition-x-fast) color;
    -webkit-appearance: none;
  }

  .icon-button:hover:not(.icon-button--disabled),
  .icon-button:focus-visible:not(.icon-button--disabled) {
    color: var(--sl-color-primary-600);
  }

  .icon-button:active:not(.icon-button--disabled) {
    color: var(--sl-color-primary-700);
  }

  .icon-button:focus {
    outline: none;
  }

  .icon-button--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon-button:focus-visible {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .icon-button__icon {
    pointer-events: none;
  }
`,Ts={name:"default",resolver:t=>Qo(`assets/icons/${t}.svg`)},zs=Ts,Gi={caret:`
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,check:`
    <svg part="checked-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor">
          <g transform="translate(3.428571, 3.428571)">
            <path d="M0,5.71428571 L3.42857143,9.14285714"></path>
            <path d="M9.14285714,0 L3.42857143,9.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,"chevron-down":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,"chevron-left":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  `,"chevron-right":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `,copy:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
    </svg>
  `,eye:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
    </svg>
  `,"eye-slash":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
      <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
    </svg>
  `,eyedropper:`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eyedropper" viewBox="0 0 16 16">
      <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708l-2-2zM2 12.707l7-7L10.293 7l-7 7H2v-1.293z"></path>
    </svg>
  `,"grip-vertical":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-grip-vertical" viewBox="0 0 16 16">
      <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path>
    </svg>
  `,indeterminate:`
    <svg part="indeterminate-icon" class="checkbox__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
        <g stroke="currentColor" stroke-width="2">
          <g transform="translate(2.285714, 6.857143)">
            <path d="M10.2857143,1.14285714 L1.14285714,1.14285714"></path>
          </g>
        </g>
      </g>
    </svg>
  `,"person-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill" viewBox="0 0 16 16">
      <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
    </svg>
  `,"play-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
    </svg>
  `,"pause-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 16 16">
      <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"></path>
    </svg>
  `,radio:`
    <svg part="checked-icon" class="radio__icon" viewBox="0 0 16 16">
      <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g fill="currentColor">
          <circle cx="8" cy="8" r="3.42857143"></circle>
        </g>
      </g>
    </svg>
  `,"star-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
      <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
    </svg>
  `,"x-lg":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    </svg>
  `,"x-circle-fill":`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"></path>
    </svg>
  `},Ms={name:"system",resolver:t=>t in Gi?`data:image/svg+xml,${encodeURIComponent(Gi[t])}`:""},Os=Ms,Ls=[zs,Os],Wn=[];function Ps(t){Wn.push(t)}function Is(t){Wn=Wn.filter(e=>e!==t)}function Zi(t){return Ls.find(e=>e.name===t)}var Ns=pt`
  :host {
    display: inline-block;
    width: 1em;
    height: 1em;
    box-sizing: content-box !important;
  }

  svg {
    display: block;
    height: 100%;
    width: 100%;
  }
`;function G(t,e){const n=Wt({waitUntilFirstUpdate:!1},e);return(i,r)=>{const{update:o}=i,s=Array.isArray(t)?t:[t];i.update=function(a){s.forEach(l=>{const c=l;if(a.has(c)){const u=a.get(c),h=this[c];u!==h&&(!n.waitUntilFirstUpdate||this.hasUpdated)&&this[r](u,h)}}),o.call(this,a)}}}var $t=pt`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }
`;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Rs={attribute:!0,type:String,converter:Qt,reflect:!1,hasChanged:fi},Bs=(t=Rs,e,n)=>{const{kind:i,metadata:r}=n;let o=globalThis.litPropertyMetadata.get(r);if(o===void 0&&globalThis.litPropertyMetadata.set(r,o=new Map),i==="setter"&&((t=Object.create(t)).wrapped=!0),o.set(n.name,t),i==="accessor"){const{name:s}=n;return{set(a){const l=e.get.call(this);e.set.call(this,a),this.requestUpdate(s,l,t,!0,a)},init(a){return a!==void 0&&this.C(s,void 0,t,a),a}}}if(i==="setter"){const{name:s}=n;return function(a){const l=this[s];e.call(this,a),this.requestUpdate(s,l,t,!0,a)}}throw Error("Unsupported decorator location: "+i)};function g(t){return(e,n)=>typeof n=="object"?Bs(t,e,n):((i,r,o)=>{const s=r.hasOwnProperty(o);return r.constructor.createProperty(o,i),s?Object.getOwnPropertyDescriptor(r,o):void 0})(t,e,n)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Z(t){return g({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function Ds(t){return(e,n)=>{const i=typeof e=="function"?e:e[n];Object.assign(i,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Fs=(t,e,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof e!="object"&&Object.defineProperty(t,e,n),n);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function rt(t,e){return(n,i,r)=>{const o=s=>{var a;return((a=s.renderRoot)==null?void 0:a.querySelector(t))??null};return Fs(n,i,{get(){return o(this)}})}}var He,ot=class extends xe{constructor(){super(),ss(this,He,!1),this.initialReflectedProperties=new Map,Object.entries(this.constructor.dependencies).forEach(([t,e])=>{this.constructor.define(t,e)})}emit(t,e){const n=new CustomEvent(t,Wt({bubbles:!0,cancelable:!1,composed:!0,detail:{}},e));return this.dispatchEvent(n),n}static define(t,e=this,n={}){const i=customElements.get(t);if(!i){try{customElements.define(t,e,n)}catch{customElements.define(t,class extends e{},n)}return}let r=" (unknown version)",o=r;"version"in e&&e.version&&(r=" v"+e.version),"version"in i&&i.version&&(o=" v"+i.version),!(r&&o&&r===o)&&console.warn(`Attempted to register <${t}>${r}, but <${t}>${o} has already been registered.`)}attributeChangedCallback(t,e,n){os(this,He)||(this.constructor.elementProperties.forEach((i,r)=>{i.reflect&&this[r]!=null&&this.initialReflectedProperties.set(r,this[r])}),as(this,He,!0)),super.attributeChangedCallback(t,e,n)}willUpdate(t){super.willUpdate(t),this.initialReflectedProperties.forEach((e,n)=>{t.has(n)&&this[n]==null&&(this[n]=e)})}};He=new WeakMap;ot.version="2.20.1";ot.dependencies={};p([g()],ot.prototype,"dir",2);p([g()],ot.prototype,"lang",2);/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Vs=(t,e)=>(t==null?void 0:t._$litType$)!==void 0,Hs=t=>t.strings===void 0,qs={},Us=(t,e=qs)=>t._$AH=e;var ue=Symbol(),Pe=Symbol(),Mn,On=new Map,st=class extends ot{constructor(){super(...arguments),this.initialRender=!1,this.svg=null,this.label="",this.library="default"}async resolveIcon(t,e){var n;let i;if(e!=null&&e.spriteSheet)return this.svg=B`<svg part="svg">
        <use part="use" href="${t}"></use>
      </svg>`,this.svg;try{if(i=await fetch(t,{mode:"cors"}),!i.ok)return i.status===410?ue:Pe}catch{return Pe}try{const r=document.createElement("div");r.innerHTML=await i.text();const o=r.firstElementChild;if(((n=o==null?void 0:o.tagName)==null?void 0:n.toLowerCase())!=="svg")return ue;Mn||(Mn=new DOMParser);const a=Mn.parseFromString(o.outerHTML,"text/html").body.querySelector("svg");return a?(a.part.add("svg"),document.adoptNode(a)):ue}catch{return ue}}connectedCallback(){super.connectedCallback(),Ps(this)}firstUpdated(){this.initialRender=!0,this.setIcon()}disconnectedCallback(){super.disconnectedCallback(),Is(this)}getIconSource(){const t=Zi(this.library);return this.name&&t?{url:t.resolver(this.name),fromLibrary:!0}:{url:this.src,fromLibrary:!1}}handleLabelChange(){typeof this.label=="string"&&this.label.length>0?(this.setAttribute("role","img"),this.setAttribute("aria-label",this.label),this.removeAttribute("aria-hidden")):(this.removeAttribute("role"),this.removeAttribute("aria-label"),this.setAttribute("aria-hidden","true"))}async setIcon(){var t;const{url:e,fromLibrary:n}=this.getIconSource(),i=n?Zi(this.library):void 0;if(!e){this.svg=null;return}let r=On.get(e);if(r||(r=this.resolveIcon(e,i),On.set(e,r)),!this.initialRender)return;const o=await r;if(o===Pe&&On.delete(e),e===this.getIconSource().url){if(Vs(o)){if(this.svg=o,i){await this.updateComplete;const s=this.shadowRoot.querySelector("[part='svg']");typeof i.mutator=="function"&&s&&i.mutator(s)}return}switch(o){case Pe:case ue:this.svg=null,this.emit("sl-error");break;default:this.svg=o.cloneNode(!0),(t=i==null?void 0:i.mutator)==null||t.call(i,this.svg),this.emit("sl-load")}}}render(){return this.svg}};st.styles=[$t,Ns];p([Z()],st.prototype,"svg",2);p([g({reflect:!0})],st.prototype,"name",2);p([g()],st.prototype,"src",2);p([g()],st.prototype,"label",2);p([g({reflect:!0})],st.prototype,"library",2);p([G("label")],st.prototype,"handleLabelChange",1);p([G(["name","src","library"])],st.prototype,"setIcon",1);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Et={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4},mi=t=>(...e)=>({_$litDirective$:t,values:e});let gi=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,n,i){this._$Ct=e,this._$AM=n,this._$Ci=i}_$AS(e,n){return this.update(e,n)}update(e,n){return this.render(...n)}};/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const nt=mi(class extends gi{constructor(t){var e;if(super(t),t.type!==Et.ATTRIBUTE||t.name!=="class"||((e=t.strings)==null?void 0:e.length)>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter(e=>t[e]).join(" ")+" "}update(t,[e]){var i,r;if(this.st===void 0){this.st=new Set,t.strings!==void 0&&(this.nt=new Set(t.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(const o in e)e[o]&&!((i=this.nt)!=null&&i.has(o))&&this.st.add(o);return this.render(e)}const n=t.element.classList;for(const o of this.st)o in e||(n.remove(o),this.st.delete(o));for(const o in e){const s=!!e[o];s===this.st.has(o)||(r=this.nt)!=null&&r.has(o)||(s?(n.add(o),this.st.add(o)):(n.remove(o),this.st.delete(o)))}return lt}});/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Gr=Symbol.for(""),js=t=>{if((t==null?void 0:t.r)===Gr)return t==null?void 0:t._$litStatic$},Ji=(t,...e)=>({_$litStatic$:e.reduce((n,i,r)=>n+(o=>{if(o._$litStatic$!==void 0)return o._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${o}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`)})(i)+t[r+1],t[0]),r:Gr}),Qi=new Map,Ws=t=>(e,...n)=>{const i=n.length;let r,o;const s=[],a=[];let l,c=0,u=!1;for(;c<i;){for(l=e[c];c<i&&(o=n[c],(r=js(o))!==void 0);)l+=r+e[++c],u=!0;c!==i&&a.push(o),s.push(l),c++}if(c===i&&s.push(e[i]),u){const h=s.join("$$lit$$");(e=Qi.get(h))===void 0&&(s.raw=s,Qi.set(h,e=s)),n=a}return t(e,...n)},Xs=Ws(B);/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const L=t=>t??q;var at=class extends ot{constructor(){super(...arguments),this.hasFocus=!1,this.label="",this.disabled=!1}handleBlur(){this.hasFocus=!1,this.emit("sl-blur")}handleFocus(){this.hasFocus=!0,this.emit("sl-focus")}handleClick(t){this.disabled&&(t.preventDefault(),t.stopPropagation())}click(){this.button.click()}focus(t){this.button.focus(t)}blur(){this.button.blur()}render(){const t=!!this.href,e=t?Ji`a`:Ji`button`;return Xs`
      <${e}
        part="base"
        class=${nt({"icon-button":!0,"icon-button--disabled":!t&&this.disabled,"icon-button--focused":this.hasFocus})}
        ?disabled=${L(t?void 0:this.disabled)}
        type=${L(t?void 0:"button")}
        href=${L(t?this.href:void 0)}
        target=${L(t?this.target:void 0)}
        download=${L(t?this.download:void 0)}
        rel=${L(t&&this.target?"noreferrer noopener":void 0)}
        role=${L(t?void 0:"button")}
        aria-disabled=${this.disabled?"true":"false"}
        aria-label="${this.label}"
        tabindex=${this.disabled?"-1":"0"}
        @blur=${this.handleBlur}
        @focus=${this.handleFocus}
        @click=${this.handleClick}
      >
        <sl-icon
          class="icon-button__icon"
          name=${L(this.name)}
          library=${L(this.library)}
          src=${L(this.src)}
          aria-hidden="true"
        ></sl-icon>
      </${e}>
    `}};at.styles=[$t,Ss];at.dependencies={"sl-icon":st};p([rt(".icon-button")],at.prototype,"button",2);p([Z()],at.prototype,"hasFocus",2);p([g()],at.prototype,"name",2);p([g()],at.prototype,"library",2);p([g()],at.prototype,"src",2);p([g()],at.prototype,"href",2);p([g()],at.prototype,"target",2);p([g()],at.prototype,"download",2);p([g()],at.prototype,"label",2);p([g({type:Boolean,reflect:!0})],at.prototype,"disabled",2);const Xn=new Set,Kt=new Map;let It,vi="ltr",bi="en";const Zr=typeof MutationObserver<"u"&&typeof document<"u"&&typeof document.documentElement<"u";if(Zr){const t=new MutationObserver(Qr);vi=document.documentElement.dir||"ltr",bi=document.documentElement.lang||navigator.language,t.observe(document.documentElement,{attributes:!0,attributeFilter:["dir","lang"]})}function Jr(...t){t.map(e=>{const n=e.$code.toLowerCase();Kt.has(n)?Kt.set(n,Object.assign(Object.assign({},Kt.get(n)),e)):Kt.set(n,e),It||(It=e)}),Qr()}function Qr(){Zr&&(vi=document.documentElement.dir||"ltr",bi=document.documentElement.lang||navigator.language),[...Xn.keys()].map(t=>{typeof t.requestUpdate=="function"&&t.requestUpdate()})}let Ys=class{constructor(e){this.host=e,this.host.addController(this)}hostConnected(){Xn.add(this.host)}hostDisconnected(){Xn.delete(this.host)}dir(){return`${this.host.dir||vi}`.toLowerCase()}lang(){return`${this.host.lang||bi}`.toLowerCase()}getTranslationData(e){var n,i;const r=new Intl.Locale(e.replace(/_/g,"-")),o=r==null?void 0:r.language.toLowerCase(),s=(i=(n=r==null?void 0:r.region)===null||n===void 0?void 0:n.toLowerCase())!==null&&i!==void 0?i:"",a=Kt.get(`${o}-${s}`),l=Kt.get(o);return{locale:r,language:o,region:s,primary:a,secondary:l}}exists(e,n){var i;const{primary:r,secondary:o}=this.getTranslationData((i=n.lang)!==null&&i!==void 0?i:this.lang());return n=Object.assign({includeFallback:!1},n),!!(r&&r[e]||o&&o[e]||n.includeFallback&&It&&It[e])}term(e,...n){const{primary:i,secondary:r}=this.getTranslationData(this.lang());let o;if(i&&i[e])o=i[e];else if(r&&r[e])o=r[e];else if(It&&It[e])o=It[e];else return console.error(`No translation found for: ${String(e)}`),String(e);return typeof o=="function"?o(...n):o}date(e,n){return e=new Date(e),new Intl.DateTimeFormat(this.lang(),n).format(e)}number(e,n){return e=Number(e),isNaN(e)?"":new Intl.NumberFormat(this.lang(),n).format(e)}relativeTime(e,n,i){return new Intl.RelativeTimeFormat(this.lang(),i).format(e,n)}};var to={$code:"en",$name:"English",$dir:"ltr",carousel:"Carousel",clearEntry:"Clear entry",close:"Close",copied:"Copied",copy:"Copy",currentValue:"Current value",error:"Error",goToSlide:(t,e)=>`Go to slide ${t} of ${e}`,hidePassword:"Hide password",loading:"Loading",nextSlide:"Next slide",numOptionsSelected:t=>t===0?"No options selected":t===1?"1 option selected":`${t} options selected`,previousSlide:"Previous slide",progress:"Progress",remove:"Remove",resize:"Resize",scrollToEnd:"Scroll to end",scrollToStart:"Scroll to start",selectAColorFromTheScreen:"Select a color from the screen",showPassword:"Show password",slideNum:t=>`Slide ${t}`,toggleColorFormat:"Toggle color format"};Jr(to);var Ks=to,oe=class extends Ys{};Jr(Ks);var Xt=class extends ot{constructor(){super(...arguments),this.localize=new oe(this),this.variant="neutral",this.size="medium",this.pill=!1,this.removable=!1}handleRemoveClick(){this.emit("sl-remove")}render(){return B`
      <span
        part="base"
        class=${nt({tag:!0,"tag--primary":this.variant==="primary","tag--success":this.variant==="success","tag--neutral":this.variant==="neutral","tag--warning":this.variant==="warning","tag--danger":this.variant==="danger","tag--text":this.variant==="text","tag--small":this.size==="small","tag--medium":this.size==="medium","tag--large":this.size==="large","tag--pill":this.pill,"tag--removable":this.removable})}
      >
        <slot part="content" class="tag__content"></slot>

        ${this.removable?B`
              <sl-icon-button
                part="remove-button"
                exportparts="base:remove-button__base"
                name="x-lg"
                library="system"
                label=${this.localize.term("remove")}
                class="tag__remove"
                @click=${this.handleRemoveClick}
                tabindex="-1"
              ></sl-icon-button>
            `:""}
      </span>
    `}};Xt.styles=[$t,As];Xt.dependencies={"sl-icon-button":at};p([g({reflect:!0})],Xt.prototype,"variant",2);p([g({reflect:!0})],Xt.prototype,"size",2);p([g({type:Boolean,reflect:!0})],Xt.prototype,"pill",2);p([g({type:Boolean})],Xt.prototype,"removable",2);var Gs=pt`
  :host {
    display: block;
  }

  /** The popup */
  .select {
    flex: 1 1 auto;
    display: inline-flex;
    width: 100%;
    position: relative;
    vertical-align: middle;
  }

  .select::part(popup) {
    z-index: var(--sl-z-index-dropdown);
  }

  .select[data-current-placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .select[data-current-placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  /* Combobox */
  .select__combobox {
    flex: 1;
    display: flex;
    width: 100%;
    min-width: 0;
    position: relative;
    align-items: center;
    justify-content: start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: pointer;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  .select__display-input {
    position: relative;
    width: 100%;
    font: inherit;
    border: none;
    background: none;
    color: var(--sl-input-color);
    cursor: inherit;
    overflow: hidden;
    padding: 0;
    margin: 0;
    -webkit-appearance: none;
  }

  .select__display-input::placeholder {
    color: var(--sl-input-placeholder-color);
  }

  .select:not(.select--disabled):hover .select__display-input {
    color: var(--sl-input-color-hover);
  }

  .select__display-input:focus {
    outline: none;
  }

  /* Visually hide the display input when multiple is enabled */
  .select--multiple:not(.select--placeholder-visible) .select__display-input {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .select__value-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: -1;
  }

  .select__tags {
    display: flex;
    flex: 1;
    align-items: center;
    flex-wrap: wrap;
    margin-inline-start: var(--sl-spacing-2x-small);
  }

  .select__tags::slotted(sl-tag) {
    cursor: pointer !important;
  }

  .select--disabled .select__tags,
  .select--disabled .select__tags::slotted(sl-tag) {
    cursor: not-allowed !important;
  }

  /* Standard selects */
  .select--standard .select__combobox {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .select--standard.select--disabled .select__combobox {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    color: var(--sl-input-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
    outline: none;
  }

  .select--standard:not(.select--disabled).select--open .select__combobox,
  .select--standard:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  /* Filled selects */
  .select--filled .select__combobox {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .select--filled:hover:not(.select--disabled) .select__combobox {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .select--filled.select--disabled .select__combobox {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .select--filled:not(.select--disabled).select--open .select__combobox,
  .select--filled:not(.select--disabled).select--focused .select__combobox {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
  }

  /* Sizes */
  .select--small .select__combobox {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    min-height: var(--sl-input-height-small);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-small);
  }

  .select--small .select__clear {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .select--small .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .select--small.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .select--small.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-block: 2px;
    padding-inline-start: 0;
  }

  .select--small .select__tags {
    gap: 2px;
  }

  .select--medium .select__combobox {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    min-height: var(--sl-input-height-medium);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-medium);
  }

  .select--medium .select__clear {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .select--medium .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .select--medium.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .select--medium.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 3px;
  }

  .select--medium .select__tags {
    gap: 3px;
  }

  .select--large .select__combobox {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    min-height: var(--sl-input-height-large);
    padding-block: 0;
    padding-inline: var(--sl-input-spacing-large);
  }

  .select--large .select__clear {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .select--large .select__prefix::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  .select--large.select--multiple:not(.select--placeholder-visible) .select__prefix::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .select--large.select--multiple:not(.select--placeholder-visible) .select__combobox {
    padding-inline-start: 0;
    padding-block: 4px;
  }

  .select--large .select__tags {
    gap: 4px;
  }

  /* Pills */
  .select--pill.select--small .select__combobox {
    border-radius: var(--sl-input-height-small);
  }

  .select--pill.select--medium .select__combobox {
    border-radius: var(--sl-input-height-medium);
  }

  .select--pill.select--large .select__combobox {
    border-radius: var(--sl-input-height-large);
  }

  /* Prefix and Suffix */
  .select__prefix,
  .select__suffix {
    flex: 0;
    display: inline-flex;
    align-items: center;
    color: var(--sl-input-placeholder-color);
  }

  .select__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-small);
  }

  /* Clear button */
  .select__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: inherit;
    color: var(--sl-input-icon-color);
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .select__clear:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .select__clear:focus {
    outline: none;
  }

  /* Expand icon */
  .select__expand-icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    transition: var(--sl-transition-medium) rotate ease;
    rotate: 0;
    margin-inline-start: var(--sl-spacing-small);
  }

  .select--open .select__expand-icon {
    rotate: -180deg;
  }

  /* Listbox */
  .select__listbox {
    display: block;
    position: relative;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    box-shadow: var(--sl-shadow-large);
    background: var(--sl-panel-background-color);
    border: solid var(--sl-panel-border-width) var(--sl-panel-border-color);
    border-radius: var(--sl-border-radius-medium);
    padding-block: var(--sl-spacing-x-small);
    padding-inline: 0;
    overflow: auto;
    overscroll-behavior: none;

    /* Make sure it adheres to the popup's auto size */
    max-width: var(--auto-size-available-width);
    max-height: var(--auto-size-available-height);
  }

  .select__listbox ::slotted(sl-divider) {
    --spacing: var(--sl-spacing-x-small);
  }

  .select__listbox ::slotted(small) {
    display: block;
    font-size: var(--sl-font-size-small);
    font-weight: var(--sl-font-weight-semibold);
    color: var(--sl-color-neutral-500);
    padding-block: var(--sl-spacing-2x-small);
    padding-inline: var(--sl-spacing-x-large);
  }
`;function Zs(t,e){return{top:Math.round(t.getBoundingClientRect().top-e.getBoundingClientRect().top),left:Math.round(t.getBoundingClientRect().left-e.getBoundingClientRect().left)}}function Js(t,e,n="vertical",i="smooth"){const r=Zs(t,e),o=r.top+e.scrollTop,s=r.left+e.scrollLeft,a=e.scrollLeft,l=e.scrollLeft+e.offsetWidth,c=e.scrollTop,u=e.scrollTop+e.offsetHeight;(n==="horizontal"||n==="both")&&(s<a?e.scrollTo({left:s,behavior:i}):s+t.clientWidth>l&&e.scrollTo({left:s-e.offsetWidth+t.clientWidth,behavior:i})),(n==="vertical"||n==="both")&&(o<c?e.scrollTo({top:o,behavior:i}):o+t.clientHeight>u&&e.scrollTo({top:o-e.offsetHeight+t.clientHeight,behavior:i}))}var mn=pt`
  .form-control .form-control__label {
    display: none;
  }

  .form-control .form-control__help-text {
    display: none;
  }

  /* Label */
  .form-control--has-label .form-control__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    margin-bottom: var(--sl-spacing-3x-small);
  }

  .form-control--has-label.form-control--small .form-control__label {
    font-size: var(--sl-input-label-font-size-small);
  }

  .form-control--has-label.form-control--medium .form-control__label {
    font-size: var(--sl-input-label-font-size-medium);
  }

  .form-control--has-label.form-control--large .form-control__label {
    font-size: var(--sl-input-label-font-size-large);
  }

  :host([required]) .form-control--has-label .form-control__label::after {
    content: var(--sl-input-required-content);
    margin-inline-start: var(--sl-input-required-content-offset);
    color: var(--sl-input-required-content-color);
  }

  /* Help text */
  .form-control--has-help-text .form-control__help-text {
    display: block;
    color: var(--sl-input-help-text-color);
    margin-top: var(--sl-spacing-3x-small);
  }

  .form-control--has-help-text.form-control--small .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-small);
  }

  .form-control--has-help-text.form-control--medium .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-medium);
  }

  .form-control--has-help-text.form-control--large .form-control__help-text {
    font-size: var(--sl-input-help-text-font-size-large);
  }

  .form-control--has-help-text.form-control--radio-group .form-control__help-text {
    margin-top: var(--sl-spacing-2x-small);
  }
`,Qs=pt`
  :host {
    --arrow-color: var(--sl-color-neutral-1000);
    --arrow-size: 6px;

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45), which is the diagonal size of the arrow's container after rotating.
     */
    --arrow-size-diagonal: calc(var(--arrow-size) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);
  }

  .popup--fixed {
    position: fixed;
  }

  .popup:not(.popup--active) {
    display: none;
  }

  .popup__arrow {
    position: absolute;
    width: calc(var(--arrow-size-diagonal) * 2);
    height: calc(var(--arrow-size-diagonal) * 2);
    rotate: 45deg;
    background: var(--arrow-color);
    z-index: -1;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge--visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: calc(var(--sl-z-index-dropdown) - 1);
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }
`;const Tt=Math.min,tt=Math.max,Ke=Math.round,Ie=Math.floor,gt=t=>({x:t,y:t}),ta={left:"right",right:"left",bottom:"top",top:"bottom"};function Yn(t,e,n){return tt(t,Tt(e,n))}function se(t,e){return typeof t=="function"?t(e):t}function zt(t){return t.split("-")[0]}function ae(t){return t.split("-")[1]}function eo(t){return t==="x"?"y":"x"}function yi(t){return t==="y"?"height":"width"}function xt(t){const e=t[0];return e==="t"||e==="b"?"y":"x"}function wi(t){return eo(xt(t))}function ea(t,e,n){n===void 0&&(n=!1);const i=ae(t),r=wi(t),o=yi(r);let s=r==="x"?i===(n?"end":"start")?"right":"left":i==="start"?"bottom":"top";return e.reference[o]>e.floating[o]&&(s=Ge(s)),[s,Ge(s)]}function na(t){const e=Ge(t);return[Kn(t),e,Kn(e)]}function Kn(t){return t.includes("start")?t.replace("start","end"):t.replace("end","start")}const tr=["left","right"],er=["right","left"],ia=["top","bottom"],ra=["bottom","top"];function oa(t,e,n){switch(t){case"top":case"bottom":return n?e?er:tr:e?tr:er;case"left":case"right":return e?ia:ra;default:return[]}}function sa(t,e,n,i){const r=ae(t);let o=oa(zt(t),n==="start",i);return r&&(o=o.map(s=>s+"-"+r),e&&(o=o.concat(o.map(Kn)))),o}function Ge(t){const e=zt(t);return ta[e]+t.slice(e.length)}function aa(t){return{top:0,right:0,bottom:0,left:0,...t}}function no(t){return typeof t!="number"?aa(t):{top:t,right:t,bottom:t,left:t}}function Ze(t){const{x:e,y:n,width:i,height:r}=t;return{width:i,height:r,top:n,left:e,right:e+i,bottom:n+r,x:e,y:n}}function nr(t,e,n){let{reference:i,floating:r}=t;const o=xt(e),s=wi(e),a=yi(s),l=zt(e),c=o==="y",u=i.x+i.width/2-r.width/2,h=i.y+i.height/2-r.height/2,d=i[a]/2-r[a]/2;let f;switch(l){case"top":f={x:u,y:i.y-r.height};break;case"bottom":f={x:u,y:i.y+i.height};break;case"right":f={x:i.x+i.width,y:h};break;case"left":f={x:i.x-r.width,y:h};break;default:f={x:i.x,y:i.y}}switch(ae(e)){case"start":f[s]-=d*(n&&c?-1:1);break;case"end":f[s]+=d*(n&&c?-1:1);break}return f}async function la(t,e){var n;e===void 0&&(e={});const{x:i,y:r,platform:o,rects:s,elements:a,strategy:l}=t,{boundary:c="clippingAncestors",rootBoundary:u="viewport",elementContext:h="floating",altBoundary:d=!1,padding:f=0}=se(e,t),m=no(f),y=a[d?h==="floating"?"reference":"floating":h],w=Ze(await o.getClippingRect({element:(n=await(o.isElement==null?void 0:o.isElement(y)))==null||n?y:y.contextElement||await(o.getDocumentElement==null?void 0:o.getDocumentElement(a.floating)),boundary:c,rootBoundary:u,strategy:l})),_=h==="floating"?{x:i,y:r,width:s.floating.width,height:s.floating.height}:s.reference,k=await(o.getOffsetParent==null?void 0:o.getOffsetParent(a.floating)),E=await(o.isElement==null?void 0:o.isElement(k))?await(o.getScale==null?void 0:o.getScale(k))||{x:1,y:1}:{x:1,y:1},T=Ze(o.convertOffsetParentRelativeRectToViewportRelativeRect?await o.convertOffsetParentRelativeRectToViewportRelativeRect({elements:a,rect:_,offsetParent:k,strategy:l}):_);return{top:(w.top-T.top+m.top)/E.y,bottom:(T.bottom-w.bottom+m.bottom)/E.y,left:(w.left-T.left+m.left)/E.x,right:(T.right-w.right+m.right)/E.x}}const ca=50,ua=async(t,e,n)=>{const{placement:i="bottom",strategy:r="absolute",middleware:o=[],platform:s}=n,a=s.detectOverflow?s:{...s,detectOverflow:la},l=await(s.isRTL==null?void 0:s.isRTL(e));let c=await s.getElementRects({reference:t,floating:e,strategy:r}),{x:u,y:h}=nr(c,i,l),d=i,f=0;const m={};for(let v=0;v<o.length;v++){const y=o[v];if(!y)continue;const{name:w,fn:_}=y,{x:k,y:E,data:T,reset:C}=await _({x:u,y:h,initialPlacement:i,placement:d,strategy:r,middlewareData:m,rects:c,platform:a,elements:{reference:t,floating:e}});u=k??u,h=E??h,m[w]={...m[w],...T},C&&f<ca&&(f++,typeof C=="object"&&(C.placement&&(d=C.placement),C.rects&&(c=C.rects===!0?await s.getElementRects({reference:t,floating:e,strategy:r}):C.rects),{x:u,y:h}=nr(c,d,l)),v=-1)}return{x:u,y:h,placement:d,strategy:r,middlewareData:m}},ha=t=>({name:"arrow",options:t,async fn(e){const{x:n,y:i,placement:r,rects:o,platform:s,elements:a,middlewareData:l}=e,{element:c,padding:u=0}=se(t,e)||{};if(c==null)return{};const h=no(u),d={x:n,y:i},f=wi(r),m=yi(f),v=await s.getDimensions(c),y=f==="y",w=y?"top":"left",_=y?"bottom":"right",k=y?"clientHeight":"clientWidth",E=o.reference[m]+o.reference[f]-d[f]-o.floating[m],T=d[f]-o.reference[f],C=await(s.getOffsetParent==null?void 0:s.getOffsetParent(c));let z=C?C[k]:0;(!z||!await(s.isElement==null?void 0:s.isElement(C)))&&(z=a.floating[k]||o.floating[m]);const X=E/2-T/2,V=z/2-v[m]/2-1,D=Tt(h[w],V),j=Tt(h[_],V),b=D,R=z-v[m]-j,M=z/2-v[m]/2+X,x=Yn(b,M,R),O=!l.arrow&&ae(r)!=null&&M!==x&&o.reference[m]/2-(M<b?D:j)-v[m]/2<0,I=O?M<b?M-b:M-R:0;return{[f]:d[f]+I,data:{[f]:x,centerOffset:M-x-I,...O&&{alignmentOffset:I}},reset:O}}}),da=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,i;const{placement:r,middlewareData:o,rects:s,initialPlacement:a,platform:l,elements:c}=e,{mainAxis:u=!0,crossAxis:h=!0,fallbackPlacements:d,fallbackStrategy:f="bestFit",fallbackAxisSideDirection:m="none",flipAlignment:v=!0,...y}=se(t,e);if((n=o.arrow)!=null&&n.alignmentOffset)return{};const w=zt(r),_=xt(a),k=zt(a)===a,E=await(l.isRTL==null?void 0:l.isRTL(c.floating)),T=d||(k||!v?[Ge(a)]:na(a)),C=m!=="none";!d&&C&&T.push(...sa(a,v,m,E));const z=[a,...T],X=await l.detectOverflow(e,y),V=[];let D=((i=o.flip)==null?void 0:i.overflows)||[];if(u&&V.push(X[w]),h){const M=ea(r,s,E);V.push(X[M[0]],X[M[1]])}if(D=[...D,{placement:r,overflows:V}],!V.every(M=>M<=0)){var j,b;const M=(((j=o.flip)==null?void 0:j.index)||0)+1,x=z[M];if(x&&(!(h==="alignment"?_!==xt(x):!1)||D.every(H=>xt(H.placement)===_?H.overflows[0]>0:!0)))return{data:{index:M,overflows:D},reset:{placement:x}};let O=(b=D.filter(I=>I.overflows[0]<=0).sort((I,H)=>I.overflows[1]-H.overflows[1])[0])==null?void 0:b.placement;if(!O)switch(f){case"bestFit":{var R;const I=(R=D.filter(H=>{if(C){const K=xt(H.placement);return K===_||K==="y"}return!0}).map(H=>[H.placement,H.overflows.filter(K=>K>0).reduce((K,Q)=>K+Q,0)]).sort((H,K)=>H[1]-K[1])[0])==null?void 0:R[0];I&&(O=I);break}case"initialPlacement":O=a;break}if(r!==O)return{reset:{placement:O}}}return{}}}},fa=new Set(["left","top"]);async function pa(t,e){const{placement:n,platform:i,elements:r}=t,o=await(i.isRTL==null?void 0:i.isRTL(r.floating)),s=zt(n),a=ae(n),l=xt(n)==="y",c=fa.has(s)?-1:1,u=o&&l?-1:1,h=se(e,t);let{mainAxis:d,crossAxis:f,alignmentAxis:m}=typeof h=="number"?{mainAxis:h,crossAxis:0,alignmentAxis:null}:{mainAxis:h.mainAxis||0,crossAxis:h.crossAxis||0,alignmentAxis:h.alignmentAxis};return a&&typeof m=="number"&&(f=a==="end"?m*-1:m),l?{x:f*u,y:d*c}:{x:d*c,y:f*u}}const ma=function(t){return t===void 0&&(t=0),{name:"offset",options:t,async fn(e){var n,i;const{x:r,y:o,placement:s,middlewareData:a}=e,l=await pa(e,t);return s===((n=a.offset)==null?void 0:n.placement)&&(i=a.arrow)!=null&&i.alignmentOffset?{}:{x:r+l.x,y:o+l.y,data:{...l,placement:s}}}}},ga=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:i,placement:r,platform:o}=e,{mainAxis:s=!0,crossAxis:a=!1,limiter:l={fn:w=>{let{x:_,y:k}=w;return{x:_,y:k}}},...c}=se(t,e),u={x:n,y:i},h=await o.detectOverflow(e,c),d=xt(zt(r)),f=eo(d);let m=u[f],v=u[d];if(s){const w=f==="y"?"top":"left",_=f==="y"?"bottom":"right",k=m+h[w],E=m-h[_];m=Yn(k,m,E)}if(a){const w=d==="y"?"top":"left",_=d==="y"?"bottom":"right",k=v+h[w],E=v-h[_];v=Yn(k,v,E)}const y=l.fn({...e,[f]:m,[d]:v});return{...y,data:{x:y.x-n,y:y.y-i,enabled:{[f]:s,[d]:a}}}}}},va=function(t){return t===void 0&&(t={}),{name:"size",options:t,async fn(e){var n,i;const{placement:r,rects:o,platform:s,elements:a}=e,{apply:l=()=>{},...c}=se(t,e),u=await s.detectOverflow(e,c),h=zt(r),d=ae(r),f=xt(r)==="y",{width:m,height:v}=o.floating;let y,w;h==="top"||h==="bottom"?(y=h,w=d===(await(s.isRTL==null?void 0:s.isRTL(a.floating))?"start":"end")?"left":"right"):(w=h,y=d==="end"?"top":"bottom");const _=v-u.top-u.bottom,k=m-u.left-u.right,E=Tt(v-u[y],_),T=Tt(m-u[w],k),C=!e.middlewareData.shift;let z=E,X=T;if((n=e.middlewareData.shift)!=null&&n.enabled.x&&(X=k),(i=e.middlewareData.shift)!=null&&i.enabled.y&&(z=_),C&&!d){const D=tt(u.left,0),j=tt(u.right,0),b=tt(u.top,0),R=tt(u.bottom,0);f?X=m-2*(D!==0||j!==0?D+j:tt(u.left,u.right)):z=v-2*(b!==0||R!==0?b+R:tt(u.top,u.bottom))}await l({...e,availableWidth:X,availableHeight:z});const V=await s.getDimensions(a.floating);return m!==V.width||v!==V.height?{reset:{rects:!0}}:{}}}};function gn(){return typeof window<"u"}function le(t){return io(t)?(t.nodeName||"").toLowerCase():"#document"}function et(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function bt(t){var e;return(e=(io(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function io(t){return gn()?t instanceof Node||t instanceof et(t).Node:!1}function dt(t){return gn()?t instanceof Element||t instanceof et(t).Element:!1}function Ct(t){return gn()?t instanceof HTMLElement||t instanceof et(t).HTMLElement:!1}function ir(t){return!gn()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof et(t).ShadowRoot}function Me(t){const{overflow:e,overflowX:n,overflowY:i,display:r}=ft(t);return/auto|scroll|overlay|hidden|clip/.test(e+i+n)&&r!=="inline"&&r!=="contents"}function ba(t){return/^(table|td|th)$/.test(le(t))}function vn(t){try{if(t.matches(":popover-open"))return!0}catch{}try{return t.matches(":modal")}catch{return!1}}const ya=/transform|translate|scale|rotate|perspective|filter/,wa=/paint|layout|strict|content/,Lt=t=>!!t&&t!=="none";let Ln;function bn(t){const e=dt(t)?ft(t):t;return Lt(e.transform)||Lt(e.translate)||Lt(e.scale)||Lt(e.rotate)||Lt(e.perspective)||!_i()&&(Lt(e.backdropFilter)||Lt(e.filter))||ya.test(e.willChange||"")||wa.test(e.contain||"")}function _a(t){let e=Mt(t);for(;Ct(e)&&!ee(e);){if(bn(e))return e;if(vn(e))return null;e=Mt(e)}return null}function _i(){return Ln==null&&(Ln=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),Ln}function ee(t){return/^(html|body|#document)$/.test(le(t))}function ft(t){return et(t).getComputedStyle(t)}function yn(t){return dt(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function Mt(t){if(le(t)==="html")return t;const e=t.assignedSlot||t.parentNode||ir(t)&&t.host||bt(t);return ir(e)?e.host:e}function ro(t){const e=Mt(t);return ee(e)?t.ownerDocument?t.ownerDocument.body:t.body:Ct(e)&&Me(e)?e:ro(e)}function Ee(t,e,n){var i;e===void 0&&(e=[]),n===void 0&&(n=!0);const r=ro(t),o=r===((i=t.ownerDocument)==null?void 0:i.body),s=et(r);if(o){const a=Gn(s);return e.concat(s,s.visualViewport||[],Me(r)?r:[],a&&n?Ee(a):[])}else return e.concat(r,Ee(r,[],n))}function Gn(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function oo(t){const e=ft(t);let n=parseFloat(e.width)||0,i=parseFloat(e.height)||0;const r=Ct(t),o=r?t.offsetWidth:n,s=r?t.offsetHeight:i,a=Ke(n)!==o||Ke(i)!==s;return a&&(n=o,i=s),{width:n,height:i,$:a}}function xi(t){return dt(t)?t:t.contextElement}function Zt(t){const e=xi(t);if(!Ct(e))return gt(1);const n=e.getBoundingClientRect(),{width:i,height:r,$:o}=oo(e);let s=(o?Ke(n.width):n.width)/i,a=(o?Ke(n.height):n.height)/r;return(!s||!Number.isFinite(s))&&(s=1),(!a||!Number.isFinite(a))&&(a=1),{x:s,y:a}}const xa=gt(0);function so(t){const e=et(t);return!_i()||!e.visualViewport?xa:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function ka(t,e,n){return e===void 0&&(e=!1),!n||e&&n!==et(t)?!1:e}function Ht(t,e,n,i){e===void 0&&(e=!1),n===void 0&&(n=!1);const r=t.getBoundingClientRect(),o=xi(t);let s=gt(1);e&&(i?dt(i)&&(s=Zt(i)):s=Zt(t));const a=ka(o,n,i)?so(o):gt(0);let l=(r.left+a.x)/s.x,c=(r.top+a.y)/s.y,u=r.width/s.x,h=r.height/s.y;if(o){const d=et(o),f=i&&dt(i)?et(i):i;let m=d,v=Gn(m);for(;v&&i&&f!==m;){const y=Zt(v),w=v.getBoundingClientRect(),_=ft(v),k=w.left+(v.clientLeft+parseFloat(_.paddingLeft))*y.x,E=w.top+(v.clientTop+parseFloat(_.paddingTop))*y.y;l*=y.x,c*=y.y,u*=y.x,h*=y.y,l+=k,c+=E,m=et(v),v=Gn(m)}}return Ze({width:u,height:h,x:l,y:c})}function wn(t,e){const n=yn(t).scrollLeft;return e?e.left+n:Ht(bt(t)).left+n}function ao(t,e){const n=t.getBoundingClientRect(),i=n.left+e.scrollLeft-wn(t,n),r=n.top+e.scrollTop;return{x:i,y:r}}function $a(t){let{elements:e,rect:n,offsetParent:i,strategy:r}=t;const o=r==="fixed",s=bt(i),a=e?vn(e.floating):!1;if(i===s||a&&o)return n;let l={scrollLeft:0,scrollTop:0},c=gt(1);const u=gt(0),h=Ct(i);if((h||!h&&!o)&&((le(i)!=="body"||Me(s))&&(l=yn(i)),h)){const f=Ht(i);c=Zt(i),u.x=f.x+i.clientLeft,u.y=f.y+i.clientTop}const d=s&&!h&&!o?ao(s,l):gt(0);return{width:n.width*c.x,height:n.height*c.y,x:n.x*c.x-l.scrollLeft*c.x+u.x+d.x,y:n.y*c.y-l.scrollTop*c.y+u.y+d.y}}function Ca(t){return Array.from(t.getClientRects())}function Ea(t){const e=bt(t),n=yn(t),i=t.ownerDocument.body,r=tt(e.scrollWidth,e.clientWidth,i.scrollWidth,i.clientWidth),o=tt(e.scrollHeight,e.clientHeight,i.scrollHeight,i.clientHeight);let s=-n.scrollLeft+wn(t);const a=-n.scrollTop;return ft(i).direction==="rtl"&&(s+=tt(e.clientWidth,i.clientWidth)-r),{width:r,height:o,x:s,y:a}}const rr=25;function Aa(t,e){const n=et(t),i=bt(t),r=n.visualViewport;let o=i.clientWidth,s=i.clientHeight,a=0,l=0;if(r){o=r.width,s=r.height;const u=_i();(!u||u&&e==="fixed")&&(a=r.offsetLeft,l=r.offsetTop)}const c=wn(i);if(c<=0){const u=i.ownerDocument,h=u.body,d=getComputedStyle(h),f=u.compatMode==="CSS1Compat"&&parseFloat(d.marginLeft)+parseFloat(d.marginRight)||0,m=Math.abs(i.clientWidth-h.clientWidth-f);m<=rr&&(o-=m)}else c<=rr&&(o+=c);return{width:o,height:s,x:a,y:l}}function Sa(t,e){const n=Ht(t,!0,e==="fixed"),i=n.top+t.clientTop,r=n.left+t.clientLeft,o=Ct(t)?Zt(t):gt(1),s=t.clientWidth*o.x,a=t.clientHeight*o.y,l=r*o.x,c=i*o.y;return{width:s,height:a,x:l,y:c}}function or(t,e,n){let i;if(e==="viewport")i=Aa(t,n);else if(e==="document")i=Ea(bt(t));else if(dt(e))i=Sa(e,n);else{const r=so(t);i={x:e.x-r.x,y:e.y-r.y,width:e.width,height:e.height}}return Ze(i)}function lo(t,e){const n=Mt(t);return n===e||!dt(n)||ee(n)?!1:ft(n).position==="fixed"||lo(n,e)}function Ta(t,e){const n=e.get(t);if(n)return n;let i=Ee(t,[],!1).filter(a=>dt(a)&&le(a)!=="body"),r=null;const o=ft(t).position==="fixed";let s=o?Mt(t):t;for(;dt(s)&&!ee(s);){const a=ft(s),l=bn(s);!l&&a.position==="fixed"&&(r=null),(o?!l&&!r:!l&&a.position==="static"&&!!r&&(r.position==="absolute"||r.position==="fixed")||Me(s)&&!l&&lo(t,s))?i=i.filter(u=>u!==s):r=a,s=Mt(s)}return e.set(t,i),i}function za(t){let{element:e,boundary:n,rootBoundary:i,strategy:r}=t;const s=[...n==="clippingAncestors"?vn(e)?[]:Ta(e,this._c):[].concat(n),i],a=or(e,s[0],r);let l=a.top,c=a.right,u=a.bottom,h=a.left;for(let d=1;d<s.length;d++){const f=or(e,s[d],r);l=tt(f.top,l),c=Tt(f.right,c),u=Tt(f.bottom,u),h=tt(f.left,h)}return{width:c-h,height:u-l,x:h,y:l}}function Ma(t){const{width:e,height:n}=oo(t);return{width:e,height:n}}function Oa(t,e,n){const i=Ct(e),r=bt(e),o=n==="fixed",s=Ht(t,!0,o,e);let a={scrollLeft:0,scrollTop:0};const l=gt(0);function c(){l.x=wn(r)}if(i||!i&&!o)if((le(e)!=="body"||Me(r))&&(a=yn(e)),i){const f=Ht(e,!0,o,e);l.x=f.x+e.clientLeft,l.y=f.y+e.clientTop}else r&&c();o&&!i&&r&&c();const u=r&&!i&&!o?ao(r,a):gt(0),h=s.left+a.scrollLeft-l.x-u.x,d=s.top+a.scrollTop-l.y-u.y;return{x:h,y:d,width:s.width,height:s.height}}function Pn(t){return ft(t).position==="static"}function sr(t,e){if(!Ct(t)||ft(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return bt(t)===n&&(n=n.ownerDocument.body),n}function co(t,e){const n=et(t);if(vn(t))return n;if(!Ct(t)){let r=Mt(t);for(;r&&!ee(r);){if(dt(r)&&!Pn(r))return r;r=Mt(r)}return n}let i=sr(t,e);for(;i&&ba(i)&&Pn(i);)i=sr(i,e);return i&&ee(i)&&Pn(i)&&!bn(i)?n:i||_a(t)||n}const La=async function(t){const e=this.getOffsetParent||co,n=this.getDimensions,i=await n(t.floating);return{reference:Oa(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:i.width,height:i.height}}};function Pa(t){return ft(t).direction==="rtl"}const qe={convertOffsetParentRelativeRectToViewportRelativeRect:$a,getDocumentElement:bt,getClippingRect:za,getOffsetParent:co,getElementRects:La,getClientRects:Ca,getDimensions:Ma,getScale:Zt,isElement:dt,isRTL:Pa};function uo(t,e){return t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height}function Ia(t,e){let n=null,i;const r=bt(t);function o(){var a;clearTimeout(i),(a=n)==null||a.disconnect(),n=null}function s(a,l){a===void 0&&(a=!1),l===void 0&&(l=1),o();const c=t.getBoundingClientRect(),{left:u,top:h,width:d,height:f}=c;if(a||e(),!d||!f)return;const m=Ie(h),v=Ie(r.clientWidth-(u+d)),y=Ie(r.clientHeight-(h+f)),w=Ie(u),k={rootMargin:-m+"px "+-v+"px "+-y+"px "+-w+"px",threshold:tt(0,Tt(1,l))||1};let E=!0;function T(C){const z=C[0].intersectionRatio;if(z!==l){if(!E)return s();z?s(!1,z):i=setTimeout(()=>{s(!1,1e-7)},1e3)}z===1&&!uo(c,t.getBoundingClientRect())&&s(),E=!1}try{n=new IntersectionObserver(T,{...k,root:r.ownerDocument})}catch{n=new IntersectionObserver(T,k)}n.observe(t)}return s(!0),o}function Na(t,e,n,i){i===void 0&&(i={});const{ancestorScroll:r=!0,ancestorResize:o=!0,elementResize:s=typeof ResizeObserver=="function",layoutShift:a=typeof IntersectionObserver=="function",animationFrame:l=!1}=i,c=xi(t),u=r||o?[...c?Ee(c):[],...e?Ee(e):[]]:[];u.forEach(w=>{r&&w.addEventListener("scroll",n,{passive:!0}),o&&w.addEventListener("resize",n)});const h=c&&a?Ia(c,n):null;let d=-1,f=null;s&&(f=new ResizeObserver(w=>{let[_]=w;_&&_.target===c&&f&&e&&(f.unobserve(e),cancelAnimationFrame(d),d=requestAnimationFrame(()=>{var k;(k=f)==null||k.observe(e)})),n()}),c&&!l&&f.observe(c),e&&f.observe(e));let m,v=l?Ht(t):null;l&&y();function y(){const w=Ht(t);v&&!uo(v,w)&&n(),v=w,m=requestAnimationFrame(y)}return n(),()=>{var w;u.forEach(_=>{r&&_.removeEventListener("scroll",n),o&&_.removeEventListener("resize",n)}),h==null||h(),(w=f)==null||w.disconnect(),f=null,l&&cancelAnimationFrame(m)}}const Ra=ma,Ba=ga,Da=da,ar=va,Fa=ha,Va=(t,e,n)=>{const i=new Map,r={platform:qe,...n},o={...r.platform,_c:i};return ua(t,e,{...r,platform:o})};function Ha(t){return qa(t)}function In(t){return t.assignedSlot?t.assignedSlot:t.parentNode instanceof ShadowRoot?t.parentNode.host:t.parentNode}function qa(t){for(let e=t;e;e=In(e))if(e instanceof Element&&getComputedStyle(e).display==="none")return null;for(let e=In(t);e;e=In(e)){if(!(e instanceof Element))continue;const n=getComputedStyle(e);if(n.display!=="contents"&&(n.position!=="static"||bn(n)||e.tagName==="BODY"))return e}return null}function Ua(t){return t!==null&&typeof t=="object"&&"getBoundingClientRect"in t&&("contextElement"in t?t.contextElement instanceof Element:!0)}var N=class extends ot{constructor(){super(...arguments),this.localize=new oe(this),this.active=!1,this.placement="top",this.strategy="absolute",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl){const t=this.anchorEl.getBoundingClientRect(),e=this.popup.getBoundingClientRect(),n=this.placement.includes("top")||this.placement.includes("bottom");let i=0,r=0,o=0,s=0,a=0,l=0,c=0,u=0;n?t.top<e.top?(i=t.left,r=t.bottom,o=t.right,s=t.bottom,a=e.left,l=e.top,c=e.right,u=e.top):(i=e.left,r=e.bottom,o=e.right,s=e.bottom,a=t.left,l=t.top,c=t.right,u=t.top):t.left<e.left?(i=t.right,r=t.top,o=e.left,s=e.top,a=t.right,l=t.bottom,c=e.left,u=e.bottom):(i=e.right,r=e.top,o=t.left,s=t.top,a=e.right,l=e.bottom,c=t.left,u=t.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${i}px`),this.style.setProperty("--hover-bridge-top-left-y",`${r}px`),this.style.setProperty("--hover-bridge-top-right-x",`${o}px`),this.style.setProperty("--hover-bridge-top-right-y",`${s}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${a}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${c}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${u}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(t){super.updated(t),t.has("active")&&(this.active?this.start():this.stop()),t.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){const t=this.getRootNode();this.anchorEl=t.getElementById(this.anchor)}else this.anchor instanceof Element||Ua(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.active&&this.start()}start(){!this.anchorEl||!this.active||(this.cleanup=Na(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(t=>{this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>t())):t()})}reposition(){if(!this.active||!this.anchorEl)return;const t=[Ra({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?t.push(ar({apply:({rects:n})=>{const i=this.sync==="width"||this.sync==="both",r=this.sync==="height"||this.sync==="both";this.popup.style.width=i?`${n.reference.width}px`:"",this.popup.style.height=r?`${n.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height=""),this.flip&&t.push(Da({boundary:this.flipBoundary,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&t.push(Ba({boundary:this.shiftBoundary,padding:this.shiftPadding})),this.autoSize?t.push(ar({boundary:this.autoSizeBoundary,padding:this.autoSizePadding,apply:({availableWidth:n,availableHeight:i})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${i}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${n}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&t.push(Fa({element:this.arrowEl,padding:this.arrowPadding}));const e=this.strategy==="absolute"?n=>qe.getOffsetParent(n,Ha):qe.getOffsetParent;Va(this.anchorEl,this.popup,{placement:this.placement,middleware:t,strategy:this.strategy,platform:fn(Wt({},qe),{getOffsetParent:e})}).then(({x:n,y:i,middlewareData:r,placement:o})=>{const s=this.localize.dir()==="rtl",a={top:"bottom",right:"left",bottom:"top",left:"right"}[o.split("-")[0]];if(this.setAttribute("data-current-placement",o),Object.assign(this.popup.style,{left:`${n}px`,top:`${i}px`}),this.arrow){const l=r.arrow.x,c=r.arrow.y;let u="",h="",d="",f="";if(this.arrowPlacement==="start"){const m=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";u=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",h=s?m:"",f=s?"":m}else if(this.arrowPlacement==="end"){const m=typeof l=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";h=s?"":m,f=s?m:"",d=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(f=typeof l=="number"?"calc(50% - var(--arrow-size-diagonal))":"",u=typeof c=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(f=typeof l=="number"?`${l}px`:"",u=typeof c=="number"?`${c}px`:"");Object.assign(this.arrowEl.style,{top:u,right:h,bottom:d,left:f,[a]:"calc(var(--arrow-size-diagonal) * -1)"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.emit("sl-reposition")}render(){return B`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${nt({"popup-hover-bridge":!0,"popup-hover-bridge--visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        part="popup"
        class=${nt({popup:!0,"popup--active":this.active,"popup--fixed":this.strategy==="fixed","popup--has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?B`<div part="arrow" class="popup__arrow" role="presentation"></div>`:""}
      </div>
    `}};N.styles=[$t,Qs];p([rt(".popup")],N.prototype,"popup",2);p([rt(".popup__arrow")],N.prototype,"arrowEl",2);p([g()],N.prototype,"anchor",2);p([g({type:Boolean,reflect:!0})],N.prototype,"active",2);p([g({reflect:!0})],N.prototype,"placement",2);p([g({reflect:!0})],N.prototype,"strategy",2);p([g({type:Number})],N.prototype,"distance",2);p([g({type:Number})],N.prototype,"skidding",2);p([g({type:Boolean})],N.prototype,"arrow",2);p([g({attribute:"arrow-placement"})],N.prototype,"arrowPlacement",2);p([g({attribute:"arrow-padding",type:Number})],N.prototype,"arrowPadding",2);p([g({type:Boolean})],N.prototype,"flip",2);p([g({attribute:"flip-fallback-placements",converter:{fromAttribute:t=>t.split(" ").map(e=>e.trim()).filter(e=>e!==""),toAttribute:t=>t.join(" ")}})],N.prototype,"flipFallbackPlacements",2);p([g({attribute:"flip-fallback-strategy"})],N.prototype,"flipFallbackStrategy",2);p([g({type:Object})],N.prototype,"flipBoundary",2);p([g({attribute:"flip-padding",type:Number})],N.prototype,"flipPadding",2);p([g({type:Boolean})],N.prototype,"shift",2);p([g({type:Object})],N.prototype,"shiftBoundary",2);p([g({attribute:"shift-padding",type:Number})],N.prototype,"shiftPadding",2);p([g({attribute:"auto-size"})],N.prototype,"autoSize",2);p([g()],N.prototype,"sync",2);p([g({type:Object})],N.prototype,"autoSizeBoundary",2);p([g({attribute:"auto-size-padding",type:Number})],N.prototype,"autoSizePadding",2);p([g({attribute:"hover-bridge",type:Boolean})],N.prototype,"hoverBridge",2);var he=new WeakMap,de=new WeakMap,fe=new WeakMap,Nn=new WeakSet,Ne=new WeakMap,_n=class{constructor(t,e){this.handleFormData=n=>{const i=this.options.disabled(this.host),r=this.options.name(this.host),o=this.options.value(this.host),s=this.host.tagName.toLowerCase()==="sl-button";this.host.isConnected&&!i&&!s&&typeof r=="string"&&r.length>0&&typeof o<"u"&&(Array.isArray(o)?o.forEach(a=>{n.formData.append(r,a.toString())}):n.formData.append(r,o.toString()))},this.handleFormSubmit=n=>{var i;const r=this.options.disabled(this.host),o=this.options.reportValidity;this.form&&!this.form.noValidate&&((i=he.get(this.form))==null||i.forEach(s=>{this.setUserInteracted(s,!0)})),this.form&&!this.form.noValidate&&!r&&!o(this.host)&&(n.preventDefault(),n.stopImmediatePropagation())},this.handleFormReset=()=>{this.options.setValue(this.host,this.options.defaultValue(this.host)),this.setUserInteracted(this.host,!1),Ne.set(this.host,[])},this.handleInteraction=n=>{const i=Ne.get(this.host);i.includes(n.type)||i.push(n.type),i.length===this.options.assumeInteractionOn.length&&this.setUserInteracted(this.host,!0)},this.checkFormValidity=()=>{if(this.form&&!this.form.noValidate){const n=this.form.querySelectorAll("*");for(const i of n)if(typeof i.checkValidity=="function"&&!i.checkValidity())return!1}return!0},this.reportFormValidity=()=>{if(this.form&&!this.form.noValidate){const n=this.form.querySelectorAll("*");for(const i of n)if(typeof i.reportValidity=="function"&&!i.reportValidity())return!1}return!0},(this.host=t).addController(this),this.options=Wt({form:n=>{const i=n.form;if(i){const o=n.getRootNode().querySelector(`#${i}`);if(o)return o}return n.closest("form")},name:n=>n.name,value:n=>n.value,defaultValue:n=>n.defaultValue,disabled:n=>{var i;return(i=n.disabled)!=null?i:!1},reportValidity:n=>typeof n.reportValidity=="function"?n.reportValidity():!0,checkValidity:n=>typeof n.checkValidity=="function"?n.checkValidity():!0,setValue:(n,i)=>n.value=i,assumeInteractionOn:["sl-input"]},e)}hostConnected(){const t=this.options.form(this.host);t&&this.attachForm(t),Ne.set(this.host,[]),this.options.assumeInteractionOn.forEach(e=>{this.host.addEventListener(e,this.handleInteraction)})}hostDisconnected(){this.detachForm(),Ne.delete(this.host),this.options.assumeInteractionOn.forEach(t=>{this.host.removeEventListener(t,this.handleInteraction)})}hostUpdated(){const t=this.options.form(this.host);t||this.detachForm(),t&&this.form!==t&&(this.detachForm(),this.attachForm(t)),this.host.hasUpdated&&this.setValidity(this.host.validity.valid)}attachForm(t){t?(this.form=t,he.has(this.form)?he.get(this.form).add(this.host):he.set(this.form,new Set([this.host])),this.form.addEventListener("formdata",this.handleFormData),this.form.addEventListener("submit",this.handleFormSubmit),this.form.addEventListener("reset",this.handleFormReset),de.has(this.form)||(de.set(this.form,this.form.reportValidity),this.form.reportValidity=()=>this.reportFormValidity()),fe.has(this.form)||(fe.set(this.form,this.form.checkValidity),this.form.checkValidity=()=>this.checkFormValidity())):this.form=void 0}detachForm(){if(!this.form)return;const t=he.get(this.form);t&&(t.delete(this.host),t.size<=0&&(this.form.removeEventListener("formdata",this.handleFormData),this.form.removeEventListener("submit",this.handleFormSubmit),this.form.removeEventListener("reset",this.handleFormReset),de.has(this.form)&&(this.form.reportValidity=de.get(this.form),de.delete(this.form)),fe.has(this.form)&&(this.form.checkValidity=fe.get(this.form),fe.delete(this.form)),this.form=void 0))}setUserInteracted(t,e){e?Nn.add(t):Nn.delete(t),t.requestUpdate()}doAction(t,e){if(this.form){const n=document.createElement("button");n.type=t,n.style.position="absolute",n.style.width="0",n.style.height="0",n.style.clipPath="inset(50%)",n.style.overflow="hidden",n.style.whiteSpace="nowrap",e&&(n.name=e.name,n.value=e.value,["formaction","formenctype","formmethod","formnovalidate","formtarget"].forEach(i=>{e.hasAttribute(i)&&n.setAttribute(i,e.getAttribute(i))})),this.form.append(n),n.click(),n.remove()}}getForm(){var t;return(t=this.form)!=null?t:null}reset(t){this.doAction("reset",t)}submit(t){this.doAction("submit",t)}setValidity(t){const e=this.host,n=!!Nn.has(e),i=!!e.required;e.toggleAttribute("data-required",i),e.toggleAttribute("data-optional",!i),e.toggleAttribute("data-invalid",!t),e.toggleAttribute("data-valid",t),e.toggleAttribute("data-user-invalid",!t&&n),e.toggleAttribute("data-user-valid",t&&n)}updateValidity(){const t=this.host;this.setValidity(t.validity.valid)}emitInvalidEvent(t){const e=new CustomEvent("sl-invalid",{bubbles:!1,composed:!1,cancelable:!0,detail:{}});t||e.preventDefault(),this.host.dispatchEvent(e)||t==null||t.preventDefault()}},ho=Object.freeze({badInput:!1,customError:!1,patternMismatch:!1,rangeOverflow:!1,rangeUnderflow:!1,stepMismatch:!1,tooLong:!1,tooShort:!1,typeMismatch:!1,valid:!0,valueMissing:!1});Object.freeze(fn(Wt({},ho),{valid:!1,valueMissing:!0}));Object.freeze(fn(Wt({},ho),{valid:!1,customError:!0}));var fo=new Map,ja=new WeakMap;function Wa(t){return t??{keyframes:[],options:{duration:0}}}function lr(t,e){return e.toLowerCase()==="rtl"?{keyframes:t.rtlKeyframes||t.keyframes,options:t.options}:t}function po(t,e){fo.set(t,Wa(e))}function cr(t,e,n){const i=ja.get(t);if(i!=null&&i[e])return lr(i[e],n.dir);const r=fo.get(e);return r?lr(r,n.dir):{keyframes:[],options:{duration:0}}}function ur(t,e){return new Promise(n=>{function i(r){r.target===t&&(t.removeEventListener(e,i),n())}t.addEventListener(e,i)})}function hr(t,e,n){return new Promise(i=>{if((n==null?void 0:n.duration)===1/0)throw new Error("Promise-based animations must be finite.");const r=t.animate(e,fn(Wt({},n),{duration:Xa()?0:n.duration}));r.addEventListener("cancel",i,{once:!0}),r.addEventListener("finish",i,{once:!0})})}function Xa(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}function dr(t){return Promise.all(t.getAnimations().map(e=>new Promise(n=>{e.cancel(),requestAnimationFrame(n)})))}var xn=class{constructor(t,...e){this.slotNames=[],this.handleSlotChange=n=>{const i=n.target;(this.slotNames.includes("[default]")&&!i.name||i.name&&this.slotNames.includes(i.name))&&this.host.requestUpdate()},(this.host=t).addController(this),this.slotNames=e}hasDefaultSlot(){return[...this.host.childNodes].some(t=>{if(t.nodeType===t.TEXT_NODE&&t.textContent.trim()!=="")return!0;if(t.nodeType===t.ELEMENT_NODE){const e=t;if(e.tagName.toLowerCase()==="sl-visually-hidden")return!1;if(!e.hasAttribute("slot"))return!0}return!1})}hasNamedSlot(t){return this.host.querySelector(`:scope > [slot="${t}"]`)!==null}test(t){return t==="[default]"?this.hasDefaultSlot():this.hasNamedSlot(t)}hostConnected(){this.host.shadowRoot.addEventListener("slotchange",this.handleSlotChange)}hostDisconnected(){this.host.shadowRoot.removeEventListener("slotchange",this.handleSlotChange)}};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class Zn extends gi{constructor(e){if(super(e),this.it=q,e.type!==Et.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===q||e==null)return this._t=void 0,this.it=e;if(e===lt)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const n=[e];return n.raw=n,this._t={_$litType$:this.constructor.resultType,strings:n,values:[]}}}Zn.directiveName="unsafeHTML",Zn.resultType=1;const Ya=mi(Zn);var S=class extends ot{constructor(){super(...arguments),this.formControlController=new _n(this,{assumeInteractionOn:["sl-blur","sl-input"]}),this.hasSlotController=new xn(this,"help-text","label"),this.localize=new oe(this),this.typeToSelectString="",this.hasFocus=!1,this.displayLabel="",this.selectedOptions=[],this.valueHasChanged=!1,this.name="",this._value="",this.defaultValue="",this.size="medium",this.placeholder="",this.multiple=!1,this.maxOptionsVisible=3,this.disabled=!1,this.clearable=!1,this.open=!1,this.hoist=!1,this.filled=!1,this.pill=!1,this.label="",this.placement="bottom",this.helpText="",this.form="",this.required=!1,this.getTag=t=>B`
      <sl-tag
        part="tag"
        exportparts="
              base:tag__base,
              content:tag__content,
              remove-button:tag__remove-button,
              remove-button__base:tag__remove-button__base
            "
        ?pill=${this.pill}
        size=${this.size}
        removable
        @sl-remove=${e=>this.handleTagRemove(e,t)}
      >
        ${t.getTextLabel()}
      </sl-tag>
    `,this.handleDocumentFocusIn=t=>{const e=t.composedPath();this&&!e.includes(this)&&this.hide()},this.handleDocumentKeyDown=t=>{const e=t.target,n=e.closest(".select__clear")!==null,i=e.closest("sl-icon-button")!==null;if(!(n||i)){if(t.key==="Escape"&&this.open&&!this.closeWatcher&&(t.preventDefault(),t.stopPropagation(),this.hide(),this.displayInput.focus({preventScroll:!0})),t.key==="Enter"||t.key===" "&&this.typeToSelectString===""){if(t.preventDefault(),t.stopImmediatePropagation(),!this.open){this.show();return}this.currentOption&&!this.currentOption.disabled&&(this.valueHasChanged=!0,this.multiple?this.toggleOptionSelection(this.currentOption):this.setSelectedOptions(this.currentOption),this.updateComplete.then(()=>{this.emit("sl-input"),this.emit("sl-change")}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})));return}if(["ArrowUp","ArrowDown","Home","End"].includes(t.key)){const r=this.getAllOptions(),o=r.indexOf(this.currentOption);let s=Math.max(0,o);if(t.preventDefault(),!this.open&&(this.show(),this.currentOption))return;t.key==="ArrowDown"?(s=o+1,s>r.length-1&&(s=0)):t.key==="ArrowUp"?(s=o-1,s<0&&(s=r.length-1)):t.key==="Home"?s=0:t.key==="End"&&(s=r.length-1),this.setCurrentOption(r[s])}if(t.key&&t.key.length===1||t.key==="Backspace"){const r=this.getAllOptions();if(t.metaKey||t.ctrlKey||t.altKey)return;if(!this.open){if(t.key==="Backspace")return;this.show()}t.stopPropagation(),t.preventDefault(),clearTimeout(this.typeToSelectTimeout),this.typeToSelectTimeout=window.setTimeout(()=>this.typeToSelectString="",1e3),t.key==="Backspace"?this.typeToSelectString=this.typeToSelectString.slice(0,-1):this.typeToSelectString+=t.key.toLowerCase();for(const o of r)if(o.getTextLabel().toLowerCase().startsWith(this.typeToSelectString)){this.setCurrentOption(o);break}}}},this.handleDocumentMouseDown=t=>{const e=t.composedPath();this&&!e.includes(this)&&this.hide()}}get value(){return this._value}set value(t){this.multiple?t=Array.isArray(t)?t:t.split(" "):t=Array.isArray(t)?t.join(" "):t,this._value!==t&&(this.valueHasChanged=!0,this._value=t)}get validity(){return this.valueInput.validity}get validationMessage(){return this.valueInput.validationMessage}connectedCallback(){super.connectedCallback(),setTimeout(()=>{this.handleDefaultSlotChange()}),this.open=!1}addOpenListeners(){var t;document.addEventListener("focusin",this.handleDocumentFocusIn),document.addEventListener("keydown",this.handleDocumentKeyDown),document.addEventListener("mousedown",this.handleDocumentMouseDown),this.getRootNode()!==document&&this.getRootNode().addEventListener("focusin",this.handleDocumentFocusIn),"CloseWatcher"in window&&((t=this.closeWatcher)==null||t.destroy(),this.closeWatcher=new CloseWatcher,this.closeWatcher.onclose=()=>{this.open&&(this.hide(),this.displayInput.focus({preventScroll:!0}))})}removeOpenListeners(){var t;document.removeEventListener("focusin",this.handleDocumentFocusIn),document.removeEventListener("keydown",this.handleDocumentKeyDown),document.removeEventListener("mousedown",this.handleDocumentMouseDown),this.getRootNode()!==document&&this.getRootNode().removeEventListener("focusin",this.handleDocumentFocusIn),(t=this.closeWatcher)==null||t.destroy()}handleFocus(){this.hasFocus=!0,this.displayInput.setSelectionRange(0,0),this.emit("sl-focus")}handleBlur(){this.hasFocus=!1,this.emit("sl-blur")}handleLabelClick(){this.displayInput.focus()}handleComboboxMouseDown(t){const n=t.composedPath().some(i=>i instanceof Element&&i.tagName.toLowerCase()==="sl-icon-button");this.disabled||n||(t.preventDefault(),this.displayInput.focus({preventScroll:!0}),this.open=!this.open)}handleComboboxKeyDown(t){t.key!=="Tab"&&(t.stopPropagation(),this.handleDocumentKeyDown(t))}handleClearClick(t){t.stopPropagation(),this.valueHasChanged=!0,this.value!==""&&(this.setSelectedOptions([]),this.displayInput.focus({preventScroll:!0}),this.updateComplete.then(()=>{this.emit("sl-clear"),this.emit("sl-input"),this.emit("sl-change")}))}handleClearMouseDown(t){t.stopPropagation(),t.preventDefault()}handleOptionClick(t){const n=t.target.closest("sl-option"),i=this.value;n&&!n.disabled&&(this.valueHasChanged=!0,this.multiple?this.toggleOptionSelection(n):this.setSelectedOptions(n),this.updateComplete.then(()=>this.displayInput.focus({preventScroll:!0})),this.value!==i&&this.updateComplete.then(()=>{this.emit("sl-input"),this.emit("sl-change")}),this.multiple||(this.hide(),this.displayInput.focus({preventScroll:!0})))}handleDefaultSlotChange(){customElements.get("sl-option")||customElements.whenDefined("sl-option").then(()=>this.handleDefaultSlotChange());const t=this.getAllOptions(),e=this.valueHasChanged?this.value:this.defaultValue,n=Array.isArray(e)?e:[e],i=[];t.forEach(r=>i.push(r.value)),this.setSelectedOptions(t.filter(r=>n.includes(r.value)))}handleTagRemove(t,e){t.stopPropagation(),this.valueHasChanged=!0,this.disabled||(this.toggleOptionSelection(e,!1),this.updateComplete.then(()=>{this.emit("sl-input"),this.emit("sl-change")}))}getAllOptions(){return[...this.querySelectorAll("sl-option")]}getFirstOption(){return this.querySelector("sl-option")}setCurrentOption(t){this.getAllOptions().forEach(n=>{n.current=!1,n.tabIndex=-1}),t&&(this.currentOption=t,t.current=!0,t.tabIndex=0,t.focus())}setSelectedOptions(t){const e=this.getAllOptions(),n=Array.isArray(t)?t:[t];e.forEach(i=>i.selected=!1),n.length&&n.forEach(i=>i.selected=!0),this.selectionChanged()}toggleOptionSelection(t,e){e===!0||e===!1?t.selected=e:t.selected=!t.selected,this.selectionChanged()}selectionChanged(){var t,e,n;const i=this.getAllOptions();this.selectedOptions=i.filter(o=>o.selected);const r=this.valueHasChanged;if(this.multiple)this.value=this.selectedOptions.map(o=>o.value),this.placeholder&&this.value.length===0?this.displayLabel="":this.displayLabel=this.localize.term("numOptionsSelected",this.selectedOptions.length);else{const o=this.selectedOptions[0];this.value=(t=o==null?void 0:o.value)!=null?t:"",this.displayLabel=(n=(e=o==null?void 0:o.getTextLabel)==null?void 0:e.call(o))!=null?n:""}this.valueHasChanged=r,this.updateComplete.then(()=>{this.formControlController.updateValidity()})}get tags(){return this.selectedOptions.map((t,e)=>{if(e<this.maxOptionsVisible||this.maxOptionsVisible<=0){const n=this.getTag(t,e);return B`<div @sl-remove=${i=>this.handleTagRemove(i,t)}>
          ${typeof n=="string"?Ya(n):n}
        </div>`}else if(e===this.maxOptionsVisible)return B`<sl-tag size=${this.size}>+${this.selectedOptions.length-e}</sl-tag>`;return B``})}handleInvalid(t){this.formControlController.setValidity(!1),this.formControlController.emitInvalidEvent(t)}handleDisabledChange(){this.disabled&&(this.open=!1,this.handleOpenChange())}attributeChangedCallback(t,e,n){if(super.attributeChangedCallback(t,e,n),t==="value"){const i=this.valueHasChanged;this.value=this.defaultValue,this.valueHasChanged=i}}handleValueChange(){if(!this.valueHasChanged){const n=this.valueHasChanged;this.value=this.defaultValue,this.valueHasChanged=n}const t=this.getAllOptions(),e=Array.isArray(this.value)?this.value:[this.value];this.setSelectedOptions(t.filter(n=>e.includes(n.value)))}async handleOpenChange(){if(this.open&&!this.disabled){this.setCurrentOption(this.selectedOptions[0]||this.getFirstOption()),this.emit("sl-show"),this.addOpenListeners(),await dr(this),this.listbox.hidden=!1,this.popup.active=!0,requestAnimationFrame(()=>{this.setCurrentOption(this.currentOption)});const{keyframes:t,options:e}=cr(this,"select.show",{dir:this.localize.dir()});await hr(this.popup.popup,t,e),this.currentOption&&Js(this.currentOption,this.listbox,"vertical","auto"),this.emit("sl-after-show")}else{this.emit("sl-hide"),this.removeOpenListeners(),await dr(this);const{keyframes:t,options:e}=cr(this,"select.hide",{dir:this.localize.dir()});await hr(this.popup.popup,t,e),this.listbox.hidden=!0,this.popup.active=!1,this.emit("sl-after-hide")}}async show(){if(this.open||this.disabled){this.open=!1;return}return this.open=!0,ur(this,"sl-after-show")}async hide(){if(!this.open||this.disabled){this.open=!1;return}return this.open=!1,ur(this,"sl-after-hide")}checkValidity(){return this.valueInput.checkValidity()}getForm(){return this.formControlController.getForm()}reportValidity(){return this.valueInput.reportValidity()}setCustomValidity(t){this.valueInput.setCustomValidity(t),this.formControlController.updateValidity()}focus(t){this.displayInput.focus(t)}blur(){this.displayInput.blur()}render(){const t=this.hasSlotController.test("label"),e=this.hasSlotController.test("help-text"),n=this.label?!0:!!t,i=this.helpText?!0:!!e,r=this.clearable&&!this.disabled&&this.value.length>0,o=this.placeholder&&this.value&&this.value.length<=0;return B`
      <div
        part="form-control"
        class=${nt({"form-control":!0,"form-control--small":this.size==="small","form-control--medium":this.size==="medium","form-control--large":this.size==="large","form-control--has-label":n,"form-control--has-help-text":i})}
      >
        <label
          id="label"
          part="form-control-label"
          class="form-control__label"
          aria-hidden=${n?"false":"true"}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <sl-popup
            class=${nt({select:!0,"select--standard":!0,"select--filled":this.filled,"select--pill":this.pill,"select--open":this.open,"select--disabled":this.disabled,"select--multiple":this.multiple,"select--focused":this.hasFocus,"select--placeholder-visible":o,"select--top":this.placement==="top","select--bottom":this.placement==="bottom","select--small":this.size==="small","select--medium":this.size==="medium","select--large":this.size==="large"})}
            placement=${this.placement}
            strategy=${this.hoist?"fixed":"absolute"}
            flip
            shift
            sync="width"
            auto-size="vertical"
            auto-size-padding="10"
          >
            <div
              part="combobox"
              class="select__combobox"
              slot="anchor"
              @keydown=${this.handleComboboxKeyDown}
              @mousedown=${this.handleComboboxMouseDown}
            >
              <slot part="prefix" name="prefix" class="select__prefix"></slot>

              <input
                part="display-input"
                class="select__display-input"
                type="text"
                placeholder=${this.placeholder}
                .disabled=${this.disabled}
                .value=${this.displayLabel}
                autocomplete="off"
                spellcheck="false"
                autocapitalize="off"
                readonly
                aria-controls="listbox"
                aria-expanded=${this.open?"true":"false"}
                aria-haspopup="listbox"
                aria-labelledby="label"
                aria-disabled=${this.disabled?"true":"false"}
                aria-describedby="help-text"
                role="combobox"
                tabindex="0"
                @focus=${this.handleFocus}
                @blur=${this.handleBlur}
              />

              ${this.multiple?B`<div part="tags" class="select__tags">${this.tags}</div>`:""}

              <input
                class="select__value-input"
                type="text"
                ?disabled=${this.disabled}
                ?required=${this.required}
                .value=${Array.isArray(this.value)?this.value.join(", "):this.value}
                tabindex="-1"
                aria-hidden="true"
                @focus=${()=>this.focus()}
                @invalid=${this.handleInvalid}
              />

              ${r?B`
                    <button
                      part="clear-button"
                      class="select__clear"
                      type="button"
                      aria-label=${this.localize.term("clearEntry")}
                      @mousedown=${this.handleClearMouseDown}
                      @click=${this.handleClearClick}
                      tabindex="-1"
                    >
                      <slot name="clear-icon">
                        <sl-icon name="x-circle-fill" library="system"></sl-icon>
                      </slot>
                    </button>
                  `:""}

              <slot name="suffix" part="suffix" class="select__suffix"></slot>

              <slot name="expand-icon" part="expand-icon" class="select__expand-icon">
                <sl-icon library="system" name="chevron-down"></sl-icon>
              </slot>
            </div>

            <div
              id="listbox"
              role="listbox"
              aria-expanded=${this.open?"true":"false"}
              aria-multiselectable=${this.multiple?"true":"false"}
              aria-labelledby="label"
              part="listbox"
              class="select__listbox"
              tabindex="-1"
              @mouseup=${this.handleOptionClick}
              @slotchange=${this.handleDefaultSlotChange}
            >
              <slot></slot>
            </div>
          </sl-popup>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${i?"false":"true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `}};S.styles=[$t,mn,Gs];S.dependencies={"sl-icon":st,"sl-popup":N,"sl-tag":Xt};p([rt(".select")],S.prototype,"popup",2);p([rt(".select__combobox")],S.prototype,"combobox",2);p([rt(".select__display-input")],S.prototype,"displayInput",2);p([rt(".select__value-input")],S.prototype,"valueInput",2);p([rt(".select__listbox")],S.prototype,"listbox",2);p([Z()],S.prototype,"hasFocus",2);p([Z()],S.prototype,"displayLabel",2);p([Z()],S.prototype,"currentOption",2);p([Z()],S.prototype,"selectedOptions",2);p([Z()],S.prototype,"valueHasChanged",2);p([g()],S.prototype,"name",2);p([Z()],S.prototype,"value",1);p([g({attribute:"value"})],S.prototype,"defaultValue",2);p([g({reflect:!0})],S.prototype,"size",2);p([g()],S.prototype,"placeholder",2);p([g({type:Boolean,reflect:!0})],S.prototype,"multiple",2);p([g({attribute:"max-options-visible",type:Number})],S.prototype,"maxOptionsVisible",2);p([g({type:Boolean,reflect:!0})],S.prototype,"disabled",2);p([g({type:Boolean})],S.prototype,"clearable",2);p([g({type:Boolean,reflect:!0})],S.prototype,"open",2);p([g({type:Boolean})],S.prototype,"hoist",2);p([g({type:Boolean,reflect:!0})],S.prototype,"filled",2);p([g({type:Boolean,reflect:!0})],S.prototype,"pill",2);p([g()],S.prototype,"label",2);p([g({reflect:!0})],S.prototype,"placement",2);p([g({attribute:"help-text"})],S.prototype,"helpText",2);p([g({reflect:!0})],S.prototype,"form",2);p([g({type:Boolean,reflect:!0})],S.prototype,"required",2);p([g()],S.prototype,"getTag",2);p([G("disabled",{waitUntilFirstUpdate:!0})],S.prototype,"handleDisabledChange",1);p([G(["defaultValue","value"],{waitUntilFirstUpdate:!0})],S.prototype,"handleValueChange",1);p([G("open",{waitUntilFirstUpdate:!0})],S.prototype,"handleOpenChange",1);po("select.show",{keyframes:[{opacity:0,scale:.9},{opacity:1,scale:1}],options:{duration:100,easing:"ease"}});po("select.hide",{keyframes:[{opacity:1,scale:1},{opacity:0,scale:.9}],options:{duration:100,easing:"ease"}});S.define("sl-select");var Ka=pt`
  :host {
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:focus) {
    outline: none;
  }

  .option {
    position: relative;
    display: flex;
    align-items: center;
    font-family: var(--sl-font-sans);
    font-size: var(--sl-font-size-medium);
    font-weight: var(--sl-font-weight-normal);
    line-height: var(--sl-line-height-normal);
    letter-spacing: var(--sl-letter-spacing-normal);
    color: var(--sl-color-neutral-700);
    padding: var(--sl-spacing-x-small) var(--sl-spacing-medium) var(--sl-spacing-x-small) var(--sl-spacing-x-small);
    transition: var(--sl-transition-fast) fill;
    cursor: pointer;
  }

  .option--hover:not(.option--current):not(.option--disabled) {
    background-color: var(--sl-color-neutral-100);
    color: var(--sl-color-neutral-1000);
  }

  .option--current,
  .option--current.option--disabled {
    background-color: var(--sl-color-primary-600);
    color: var(--sl-color-neutral-0);
    opacity: 1;
  }

  .option--disabled {
    outline: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option__label {
    flex: 1 1 auto;
    display: inline-block;
    line-height: var(--sl-line-height-dense);
  }

  .option .option__check {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: hidden;
    padding-inline-end: var(--sl-spacing-2x-small);
  }

  .option--selected .option__check {
    visibility: visible;
  }

  .option__prefix,
  .option__suffix {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .option__prefix::slotted(*) {
    margin-inline-end: var(--sl-spacing-x-small);
  }

  .option__suffix::slotted(*) {
    margin-inline-start: var(--sl-spacing-x-small);
  }

  @media (forced-colors: active) {
    :host(:hover:not([aria-disabled='true'])) .option {
      outline: dashed 1px SelectedItem;
      outline-offset: -1px;
    }
  }
`,ct=class extends ot{constructor(){super(...arguments),this.localize=new oe(this),this.isInitialized=!1,this.current=!1,this.selected=!1,this.hasHover=!1,this.value="",this.disabled=!1}connectedCallback(){super.connectedCallback(),this.setAttribute("role","option"),this.setAttribute("aria-selected","false")}handleDefaultSlotChange(){this.isInitialized?customElements.whenDefined("sl-select").then(()=>{const t=this.closest("sl-select");t&&t.handleDefaultSlotChange()}):this.isInitialized=!0}handleMouseEnter(){this.hasHover=!0}handleMouseLeave(){this.hasHover=!1}handleDisabledChange(){this.setAttribute("aria-disabled",this.disabled?"true":"false")}handleSelectedChange(){this.setAttribute("aria-selected",this.selected?"true":"false")}handleValueChange(){typeof this.value!="string"&&(this.value=String(this.value)),this.value.includes(" ")&&(console.error("Option values cannot include a space. All spaces have been replaced with underscores.",this),this.value=this.value.replace(/ /g,"_"))}getTextLabel(){const t=this.childNodes;let e="";return[...t].forEach(n=>{n.nodeType===Node.ELEMENT_NODE&&(n.hasAttribute("slot")||(e+=n.textContent)),n.nodeType===Node.TEXT_NODE&&(e+=n.textContent)}),e.trim()}render(){return B`
      <div
        part="base"
        class=${nt({option:!0,"option--current":this.current,"option--disabled":this.disabled,"option--selected":this.selected,"option--hover":this.hasHover})}
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
      >
        <sl-icon part="checked-icon" class="option__check" name="check" library="system" aria-hidden="true"></sl-icon>
        <slot part="prefix" name="prefix" class="option__prefix"></slot>
        <slot part="label" class="option__label" @slotchange=${this.handleDefaultSlotChange}></slot>
        <slot part="suffix" name="suffix" class="option__suffix"></slot>
      </div>
    `}};ct.styles=[$t,Ka];ct.dependencies={"sl-icon":st};p([rt(".option__label")],ct.prototype,"defaultSlot",2);p([Z()],ct.prototype,"current",2);p([Z()],ct.prototype,"selected",2);p([Z()],ct.prototype,"hasHover",2);p([g({reflect:!0})],ct.prototype,"value",2);p([g({type:Boolean,reflect:!0})],ct.prototype,"disabled",2);p([G("disabled")],ct.prototype,"handleDisabledChange",1);p([G("selected")],ct.prototype,"handleSelectedChange",1);p([G("value")],ct.prototype,"handleValueChange",1);ct.define("sl-option");var Ga=pt`
  :host {
    display: block;
  }

  .input {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: stretch;
    justify-content: start;
    position: relative;
    width: 100%;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    letter-spacing: var(--sl-input-letter-spacing);
    vertical-align: middle;
    overflow: hidden;
    cursor: text;
    transition:
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) border,
      var(--sl-transition-fast) box-shadow,
      var(--sl-transition-fast) background-color;
  }

  /* Standard inputs */
  .input--standard {
    background-color: var(--sl-input-background-color);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }

  .input--standard:hover:not(.input--disabled) {
    background-color: var(--sl-input-background-color-hover);
    border-color: var(--sl-input-border-color-hover);
  }

  .input--standard.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-background-color-focus);
    border-color: var(--sl-input-border-color-focus);
    box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-input-focus-ring-color);
  }

  .input--standard.input--focused:not(.input--disabled) .input__control {
    color: var(--sl-input-color-focus);
  }

  .input--standard.input--disabled {
    background-color: var(--sl-input-background-color-disabled);
    border-color: var(--sl-input-border-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input--standard.input--disabled .input__control {
    color: var(--sl-input-color-disabled);
  }

  .input--standard.input--disabled .input__control::placeholder {
    color: var(--sl-input-placeholder-color-disabled);
  }

  /* Filled inputs */
  .input--filled {
    border: none;
    background-color: var(--sl-input-filled-background-color);
    color: var(--sl-input-color);
  }

  .input--filled:hover:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-hover);
  }

  .input--filled.input--focused:not(.input--disabled) {
    background-color: var(--sl-input-filled-background-color-focus);
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .input--filled.input--disabled {
    background-color: var(--sl-input-filled-background-color-disabled);
    opacity: 0.5;
    cursor: not-allowed;
  }

  .input__control {
    flex: 1 1 auto;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    min-width: 0;
    height: 100%;
    color: var(--sl-input-color);
    border: none;
    background: inherit;
    box-shadow: none;
    padding: 0;
    margin: 0;
    cursor: inherit;
    -webkit-appearance: none;
  }

  .input__control::-webkit-search-decoration,
  .input__control::-webkit-search-cancel-button,
  .input__control::-webkit-search-results-button,
  .input__control::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  .input__control:-webkit-autofill,
  .input__control:-webkit-autofill:hover,
  .input__control:-webkit-autofill:focus,
  .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-background-color-hover) inset !important;
    -webkit-text-fill-color: var(--sl-color-primary-500);
    caret-color: var(--sl-input-color);
  }

  .input--filled .input__control:-webkit-autofill,
  .input--filled .input__control:-webkit-autofill:hover,
  .input--filled .input__control:-webkit-autofill:focus,
  .input--filled .input__control:-webkit-autofill:active {
    box-shadow: 0 0 0 var(--sl-input-height-large) var(--sl-input-filled-background-color) inset !important;
  }

  .input__control::placeholder {
    color: var(--sl-input-placeholder-color);
    user-select: none;
    -webkit-user-select: none;
  }

  .input:hover:not(.input--disabled) .input__control {
    color: var(--sl-input-color-hover);
  }

  .input__control:focus {
    outline: none;
  }

  .input__prefix,
  .input__suffix {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    cursor: default;
  }

  .input__prefix ::slotted(sl-icon),
  .input__suffix ::slotted(sl-icon) {
    color: var(--sl-input-icon-color);
  }

  /*
   * Size modifiers
   */

  .input--small {
    border-radius: var(--sl-input-border-radius-small);
    font-size: var(--sl-input-font-size-small);
    height: var(--sl-input-height-small);
  }

  .input--small .input__control {
    height: calc(var(--sl-input-height-small) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-small);
  }

  .input--small .input__clear,
  .input--small .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-small) * 2);
  }

  .input--small .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-small);
  }

  .input--small .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-small);
  }

  .input--medium {
    border-radius: var(--sl-input-border-radius-medium);
    font-size: var(--sl-input-font-size-medium);
    height: var(--sl-input-height-medium);
  }

  .input--medium .input__control {
    height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-medium);
  }

  .input--medium .input__clear,
  .input--medium .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-medium) * 2);
  }

  .input--medium .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-medium);
  }

  .input--medium .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-medium);
  }

  .input--large {
    border-radius: var(--sl-input-border-radius-large);
    font-size: var(--sl-input-font-size-large);
    height: var(--sl-input-height-large);
  }

  .input--large .input__control {
    height: calc(var(--sl-input-height-large) - var(--sl-input-border-width) * 2);
    padding: 0 var(--sl-input-spacing-large);
  }

  .input--large .input__clear,
  .input--large .input__password-toggle {
    width: calc(1em + var(--sl-input-spacing-large) * 2);
  }

  .input--large .input__prefix ::slotted(*) {
    margin-inline-start: var(--sl-input-spacing-large);
  }

  .input--large .input__suffix ::slotted(*) {
    margin-inline-end: var(--sl-input-spacing-large);
  }

  /*
   * Pill modifier
   */

  .input--pill.input--small {
    border-radius: var(--sl-input-height-small);
  }

  .input--pill.input--medium {
    border-radius: var(--sl-input-height-medium);
  }

  .input--pill.input--large {
    border-radius: var(--sl-input-height-large);
  }

  /*
   * Clearable + Password Toggle
   */

  .input__clear,
  .input__password-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: inherit;
    color: var(--sl-input-icon-color);
    border: none;
    background: none;
    padding: 0;
    transition: var(--sl-transition-fast) color;
    cursor: pointer;
  }

  .input__clear:hover,
  .input__password-toggle:hover {
    color: var(--sl-input-icon-color-hover);
  }

  .input__clear:focus,
  .input__password-toggle:focus {
    outline: none;
  }

  /* Don't show the browser's password toggle in Edge */
  ::-ms-reveal {
    display: none;
  }

  /* Hide the built-in number spinner */
  .input--no-spin-buttons input[type='number']::-webkit-outer-spin-button,
  .input--no-spin-buttons input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    display: none;
  }

  .input--no-spin-buttons input[type='number'] {
    -moz-appearance: textfield;
  }
`,ki=(t="value")=>(e,n)=>{const i=e.constructor,r=i.prototype.attributeChangedCallback;i.prototype.attributeChangedCallback=function(o,s,a){var l;const c=i.getPropertyOptions(t),u=typeof c.attribute=="string"?c.attribute:t;if(o===u){const h=c.converter||Qt,f=(typeof h=="function"?h:(l=h==null?void 0:h.fromAttribute)!=null?l:Qt.fromAttribute)(a,c.type);this[t]!==f&&(this[n]=f)}r.call(this,o,s,a)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Je=mi(class extends gi{constructor(t){if(super(t),t.type!==Et.PROPERTY&&t.type!==Et.ATTRIBUTE&&t.type!==Et.BOOLEAN_ATTRIBUTE)throw Error("The `live` directive is not allowed on child or event bindings");if(!Hs(t))throw Error("`live` bindings can only contain a single expression")}render(t){return t}update(t,[e]){if(e===lt||e===q)return e;const n=t.element,i=t.name;if(t.type===Et.PROPERTY){if(e===n[i])return lt}else if(t.type===Et.BOOLEAN_ATTRIBUTE){if(!!e===n.hasAttribute(i))return lt}else if(t.type===Et.ATTRIBUTE&&n.getAttribute(i)===e+"")return lt;return Us(t),e}});var A=class extends ot{constructor(){super(...arguments),this.formControlController=new _n(this,{assumeInteractionOn:["sl-blur","sl-input"]}),this.hasSlotController=new xn(this,"help-text","label"),this.localize=new oe(this),this.hasFocus=!1,this.title="",this.__numberInput=Object.assign(document.createElement("input"),{type:"number"}),this.__dateInput=Object.assign(document.createElement("input"),{type:"date"}),this.type="text",this.name="",this.value="",this.defaultValue="",this.size="medium",this.filled=!1,this.pill=!1,this.label="",this.helpText="",this.clearable=!1,this.disabled=!1,this.placeholder="",this.readonly=!1,this.passwordToggle=!1,this.passwordVisible=!1,this.noSpinButtons=!1,this.form="",this.required=!1,this.spellcheck=!0}get valueAsDate(){var t;return this.__dateInput.type=this.type,this.__dateInput.value=this.value,((t=this.input)==null?void 0:t.valueAsDate)||this.__dateInput.valueAsDate}set valueAsDate(t){this.__dateInput.type=this.type,this.__dateInput.valueAsDate=t,this.value=this.__dateInput.value}get valueAsNumber(){var t;return this.__numberInput.value=this.value,((t=this.input)==null?void 0:t.valueAsNumber)||this.__numberInput.valueAsNumber}set valueAsNumber(t){this.__numberInput.valueAsNumber=t,this.value=this.__numberInput.value}get validity(){return this.input.validity}get validationMessage(){return this.input.validationMessage}firstUpdated(){this.formControlController.updateValidity()}handleBlur(){this.hasFocus=!1,this.emit("sl-blur")}handleChange(){this.value=this.input.value,this.emit("sl-change")}handleClearClick(t){t.preventDefault(),this.value!==""&&(this.value="",this.emit("sl-clear"),this.emit("sl-input"),this.emit("sl-change")),this.input.focus()}handleFocus(){this.hasFocus=!0,this.emit("sl-focus")}handleInput(){this.value=this.input.value,this.formControlController.updateValidity(),this.emit("sl-input")}handleInvalid(t){this.formControlController.setValidity(!1),this.formControlController.emitInvalidEvent(t)}handleKeyDown(t){const e=t.metaKey||t.ctrlKey||t.shiftKey||t.altKey;t.key==="Enter"&&!e&&setTimeout(()=>{!t.defaultPrevented&&!t.isComposing&&this.formControlController.submit()})}handlePasswordToggle(){this.passwordVisible=!this.passwordVisible}handleDisabledChange(){this.formControlController.setValidity(this.disabled)}handleStepChange(){this.input.step=String(this.step),this.formControlController.updateValidity()}async handleValueChange(){await this.updateComplete,this.formControlController.updateValidity()}focus(t){this.input.focus(t)}blur(){this.input.blur()}select(){this.input.select()}setSelectionRange(t,e,n="none"){this.input.setSelectionRange(t,e,n)}setRangeText(t,e,n,i="preserve"){const r=e??this.input.selectionStart,o=n??this.input.selectionEnd;this.input.setRangeText(t,r,o,i),this.value!==this.input.value&&(this.value=this.input.value)}showPicker(){"showPicker"in HTMLInputElement.prototype&&this.input.showPicker()}stepUp(){this.input.stepUp(),this.value!==this.input.value&&(this.value=this.input.value)}stepDown(){this.input.stepDown(),this.value!==this.input.value&&(this.value=this.input.value)}checkValidity(){return this.input.checkValidity()}getForm(){return this.formControlController.getForm()}reportValidity(){return this.input.reportValidity()}setCustomValidity(t){this.input.setCustomValidity(t),this.formControlController.updateValidity()}render(){const t=this.hasSlotController.test("label"),e=this.hasSlotController.test("help-text"),n=this.label?!0:!!t,i=this.helpText?!0:!!e,o=this.clearable&&!this.disabled&&!this.readonly&&(typeof this.value=="number"||this.value.length>0);return B`
      <div
        part="form-control"
        class=${nt({"form-control":!0,"form-control--small":this.size==="small","form-control--medium":this.size==="medium","form-control--large":this.size==="large","form-control--has-label":n,"form-control--has-help-text":i})}
      >
        <label
          part="form-control-label"
          class="form-control__label"
          for="input"
          aria-hidden=${n?"false":"true"}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div
            part="base"
            class=${nt({input:!0,"input--small":this.size==="small","input--medium":this.size==="medium","input--large":this.size==="large","input--pill":this.pill,"input--standard":!this.filled,"input--filled":this.filled,"input--disabled":this.disabled,"input--focused":this.hasFocus,"input--empty":!this.value,"input--no-spin-buttons":this.noSpinButtons})}
          >
            <span part="prefix" class="input__prefix">
              <slot name="prefix"></slot>
            </span>

            <input
              part="input"
              id="input"
              class="input__control"
              type=${this.type==="password"&&this.passwordVisible?"text":this.type}
              title=${this.title}
              name=${L(this.name)}
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              ?required=${this.required}
              placeholder=${L(this.placeholder)}
              minlength=${L(this.minlength)}
              maxlength=${L(this.maxlength)}
              min=${L(this.min)}
              max=${L(this.max)}
              step=${L(this.step)}
              .value=${Je(this.value)}
              autocapitalize=${L(this.autocapitalize)}
              autocomplete=${L(this.autocomplete)}
              autocorrect=${L(this.autocorrect)}
              ?autofocus=${this.autofocus}
              spellcheck=${this.spellcheck}
              pattern=${L(this.pattern)}
              enterkeyhint=${L(this.enterkeyhint)}
              inputmode=${L(this.inputmode)}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @keydown=${this.handleKeyDown}
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
            />

            ${o?B`
                  <button
                    part="clear-button"
                    class="input__clear"
                    type="button"
                    aria-label=${this.localize.term("clearEntry")}
                    @click=${this.handleClearClick}
                    tabindex="-1"
                  >
                    <slot name="clear-icon">
                      <sl-icon name="x-circle-fill" library="system"></sl-icon>
                    </slot>
                  </button>
                `:""}
            ${this.passwordToggle&&!this.disabled?B`
                  <button
                    part="password-toggle-button"
                    class="input__password-toggle"
                    type="button"
                    aria-label=${this.localize.term(this.passwordVisible?"hidePassword":"showPassword")}
                    @click=${this.handlePasswordToggle}
                    tabindex="-1"
                  >
                    ${this.passwordVisible?B`
                          <slot name="show-password-icon">
                            <sl-icon name="eye-slash" library="system"></sl-icon>
                          </slot>
                        `:B`
                          <slot name="hide-password-icon">
                            <sl-icon name="eye" library="system"></sl-icon>
                          </slot>
                        `}
                  </button>
                `:""}

            <span part="suffix" class="input__suffix">
              <slot name="suffix"></slot>
            </span>
          </div>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${i?"false":"true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `}};A.styles=[$t,mn,Ga];A.dependencies={"sl-icon":st};p([rt(".input__control")],A.prototype,"input",2);p([Z()],A.prototype,"hasFocus",2);p([g()],A.prototype,"title",2);p([g({reflect:!0})],A.prototype,"type",2);p([g()],A.prototype,"name",2);p([g()],A.prototype,"value",2);p([ki()],A.prototype,"defaultValue",2);p([g({reflect:!0})],A.prototype,"size",2);p([g({type:Boolean,reflect:!0})],A.prototype,"filled",2);p([g({type:Boolean,reflect:!0})],A.prototype,"pill",2);p([g()],A.prototype,"label",2);p([g({attribute:"help-text"})],A.prototype,"helpText",2);p([g({type:Boolean})],A.prototype,"clearable",2);p([g({type:Boolean,reflect:!0})],A.prototype,"disabled",2);p([g()],A.prototype,"placeholder",2);p([g({type:Boolean,reflect:!0})],A.prototype,"readonly",2);p([g({attribute:"password-toggle",type:Boolean})],A.prototype,"passwordToggle",2);p([g({attribute:"password-visible",type:Boolean})],A.prototype,"passwordVisible",2);p([g({attribute:"no-spin-buttons",type:Boolean})],A.prototype,"noSpinButtons",2);p([g({reflect:!0})],A.prototype,"form",2);p([g({type:Boolean,reflect:!0})],A.prototype,"required",2);p([g()],A.prototype,"pattern",2);p([g({type:Number})],A.prototype,"minlength",2);p([g({type:Number})],A.prototype,"maxlength",2);p([g()],A.prototype,"min",2);p([g()],A.prototype,"max",2);p([g()],A.prototype,"step",2);p([g()],A.prototype,"autocapitalize",2);p([g()],A.prototype,"autocorrect",2);p([g()],A.prototype,"autocomplete",2);p([g({type:Boolean})],A.prototype,"autofocus",2);p([g()],A.prototype,"enterkeyhint",2);p([g({type:Boolean,converter:{fromAttribute:t=>!(!t||t==="false"),toAttribute:t=>t?"true":"false"}})],A.prototype,"spellcheck",2);p([g()],A.prototype,"inputmode",2);p([G("disabled",{waitUntilFirstUpdate:!0})],A.prototype,"handleDisabledChange",1);p([G("step",{waitUntilFirstUpdate:!0})],A.prototype,"handleStepChange",1);p([G("value",{waitUntilFirstUpdate:!0})],A.prototype,"handleValueChange",1);A.define("sl-input");var Za=pt`
  :host {
    --thumb-size: 20px;
    --tooltip-offset: 10px;
    --track-color-active: var(--sl-color-neutral-200);
    --track-color-inactive: var(--sl-color-neutral-200);
    --track-active-offset: 0%;
    --track-height: 6px;

    display: block;
  }

  .range {
    position: relative;
  }

  .range__control {
    --percent: 0%;
    -webkit-appearance: none;
    border-radius: 3px;
    width: 100%;
    height: var(--track-height);
    background: transparent;
    line-height: var(--sl-input-height-medium);
    vertical-align: middle;
    margin: 0;

    background-image: linear-gradient(
      to right,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  .range--rtl .range__control {
    background-image: linear-gradient(
      to left,
      var(--track-color-inactive) 0%,
      var(--track-color-inactive) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) min(var(--percent), var(--track-active-offset)),
      var(--track-color-active) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) max(var(--percent), var(--track-active-offset)),
      var(--track-color-inactive) 100%
    );
  }

  /* Webkit */
  .range__control::-webkit-slider-runnable-track {
    width: 100%;
    height: var(--track-height);
    border-radius: 3px;
    border: none;
  }

  .range__control::-webkit-slider-thumb {
    border: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border: solid var(--sl-input-border-width) var(--sl-color-primary-600);
    -webkit-appearance: none;
    margin-top: calc(var(--thumb-size) / -2 + var(--track-height) / 2);
    cursor: pointer;
  }

  .range__control:enabled::-webkit-slider-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-webkit-slider-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-webkit-slider-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* Firefox */
  .range__control::-moz-focus-outer {
    border: 0;
  }

  .range__control::-moz-range-progress {
    background-color: var(--track-color-active);
    border-radius: 3px;
    height: var(--track-height);
  }

  .range__control::-moz-range-track {
    width: 100%;
    height: var(--track-height);
    background-color: var(--track-color-inactive);
    border-radius: 3px;
    border: none;
  }

  .range__control::-moz-range-thumb {
    border: none;
    height: var(--thumb-size);
    width: var(--thumb-size);
    border-radius: 50%;
    background-color: var(--sl-color-primary-600);
    border-color: var(--sl-color-primary-600);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
    cursor: pointer;
  }

  .range__control:enabled::-moz-range-thumb:hover {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
  }

  .range__control:enabled:focus-visible::-moz-range-thumb {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  .range__control:enabled::-moz-range-thumb:active {
    background-color: var(--sl-color-primary-500);
    border-color: var(--sl-color-primary-500);
    cursor: grabbing;
  }

  /* States */
  .range__control:focus-visible {
    outline: none;
  }

  .range__control:disabled {
    opacity: 0.5;
  }

  .range__control:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  .range__control:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }

  /* Tooltip output */
  .range__tooltip {
    position: absolute;
    z-index: var(--sl-z-index-tooltip);
    left: 0;
    border-radius: var(--sl-tooltip-border-radius);
    background-color: var(--sl-tooltip-background-color);
    font-family: var(--sl-tooltip-font-family);
    font-size: var(--sl-tooltip-font-size);
    font-weight: var(--sl-tooltip-font-weight);
    line-height: var(--sl-tooltip-line-height);
    color: var(--sl-tooltip-color);
    opacity: 0;
    padding: var(--sl-tooltip-padding);
    transition: var(--sl-transition-fast) opacity;
    pointer-events: none;
  }

  .range__tooltip:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    translate: calc(-1 * var(--sl-tooltip-arrow-size));
  }

  .range--tooltip-visible .range__tooltip {
    opacity: 1;
  }

  /* Tooltip on top */
  .range--tooltip-top .range__tooltip {
    top: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-top .range__tooltip:after {
    border-top: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    top: 100%;
  }

  /* Tooltip on bottom */
  .range--tooltip-bottom .range__tooltip {
    bottom: calc(-1 * var(--thumb-size) - var(--tooltip-offset));
  }

  .range--tooltip-bottom .range__tooltip:after {
    border-bottom: var(--sl-tooltip-arrow-size) solid var(--sl-tooltip-background-color);
    border-left: var(--sl-tooltip-arrow-size) solid transparent;
    border-right: var(--sl-tooltip-arrow-size) solid transparent;
    bottom: 100%;
  }

  @media (forced-colors: active) {
    .range__control,
    .range__tooltip {
      border: solid 1px transparent;
    }

    .range__control::-webkit-slider-thumb {
      border: solid 1px transparent;
    }

    .range__control::-moz-range-thumb {
      border: solid 1px transparent;
    }

    .range__tooltip:after {
      display: none;
    }
  }
`,F=class extends ot{constructor(){super(...arguments),this.formControlController=new _n(this),this.hasSlotController=new xn(this,"help-text","label"),this.localize=new oe(this),this.hasFocus=!1,this.hasTooltip=!1,this.title="",this.name="",this.value=0,this.label="",this.helpText="",this.disabled=!1,this.min=0,this.max=100,this.step=1,this.tooltip="top",this.tooltipFormatter=t=>t.toString(),this.form="",this.defaultValue=0}get validity(){return this.input.validity}get validationMessage(){return this.input.validationMessage}connectedCallback(){super.connectedCallback(),this.resizeObserver=new ResizeObserver(()=>this.syncRange()),this.value<this.min&&(this.value=this.min),this.value>this.max&&(this.value=this.max),this.updateComplete.then(()=>{this.syncRange(),this.resizeObserver.observe(this.input)})}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this.resizeObserver)==null||t.unobserve(this.input)}handleChange(){this.emit("sl-change")}handleInput(){this.value=parseFloat(this.input.value),this.emit("sl-input"),this.syncRange()}handleBlur(){this.hasFocus=!1,this.hasTooltip=!1,this.emit("sl-blur")}handleFocus(){this.hasFocus=!0,this.hasTooltip=!0,this.emit("sl-focus")}handleThumbDragStart(){this.hasTooltip=!0}handleThumbDragEnd(){this.hasTooltip=!1}syncProgress(t){this.input.style.setProperty("--percent",`${t*100}%`)}syncTooltip(t){if(this.output!==null){const e=this.input.offsetWidth,n=this.output.offsetWidth,i=getComputedStyle(this.input).getPropertyValue("--thumb-size"),r=this.localize.dir()==="rtl",o=e*t;if(r){const s=`${e-o}px + ${t} * ${i}`;this.output.style.translate=`calc((${s} - ${n/2}px - ${i} / 2))`}else{const s=`${o}px - ${t} * ${i}`;this.output.style.translate=`calc(${s} - ${n/2}px + ${i} / 2)`}}}handleValueChange(){this.formControlController.updateValidity(),this.input.value=this.value.toString(),this.value=parseFloat(this.input.value),this.syncRange()}handleDisabledChange(){this.formControlController.setValidity(this.disabled)}syncRange(){const t=Math.max(0,(this.value-this.min)/(this.max-this.min));this.syncProgress(t),this.tooltip!=="none"&&this.hasTooltip&&this.updateComplete.then(()=>this.syncTooltip(t))}handleInvalid(t){this.formControlController.setValidity(!1),this.formControlController.emitInvalidEvent(t)}focus(t){this.input.focus(t)}blur(){this.input.blur()}stepUp(){this.input.stepUp(),this.value!==Number(this.input.value)&&(this.value=Number(this.input.value))}stepDown(){this.input.stepDown(),this.value!==Number(this.input.value)&&(this.value=Number(this.input.value))}checkValidity(){return this.input.checkValidity()}getForm(){return this.formControlController.getForm()}reportValidity(){return this.input.reportValidity()}setCustomValidity(t){this.input.setCustomValidity(t),this.formControlController.updateValidity()}render(){const t=this.hasSlotController.test("label"),e=this.hasSlotController.test("help-text"),n=this.label?!0:!!t,i=this.helpText?!0:!!e;return B`
      <div
        part="form-control"
        class=${nt({"form-control":!0,"form-control--medium":!0,"form-control--has-label":n,"form-control--has-help-text":i})}
      >
        <label
          part="form-control-label"
          class="form-control__label"
          for="input"
          aria-hidden=${n?"false":"true"}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" class="form-control-input">
          <div
            part="base"
            class=${nt({range:!0,"range--disabled":this.disabled,"range--focused":this.hasFocus,"range--rtl":this.localize.dir()==="rtl","range--tooltip-visible":this.hasTooltip,"range--tooltip-top":this.tooltip==="top","range--tooltip-bottom":this.tooltip==="bottom"})}
            @mousedown=${this.handleThumbDragStart}
            @mouseup=${this.handleThumbDragEnd}
            @touchstart=${this.handleThumbDragStart}
            @touchend=${this.handleThumbDragEnd}
          >
            <input
              part="input"
              id="input"
              class="range__control"
              title=${this.title}
              type="range"
              name=${L(this.name)}
              ?disabled=${this.disabled}
              min=${L(this.min)}
              max=${L(this.max)}
              step=${L(this.step)}
              .value=${Je(this.value.toString())}
              aria-describedby="help-text"
              @change=${this.handleChange}
              @focus=${this.handleFocus}
              @input=${this.handleInput}
              @invalid=${this.handleInvalid}
              @blur=${this.handleBlur}
            />
            ${this.tooltip!=="none"&&!this.disabled?B`
                  <output part="tooltip" class="range__tooltip">
                    ${typeof this.tooltipFormatter=="function"?this.tooltipFormatter(this.value):this.value}
                  </output>
                `:""}
          </div>
        </div>

        <div
          part="form-control-help-text"
          id="help-text"
          class="form-control__help-text"
          aria-hidden=${i?"false":"true"}
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `}};F.styles=[$t,mn,Za];p([rt(".range__control")],F.prototype,"input",2);p([rt(".range__tooltip")],F.prototype,"output",2);p([Z()],F.prototype,"hasFocus",2);p([Z()],F.prototype,"hasTooltip",2);p([g()],F.prototype,"title",2);p([g()],F.prototype,"name",2);p([g({type:Number})],F.prototype,"value",2);p([g()],F.prototype,"label",2);p([g({attribute:"help-text"})],F.prototype,"helpText",2);p([g({type:Boolean,reflect:!0})],F.prototype,"disabled",2);p([g({type:Number})],F.prototype,"min",2);p([g({type:Number})],F.prototype,"max",2);p([g({type:Number})],F.prototype,"step",2);p([g()],F.prototype,"tooltip",2);p([g({attribute:!1})],F.prototype,"tooltipFormatter",2);p([g({reflect:!0})],F.prototype,"form",2);p([ki()],F.prototype,"defaultValue",2);p([Ds({passive:!0})],F.prototype,"handleThumbDragStart",1);p([G("value",{waitUntilFirstUpdate:!0})],F.prototype,"handleValueChange",1);p([G("disabled",{waitUntilFirstUpdate:!0})],F.prototype,"handleDisabledChange",1);p([G("hasTooltip",{waitUntilFirstUpdate:!0})],F.prototype,"syncRange",1);F.define("sl-range");var Ja=pt`
  :host {
    display: inline-block;
  }

  .checkbox {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
    font-family: var(--sl-input-font-family);
    font-weight: var(--sl-input-font-weight);
    color: var(--sl-input-label-color);
    vertical-align: middle;
    cursor: pointer;
  }

  .checkbox--small {
    --toggle-size: var(--sl-toggle-size-small);
    font-size: var(--sl-input-font-size-small);
  }

  .checkbox--medium {
    --toggle-size: var(--sl-toggle-size-medium);
    font-size: var(--sl-input-font-size-medium);
  }

  .checkbox--large {
    --toggle-size: var(--sl-toggle-size-large);
    font-size: var(--sl-input-font-size-large);
  }

  .checkbox__control {
    flex: 0 0 auto;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--toggle-size);
    height: var(--toggle-size);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
    border-radius: 2px;
    background-color: var(--sl-input-background-color);
    color: var(--sl-color-neutral-0);
    transition:
      var(--sl-transition-fast) border-color,
      var(--sl-transition-fast) background-color,
      var(--sl-transition-fast) color,
      var(--sl-transition-fast) box-shadow;
  }

  .checkbox__input {
    position: absolute;
    opacity: 0;
    padding: 0;
    margin: 0;
    pointer-events: none;
  }

  .checkbox__checked-icon,
  .checkbox__indeterminate-icon {
    display: inline-flex;
    width: var(--toggle-size);
    height: var(--toggle-size);
  }

  /* Hover */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-input-border-color-hover);
    background-color: var(--sl-input-background-color-hover);
  }

  /* Focus */
  .checkbox:not(.checkbox--checked):not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Checked/indeterminate */
  .checkbox--checked .checkbox__control,
  .checkbox--indeterminate .checkbox__control {
    border-color: var(--sl-color-primary-600);
    background-color: var(--sl-color-primary-600);
  }

  /* Checked/indeterminate + hover */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__control:hover,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__control:hover {
    border-color: var(--sl-color-primary-500);
    background-color: var(--sl-color-primary-500);
  }

  /* Checked/indeterminate + focus */
  .checkbox.checkbox--checked:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control,
  .checkbox.checkbox--indeterminate:not(.checkbox--disabled) .checkbox__input:focus-visible ~ .checkbox__control {
    outline: var(--sl-focus-ring);
    outline-offset: var(--sl-focus-ring-offset);
  }

  /* Disabled */
  .checkbox--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .checkbox__label {
    display: inline-block;
    color: var(--sl-input-label-color);
    line-height: var(--toggle-size);
    margin-inline-start: 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([required]) .checkbox__label::after {
    content: var(--sl-input-required-content);
    color: var(--sl-input-required-content-color);
    margin-inline-start: var(--sl-input-required-content-offset);
  }
`,Y=class extends ot{constructor(){super(...arguments),this.formControlController=new _n(this,{value:t=>t.checked?t.value||"on":void 0,defaultValue:t=>t.defaultChecked,setValue:(t,e)=>t.checked=e}),this.hasSlotController=new xn(this,"help-text"),this.hasFocus=!1,this.title="",this.name="",this.size="medium",this.disabled=!1,this.checked=!1,this.indeterminate=!1,this.defaultChecked=!1,this.form="",this.required=!1,this.helpText=""}get validity(){return this.input.validity}get validationMessage(){return this.input.validationMessage}firstUpdated(){this.formControlController.updateValidity()}handleClick(){this.checked=!this.checked,this.indeterminate=!1,this.emit("sl-change")}handleBlur(){this.hasFocus=!1,this.emit("sl-blur")}handleInput(){this.emit("sl-input")}handleInvalid(t){this.formControlController.setValidity(!1),this.formControlController.emitInvalidEvent(t)}handleFocus(){this.hasFocus=!0,this.emit("sl-focus")}handleDisabledChange(){this.formControlController.setValidity(this.disabled)}handleStateChange(){this.input.checked=this.checked,this.input.indeterminate=this.indeterminate,this.formControlController.updateValidity()}click(){this.input.click()}focus(t){this.input.focus(t)}blur(){this.input.blur()}checkValidity(){return this.input.checkValidity()}getForm(){return this.formControlController.getForm()}reportValidity(){return this.input.reportValidity()}setCustomValidity(t){this.input.setCustomValidity(t),this.formControlController.updateValidity()}render(){const t=this.hasSlotController.test("help-text"),e=this.helpText?!0:!!t;return B`
      <div
        class=${nt({"form-control":!0,"form-control--small":this.size==="small","form-control--medium":this.size==="medium","form-control--large":this.size==="large","form-control--has-help-text":e})}
      >
        <label
          part="base"
          class=${nt({checkbox:!0,"checkbox--checked":this.checked,"checkbox--disabled":this.disabled,"checkbox--focused":this.hasFocus,"checkbox--indeterminate":this.indeterminate,"checkbox--small":this.size==="small","checkbox--medium":this.size==="medium","checkbox--large":this.size==="large"})}
        >
          <input
            class="checkbox__input"
            type="checkbox"
            title=${this.title}
            name=${this.name}
            value=${L(this.value)}
            .indeterminate=${Je(this.indeterminate)}
            .checked=${Je(this.checked)}
            .disabled=${this.disabled}
            .required=${this.required}
            aria-checked=${this.checked?"true":"false"}
            aria-describedby="help-text"
            @click=${this.handleClick}
            @input=${this.handleInput}
            @invalid=${this.handleInvalid}
            @blur=${this.handleBlur}
            @focus=${this.handleFocus}
          />

          <span
            part="control${this.checked?" control--checked":""}${this.indeterminate?" control--indeterminate":""}"
            class="checkbox__control"
          >
            ${this.checked?B`
                  <sl-icon part="checked-icon" class="checkbox__checked-icon" library="system" name="check"></sl-icon>
                `:""}
            ${!this.checked&&this.indeterminate?B`
                  <sl-icon
                    part="indeterminate-icon"
                    class="checkbox__indeterminate-icon"
                    library="system"
                    name="indeterminate"
                  ></sl-icon>
                `:""}
          </span>

          <div part="label" class="checkbox__label">
            <slot></slot>
          </div>
        </label>

        <div
          aria-hidden=${e?"false":"true"}
          class="form-control__help-text"
          id="help-text"
          part="form-control-help-text"
        >
          <slot name="help-text">${this.helpText}</slot>
        </div>
      </div>
    `}};Y.styles=[$t,mn,Ja];Y.dependencies={"sl-icon":st};p([rt('input[type="checkbox"]')],Y.prototype,"input",2);p([Z()],Y.prototype,"hasFocus",2);p([g()],Y.prototype,"title",2);p([g()],Y.prototype,"name",2);p([g()],Y.prototype,"value",2);p([g({reflect:!0})],Y.prototype,"size",2);p([g({type:Boolean,reflect:!0})],Y.prototype,"disabled",2);p([g({type:Boolean,reflect:!0})],Y.prototype,"checked",2);p([g({type:Boolean,reflect:!0})],Y.prototype,"indeterminate",2);p([ki("checked")],Y.prototype,"defaultChecked",2);p([g({reflect:!0})],Y.prototype,"form",2);p([g({type:Boolean,reflect:!0})],Y.prototype,"required",2);p([g({attribute:"help-text"})],Y.prototype,"helpText",2);p([G("disabled",{waitUntilFirstUpdate:!0})],Y.prototype,"handleDisabledChange",1);p([G(["checked","indeterminate"],{waitUntilFirstUpdate:!0})],Y.prototype,"handleStateChange",1);Y.define("sl-checkbox");function qt(t){var e,n;document.querySelectorAll(".view").forEach(i=>i.classList.remove("active")),document.querySelectorAll(".nav-btn").forEach(i=>i.classList.remove("active")),(e=document.getElementById(`view-${t}`))==null||e.classList.add("active"),(n=document.querySelector(`.nav-btn[data-view="${t}"]`))==null||n.classList.add("active")}function Qa(){document.querySelectorAll(".nav-btn").forEach(t=>{t.addEventListener("click",()=>qt(t.dataset.view))})}let Rn=null;function P(t,e="success",n=3500){const i=document.getElementById("toast");i.textContent=t,i.className=e,i.classList.remove("hidden"),Rn&&clearTimeout(Rn),Rn=setTimeout(()=>i.classList.add("hidden"),n)}const Qe=(()=>{const t=document.getElementById("modal-overlay"),e=document.getElementById("modal-title"),n=document.getElementById("modal-body"),i=document.getElementById("modal-confirm"),r=document.getElementById("modal-cancel");let o=null;function s({titleText:l,bodyHTML:c,confirmLabel:u="Confirmar",cancelLabel:h="Cancelar",onMount:d=null}){return e.textContent=l,n.innerHTML=c,i.textContent=u,r.textContent=h,t.classList.remove("hidden"),d&&d(),new Promise(f=>{o=f})}function a(l){t.classList.add("hidden"),o&&(o(l),o=null),setTimeout(()=>{n.innerHTML=""},0)}return i.addEventListener("click",()=>a(!0)),r.addEventListener("click",()=>a(!1)),t.addEventListener("click",l=>{l.target===t&&a(!1)}),{show:s,hide:a}})();function Bn(t,e,n="-- selecione --"){t.innerHTML="",t.tagName.toLowerCase()==="sl-select"?(t.placeholder=n,e.forEach(i=>{const r=document.createElement("sl-option");r.value=i,r.textContent=i,t.appendChild(r)})):(t.innerHTML=`<option value="">${n}</option>`,e.forEach(i=>{const r=document.createElement("option");r.value=i,r.textContent=i,t.appendChild(r)}))}const mo="";async function U(t,e,n=null){const i={method:t,headers:n?{"Content-Type":"application/json"}:{}};n&&(i.body=JSON.stringify(n));const r=await fetch(mo+e,i),o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o.detail||`HTTP ${r.status}`);return o}async function tl(t,e){const n=await fetch(mo+t,{method:"POST",body:e}),i=await n.json().catch(()=>({}));if(!n.ok)throw new Error(i.detail||`HTTP ${n.status}`);return i}const W={project:{current:()=>U("GET","/api/project/current"),create:t=>U("POST","/api/project/create",t),open:t=>U("POST","/api/project/open",t),summary:()=>U("GET","/api/project/summary"),meta:()=>U("GET","/api/project/meta")},corpus:{list:()=>U("GET","/api/corpus/list"),files:t=>U("GET",`/api/corpus/${encodeURIComponent(t)}/files`),importFolder:t=>U("POST","/api/corpus/import-folder",t),importTagged:t=>U("POST","/api/corpus/import-tagged",t),uploadFile:(t,e)=>{const n=new FormData;return n.append("corpus_name",t),n.append("file",e),tl("/api/corpus/upload",n)}},tagging:{run:t=>U("POST","/api/tagging/run",t),status:t=>U("GET",`/api/tagging/status/${t}`)},utils:{pickFolder:()=>U("GET","/api/utils/pick-folder"),pickFile:()=>U("GET","/api/utils/pick-file")},quickrun:{start:t=>U("POST","/api/quickrun/start",t),status:t=>U("GET",`/api/quickrun/status/${t}`)},tags:{list:()=>U("GET","/api/tags")},analysis:{runKfa:t=>U("POST","/api/analysis/kfa",t),listKfa:()=>U("GET","/api/analysis/kfa/list"),getKfa:(t,e,n,i)=>U("GET",`/api/analysis/kfa/${encodeURIComponent(t)}/${encodeURIComponent(e)}?min_effect=${n}&join=${i}`),featureTable:(t,e)=>U("GET",`/api/analysis/features/${encodeURIComponent(t)}/${e}`),listFeatures:()=>U("GET","/api/analysis/features/list")}};async function $i(){try{const{path:t}=await W.project.current(),e=document.getElementById("project-label");if(t){const n=t.replace(/\\/g,"/").split("/");e.textContent=n[n.length-1],e.title=t}else e.textContent="Nenhum projeto",e.title=""}catch{}}async function fr(t,e,n){await $i(),await t(),await e(),await n();try{const{kfa_results:i}=await W.analysis.listKfa();if(i&&i.length>0){qt("results");return}}catch{}qt("corpus")}function el({loadCorpusList:t,refreshCorpusSelects:e,refreshKfaSelect:n}){var o,s,a,l;async function i(){var d,f,m,v;if(!await Qe.show({titleText:"Criar novo projeto",bodyHTML:`
        <label>Caminho do arquivo <code>.ttwa</code>
          <input type="text" id="modal-new-path" placeholder="/caminho/meu_projeto.ttwa" />
        </label>
        <label>Nome do projeto
          <input type="text" id="modal-new-name" placeholder="Meu Projeto" />
        </label>`,confirmLabel:"Criar"}))return;const u=(f=(d=document.getElementById("modal-new-path"))==null?void 0:d.value)==null?void 0:f.trim(),h=(v=(m=document.getElementById("modal-new-name"))==null?void 0:m.value)==null?void 0:v.trim();if(!u){P("Informe o caminho do arquivo.","error");return}try{await W.project.create({path:u,name:h,overwrite:!1}),P(`Projeto '${h||u}' criado.`),await fr(t,e,n)}catch(y){P(y.message,"error")}}async function r(){var h,d;if(!await Qe.show({titleText:"Abrir projeto .ttwa",bodyHTML:`
        <label>Arquivo <code>.ttwa</code>
          <div class="input-browse" style="margin-top:.35rem">
            <input type="text" id="modal-open-path" placeholder="/caminho/meu_projeto.ttwa" />
            <button type="button" id="btn-modal-browse" class="btn-browse" title="Procurar arquivo">📁</button>
          </div>
        </label>`,confirmLabel:"Abrir",onMount:()=>{var f;(f=document.getElementById("btn-modal-browse"))==null||f.addEventListener("click",async()=>{const m=document.getElementById("btn-modal-browse");m.disabled=!0,m.textContent="…";try{const v=await W.utils.pickFile();v!=null&&v.path&&(document.getElementById("modal-open-path").value=v.path)}catch{m.textContent="📁",m.disabled=!1;const y=m.closest(".input-browse");if(y&&!y.querySelector("input[type=file]")){const w=document.createElement("input");w.type="file",w.accept=".ttwa",w.style.cssText="position:absolute;opacity:0;width:1px;height:1px",y.appendChild(w),w.addEventListener("change",()=>{var k;const _=(k=w.files)==null?void 0:k[0];_!=null&&_.path?document.getElementById("modal-open-path").value=_.path:_!=null&&_.name&&(document.getElementById("modal-open-path").value=_.name)}),w.click()}return}m.textContent="📁",m.disabled=!1})}}))return;const u=(d=(h=document.getElementById("modal-open-path"))==null?void 0:h.value)==null?void 0:d.trim();if(!u){P("Informe o caminho.","error");return}try{await W.project.open({path:u}),P("Projeto aberto."),await fr(t,e,n)}catch(f){P(f.message,"error")}}(o=document.getElementById("btn-home-open"))==null||o.addEventListener("click",()=>r()),(s=document.getElementById("btn-new-project"))==null||s.addEventListener("click",()=>i()),(a=document.getElementById("btn-open-project"))==null||a.addEventListener("click",()=>r()),(l=document.getElementById("btn-home-newanalysis"))==null||l.addEventListener("click",()=>qt("quickrun"))}async function nl({loadCorpusList:t,refreshCorpusSelects:e,refreshKfaSelect:n}){await $i();try{const{path:i}=await W.project.current();i&&(await t(),await e(),await n(),qt("corpus"))}catch{}}const pr=["queued","tagging","normalizing","kfa","saving","done"];let go=null,Pt=null;function vo(t,e){document.querySelectorAll(".progress-step").forEach(n=>{const i=n.dataset.step;if(n.classList.remove("active","done","error"),e&&i===t)n.classList.add("error");else if(!e){const r=pr.indexOf(i),o=pr.indexOf(t);r<o?n.classList.add("done"):r===o&&n.classList.add("active")}})}function bo(t){const e=document.getElementById("qr-msg");e&&(e.textContent=t||"")}async function il(t){var e;try{const n=await W.quickrun.status(go);if(vo(n.step,n.status==="error"),bo(n.message||""),n.status==="done"){clearInterval(Pt),Pt=null,P("Análise concluída!"),document.dispatchEvent(new CustomEvent("project-changed"));try{await t()}catch{}(e=document.getElementById("btn-qr-results"))==null||e.classList.remove("hidden");return}n.status==="error"&&(clearInterval(Pt),Pt=null,P(n.error||"Erro na análise.","error"))}catch(n){clearInterval(Pt),Pt=null,P(n.message,"error")}}function rl({refreshKfaSelect:t}){var e,n;document.querySelectorAll("#form-quickrun .btn-browse").forEach(i=>{i.addEventListener("click",async()=>{var o,s,a,l;i.disabled=!0;const r=i.textContent;i.textContent="…";try{const c=await W.utils.pickFolder();if(c!=null&&c.path){const u=i.dataset.target,h=document.getElementById(u);if(h){if(u==="qr-output"){const d=((s=(o=document.getElementById("qr-c1-name"))==null?void 0:o.value)==null?void 0:s.trim())||"corpus1",f=((l=(a=document.getElementById("qr-c2-name"))==null?void 0:a.value)==null?void 0:l.trim())||"corpus2";h.value=c.path+"/"+d+"_vs_"+f+".ttwa"}else h.value=c.path;h.dispatchEvent(new Event("change"))}}}catch{}i.textContent=r,i.disabled=!1})}),(e=document.getElementById("form-quickrun"))==null||e.addEventListener("submit",async i=>{var l,c,u;i.preventDefault();const r=h=>{var d,f;return(f=(d=document.getElementById(h))==null?void 0:d.value)==null?void 0:f.trim()};let o=r("qr-output")||"";o&&!o.toLowerCase().endsWith(".ttwa")&&(o=o.replace(/\/$/,"")+".ttwa");const s={corpus1_name:r("qr-c1-name"),corpus1_folder:r("qr-c1-folder"),corpus2_name:r("qr-c2-name"),corpus2_folder:r("qr-c2-folder"),output_ttwa:o,mode:r("qr-mode"),join:r("qr-join"),min_effect:parseFloat(r("qr-effect")||"0.2"),usenlp:((l=document.getElementById("qr-usenlp"))==null?void 0:l.checked)??!1,n_processes:1,overwrite:!0};if(["corpus1_name","corpus1_folder","corpus2_name","corpus2_folder","output_ttwa"].some(h=>!s[h])){P("Preencha todos os campos obrigatórios.","error");return}vo("queued",!1),bo("Iniciando…"),(c=document.getElementById("qr-progress"))==null||c.classList.remove("hidden"),(u=document.getElementById("btn-qr-results"))==null||u.classList.add("hidden");try{const{job_id:h}=await W.quickrun.start(s);go=h,Pt=setInterval(()=>il(t),1500)}catch(h){P(h.message,"error")}}),(n=document.getElementById("btn-qr-results"))==null||n.addEventListener("click",async()=>{try{await t()}catch{}qt("results")})}async function tn(){const t=document.getElementById("corpus-list");try{const{corpora:e}=await W.corpus.list();if(!e.length)return t.innerHTML='<p class="placeholder">Nenhum corpus carregado.</p>',e;const n=await Promise.all(e.map(async i=>{const{files:r}=await W.corpus.files(i);return{name:i,count:r.length}}));return t.innerHTML=n.map(i=>`
      <div class="corpus-item">
        <span class="corpus-name">${i.name}</span>
        <span class="corpus-meta">${i.count} arquivo(s)</span>
      </div>`).join(""),e}catch(e){return t.innerHTML=`<p class="placeholder">Erro: ${e.message}</p>`,[]}}async function Jn(){try{const{corpora:t}=await W.corpus.list();Bn(document.getElementById("tag-corpus-select"),t,"-- selecione --"),Bn(document.getElementById("kfa-corpus1"),t,"-- selecione --"),Bn(document.getElementById("kfa-corpus2"),t,"-- selecione --")}catch{}}function ol(){var t,e;(t=document.getElementById("btn-import-folder"))==null||t.addEventListener("click",async()=>{var o,s,a,l;if(!await Qe.show({titleText:"Importar pasta de corpus",bodyHTML:`
        <label>Nome do corpus
          <input type="text" id="modal-corpus-name" placeholder="ex: corpus_A" />
        </label>
        <label>Caminho da pasta no disco
          <input type="text" id="modal-folder-path" placeholder="/caminho/para/pasta" />
        </label>`,confirmLabel:"Importar"}))return;const i=(s=(o=document.getElementById("modal-corpus-name"))==null?void 0:o.value)==null?void 0:s.trim(),r=(l=(a=document.getElementById("modal-folder-path"))==null?void 0:a.value)==null?void 0:l.trim();if(!i||!r){P("Preencha todos os campos.","error");return}try{const{imported:c}=await W.corpus.importFolder({corpus_name:i,folder_path:r});P(`${c} arquivo(s) importados para '${i}'.`),await tn(),await Jn()}catch(c){P(c.message,"error")}}),(e=document.getElementById("btn-upload-file"))==null||e.addEventListener("click",async()=>{var o,s,a,l;if(!await Qe.show({titleText:"Upload de arquivo .txt",bodyHTML:`
        <label>Nome do corpus
          <input type="text" id="modal-up-corpus" placeholder="ex: corpus_A" />
        </label>
        <label>Arquivo
          <input type="file" id="modal-up-file" accept=".txt" />
        </label>`,confirmLabel:"Enviar"}))return;const i=(s=(o=document.getElementById("modal-up-corpus"))==null?void 0:o.value)==null?void 0:s.trim(),r=(l=(a=document.getElementById("modal-up-file"))==null?void 0:a.files)==null?void 0:l[0];if(!i||!r){P("Selecione um corpus e um arquivo.","error");return}try{await W.corpus.uploadFile(i,r),P(`'${r.name}' enviado para '${i}'.`),await tn(),await Jn()}catch(c){P(c.message,"error")}})}let Qn=null,_t=null;function me(t,e){const n=document.getElementById("tagging-status");n.className=`status-box ${t}`,n.textContent=e,n.classList.remove("hidden")}async function sl(){if(Qn)try{const t=await W.tagging.status(Qn);t.status==="done"?(clearInterval(_t),_t=null,me("done","Tagging concluído com sucesso!"),P("Tagging concluído!"),await tn()):t.status==="error"?(clearInterval(_t),_t=null,me("error",`Erro: ${t.error}`),P(t.error,"error")):me("running",`Status: ${t.status}…`)}catch(t){clearInterval(_t),_t=null,me("error",`Falha: ${t.message}`)}}function al(){var t;(t=document.getElementById("form-tagging"))==null||t.addEventListener("submit",async e=>{e.preventDefault();const n=document.getElementById("tag-corpus-select").value;if(!n){P("Selecione um corpus.","error");return}const i={corpus_name:n,source:"project",usenlp:document.getElementById("tag-usenlp").checked,save_tagged:document.getElementById("tag-save-tagged").checked,n_processes:parseInt(document.getElementById("tag-nprocesses").value,10),function_words:!1};try{const{job_id:r}=await W.tagging.run(i);Qn=r,_t&&clearInterval(_t),me("running",`Job iniciado (${r.slice(0,8)}…). Aguardando…`),_t=setInterval(sl,2e3)}catch(r){P(r.message,"error")}})}function ll({refreshKfaSelect:t}){var e;(e=document.getElementById("form-kfa"))==null||e.addEventListener("submit",async n=>{n.preventDefault();const i=document.getElementById("kfa-corpus1").value,r=document.getElementById("kfa-corpus2").value,o=parseFloat(document.getElementById("kfa-effect").value),s=document.getElementById("kfa-join").value;if(!i||!r){P("Selecione os dois corpora.","error");return}if(i===r){P("Os corpora devem ser diferentes.","error");return}if(isNaN(o)){P("Effect size inválido.","error");return}const a=n.target.querySelector('button[type="submit"]');a.disabled=!0,a.textContent="Executando…";try{const l=await W.analysis.runKfa({corpus1_name:i,corpus2_name:r,min_effect_size:o,join:s,save_to_project:!0});P(`KFA concluída: ${l.n_features} features com |d| ≥ ${o}.`),await t(),qt("results")}catch(l){P(l.message,"error")}finally{a.disabled=!1,a.textContent="Executar KFA"}})}const $={currentProject:null,kfaData:null,kfaC1:"",kfaC2:"",chartMetric:"Effect_Size",barHeight:18,palette:"biber",sortCol:"Effect_Size",sortDir:-1,filter:"",tagDefs:{}};function Ue(t,e){return t==null||e==null?NaN:t<e?-1:t>e?1:t>=e?0:NaN}function cl(t,e){return t==null||e==null?NaN:e<t?-1:e>t?1:e>=t?0:NaN}function yo(t){let e,n,i;t.length!==2?(e=Ue,n=(a,l)=>Ue(t(a),l),i=(a,l)=>t(a)-l):(e=t===Ue||t===cl?t:ul,n=t,i=t);function r(a,l,c=0,u=a.length){if(c<u){if(e(l,l)!==0)return u;do{const h=c+u>>>1;n(a[h],l)<0?c=h+1:u=h}while(c<u)}return c}function o(a,l,c=0,u=a.length){if(c<u){if(e(l,l)!==0)return u;do{const h=c+u>>>1;n(a[h],l)<=0?c=h+1:u=h}while(c<u)}return c}function s(a,l,c=0,u=a.length){const h=r(a,l,c,u-1);return h>c&&i(a[h-1],l)>-i(a[h],l)?h-1:h}return{left:r,center:s,right:o}}function ul(){return 0}function hl(t){return t===null?NaN:+t}const dl=yo(Ue),fl=dl.right;yo(hl).center;class mr extends Map{constructor(e,n=gl){if(super(),Object.defineProperties(this,{_intern:{value:new Map},_key:{value:n}}),e!=null)for(const[i,r]of e)this.set(i,r)}get(e){return super.get(gr(this,e))}has(e){return super.has(gr(this,e))}set(e,n){return super.set(pl(this,e),n)}delete(e){return super.delete(ml(this,e))}}function gr({_intern:t,_key:e},n){const i=e(n);return t.has(i)?t.get(i):n}function pl({_intern:t,_key:e},n){const i=e(n);return t.has(i)?t.get(i):(t.set(i,n),n)}function ml({_intern:t,_key:e},n){const i=e(n);return t.has(i)&&(n=t.get(i),t.delete(i)),n}function gl(t){return t!==null&&typeof t=="object"?t.valueOf():t}const vl=Math.sqrt(50),bl=Math.sqrt(10),yl=Math.sqrt(2);function en(t,e,n){const i=(e-t)/Math.max(0,n),r=Math.floor(Math.log10(i)),o=i/Math.pow(10,r),s=o>=vl?10:o>=bl?5:o>=yl?2:1;let a,l,c;return r<0?(c=Math.pow(10,-r)/s,a=Math.round(t*c),l=Math.round(e*c),a/c<t&&++a,l/c>e&&--l,c=-c):(c=Math.pow(10,r)*s,a=Math.round(t/c),l=Math.round(e/c),a*c<t&&++a,l*c>e&&--l),l<a&&.5<=n&&n<2?en(t,e,n*2):[a,l,c]}function wl(t,e,n){if(e=+e,t=+t,n=+n,!(n>0))return[];if(t===e)return[t];const i=e<t,[r,o,s]=i?en(e,t,n):en(t,e,n);if(!(o>=r))return[];const a=o-r+1,l=new Array(a);if(i)if(s<0)for(let c=0;c<a;++c)l[c]=(o-c)/-s;else for(let c=0;c<a;++c)l[c]=(o-c)*s;else if(s<0)for(let c=0;c<a;++c)l[c]=(r+c)/-s;else for(let c=0;c<a;++c)l[c]=(r+c)*s;return l}function ti(t,e,n){return e=+e,t=+t,n=+n,en(t,e,n)[2]}function _l(t,e,n){e=+e,t=+t,n=+n;const i=e<t,r=i?ti(e,t,n):ti(t,e,n);return(i?-1:1)*(r<0?1/-r:r)}function xl(t,e){let n;for(const i of t)i!=null&&(n<i||n===void 0&&i>=i)&&(n=i);return n}function kl(t,e){let n;for(const i of t)i!=null&&(n>i||n===void 0&&i>=i)&&(n=i);return n}function $l(t,e,n){t=+t,e=+e,n=(r=arguments.length)<2?(e=t,t=0,1):r<3?1:+n;for(var i=-1,r=Math.max(0,Math.ceil((e-t)/n))|0,o=new Array(r);++i<r;)o[i]=t+i*n;return o}function Cl(t){return t}var Dn=1,Fn=2,ei=3,ge=4,vr=1e-6;function El(t){return"translate("+t+",0)"}function Al(t){return"translate(0,"+t+")"}function Sl(t){return e=>+t(e)}function Tl(t,e){return e=Math.max(0,t.bandwidth()-e*2)/2,t.round()&&(e=Math.round(e)),n=>+t(n)+e}function zl(){return!this.__axis}function wo(t,e){var n=[],i=null,r=null,o=6,s=6,a=3,l=typeof window<"u"&&window.devicePixelRatio>1?0:.5,c=t===Dn||t===ge?-1:1,u=t===ge||t===Fn?"x":"y",h=t===Dn||t===ei?El:Al;function d(f){var m=i??(e.ticks?e.ticks.apply(e,n):e.domain()),v=r??(e.tickFormat?e.tickFormat.apply(e,n):Cl),y=Math.max(o,0)+a,w=e.range(),_=+w[0]+l,k=+w[w.length-1]+l,E=(e.bandwidth?Tl:Sl)(e.copy(),l),T=f.selection?f.selection():f,C=T.selectAll(".domain").data([null]),z=T.selectAll(".tick").data(m,e).order(),X=z.exit(),V=z.enter().append("g").attr("class","tick"),D=z.select("line"),j=z.select("text");C=C.merge(C.enter().insert("path",".tick").attr("class","domain").attr("stroke","currentColor")),z=z.merge(V),D=D.merge(V.append("line").attr("stroke","currentColor").attr(u+"2",c*o)),j=j.merge(V.append("text").attr("fill","currentColor").attr(u,c*y).attr("dy",t===Dn?"0em":t===ei?"0.71em":"0.32em")),f!==T&&(C=C.transition(f),z=z.transition(f),D=D.transition(f),j=j.transition(f),X=X.transition(f).attr("opacity",vr).attr("transform",function(b){return isFinite(b=E(b))?h(b+l):this.getAttribute("transform")}),V.attr("opacity",vr).attr("transform",function(b){var R=this.parentNode.__axis;return h((R&&isFinite(R=R(b))?R:E(b))+l)})),X.remove(),C.attr("d",t===ge||t===Fn?s?"M"+c*s+","+_+"H"+l+"V"+k+"H"+c*s:"M"+l+","+_+"V"+k:s?"M"+_+","+c*s+"V"+l+"H"+k+"V"+c*s:"M"+_+","+l+"H"+k),z.attr("opacity",1).attr("transform",function(b){return h(E(b)+l)}),D.attr(u+"2",c*o),j.attr(u,c*y).text(v),T.filter(zl).attr("fill","none").attr("font-size",10).attr("font-family","sans-serif").attr("text-anchor",t===Fn?"start":t===ge?"end":"middle"),T.each(function(){this.__axis=E})}return d.scale=function(f){return arguments.length?(e=f,d):e},d.ticks=function(){return n=Array.from(arguments),d},d.tickArguments=function(f){return arguments.length?(n=f==null?[]:Array.from(f),d):n.slice()},d.tickValues=function(f){return arguments.length?(i=f==null?null:Array.from(f),d):i&&i.slice()},d.tickFormat=function(f){return arguments.length?(r=f,d):r},d.tickSize=function(f){return arguments.length?(o=s=+f,d):o},d.tickSizeInner=function(f){return arguments.length?(o=+f,d):o},d.tickSizeOuter=function(f){return arguments.length?(s=+f,d):s},d.tickPadding=function(f){return arguments.length?(a=+f,d):a},d.offset=function(f){return arguments.length?(l=+f,d):l},d}function br(t){return wo(ei,t)}function Ml(t){return wo(ge,t)}var Ol={value:()=>{}};function _o(){for(var t=0,e=arguments.length,n={},i;t<e;++t){if(!(i=arguments[t]+"")||i in n||/[\s.]/.test(i))throw new Error("illegal type: "+i);n[i]=[]}return new je(n)}function je(t){this._=t}function Ll(t,e){return t.trim().split(/^|\s+/).map(function(n){var i="",r=n.indexOf(".");if(r>=0&&(i=n.slice(r+1),n=n.slice(0,r)),n&&!e.hasOwnProperty(n))throw new Error("unknown type: "+n);return{type:n,name:i}})}je.prototype=_o.prototype={constructor:je,on:function(t,e){var n=this._,i=Ll(t+"",n),r,o=-1,s=i.length;if(arguments.length<2){for(;++o<s;)if((r=(t=i[o]).type)&&(r=Pl(n[r],t.name)))return r;return}if(e!=null&&typeof e!="function")throw new Error("invalid callback: "+e);for(;++o<s;)if(r=(t=i[o]).type)n[r]=yr(n[r],t.name,e);else if(e==null)for(r in n)n[r]=yr(n[r],t.name,null);return this},copy:function(){var t={},e=this._;for(var n in e)t[n]=e[n].slice();return new je(t)},call:function(t,e){if((r=arguments.length-2)>0)for(var n=new Array(r),i=0,r,o;i<r;++i)n[i]=arguments[i+2];if(!this._.hasOwnProperty(t))throw new Error("unknown type: "+t);for(o=this._[t],i=0,r=o.length;i<r;++i)o[i].value.apply(e,n)},apply:function(t,e,n){if(!this._.hasOwnProperty(t))throw new Error("unknown type: "+t);for(var i=this._[t],r=0,o=i.length;r<o;++r)i[r].value.apply(e,n)}};function Pl(t,e){for(var n=0,i=t.length,r;n<i;++n)if((r=t[n]).name===e)return r.value}function yr(t,e,n){for(var i=0,r=t.length;i<r;++i)if(t[i].name===e){t[i]=Ol,t=t.slice(0,i).concat(t.slice(i+1));break}return n!=null&&t.push({name:e,value:n}),t}var ni="http://www.w3.org/1999/xhtml";const wr={svg:"http://www.w3.org/2000/svg",xhtml:ni,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};function kn(t){var e=t+="",n=e.indexOf(":");return n>=0&&(e=t.slice(0,n))!=="xmlns"&&(t=t.slice(n+1)),wr.hasOwnProperty(e)?{space:wr[e],local:t}:t}function Il(t){return function(){var e=this.ownerDocument,n=this.namespaceURI;return n===ni&&e.documentElement.namespaceURI===ni?e.createElement(t):e.createElementNS(n,t)}}function Nl(t){return function(){return this.ownerDocument.createElementNS(t.space,t.local)}}function xo(t){var e=kn(t);return(e.local?Nl:Il)(e)}function Rl(){}function Ci(t){return t==null?Rl:function(){return this.querySelector(t)}}function Bl(t){typeof t!="function"&&(t=Ci(t));for(var e=this._groups,n=e.length,i=new Array(n),r=0;r<n;++r)for(var o=e[r],s=o.length,a=i[r]=new Array(s),l,c,u=0;u<s;++u)(l=o[u])&&(c=t.call(l,l.__data__,u,o))&&("__data__"in l&&(c.__data__=l.__data__),a[u]=c);return new it(i,this._parents)}function Dl(t){return t==null?[]:Array.isArray(t)?t:Array.from(t)}function Fl(){return[]}function ko(t){return t==null?Fl:function(){return this.querySelectorAll(t)}}function Vl(t){return function(){return Dl(t.apply(this,arguments))}}function Hl(t){typeof t=="function"?t=Vl(t):t=ko(t);for(var e=this._groups,n=e.length,i=[],r=[],o=0;o<n;++o)for(var s=e[o],a=s.length,l,c=0;c<a;++c)(l=s[c])&&(i.push(t.call(l,l.__data__,c,s)),r.push(l));return new it(i,r)}function $o(t){return function(){return this.matches(t)}}function Co(t){return function(e){return e.matches(t)}}var ql=Array.prototype.find;function Ul(t){return function(){return ql.call(this.children,t)}}function jl(){return this.firstElementChild}function Wl(t){return this.select(t==null?jl:Ul(typeof t=="function"?t:Co(t)))}var Xl=Array.prototype.filter;function Yl(){return Array.from(this.children)}function Kl(t){return function(){return Xl.call(this.children,t)}}function Gl(t){return this.selectAll(t==null?Yl:Kl(typeof t=="function"?t:Co(t)))}function Zl(t){typeof t!="function"&&(t=$o(t));for(var e=this._groups,n=e.length,i=new Array(n),r=0;r<n;++r)for(var o=e[r],s=o.length,a=i[r]=[],l,c=0;c<s;++c)(l=o[c])&&t.call(l,l.__data__,c,o)&&a.push(l);return new it(i,this._parents)}function Eo(t){return new Array(t.length)}function Jl(){return new it(this._enter||this._groups.map(Eo),this._parents)}function nn(t,e){this.ownerDocument=t.ownerDocument,this.namespaceURI=t.namespaceURI,this._next=null,this._parent=t,this.__data__=e}nn.prototype={constructor:nn,appendChild:function(t){return this._parent.insertBefore(t,this._next)},insertBefore:function(t,e){return this._parent.insertBefore(t,e)},querySelector:function(t){return this._parent.querySelector(t)},querySelectorAll:function(t){return this._parent.querySelectorAll(t)}};function Ql(t){return function(){return t}}function tc(t,e,n,i,r,o){for(var s=0,a,l=e.length,c=o.length;s<c;++s)(a=e[s])?(a.__data__=o[s],i[s]=a):n[s]=new nn(t,o[s]);for(;s<l;++s)(a=e[s])&&(r[s]=a)}function ec(t,e,n,i,r,o,s){var a,l,c=new Map,u=e.length,h=o.length,d=new Array(u),f;for(a=0;a<u;++a)(l=e[a])&&(d[a]=f=s.call(l,l.__data__,a,e)+"",c.has(f)?r[a]=l:c.set(f,l));for(a=0;a<h;++a)f=s.call(t,o[a],a,o)+"",(l=c.get(f))?(i[a]=l,l.__data__=o[a],c.delete(f)):n[a]=new nn(t,o[a]);for(a=0;a<u;++a)(l=e[a])&&c.get(d[a])===l&&(r[a]=l)}function nc(t){return t.__data__}function ic(t,e){if(!arguments.length)return Array.from(this,nc);var n=e?ec:tc,i=this._parents,r=this._groups;typeof t!="function"&&(t=Ql(t));for(var o=r.length,s=new Array(o),a=new Array(o),l=new Array(o),c=0;c<o;++c){var u=i[c],h=r[c],d=h.length,f=rc(t.call(u,u&&u.__data__,c,i)),m=f.length,v=a[c]=new Array(m),y=s[c]=new Array(m),w=l[c]=new Array(d);n(u,h,v,y,w,f,e);for(var _=0,k=0,E,T;_<m;++_)if(E=v[_]){for(_>=k&&(k=_+1);!(T=y[k])&&++k<m;);E._next=T||null}}return s=new it(s,i),s._enter=a,s._exit=l,s}function rc(t){return typeof t=="object"&&"length"in t?t:Array.from(t)}function oc(){return new it(this._exit||this._groups.map(Eo),this._parents)}function sc(t,e,n){var i=this.enter(),r=this,o=this.exit();return typeof t=="function"?(i=t(i),i&&(i=i.selection())):i=i.append(t+""),e!=null&&(r=e(r),r&&(r=r.selection())),n==null?o.remove():n(o),i&&r?i.merge(r).order():r}function ac(t){for(var e=t.selection?t.selection():t,n=this._groups,i=e._groups,r=n.length,o=i.length,s=Math.min(r,o),a=new Array(r),l=0;l<s;++l)for(var c=n[l],u=i[l],h=c.length,d=a[l]=new Array(h),f,m=0;m<h;++m)(f=c[m]||u[m])&&(d[m]=f);for(;l<r;++l)a[l]=n[l];return new it(a,this._parents)}function lc(){for(var t=this._groups,e=-1,n=t.length;++e<n;)for(var i=t[e],r=i.length-1,o=i[r],s;--r>=0;)(s=i[r])&&(o&&s.compareDocumentPosition(o)^4&&o.parentNode.insertBefore(s,o),o=s);return this}function cc(t){t||(t=uc);function e(h,d){return h&&d?t(h.__data__,d.__data__):!h-!d}for(var n=this._groups,i=n.length,r=new Array(i),o=0;o<i;++o){for(var s=n[o],a=s.length,l=r[o]=new Array(a),c,u=0;u<a;++u)(c=s[u])&&(l[u]=c);l.sort(e)}return new it(r,this._parents).order()}function uc(t,e){return t<e?-1:t>e?1:t>=e?0:NaN}function hc(){var t=arguments[0];return arguments[0]=this,t.apply(null,arguments),this}function dc(){return Array.from(this)}function fc(){for(var t=this._groups,e=0,n=t.length;e<n;++e)for(var i=t[e],r=0,o=i.length;r<o;++r){var s=i[r];if(s)return s}return null}function pc(){let t=0;for(const e of this)++t;return t}function mc(){return!this.node()}function gc(t){for(var e=this._groups,n=0,i=e.length;n<i;++n)for(var r=e[n],o=0,s=r.length,a;o<s;++o)(a=r[o])&&t.call(a,a.__data__,o,r);return this}function vc(t){return function(){this.removeAttribute(t)}}function bc(t){return function(){this.removeAttributeNS(t.space,t.local)}}function yc(t,e){return function(){this.setAttribute(t,e)}}function wc(t,e){return function(){this.setAttributeNS(t.space,t.local,e)}}function _c(t,e){return function(){var n=e.apply(this,arguments);n==null?this.removeAttribute(t):this.setAttribute(t,n)}}function xc(t,e){return function(){var n=e.apply(this,arguments);n==null?this.removeAttributeNS(t.space,t.local):this.setAttributeNS(t.space,t.local,n)}}function kc(t,e){var n=kn(t);if(arguments.length<2){var i=this.node();return n.local?i.getAttributeNS(n.space,n.local):i.getAttribute(n)}return this.each((e==null?n.local?bc:vc:typeof e=="function"?n.local?xc:_c:n.local?wc:yc)(n,e))}function Ao(t){return t.ownerDocument&&t.ownerDocument.defaultView||t.document&&t||t.defaultView}function $c(t){return function(){this.style.removeProperty(t)}}function Cc(t,e,n){return function(){this.style.setProperty(t,e,n)}}function Ec(t,e,n){return function(){var i=e.apply(this,arguments);i==null?this.style.removeProperty(t):this.style.setProperty(t,i,n)}}function Ac(t,e,n){return arguments.length>1?this.each((e==null?$c:typeof e=="function"?Ec:Cc)(t,e,n??"")):ne(this.node(),t)}function ne(t,e){return t.style.getPropertyValue(e)||Ao(t).getComputedStyle(t,null).getPropertyValue(e)}function Sc(t){return function(){delete this[t]}}function Tc(t,e){return function(){this[t]=e}}function zc(t,e){return function(){var n=e.apply(this,arguments);n==null?delete this[t]:this[t]=n}}function Mc(t,e){return arguments.length>1?this.each((e==null?Sc:typeof e=="function"?zc:Tc)(t,e)):this.node()[t]}function So(t){return t.trim().split(/^|\s+/)}function Ei(t){return t.classList||new To(t)}function To(t){this._node=t,this._names=So(t.getAttribute("class")||"")}To.prototype={add:function(t){var e=this._names.indexOf(t);e<0&&(this._names.push(t),this._node.setAttribute("class",this._names.join(" ")))},remove:function(t){var e=this._names.indexOf(t);e>=0&&(this._names.splice(e,1),this._node.setAttribute("class",this._names.join(" ")))},contains:function(t){return this._names.indexOf(t)>=0}};function zo(t,e){for(var n=Ei(t),i=-1,r=e.length;++i<r;)n.add(e[i])}function Mo(t,e){for(var n=Ei(t),i=-1,r=e.length;++i<r;)n.remove(e[i])}function Oc(t){return function(){zo(this,t)}}function Lc(t){return function(){Mo(this,t)}}function Pc(t,e){return function(){(e.apply(this,arguments)?zo:Mo)(this,t)}}function Ic(t,e){var n=So(t+"");if(arguments.length<2){for(var i=Ei(this.node()),r=-1,o=n.length;++r<o;)if(!i.contains(n[r]))return!1;return!0}return this.each((typeof e=="function"?Pc:e?Oc:Lc)(n,e))}function Nc(){this.textContent=""}function Rc(t){return function(){this.textContent=t}}function Bc(t){return function(){var e=t.apply(this,arguments);this.textContent=e??""}}function Dc(t){return arguments.length?this.each(t==null?Nc:(typeof t=="function"?Bc:Rc)(t)):this.node().textContent}function Fc(){this.innerHTML=""}function Vc(t){return function(){this.innerHTML=t}}function Hc(t){return function(){var e=t.apply(this,arguments);this.innerHTML=e??""}}function qc(t){return arguments.length?this.each(t==null?Fc:(typeof t=="function"?Hc:Vc)(t)):this.node().innerHTML}function Uc(){this.nextSibling&&this.parentNode.appendChild(this)}function jc(){return this.each(Uc)}function Wc(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}function Xc(){return this.each(Wc)}function Yc(t){var e=typeof t=="function"?t:xo(t);return this.select(function(){return this.appendChild(e.apply(this,arguments))})}function Kc(){return null}function Gc(t,e){var n=typeof t=="function"?t:xo(t),i=e==null?Kc:typeof e=="function"?e:Ci(e);return this.select(function(){return this.insertBefore(n.apply(this,arguments),i.apply(this,arguments)||null)})}function Zc(){var t=this.parentNode;t&&t.removeChild(this)}function Jc(){return this.each(Zc)}function Qc(){var t=this.cloneNode(!1),e=this.parentNode;return e?e.insertBefore(t,this.nextSibling):t}function tu(){var t=this.cloneNode(!0),e=this.parentNode;return e?e.insertBefore(t,this.nextSibling):t}function eu(t){return this.select(t?tu:Qc)}function nu(t){return arguments.length?this.property("__data__",t):this.node().__data__}function iu(t){return function(e){t.call(this,e,this.__data__)}}function ru(t){return t.trim().split(/^|\s+/).map(function(e){var n="",i=e.indexOf(".");return i>=0&&(n=e.slice(i+1),e=e.slice(0,i)),{type:e,name:n}})}function ou(t){return function(){var e=this.__on;if(e){for(var n=0,i=-1,r=e.length,o;n<r;++n)o=e[n],(!t.type||o.type===t.type)&&o.name===t.name?this.removeEventListener(o.type,o.listener,o.options):e[++i]=o;++i?e.length=i:delete this.__on}}}function su(t,e,n){return function(){var i=this.__on,r,o=iu(e);if(i){for(var s=0,a=i.length;s<a;++s)if((r=i[s]).type===t.type&&r.name===t.name){this.removeEventListener(r.type,r.listener,r.options),this.addEventListener(r.type,r.listener=o,r.options=n),r.value=e;return}}this.addEventListener(t.type,o,n),r={type:t.type,name:t.name,value:e,listener:o,options:n},i?i.push(r):this.__on=[r]}}function au(t,e,n){var i=ru(t+""),r,o=i.length,s;if(arguments.length<2){var a=this.node().__on;if(a){for(var l=0,c=a.length,u;l<c;++l)for(r=0,u=a[l];r<o;++r)if((s=i[r]).type===u.type&&s.name===u.name)return u.value}return}for(a=e?su:ou,r=0;r<o;++r)this.each(a(i[r],e,n));return this}function Oo(t,e,n){var i=Ao(t),r=i.CustomEvent;typeof r=="function"?r=new r(e,n):(r=i.document.createEvent("Event"),n?(r.initEvent(e,n.bubbles,n.cancelable),r.detail=n.detail):r.initEvent(e,!1,!1)),t.dispatchEvent(r)}function lu(t,e){return function(){return Oo(this,t,e)}}function cu(t,e){return function(){return Oo(this,t,e.apply(this,arguments))}}function uu(t,e){return this.each((typeof e=="function"?cu:lu)(t,e))}function*hu(){for(var t=this._groups,e=0,n=t.length;e<n;++e)for(var i=t[e],r=0,o=i.length,s;r<o;++r)(s=i[r])&&(yield s)}var Lo=[null];function it(t,e){this._groups=t,this._parents=e}function Oe(){return new it([[document.documentElement]],Lo)}function du(){return this}it.prototype=Oe.prototype={constructor:it,select:Bl,selectAll:Hl,selectChild:Wl,selectChildren:Gl,filter:Zl,data:ic,enter:Jl,exit:oc,join:sc,merge:ac,selection:du,order:lc,sort:cc,call:hc,nodes:dc,node:fc,size:pc,empty:mc,each:gc,attr:kc,style:Ac,property:Mc,classed:Ic,text:Dc,html:qc,raise:jc,lower:Xc,append:Yc,insert:Gc,remove:Jc,clone:eu,datum:nu,on:au,dispatch:uu,[Symbol.iterator]:hu};function Vn(t){return typeof t=="string"?new it([[document.querySelector(t)]],[document.documentElement]):new it([[t]],Lo)}function Ai(t,e,n){t.prototype=e.prototype=n,n.constructor=t}function Po(t,e){var n=Object.create(t.prototype);for(var i in e)n[i]=e[i];return n}function Le(){}var Ae=.7,rn=1/Ae,Jt="\\s*([+-]?\\d+)\\s*",Se="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",vt="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",fu=/^#([0-9a-f]{3,8})$/,pu=new RegExp(`^rgb\\(${Jt},${Jt},${Jt}\\)$`),mu=new RegExp(`^rgb\\(${vt},${vt},${vt}\\)$`),gu=new RegExp(`^rgba\\(${Jt},${Jt},${Jt},${Se}\\)$`),vu=new RegExp(`^rgba\\(${vt},${vt},${vt},${Se}\\)$`),bu=new RegExp(`^hsl\\(${Se},${vt},${vt}\\)$`),yu=new RegExp(`^hsla\\(${Se},${vt},${vt},${Se}\\)$`),_r={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};Ai(Le,Ut,{copy(t){return Object.assign(new this.constructor,this,t)},displayable(){return this.rgb().displayable()},hex:xr,formatHex:xr,formatHex8:wu,formatHsl:_u,formatRgb:kr,toString:kr});function xr(){return this.rgb().formatHex()}function wu(){return this.rgb().formatHex8()}function _u(){return Io(this).formatHsl()}function kr(){return this.rgb().formatRgb()}function Ut(t){var e,n;return t=(t+"").trim().toLowerCase(),(e=fu.exec(t))?(n=e[1].length,e=parseInt(e[1],16),n===6?$r(e):n===3?new J(e>>8&15|e>>4&240,e>>4&15|e&240,(e&15)<<4|e&15,1):n===8?Re(e>>24&255,e>>16&255,e>>8&255,(e&255)/255):n===4?Re(e>>12&15|e>>8&240,e>>8&15|e>>4&240,e>>4&15|e&240,((e&15)<<4|e&15)/255):null):(e=pu.exec(t))?new J(e[1],e[2],e[3],1):(e=mu.exec(t))?new J(e[1]*255/100,e[2]*255/100,e[3]*255/100,1):(e=gu.exec(t))?Re(e[1],e[2],e[3],e[4]):(e=vu.exec(t))?Re(e[1]*255/100,e[2]*255/100,e[3]*255/100,e[4]):(e=bu.exec(t))?Ar(e[1],e[2]/100,e[3]/100,1):(e=yu.exec(t))?Ar(e[1],e[2]/100,e[3]/100,e[4]):_r.hasOwnProperty(t)?$r(_r[t]):t==="transparent"?new J(NaN,NaN,NaN,0):null}function $r(t){return new J(t>>16&255,t>>8&255,t&255,1)}function Re(t,e,n,i){return i<=0&&(t=e=n=NaN),new J(t,e,n,i)}function xu(t){return t instanceof Le||(t=Ut(t)),t?(t=t.rgb(),new J(t.r,t.g,t.b,t.opacity)):new J}function ii(t,e,n,i){return arguments.length===1?xu(t):new J(t,e,n,i??1)}function J(t,e,n,i){this.r=+t,this.g=+e,this.b=+n,this.opacity=+i}Ai(J,ii,Po(Le,{brighter(t){return t=t==null?rn:Math.pow(rn,t),new J(this.r*t,this.g*t,this.b*t,this.opacity)},darker(t){return t=t==null?Ae:Math.pow(Ae,t),new J(this.r*t,this.g*t,this.b*t,this.opacity)},rgb(){return this},clamp(){return new J(Ft(this.r),Ft(this.g),Ft(this.b),on(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:Cr,formatHex:Cr,formatHex8:ku,formatRgb:Er,toString:Er}));function Cr(){return`#${Bt(this.r)}${Bt(this.g)}${Bt(this.b)}`}function ku(){return`#${Bt(this.r)}${Bt(this.g)}${Bt(this.b)}${Bt((isNaN(this.opacity)?1:this.opacity)*255)}`}function Er(){const t=on(this.opacity);return`${t===1?"rgb(":"rgba("}${Ft(this.r)}, ${Ft(this.g)}, ${Ft(this.b)}${t===1?")":`, ${t})`}`}function on(t){return isNaN(t)?1:Math.max(0,Math.min(1,t))}function Ft(t){return Math.max(0,Math.min(255,Math.round(t)||0))}function Bt(t){return t=Ft(t),(t<16?"0":"")+t.toString(16)}function Ar(t,e,n,i){return i<=0?t=e=n=NaN:n<=0||n>=1?t=e=NaN:e<=0&&(t=NaN),new ht(t,e,n,i)}function Io(t){if(t instanceof ht)return new ht(t.h,t.s,t.l,t.opacity);if(t instanceof Le||(t=Ut(t)),!t)return new ht;if(t instanceof ht)return t;t=t.rgb();var e=t.r/255,n=t.g/255,i=t.b/255,r=Math.min(e,n,i),o=Math.max(e,n,i),s=NaN,a=o-r,l=(o+r)/2;return a?(e===o?s=(n-i)/a+(n<i)*6:n===o?s=(i-e)/a+2:s=(e-n)/a+4,a/=l<.5?o+r:2-o-r,s*=60):a=l>0&&l<1?0:s,new ht(s,a,l,t.opacity)}function $u(t,e,n,i){return arguments.length===1?Io(t):new ht(t,e,n,i??1)}function ht(t,e,n,i){this.h=+t,this.s=+e,this.l=+n,this.opacity=+i}Ai(ht,$u,Po(Le,{brighter(t){return t=t==null?rn:Math.pow(rn,t),new ht(this.h,this.s,this.l*t,this.opacity)},darker(t){return t=t==null?Ae:Math.pow(Ae,t),new ht(this.h,this.s,this.l*t,this.opacity)},rgb(){var t=this.h%360+(this.h<0)*360,e=isNaN(t)||isNaN(this.s)?0:this.s,n=this.l,i=n+(n<.5?n:1-n)*e,r=2*n-i;return new J(Hn(t>=240?t-240:t+120,r,i),Hn(t,r,i),Hn(t<120?t+240:t-120,r,i),this.opacity)},clamp(){return new ht(Sr(this.h),Be(this.s),Be(this.l),on(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const t=on(this.opacity);return`${t===1?"hsl(":"hsla("}${Sr(this.h)}, ${Be(this.s)*100}%, ${Be(this.l)*100}%${t===1?")":`, ${t})`}`}}));function Sr(t){return t=(t||0)%360,t<0?t+360:t}function Be(t){return Math.max(0,Math.min(1,t||0))}function Hn(t,e,n){return(t<60?e+(n-e)*t/60:t<180?n:t<240?e+(n-e)*(240-t)/60:e)*255}const Si=t=>()=>t;function Cu(t,e){return function(n){return t+n*e}}function Eu(t,e,n){return t=Math.pow(t,n),e=Math.pow(e,n)-t,n=1/n,function(i){return Math.pow(t+i*e,n)}}function Au(t){return(t=+t)==1?No:function(e,n){return n-e?Eu(e,n,t):Si(isNaN(e)?n:e)}}function No(t,e){var n=e-t;return n?Cu(t,n):Si(isNaN(t)?e:t)}const sn=function t(e){var n=Au(e);function i(r,o){var s=n((r=ii(r)).r,(o=ii(o)).r),a=n(r.g,o.g),l=n(r.b,o.b),c=No(r.opacity,o.opacity);return function(u){return r.r=s(u),r.g=a(u),r.b=l(u),r.opacity=c(u),r+""}}return i.gamma=t,i}(1);function Su(t,e){e||(e=[]);var n=t?Math.min(e.length,t.length):0,i=e.slice(),r;return function(o){for(r=0;r<n;++r)i[r]=t[r]*(1-o)+e[r]*o;return i}}function Tu(t){return ArrayBuffer.isView(t)&&!(t instanceof DataView)}function zu(t,e){var n=e?e.length:0,i=t?Math.min(n,t.length):0,r=new Array(i),o=new Array(n),s;for(s=0;s<i;++s)r[s]=Ti(t[s],e[s]);for(;s<n;++s)o[s]=e[s];return function(a){for(s=0;s<i;++s)o[s]=r[s](a);return o}}function Mu(t,e){var n=new Date;return t=+t,e=+e,function(i){return n.setTime(t*(1-i)+e*i),n}}function ut(t,e){return t=+t,e=+e,function(n){return t*(1-n)+e*n}}function Ou(t,e){var n={},i={},r;(t===null||typeof t!="object")&&(t={}),(e===null||typeof e!="object")&&(e={});for(r in e)r in t?n[r]=Ti(t[r],e[r]):i[r]=e[r];return function(o){for(r in n)i[r]=n[r](o);return i}}var ri=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,qn=new RegExp(ri.source,"g");function Lu(t){return function(){return t}}function Pu(t){return function(e){return t(e)+""}}function Ro(t,e){var n=ri.lastIndex=qn.lastIndex=0,i,r,o,s=-1,a=[],l=[];for(t=t+"",e=e+"";(i=ri.exec(t))&&(r=qn.exec(e));)(o=r.index)>n&&(o=e.slice(n,o),a[s]?a[s]+=o:a[++s]=o),(i=i[0])===(r=r[0])?a[s]?a[s]+=r:a[++s]=r:(a[++s]=null,l.push({i:s,x:ut(i,r)})),n=qn.lastIndex;return n<e.length&&(o=e.slice(n),a[s]?a[s]+=o:a[++s]=o),a.length<2?l[0]?Pu(l[0].x):Lu(e):(e=l.length,function(c){for(var u=0,h;u<e;++u)a[(h=l[u]).i]=h.x(c);return a.join("")})}function Ti(t,e){var n=typeof e,i;return e==null||n==="boolean"?Si(e):(n==="number"?ut:n==="string"?(i=Ut(e))?(e=i,sn):Ro:e instanceof Ut?sn:e instanceof Date?Mu:Tu(e)?Su:Array.isArray(e)?zu:typeof e.valueOf!="function"&&typeof e.toString!="function"||isNaN(e)?Ou:ut)(t,e)}function Iu(t,e){return t=+t,e=+e,function(n){return Math.round(t*(1-n)+e*n)}}var Tr=180/Math.PI,oi={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function Bo(t,e,n,i,r,o){var s,a,l;return(s=Math.sqrt(t*t+e*e))&&(t/=s,e/=s),(l=t*n+e*i)&&(n-=t*l,i-=e*l),(a=Math.sqrt(n*n+i*i))&&(n/=a,i/=a,l/=a),t*i<e*n&&(t=-t,e=-e,l=-l,s=-s),{translateX:r,translateY:o,rotate:Math.atan2(e,t)*Tr,skewX:Math.atan(l)*Tr,scaleX:s,scaleY:a}}var De;function Nu(t){const e=new(typeof DOMMatrix=="function"?DOMMatrix:WebKitCSSMatrix)(t+"");return e.isIdentity?oi:Bo(e.a,e.b,e.c,e.d,e.e,e.f)}function Ru(t){return t==null||(De||(De=document.createElementNS("http://www.w3.org/2000/svg","g")),De.setAttribute("transform",t),!(t=De.transform.baseVal.consolidate()))?oi:(t=t.matrix,Bo(t.a,t.b,t.c,t.d,t.e,t.f))}function Do(t,e,n,i){function r(c){return c.length?c.pop()+" ":""}function o(c,u,h,d,f,m){if(c!==h||u!==d){var v=f.push("translate(",null,e,null,n);m.push({i:v-4,x:ut(c,h)},{i:v-2,x:ut(u,d)})}else(h||d)&&f.push("translate("+h+e+d+n)}function s(c,u,h,d){c!==u?(c-u>180?u+=360:u-c>180&&(c+=360),d.push({i:h.push(r(h)+"rotate(",null,i)-2,x:ut(c,u)})):u&&h.push(r(h)+"rotate("+u+i)}function a(c,u,h,d){c!==u?d.push({i:h.push(r(h)+"skewX(",null,i)-2,x:ut(c,u)}):u&&h.push(r(h)+"skewX("+u+i)}function l(c,u,h,d,f,m){if(c!==h||u!==d){var v=f.push(r(f)+"scale(",null,",",null,")");m.push({i:v-4,x:ut(c,h)},{i:v-2,x:ut(u,d)})}else(h!==1||d!==1)&&f.push(r(f)+"scale("+h+","+d+")")}return function(c,u){var h=[],d=[];return c=t(c),u=t(u),o(c.translateX,c.translateY,u.translateX,u.translateY,h,d),s(c.rotate,u.rotate,h,d),a(c.skewX,u.skewX,h,d),l(c.scaleX,c.scaleY,u.scaleX,u.scaleY,h,d),c=u=null,function(f){for(var m=-1,v=d.length,y;++m<v;)h[(y=d[m]).i]=y.x(f);return h.join("")}}}var Bu=Do(Nu,"px, ","px)","deg)"),Du=Do(Ru,", ",")",")"),ie=0,ve=0,pe=0,Fo=1e3,an,be,ln=0,jt=0,$n=0,Te=typeof performance=="object"&&performance.now?performance:Date,Vo=typeof window=="object"&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(t){setTimeout(t,17)};function zi(){return jt||(Vo(Fu),jt=Te.now()+$n)}function Fu(){jt=0}function cn(){this._call=this._time=this._next=null}cn.prototype=Ho.prototype={constructor:cn,restart:function(t,e,n){if(typeof t!="function")throw new TypeError("callback is not a function");n=(n==null?zi():+n)+(e==null?0:+e),!this._next&&be!==this&&(be?be._next=this:an=this,be=this),this._call=t,this._time=n,si()},stop:function(){this._call&&(this._call=null,this._time=1/0,si())}};function Ho(t,e,n){var i=new cn;return i.restart(t,e,n),i}function Vu(){zi(),++ie;for(var t=an,e;t;)(e=jt-t._time)>=0&&t._call.call(void 0,e),t=t._next;--ie}function zr(){jt=(ln=Te.now())+$n,ie=ve=0;try{Vu()}finally{ie=0,qu(),jt=0}}function Hu(){var t=Te.now(),e=t-ln;e>Fo&&($n-=e,ln=t)}function qu(){for(var t,e=an,n,i=1/0;e;)e._call?(i>e._time&&(i=e._time),t=e,e=e._next):(n=e._next,e._next=null,e=t?t._next=n:an=n);be=t,si(i)}function si(t){if(!ie){ve&&(ve=clearTimeout(ve));var e=t-jt;e>24?(t<1/0&&(ve=setTimeout(zr,t-Te.now()-$n)),pe&&(pe=clearInterval(pe))):(pe||(ln=Te.now(),pe=setInterval(Hu,Fo)),ie=1,Vo(zr))}}function Mr(t,e,n){var i=new cn;return e=e==null?0:+e,i.restart(r=>{i.stop(),t(r+e)},e,n),i}var Uu=_o("start","end","cancel","interrupt"),ju=[],qo=0,Or=1,ai=2,We=3,Lr=4,li=5,Xe=6;function Cn(t,e,n,i,r,o){var s=t.__transition;if(!s)t.__transition={};else if(n in s)return;Wu(t,n,{name:e,index:i,group:r,on:Uu,tween:ju,time:o.time,delay:o.delay,duration:o.duration,ease:o.ease,timer:null,state:qo})}function Mi(t,e){var n=mt(t,e);if(n.state>qo)throw new Error("too late; already scheduled");return n}function yt(t,e){var n=mt(t,e);if(n.state>We)throw new Error("too late; already running");return n}function mt(t,e){var n=t.__transition;if(!n||!(n=n[e]))throw new Error("transition not found");return n}function Wu(t,e,n){var i=t.__transition,r;i[e]=n,n.timer=Ho(o,0,n.time);function o(c){n.state=Or,n.timer.restart(s,n.delay,n.time),n.delay<=c&&s(c-n.delay)}function s(c){var u,h,d,f;if(n.state!==Or)return l();for(u in i)if(f=i[u],f.name===n.name){if(f.state===We)return Mr(s);f.state===Lr?(f.state=Xe,f.timer.stop(),f.on.call("interrupt",t,t.__data__,f.index,f.group),delete i[u]):+u<e&&(f.state=Xe,f.timer.stop(),f.on.call("cancel",t,t.__data__,f.index,f.group),delete i[u])}if(Mr(function(){n.state===We&&(n.state=Lr,n.timer.restart(a,n.delay,n.time),a(c))}),n.state=ai,n.on.call("start",t,t.__data__,n.index,n.group),n.state===ai){for(n.state=We,r=new Array(d=n.tween.length),u=0,h=-1;u<d;++u)(f=n.tween[u].value.call(t,t.__data__,n.index,n.group))&&(r[++h]=f);r.length=h+1}}function a(c){for(var u=c<n.duration?n.ease.call(null,c/n.duration):(n.timer.restart(l),n.state=li,1),h=-1,d=r.length;++h<d;)r[h].call(t,u);n.state===li&&(n.on.call("end",t,t.__data__,n.index,n.group),l())}function l(){n.state=Xe,n.timer.stop(),delete i[e];for(var c in i)return;delete t.__transition}}function Xu(t,e){var n=t.__transition,i,r,o=!0,s;if(n){e=e==null?null:e+"";for(s in n){if((i=n[s]).name!==e){o=!1;continue}r=i.state>ai&&i.state<li,i.state=Xe,i.timer.stop(),i.on.call(r?"interrupt":"cancel",t,t.__data__,i.index,i.group),delete n[s]}o&&delete t.__transition}}function Yu(t){return this.each(function(){Xu(this,t)})}function Ku(t,e){var n,i;return function(){var r=yt(this,t),o=r.tween;if(o!==n){i=n=o;for(var s=0,a=i.length;s<a;++s)if(i[s].name===e){i=i.slice(),i.splice(s,1);break}}r.tween=i}}function Gu(t,e,n){var i,r;if(typeof n!="function")throw new Error;return function(){var o=yt(this,t),s=o.tween;if(s!==i){r=(i=s).slice();for(var a={name:e,value:n},l=0,c=r.length;l<c;++l)if(r[l].name===e){r[l]=a;break}l===c&&r.push(a)}o.tween=r}}function Zu(t,e){var n=this._id;if(t+="",arguments.length<2){for(var i=mt(this.node(),n).tween,r=0,o=i.length,s;r<o;++r)if((s=i[r]).name===t)return s.value;return null}return this.each((e==null?Ku:Gu)(n,t,e))}function Oi(t,e,n){var i=t._id;return t.each(function(){var r=yt(this,i);(r.value||(r.value={}))[e]=n.apply(this,arguments)}),function(r){return mt(r,i).value[e]}}function Uo(t,e){var n;return(typeof e=="number"?ut:e instanceof Ut?sn:(n=Ut(e))?(e=n,sn):Ro)(t,e)}function Ju(t){return function(){this.removeAttribute(t)}}function Qu(t){return function(){this.removeAttributeNS(t.space,t.local)}}function th(t,e,n){var i,r=n+"",o;return function(){var s=this.getAttribute(t);return s===r?null:s===i?o:o=e(i=s,n)}}function eh(t,e,n){var i,r=n+"",o;return function(){var s=this.getAttributeNS(t.space,t.local);return s===r?null:s===i?o:o=e(i=s,n)}}function nh(t,e,n){var i,r,o;return function(){var s,a=n(this),l;return a==null?void this.removeAttribute(t):(s=this.getAttribute(t),l=a+"",s===l?null:s===i&&l===r?o:(r=l,o=e(i=s,a)))}}function ih(t,e,n){var i,r,o;return function(){var s,a=n(this),l;return a==null?void this.removeAttributeNS(t.space,t.local):(s=this.getAttributeNS(t.space,t.local),l=a+"",s===l?null:s===i&&l===r?o:(r=l,o=e(i=s,a)))}}function rh(t,e){var n=kn(t),i=n==="transform"?Du:Uo;return this.attrTween(t,typeof e=="function"?(n.local?ih:nh)(n,i,Oi(this,"attr."+t,e)):e==null?(n.local?Qu:Ju)(n):(n.local?eh:th)(n,i,e))}function oh(t,e){return function(n){this.setAttribute(t,e.call(this,n))}}function sh(t,e){return function(n){this.setAttributeNS(t.space,t.local,e.call(this,n))}}function ah(t,e){var n,i;function r(){var o=e.apply(this,arguments);return o!==i&&(n=(i=o)&&sh(t,o)),n}return r._value=e,r}function lh(t,e){var n,i;function r(){var o=e.apply(this,arguments);return o!==i&&(n=(i=o)&&oh(t,o)),n}return r._value=e,r}function ch(t,e){var n="attr."+t;if(arguments.length<2)return(n=this.tween(n))&&n._value;if(e==null)return this.tween(n,null);if(typeof e!="function")throw new Error;var i=kn(t);return this.tween(n,(i.local?ah:lh)(i,e))}function uh(t,e){return function(){Mi(this,t).delay=+e.apply(this,arguments)}}function hh(t,e){return e=+e,function(){Mi(this,t).delay=e}}function dh(t){var e=this._id;return arguments.length?this.each((typeof t=="function"?uh:hh)(e,t)):mt(this.node(),e).delay}function fh(t,e){return function(){yt(this,t).duration=+e.apply(this,arguments)}}function ph(t,e){return e=+e,function(){yt(this,t).duration=e}}function mh(t){var e=this._id;return arguments.length?this.each((typeof t=="function"?fh:ph)(e,t)):mt(this.node(),e).duration}function gh(t,e){if(typeof e!="function")throw new Error;return function(){yt(this,t).ease=e}}function vh(t){var e=this._id;return arguments.length?this.each(gh(e,t)):mt(this.node(),e).ease}function bh(t,e){return function(){var n=e.apply(this,arguments);if(typeof n!="function")throw new Error;yt(this,t).ease=n}}function yh(t){if(typeof t!="function")throw new Error;return this.each(bh(this._id,t))}function wh(t){typeof t!="function"&&(t=$o(t));for(var e=this._groups,n=e.length,i=new Array(n),r=0;r<n;++r)for(var o=e[r],s=o.length,a=i[r]=[],l,c=0;c<s;++c)(l=o[c])&&t.call(l,l.__data__,c,o)&&a.push(l);return new kt(i,this._parents,this._name,this._id)}function _h(t){if(t._id!==this._id)throw new Error;for(var e=this._groups,n=t._groups,i=e.length,r=n.length,o=Math.min(i,r),s=new Array(i),a=0;a<o;++a)for(var l=e[a],c=n[a],u=l.length,h=s[a]=new Array(u),d,f=0;f<u;++f)(d=l[f]||c[f])&&(h[f]=d);for(;a<i;++a)s[a]=e[a];return new kt(s,this._parents,this._name,this._id)}function xh(t){return(t+"").trim().split(/^|\s+/).every(function(e){var n=e.indexOf(".");return n>=0&&(e=e.slice(0,n)),!e||e==="start"})}function kh(t,e,n){var i,r,o=xh(e)?Mi:yt;return function(){var s=o(this,t),a=s.on;a!==i&&(r=(i=a).copy()).on(e,n),s.on=r}}function $h(t,e){var n=this._id;return arguments.length<2?mt(this.node(),n).on.on(t):this.each(kh(n,t,e))}function Ch(t){return function(){var e=this.parentNode;for(var n in this.__transition)if(+n!==t)return;e&&e.removeChild(this)}}function Eh(){return this.on("end.remove",Ch(this._id))}function Ah(t){var e=this._name,n=this._id;typeof t!="function"&&(t=Ci(t));for(var i=this._groups,r=i.length,o=new Array(r),s=0;s<r;++s)for(var a=i[s],l=a.length,c=o[s]=new Array(l),u,h,d=0;d<l;++d)(u=a[d])&&(h=t.call(u,u.__data__,d,a))&&("__data__"in u&&(h.__data__=u.__data__),c[d]=h,Cn(c[d],e,n,d,c,mt(u,n)));return new kt(o,this._parents,e,n)}function Sh(t){var e=this._name,n=this._id;typeof t!="function"&&(t=ko(t));for(var i=this._groups,r=i.length,o=[],s=[],a=0;a<r;++a)for(var l=i[a],c=l.length,u,h=0;h<c;++h)if(u=l[h]){for(var d=t.call(u,u.__data__,h,l),f,m=mt(u,n),v=0,y=d.length;v<y;++v)(f=d[v])&&Cn(f,e,n,v,d,m);o.push(d),s.push(u)}return new kt(o,s,e,n)}var Th=Oe.prototype.constructor;function zh(){return new Th(this._groups,this._parents)}function Mh(t,e){var n,i,r;return function(){var o=ne(this,t),s=(this.style.removeProperty(t),ne(this,t));return o===s?null:o===n&&s===i?r:r=e(n=o,i=s)}}function jo(t){return function(){this.style.removeProperty(t)}}function Oh(t,e,n){var i,r=n+"",o;return function(){var s=ne(this,t);return s===r?null:s===i?o:o=e(i=s,n)}}function Lh(t,e,n){var i,r,o;return function(){var s=ne(this,t),a=n(this),l=a+"";return a==null&&(l=a=(this.style.removeProperty(t),ne(this,t))),s===l?null:s===i&&l===r?o:(r=l,o=e(i=s,a))}}function Ph(t,e){var n,i,r,o="style."+e,s="end."+o,a;return function(){var l=yt(this,t),c=l.on,u=l.value[o]==null?a||(a=jo(e)):void 0;(c!==n||r!==u)&&(i=(n=c).copy()).on(s,r=u),l.on=i}}function Ih(t,e,n){var i=(t+="")=="transform"?Bu:Uo;return e==null?this.styleTween(t,Mh(t,i)).on("end.style."+t,jo(t)):typeof e=="function"?this.styleTween(t,Lh(t,i,Oi(this,"style."+t,e))).each(Ph(this._id,t)):this.styleTween(t,Oh(t,i,e),n).on("end.style."+t,null)}function Nh(t,e,n){return function(i){this.style.setProperty(t,e.call(this,i),n)}}function Rh(t,e,n){var i,r;function o(){var s=e.apply(this,arguments);return s!==r&&(i=(r=s)&&Nh(t,s,n)),i}return o._value=e,o}function Bh(t,e,n){var i="style."+(t+="");if(arguments.length<2)return(i=this.tween(i))&&i._value;if(e==null)return this.tween(i,null);if(typeof e!="function")throw new Error;return this.tween(i,Rh(t,e,n??""))}function Dh(t){return function(){this.textContent=t}}function Fh(t){return function(){var e=t(this);this.textContent=e??""}}function Vh(t){return this.tween("text",typeof t=="function"?Fh(Oi(this,"text",t)):Dh(t==null?"":t+""))}function Hh(t){return function(e){this.textContent=t.call(this,e)}}function qh(t){var e,n;function i(){var r=t.apply(this,arguments);return r!==n&&(e=(n=r)&&Hh(r)),e}return i._value=t,i}function Uh(t){var e="text";if(arguments.length<1)return(e=this.tween(e))&&e._value;if(t==null)return this.tween(e,null);if(typeof t!="function")throw new Error;return this.tween(e,qh(t))}function jh(){for(var t=this._name,e=this._id,n=Wo(),i=this._groups,r=i.length,o=0;o<r;++o)for(var s=i[o],a=s.length,l,c=0;c<a;++c)if(l=s[c]){var u=mt(l,e);Cn(l,t,n,c,s,{time:u.time+u.delay+u.duration,delay:0,duration:u.duration,ease:u.ease})}return new kt(i,this._parents,t,n)}function Wh(){var t,e,n=this,i=n._id,r=n.size();return new Promise(function(o,s){var a={value:s},l={value:function(){--r===0&&o()}};n.each(function(){var c=yt(this,i),u=c.on;u!==t&&(e=(t=u).copy(),e._.cancel.push(a),e._.interrupt.push(a),e._.end.push(l)),c.on=e}),r===0&&o()})}var Xh=0;function kt(t,e,n,i){this._groups=t,this._parents=e,this._name=n,this._id=i}function Wo(){return++Xh}var wt=Oe.prototype;kt.prototype={constructor:kt,select:Ah,selectAll:Sh,selectChild:wt.selectChild,selectChildren:wt.selectChildren,filter:wh,merge:_h,selection:zh,transition:jh,call:wt.call,nodes:wt.nodes,node:wt.node,size:wt.size,empty:wt.empty,each:wt.each,on:$h,attr:rh,attrTween:ch,style:Ih,styleTween:Bh,text:Vh,textTween:Uh,remove:Eh,tween:Zu,delay:dh,duration:mh,ease:vh,easeVarying:yh,end:Wh,[Symbol.iterator]:wt[Symbol.iterator]};function Yh(t){return((t*=2)<=1?t*t*t:(t-=2)*t*t+2)/2}var Kh={time:null,delay:0,duration:250,ease:Yh};function Gh(t,e){for(var n;!(n=t.__transition)||!(n=n[e]);)if(!(t=t.parentNode))throw new Error(`transition ${e} not found`);return n}function Zh(t){var e,n;t instanceof kt?(e=t._id,t=t._name):(e=Wo(),(n=Kh).time=zi(),t=t==null?null:t+"");for(var i=this._groups,r=i.length,o=0;o<r;++o)for(var s=i[o],a=s.length,l,c=0;c<a;++c)(l=s[c])&&Cn(l,t,e,c,s,n||Gh(l,e));return new kt(i,this._parents,t,e)}Oe.prototype.interrupt=Yu;Oe.prototype.transition=Zh;function Jh(t){return Math.abs(t=Math.round(t))>=1e21?t.toLocaleString("en").replace(/,/g,""):t.toString(10)}function un(t,e){if(!isFinite(t)||t===0)return null;var n=(t=e?t.toExponential(e-1):t.toExponential()).indexOf("e"),i=t.slice(0,n);return[i.length>1?i[0]+i.slice(2):i,+t.slice(n+1)]}function re(t){return t=un(Math.abs(t)),t?t[1]:NaN}function Qh(t,e){return function(n,i){for(var r=n.length,o=[],s=0,a=t[0],l=0;r>0&&a>0&&(l+a+1>i&&(a=Math.max(1,i-l)),o.push(n.substring(r-=a,r+a)),!((l+=a+1)>i));)a=t[s=(s+1)%t.length];return o.reverse().join(e)}}function td(t){return function(e){return e.replace(/[0-9]/g,function(n){return t[+n]})}}var ed=/^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;function hn(t){if(!(e=ed.exec(t)))throw new Error("invalid format: "+t);var e;return new Li({fill:e[1],align:e[2],sign:e[3],symbol:e[4],zero:e[5],width:e[6],comma:e[7],precision:e[8]&&e[8].slice(1),trim:e[9],type:e[10]})}hn.prototype=Li.prototype;function Li(t){this.fill=t.fill===void 0?" ":t.fill+"",this.align=t.align===void 0?">":t.align+"",this.sign=t.sign===void 0?"-":t.sign+"",this.symbol=t.symbol===void 0?"":t.symbol+"",this.zero=!!t.zero,this.width=t.width===void 0?void 0:+t.width,this.comma=!!t.comma,this.precision=t.precision===void 0?void 0:+t.precision,this.trim=!!t.trim,this.type=t.type===void 0?"":t.type+""}Li.prototype.toString=function(){return this.fill+this.align+this.sign+this.symbol+(this.zero?"0":"")+(this.width===void 0?"":Math.max(1,this.width|0))+(this.comma?",":"")+(this.precision===void 0?"":"."+Math.max(0,this.precision|0))+(this.trim?"~":"")+this.type};function nd(t){t:for(var e=t.length,n=1,i=-1,r;n<e;++n)switch(t[n]){case".":i=r=n;break;case"0":i===0&&(i=n),r=n;break;default:if(!+t[n])break t;i>0&&(i=0);break}return i>0?t.slice(0,i)+t.slice(r+1):t}var dn;function id(t,e){var n=un(t,e);if(!n)return dn=void 0,t.toPrecision(e);var i=n[0],r=n[1],o=r-(dn=Math.max(-8,Math.min(8,Math.floor(r/3)))*3)+1,s=i.length;return o===s?i:o>s?i+new Array(o-s+1).join("0"):o>0?i.slice(0,o)+"."+i.slice(o):"0."+new Array(1-o).join("0")+un(t,Math.max(0,e+o-1))[0]}function Pr(t,e){var n=un(t,e);if(!n)return t+"";var i=n[0],r=n[1];return r<0?"0."+new Array(-r).join("0")+i:i.length>r+1?i.slice(0,r+1)+"."+i.slice(r+1):i+new Array(r-i.length+2).join("0")}const Ir={"%":(t,e)=>(t*100).toFixed(e),b:t=>Math.round(t).toString(2),c:t=>t+"",d:Jh,e:(t,e)=>t.toExponential(e),f:(t,e)=>t.toFixed(e),g:(t,e)=>t.toPrecision(e),o:t=>Math.round(t).toString(8),p:(t,e)=>Pr(t*100,e),r:Pr,s:id,X:t=>Math.round(t).toString(16).toUpperCase(),x:t=>Math.round(t).toString(16)};function Nr(t){return t}var Rr=Array.prototype.map,Br=["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];function rd(t){var e=t.grouping===void 0||t.thousands===void 0?Nr:Qh(Rr.call(t.grouping,Number),t.thousands+""),n=t.currency===void 0?"":t.currency[0]+"",i=t.currency===void 0?"":t.currency[1]+"",r=t.decimal===void 0?".":t.decimal+"",o=t.numerals===void 0?Nr:td(Rr.call(t.numerals,String)),s=t.percent===void 0?"%":t.percent+"",a=t.minus===void 0?"−":t.minus+"",l=t.nan===void 0?"NaN":t.nan+"";function c(h,d){h=hn(h);var f=h.fill,m=h.align,v=h.sign,y=h.symbol,w=h.zero,_=h.width,k=h.comma,E=h.precision,T=h.trim,C=h.type;C==="n"?(k=!0,C="g"):Ir[C]||(E===void 0&&(E=12),T=!0,C="g"),(w||f==="0"&&m==="=")&&(w=!0,f="0",m="=");var z=(d&&d.prefix!==void 0?d.prefix:"")+(y==="$"?n:y==="#"&&/[boxX]/.test(C)?"0"+C.toLowerCase():""),X=(y==="$"?i:/[%p]/.test(C)?s:"")+(d&&d.suffix!==void 0?d.suffix:""),V=Ir[C],D=/[defgprs%]/.test(C);E=E===void 0?6:/[gprs]/.test(C)?Math.max(1,Math.min(21,E)):Math.max(0,Math.min(20,E));function j(b){var R=z,M=X,x,O,I;if(C==="c")M=V(b)+M,b="";else{b=+b;var H=b<0||1/b<0;if(b=isNaN(b)?l:V(Math.abs(b),E),T&&(b=nd(b)),H&&+b==0&&v!=="+"&&(H=!1),R=(H?v==="("?v:a:v==="-"||v==="("?"":v)+R,M=(C==="s"&&!isNaN(b)&&dn!==void 0?Br[8+dn/3]:"")+M+(H&&v==="("?")":""),D){for(x=-1,O=b.length;++x<O;)if(I=b.charCodeAt(x),48>I||I>57){M=(I===46?r+b.slice(x+1):b.slice(x))+M,b=b.slice(0,x);break}}}k&&!w&&(b=e(b,1/0));var K=R.length+b.length+M.length,Q=K<_?new Array(_-K+1).join(f):"";switch(k&&w&&(b=e(Q+b,Q.length?_-M.length:1/0),Q=""),m){case"<":b=R+b+M+Q;break;case"=":b=R+Q+b+M;break;case"^":b=Q.slice(0,K=Q.length>>1)+R+b+M+Q.slice(K);break;default:b=Q+R+b+M;break}return o(b)}return j.toString=function(){return h+""},j}function u(h,d){var f=Math.max(-8,Math.min(8,Math.floor(re(d)/3)))*3,m=Math.pow(10,-f),v=c((h=hn(h),h.type="f",h),{suffix:Br[8+f/3]});return function(y){return v(m*y)}}return{format:c,formatPrefix:u}}var Fe,Xo,Yo;od({thousands:",",grouping:[3],currency:["$",""]});function od(t){return Fe=rd(t),Xo=Fe.format,Yo=Fe.formatPrefix,Fe}function sd(t){return Math.max(0,-re(Math.abs(t)))}function ad(t,e){return Math.max(0,Math.max(-8,Math.min(8,Math.floor(re(e)/3)))*3-re(Math.abs(t)))}function ld(t,e){return t=Math.abs(t),e=Math.abs(e)-t,Math.max(0,re(e)-re(t))+1}function Pi(t,e){switch(arguments.length){case 0:break;case 1:this.range(t);break;default:this.range(e).domain(t);break}return this}const Dr=Symbol("implicit");function Ko(){var t=new mr,e=[],n=[],i=Dr;function r(o){let s=t.get(o);if(s===void 0){if(i!==Dr)return i;t.set(o,s=e.push(o)-1)}return n[s%n.length]}return r.domain=function(o){if(!arguments.length)return e.slice();e=[],t=new mr;for(const s of o)t.has(s)||t.set(s,e.push(s)-1);return r},r.range=function(o){return arguments.length?(n=Array.from(o),r):n.slice()},r.unknown=function(o){return arguments.length?(i=o,r):i},r.copy=function(){return Ko(e,n).unknown(i)},Pi.apply(r,arguments),r}function Go(){var t=Ko().unknown(void 0),e=t.domain,n=t.range,i=0,r=1,o,s,a=!1,l=0,c=0,u=.5;delete t.unknown;function h(){var d=e().length,f=r<i,m=f?r:i,v=f?i:r;o=(v-m)/Math.max(1,d-l+c*2),a&&(o=Math.floor(o)),m+=(v-m-o*(d-l))*u,s=o*(1-l),a&&(m=Math.round(m),s=Math.round(s));var y=$l(d).map(function(w){return m+o*w});return n(f?y.reverse():y)}return t.domain=function(d){return arguments.length?(e(d),h()):e()},t.range=function(d){return arguments.length?([i,r]=d,i=+i,r=+r,h()):[i,r]},t.rangeRound=function(d){return[i,r]=d,i=+i,r=+r,a=!0,h()},t.bandwidth=function(){return s},t.step=function(){return o},t.round=function(d){return arguments.length?(a=!!d,h()):a},t.padding=function(d){return arguments.length?(l=Math.min(1,c=+d),h()):l},t.paddingInner=function(d){return arguments.length?(l=Math.min(1,d),h()):l},t.paddingOuter=function(d){return arguments.length?(c=+d,h()):c},t.align=function(d){return arguments.length?(u=Math.max(0,Math.min(1,d)),h()):u},t.copy=function(){return Go(e(),[i,r]).round(a).paddingInner(l).paddingOuter(c).align(u)},Pi.apply(h(),arguments)}function cd(t){return function(){return t}}function ud(t){return+t}var Fr=[0,1];function Gt(t){return t}function ci(t,e){return(e-=t=+t)?function(n){return(n-t)/e}:cd(isNaN(e)?NaN:.5)}function hd(t,e){var n;return t>e&&(n=t,t=e,e=n),function(i){return Math.max(t,Math.min(e,i))}}function dd(t,e,n){var i=t[0],r=t[1],o=e[0],s=e[1];return r<i?(i=ci(r,i),o=n(s,o)):(i=ci(i,r),o=n(o,s)),function(a){return o(i(a))}}function fd(t,e,n){var i=Math.min(t.length,e.length)-1,r=new Array(i),o=new Array(i),s=-1;for(t[i]<t[0]&&(t=t.slice().reverse(),e=e.slice().reverse());++s<i;)r[s]=ci(t[s],t[s+1]),o[s]=n(e[s],e[s+1]);return function(a){var l=fl(t,a,1,i)-1;return o[l](r[l](a))}}function pd(t,e){return e.domain(t.domain()).range(t.range()).interpolate(t.interpolate()).clamp(t.clamp()).unknown(t.unknown())}function md(){var t=Fr,e=Fr,n=Ti,i,r,o,s=Gt,a,l,c;function u(){var d=Math.min(t.length,e.length);return s!==Gt&&(s=hd(t[0],t[d-1])),a=d>2?fd:dd,l=c=null,h}function h(d){return d==null||isNaN(d=+d)?o:(l||(l=a(t.map(i),e,n)))(i(s(d)))}return h.invert=function(d){return s(r((c||(c=a(e,t.map(i),ut)))(d)))},h.domain=function(d){return arguments.length?(t=Array.from(d,ud),u()):t.slice()},h.range=function(d){return arguments.length?(e=Array.from(d),u()):e.slice()},h.rangeRound=function(d){return e=Array.from(d),n=Iu,u()},h.clamp=function(d){return arguments.length?(s=d?!0:Gt,u()):s!==Gt},h.interpolate=function(d){return arguments.length?(n=d,u()):n},h.unknown=function(d){return arguments.length?(o=d,h):o},function(d,f){return i=d,r=f,u()}}function gd(){return md()(Gt,Gt)}function vd(t,e,n,i){var r=_l(t,e,n),o;switch(i=hn(i??",f"),i.type){case"s":{var s=Math.max(Math.abs(t),Math.abs(e));return i.precision==null&&!isNaN(o=ad(r,s))&&(i.precision=o),Yo(i,s)}case"":case"e":case"g":case"p":case"r":{i.precision==null&&!isNaN(o=ld(r,Math.max(Math.abs(t),Math.abs(e))))&&(i.precision=o-(i.type==="e"));break}case"f":case"%":{i.precision==null&&!isNaN(o=sd(r))&&(i.precision=o-(i.type==="%")*2);break}}return Xo(i)}function bd(t){var e=t.domain;return t.ticks=function(n){var i=e();return wl(i[0],i[i.length-1],n??10)},t.tickFormat=function(n,i){var r=e();return vd(r[0],r[r.length-1],n??10,i)},t.nice=function(n){n==null&&(n=10);var i=e(),r=0,o=i.length-1,s=i[r],a=i[o],l,c,u=10;for(a<s&&(c=s,s=a,a=c,c=r,r=o,o=c);u-- >0;){if(c=ti(s,a,n),c===l)return i[r]=s,i[o]=a,e(i);if(c>0)s=Math.floor(s/c)*c,a=Math.ceil(a/c)*c;else if(c<0)s=Math.ceil(s*c)/c,a=Math.floor(a*c)/c;else break;l=c}return t},t}function Zo(){var t=gd();return t.copy=function(){return pd(t,Zo())},Pi.apply(t,arguments),bd(t)}function Ii(t){for(var e=t.length/6|0,n=new Array(e),i=0;i<e;)n[i]="#"+t.slice(i*6,++i*6);return n}const yd=Ii("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928"),wd=Ii("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f"),_d=Ii("4e79a7f28e2ce1575976b7b259a14fedc949af7aa1ff9da79c755fbab0ab");function ye(t,e,n){this.k=t,this.x=e,this.y=n}ye.prototype={constructor:ye,scale:function(t){return t===1?this:new ye(this.k*t,this.x,this.y)},translate:function(t,e){return t===0&e===0?this:new ye(this.k,this.x+this.k*t,this.y+this.k*e)},apply:function(t){return[t[0]*this.k+this.x,t[1]*this.k+this.y]},applyX:function(t){return t*this.k+this.x},applyY:function(t){return t*this.k+this.y},invert:function(t){return[(t[0]-this.x)/this.k,(t[1]-this.y)/this.k]},invertX:function(t){return(t-this.x)/this.k},invertY:function(t){return(t-this.y)/this.k},rescaleX:function(t){return t.copy().domain(t.range().map(this.invertX,this).map(t.invert,t))},rescaleY:function(t){return t.copy().domain(t.range().map(this.invertY,this).map(t.invert,t))},toString:function(){return"translate("+this.x+","+this.y+") scale("+this.k+")"}};ye.prototype;const ui={biber:{label:"Biber (padrão)",fn:(t,e)=>{const n=e==="Effect_Size";return t.map(i=>n?i[e]>=0?"#e07b39":"#5b9cf6":"#e07b39")}},tableau:{label:"Tableau (10 cores)",fn:t=>t.map((e,n)=>_d[n%10])},pastel:{label:"Pastel (Set3)",fn:t=>t.map((e,n)=>wd[n%12])},paired:{label:"Pareado",fn:t=>t.map((e,n)=>yd[n%12])},vivid:{label:"Vívido",fn:t=>{const e=["#e63946","#f4a261","#2a9d8f","#457b9d","#e9c46a","#6a4c93","#1982c4","#8ac926","#ff595e","#ffca3a","#9b5de5","#52b788"];return t.map((n,i)=>e[i%e.length])}},accessible:{label:"Acessível (Okabe-Ito)",fn:t=>{const e=["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#555555"];return t.map((n,i)=>e[i%e.length])}}};function xd(t,e,{metric:n,barHeight:i,c1:r="",c2:o="",palette:s="biber",tagDefs:a={}}){if(t.innerHTML="",!e||e.length===0)return;const l=document.createElement("div");l.className="chart-tooltip",t.appendChild(l);function c(x,O){const I=a[O.Feature];if(!I)return;const H=typeof O[n]=="number"?Number.isInteger(O[n])?O[n]:O[n].toFixed(3):O[n];l.innerHTML=`<strong>${O.Feature}</strong>: ${I}<br><span class="tip-val">${n.replace(/_/g," ")}: ${H}</span>`,l.style.display="block",u(x)}function u(x){const O=t.getBoundingClientRect(),I=x.clientX-O.left,H=x.clientY-O.top,K=l.offsetWidth||260,Q=I+14+K>O.width?I-K-8:I+14;l.style.left=Q+"px",l.style.top=H-10+"px"}function h(){l.style.display="none"}const d=(ui[s]??ui.biber).fn(e,n),f=n==="Effect_Size",m={top:6,right:28,bottom:32,left:170},v=Math.max(t.getBoundingClientRect().width||600,320),y=v-m.left-m.right,w=i+4,_=e.length*w,k=_+m.top+m.bottom,T=Vn(t).append("svg").attr("width",v).attr("height",k).style("display","block").style("overflow","visible").append("g").attr("transform",`translate(${m.left},${m.top})`),C=e.map(x=>x[n]),z=kl(C)??0,X=xl(C)??1,V=f?Math.min(z,0):0,D=Math.max(X,0),j=Math.max((D-V)*.04,.02),b=Zo().domain([V-j,D+j]).range([0,y]),R=Go().domain(e.map(x=>x.Feature)).range([0,_]).padding(.18);T.append("g").attr("class","grid").attr("transform",`translate(0,${_})`).call(br(b).ticks(6).tickSize(-_).tickFormat("")).call(x=>x.select(".domain").remove()).call(x=>x.selectAll("line").attr("stroke","#363b4a").attr("stroke-dasharray","3,3")),T.selectAll(".bar").data(e).join("rect").attr("class","bar").attr("x",x=>b(Math.min(0,x[n]))).attr("y",x=>R(x.Feature)).attr("width",x=>Math.max(0,Math.abs(b(x[n])-b(0)))).attr("height",R.bandwidth()).attr("fill",(x,O)=>d[O]).attr("rx",3).attr("opacity",.88).style("cursor",x=>a[x.Feature]?"help":"default").on("mouseover",(x,O)=>{c(x,O),Vn(x.currentTarget).attr("opacity",1)}).on("mousemove",x=>{u(x)}).on("mouseout",x=>{h(),Vn(x.currentTarget).attr("opacity",.88)}),(V<0||f&&X>0&&z<0)&&T.append("line").attr("x1",b(0)).attr("x2",b(0)).attr("y1",0).attr("y2",_).attr("stroke","#5a6070").attr("stroke-width",1.5),T.append("g").attr("transform",`translate(0,${_})`).call(br(b).ticks(6).tickSize(4)).call(x=>x.select(".domain").attr("stroke","#363b4a")).call(x=>x.selectAll("text").attr("fill","#8892a4").attr("font-size","11px")).call(x=>x.selectAll("line").attr("stroke","#363b4a"));const M=T.append("g").call(Ml(R).tickSize(3)).call(x=>x.select(".domain").attr("stroke","#363b4a")).call(x=>x.selectAll("line").attr("stroke","#363b4a"));M.selectAll(".tick text").attr("fill","#e2e6f0").attr("font-size","11px").attr("dy","0.32em"),M.selectAll(".tick").style("cursor",x=>a[x]?"help":"default").on("mouseover",(x,O)=>{const I=e.find(H=>H.Feature===O);I&&c(x,I)}).on("mousemove",x=>u(x)).on("mouseout",()=>h())}const kd=[{key:"Feature",label:()=>"Feature"},{key:"Effect_Size",label:()=>"Effect size (d)"},{key:"Mean_Corpus1",label:()=>`Média ${$.kfaC1}`},{key:"Mean_Corpus2",label:()=>`Média ${$.kfaC2}`},{key:"Std_Corpus1",label:()=>`DP ${$.kfaC1}`},{key:"Std_Corpus2",label:()=>`DP ${$.kfaC2}`},{key:"N_Corpus1",label:()=>`N ${$.kfaC1}`},{key:"N_Corpus2",label:()=>`N ${$.kfaC2}`}];function Jo(){if(!$.kfaData)return[];let t=$.kfaData.results.slice();return $.filter&&(t=t.filter(e=>e.Feature.toLowerCase().includes($.filter))),t.sort((e,n)=>{const i=e[$.sortCol],r=n[$.sortCol];return typeof i=="string"?$.sortDir*i.localeCompare(r):$.sortDir*(i-r)}),t}function Nt(){const t=document.getElementById("chart-wrapper");xd(t,Jo(),{metric:$.chartMetric,barHeight:$.barHeight,c1:$.kfaC1,c2:$.kfaC2,palette:$.palette,tagDefs:$.tagDefs})}function Ni(){document.getElementById("table-container").classList.remove("hidden");const t=document.querySelector("#kfa-table thead tr");t.innerHTML=kd.map(n=>`<th class="${n.key===$.sortCol?$.sortDir===-1?"sort-desc":"sort-asc":""}" data-col="${n.key}">${n.label()}</th>`).join(""),t.querySelectorAll("th").forEach(n=>{n.addEventListener("click",()=>{const i=n.dataset.col;$.sortCol===i?$.sortDir*=-1:($.sortCol=i,$.sortDir=i==="Feature"?1:-1),Ni(),Nt()})});const e=Jo();document.querySelector("#kfa-table tbody").innerHTML=e.map(n=>{const i=n.Effect_Size>=0?"effect-positive":"effect-negative",r=$.tagDefs[n.Feature];return`<tr>
      <td${r?` title="${r.replace(/"/g,"'")}"`:""}>${n.Feature}</td>
      <td class="${i}">${n.Effect_Size.toFixed(3)}</td>
      <td>${n.Mean_Corpus1.toFixed(3)}</td>
      <td>${n.Mean_Corpus2.toFixed(3)}</td>
      <td>${n.Std_Corpus1.toFixed(3)}</td>
      <td>${n.Std_Corpus2.toFixed(3)}</td>
      <td>${n.N_Corpus1}</td>
      <td>${n.N_Corpus2}</td>
    </tr>`}).join("")}function $d(){document.getElementById("chart-container").classList.remove("hidden"),Nt(),Ni()}async function Cd(){try{const{kfa_results:t}=await W.analysis.listKfa(),e=document.getElementById("results-kfa-select");if(e.innerHTML="",t.forEach(n=>{const i=document.createElement("sl-option");i.value=JSON.stringify({c1:n.corpus1_name,c2:n.corpus2_name,d:n.min_effect,join:n.join_method}),i.textContent=`${n.corpus1_name} vs ${n.corpus2_name}  (d≥${n.min_effect}, ${n.join_method})`,e.appendChild(i)}),t.length===1){const n=e.querySelector("sl-option");n&&(e.value=n.value)}}catch{}}function Ed(){var r,o,s,a,l;const t=document.getElementById("chart-palette");Object.entries(ui).forEach(([c,{label:u}])=>{const h=document.createElement("sl-option");h.value=c,h.textContent=u,t.appendChild(h)}),t.value=$.palette,(r=document.getElementById("btn-load-result"))==null||r.addEventListener("click",async()=>{const c=document.getElementById("results-kfa-select");if(!c.value){P("Selecione uma KFA.","error");return}const{c1:u,c2:h,d,join:f}=JSON.parse(c.value);try{const m=await W.analysis.getKfa(u,h,d,f);$.kfaData=m,$.kfaC1=u,$.kfaC2=h,$.sortCol="Effect_Size",$.sortDir=-1,$.filter="",$.chartMetric="Effect_Size",document.getElementById("results-filter").value="",document.getElementById("chart-metric").value="Effect_Size",$d()}catch(m){P(m.message,"error")}}),(o=document.getElementById("results-filter"))==null||o.addEventListener("sl-input",c=>{$.filter=c.target.value.trim().toLowerCase(),$.kfaData&&(Ni(),Nt())}),(s=document.getElementById("chart-metric"))==null||s.addEventListener("sl-change",c=>{$.chartMetric=c.target.value,$.kfaData&&Nt()}),(a=document.getElementById("chart-thickness"))==null||a.addEventListener("sl-input",c=>{$.barHeight=parseInt(c.target.value,10);const u=document.getElementById("chart-thickness-val");u&&(u.textContent=$.barHeight),$.kfaData&&Nt()}),(l=document.getElementById("chart-palette"))==null||l.addEventListener("sl-change",c=>{$.palette=c.target.value,$.kfaData&&Nt()});const e=document.getElementById("chart-container");let n=0;new ResizeObserver(c=>{const u=c[0].contentRect.width;Math.abs(u-n)>2&&(n=u,$.kfaData&&Nt())}).observe(e)}jn("/shoelace");const En={loadCorpusList:tn,refreshCorpusSelects:Jn,refreshKfaSelect:Cd};Qa();el(En);rl(En);ol();al();ll(En);Ed();document.addEventListener("project-changed",()=>$i());nl(En);W.tags.list().then(t=>{Array.isArray(t)&&($.tagDefs=Object.fromEntries(t.map(e=>[e.tag,e.definition])))}).catch(()=>{});
