var _JUPYTERLAB;(()=>{"use strict";var e,r,t,n,i,o,a,u,l,s,p,f,d,h,c,v,m={39:(e,r,t)=>{var n={"./index":()=>t.e(568).then((()=>()=>t(568))),"./extension":()=>t.e(568).then((()=>()=>t(568)))},i=(e,r)=>(t.R=r,r=t.o(n,e)?n[e]():Promise.resolve().then((()=>{throw new Error('Module "'+e+'" does not exist in container.')})),t.R=void 0,r),o=(e,r)=>{if(t.S){var n="default",i=t.S[n];if(i&&i!==e)throw new Error("Container initialization failed as it has already been initialized with a different share scope");return t.S[n]=e,t.I(n,r)}};t.d(r,{get:()=>i,init:()=>o})}},g={};function b(e){var r=g[e];if(void 0!==r)return r.exports;var t=g[e]={exports:{}};return m[e](t,t.exports,b),t.exports}b.m=m,b.c=g,b.d=(e,r)=>{for(var t in r)b.o(r,t)&&!b.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:r[t]})},b.f={},b.e=e=>Promise.all(Object.keys(b.f).reduce(((r,t)=>(b.f[t](e,r),r)),[])),b.u=e=>e+".266d1e04caf5449102d7.js?v=266d1e04caf5449102d7",b.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),b.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),e={},r="@timkpaine/jupyterlab_miami_nights:",b.l=(t,n,i,o)=>{if(e[t])e[t].push(n);else{var a,u;if(void 0!==i)for(var l=document.getElementsByTagName("script"),s=0;s<l.length;s++){var p=l[s];if(p.getAttribute("src")==t||p.getAttribute("data-webpack")==r+i){a=p;break}}a||(u=!0,(a=document.createElement("script")).charset="utf-8",a.timeout=120,b.nc&&a.setAttribute("nonce",b.nc),a.setAttribute("data-webpack",r+i),a.src=t),e[t]=[n];var f=(r,n)=>{a.onerror=a.onload=null,clearTimeout(d);var i=e[t];if(delete e[t],a.parentNode&&a.parentNode.removeChild(a),i&&i.forEach((e=>e(n))),r)return r(n)},d=setTimeout(f.bind(null,void 0,{type:"timeout",target:a}),12e4);a.onerror=f.bind(null,a.onerror),a.onload=f.bind(null,a.onload),u&&document.head.appendChild(a)}},(()=>{b.S={};var e={},r={};b.I=(t,n)=>{n||(n=[]);var i=r[t];if(i||(i=r[t]={}),!(n.indexOf(i)>=0)){if(n.push(i),e[t])return e[t];b.o(b.S,t)||(b.S[t]={});var o=b.S[t],a="@timkpaine/jupyterlab_miami_nights",u=[];return"default"===t&&((e,r,t,n)=>{var i=o[e]=o[e]||{},u=i[r];(!u||!u.loaded&&(1!=!u.eager?n:a>u.from))&&(i[r]={get:()=>b.e(568).then((()=>()=>b(568))),from:a,eager:!1})})("@timkpaine/jupyterlab_miami_nights","0.4.2"),e[t]=u.length?Promise.all(u).then((()=>e[t]=1)):1}}})(),(()=>{var e;b.g.importScripts&&(e=b.g.location+"");var r=b.g.document;if(!e&&r&&(r.currentScript&&(e=r.currentScript.src),!e)){var t=r.getElementsByTagName("script");if(t.length)for(var n=t.length-1;n>-1&&!e;)e=t[n--].src}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),b.p=e})(),t=e=>{var r=e=>e.split(".").map((e=>+e==e?+e:e)),t=/^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(e),n=t[1]?r(t[1]):[];return t[2]&&(n.length++,n.push.apply(n,r(t[2]))),t[3]&&(n.push([]),n.push.apply(n,r(t[3]))),n},n=(e,r)=>{e=t(e),r=t(r);for(var n=0;;){if(n>=e.length)return n<r.length&&"u"!=(typeof r[n])[0];var i=e[n],o=(typeof i)[0];if(n>=r.length)return"u"==o;var a=r[n],u=(typeof a)[0];if(o!=u)return"o"==o&&"n"==u||"s"==u||"u"==o;if("o"!=o&&"u"!=o&&i!=a)return i<a;n++}},i=e=>{var r=e[0],t="";if(1===e.length)return"*";if(r+.5){t+=0==r?">=":-1==r?"<":1==r?"^":2==r?"~":r>0?"=":"!=";for(var n=1,o=1;o<e.length;o++)n--,t+="u"==(typeof(u=e[o]))[0]?"-":(n>0?".":"")+(n=2,u);return t}var a=[];for(o=1;o<e.length;o++){var u=e[o];a.push(0===u?"not("+l()+")":1===u?"("+l()+" || "+l()+")":2===u?a.pop()+" "+a.pop():i(u))}return l();function l(){return a.pop().replace(/^\((.+)\)$/,"$1")}},o=(e,r)=>{if(0 in e){r=t(r);var n=e[0],i=n<0;i&&(n=-n-1);for(var a=0,u=1,l=!0;;u++,a++){var s,p,f=u<e.length?(typeof e[u])[0]:"";if(a>=r.length||"o"==(p=(typeof(s=r[a]))[0]))return!l||("u"==f?u>n&&!i:""==f!=i);if("u"==p){if(!l||"u"!=f)return!1}else if(l)if(f==p)if(u<=n){if(s!=e[u])return!1}else{if(i?s>e[u]:s<e[u])return!1;s!=e[u]&&(l=!1)}else if("s"!=f&&"n"!=f){if(i||u<=n)return!1;l=!1,u--}else{if(u<=n||p<f!=i)return!1;l=!1}else"s"!=f&&"n"!=f&&(l=!1,u--)}}var d=[],h=d.pop.bind(d);for(a=1;a<e.length;a++){var c=e[a];d.push(1==c?h()|h():2==c?h()&h():c?o(c,r):!h())}return!!h()},a=(e,r)=>{var t=b.S[e];if(!t||!b.o(t,r))throw new Error("Shared module "+r+" doesn't exist in shared scope "+e);return t},u=(e,r)=>{var t=e[r];return Object.keys(t).reduce(((e,r)=>!e||!t[e].loaded&&n(e,r)?r:e),0)},l=(e,r,t,n)=>"Unsatisfied version "+t+" from "+(t&&e[r][t].from)+" of shared singleton module "+r+" (required "+i(n)+")",s=(e,r,t,n)=>{var i=u(e,t);return o(n,i)||p(l(e,t,i,n)),f(e[t][i])},p=e=>{"undefined"!=typeof console&&console.warn&&console.warn(e)},f=e=>(e.loaded=1,e.get()),d=(e=>function(r,t,n,i){var o=b.I(r);return o&&o.then?o.then(e.bind(e,r,b.S[r],t,n,i)):e(r,b.S[r],t,n)})(((e,r,t,n)=>(a(e,t),s(r,0,t,n)))),h={},c={510:()=>d("default","@jupyterlab/apputils",[1,4,2,5])},v={568:[510]},b.f.consumes=(e,r)=>{b.o(v,e)&&v[e].forEach((e=>{if(b.o(h,e))return r.push(h[e]);var t=r=>{h[e]=0,b.m[e]=t=>{delete b.c[e],t.exports=r()}},n=r=>{delete h[e],b.m[e]=t=>{throw delete b.c[e],r}};try{var i=c[e]();i.then?r.push(h[e]=i.then(t).catch(n)):t(i)}catch(e){n(e)}}))},(()=>{var e={69:0};b.f.j=(r,t)=>{var n=b.o(e,r)?e[r]:void 0;if(0!==n)if(n)t.push(n[2]);else{var i=new Promise(((t,i)=>n=e[r]=[t,i]));t.push(n[2]=i);var o=b.p+b.u(r),a=new Error;b.l(o,(t=>{if(b.o(e,r)&&(0!==(n=e[r])&&(e[r]=void 0),n)){var i=t&&("load"===t.type?"missing":t.type),o=t&&t.target&&t.target.src;a.message="Loading chunk "+r+" failed.\n("+i+": "+o+")",a.name="ChunkLoadError",a.type=i,a.request=o,n[1](a)}}),"chunk-"+r,r)}};var r=(r,t)=>{var n,i,[o,a,u]=t,l=0;if(o.some((r=>0!==e[r]))){for(n in a)b.o(a,n)&&(b.m[n]=a[n]);u&&u(b)}for(r&&r(t);l<o.length;l++)i=o[l],b.o(e,i)&&e[i]&&e[i][0](),e[i]=0},t=self.webpackChunk_timkpaine_jupyterlab_miami_nights=self.webpackChunk_timkpaine_jupyterlab_miami_nights||[];t.forEach(r.bind(null,0)),t.push=r.bind(null,t.push.bind(t))})();var y=b(39);(_JUPYTERLAB=void 0===_JUPYTERLAB?{}:_JUPYTERLAB)["@timkpaine/jupyterlab_miami_nights"]=y})();