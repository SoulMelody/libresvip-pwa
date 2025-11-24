import{j as c,dl as d,c as g,k as h,dm as p}from"./index-B_CN4CJH.js";const y=h`
  50% {
    color: rgba(0, 0, 0, 0);
  }
`,$=g("span",{target:"edlqvik0"})(({includeDot:e,shouldBlink:n,theme:t})=>({...e?{"&::before":{opacity:1,content:'"•"',animation:"none",color:t.colors.grayTextColor,margin:`0 ${t.spacing.twoXS}`}}:{},...n?{color:t.colors.redTextColor,animationName:`${y}`,animationDuration:"0.5s",animationIterationCount:5}:{}}),""),f=({dirty:e,value:n,inForm:t,maxLength:i,className:m,type:l="single",allowEnterToSubmit:u=!0})=>{const o=[],a=(s,r=!1)=>{o.push(c.jsx($,{includeDot:o.length>0,shouldBlink:r,children:s},o.length))};if(u){const s=t?"submit form":"apply";if(l==="multiline"){const r=p()?"⌘":"Ctrl";a(`Press ${r}+Enter to ${s}`)}else l==="single"&&a(`Press Enter to ${s}`)}return i&&(l!=="chat"||e)&&a(`${n.length}/${i}`,e&&n.length>=i),c.jsx(d,{"data-testid":"InputInstructions",className:m,children:o})};export{f as y};
