import{r as s,V as h,j as M,x as z,i as W}from"./index-Cto6lVBL.js";import{o as H,a as C}from"./IFrameUtil-8kJzIdKx-FXQ6T7jG-DvnUntCs.js";const L=z("iframe",{target:"e1u6k47s0"})(({theme:e,disableScrolling:r,width:d,height:i})=>({width:d??"100%",height:i??"100%",colorScheme:"normal",border:"none",padding:e.spacing.none,margin:e.spacing.none,overflow:r?"hidden":void 0}),""),y="streamlit:iframe:setSize",N="25rem",O=`<script>
(function() {
  var lastW = 0, lastH = 0;
  function sendSize() {
    // Guard against malformed HTML (e.g., <frameset>) or script running before body init
    if (!document.body) return;
    // Use getBoundingClientRect for accurate fractional pixel measurement,
    // then ceil to avoid scrollbars from sub-pixel rounding
    var rect = document.body.getBoundingClientRect();
    var w = Math.ceil(Math.max(
      rect.width,
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    ));
    var h = Math.ceil(Math.max(
      rect.height,
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ));
    if (w !== lastW || h !== lastH) {
      lastW = w; lastH = h;
      // Note: postMessage with '*' broadcasts to any origin, but this is safe because:
      // 1. This script only runs inside srcdoc (same-origin, sandboxed)
      // 2. The payload is just dimension integers
      // 3. The frontend receiver validates event.source === iframe.contentWindow
      window.parent.postMessage({type: '${y}', width: w, height: h}, '*');
    }
  }
  // Send initial size after DOM is ready
  if (document.readyState === 'complete') {
    sendSize();
  } else {
    window.addEventListener('load', sendSize);
  }
  // Re-measure on DOM changes
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(sendSize).observe(document.body, {
      childList: true, subtree: true, attributes: true, characterData: true
    });
  }
  // Re-measure on resize and image/font loading
  window.addEventListener('resize', sendSize);
  document.addEventListener('load', sendSize, true);
})();
<\/script>`;function R(e){return e+O}function v(e){return W(e)||e===""?void 0:e}function $({element:e,widthConfig:r,heightConfig:d}){const i=v(e.src),a=h(i)?void 0:v(e.srcdoc),m=s.useRef(null),[o,x]=s.useState({width:null,height:null}),f=r?.useContent??!1,g=d?.useContent??!1,n=h(a)&&(f||g),S=n?R(a):a;s.useEffect(()=>{if(!n)return;const w=l=>{if(l.source&&l.source===m.current?.contentWindow){const t=l.data;if(t?.type===y&&typeof t?.width=="number"&&typeof t?.height=="number"&&Number.isFinite(t.width)&&Number.isFinite(t.height)&&t.width>=0&&t.height>=0){const b=t.width,p=t.height;x(u=>u.width===b&&u.height===p?u:{width:b,height:p})}}};return window.addEventListener("message",w),()=>{window.removeEventListener("message",w)}},[n]);const E=n&&f&&o.width!==null?`${o.width}px`:void 0;let c;return g&&(n&&o.height!==null?c=`${o.height}px`:h(i)&&(c=N)),M.jsx(L,{ref:m,className:"stIFrame","data-testid":"stIFrame",allow:C,disableScrolling:!e.scrolling,src:i,srcDoc:S,scrolling:e.scrolling?"auto":"no",sandbox:H,title:"st.iframe",tabIndex:e.tabIndex??void 0,width:E,height:c})}const D=s.memo($);export{D as default};
