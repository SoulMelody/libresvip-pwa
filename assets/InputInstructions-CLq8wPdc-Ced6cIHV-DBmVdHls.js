import{j as c,dj as d,c as g,k as h,dk as p}from"./index-BXy9S0ZG.js";const x=h`
  50% {
    color: rgba(0, 0, 0, 0);
  }
`,y=g("span",{target:"edlqvik0"})(({includeDot:e,shouldBlink:o,theme:t})=>({...e?{"&::before":{opacity:1,content:'"•"',animation:"none",color:t.colors.grayTextColor,margin:`0 ${t.spacing.twoXS}`}}:{},...o?{color:t.colors.redTextColor,animationName:`${x}`,animationDuration:"0.5s",animationIterationCount:5}:{}}),""),f=({dirty:e,value:o,inForm:t,maxLength:i,className:m,type:a="single",allowEnterToSubmit:u=!0})=>{const n=[],l=(s,r=!1)=>{n.push(c.jsx(y,{includeDot:n.length>0,shouldBlink:r,children:s},n.length))};if(u){const s=t?"submit form":"apply";if(a==="multiline"){const r=p()?"⌘":"Ctrl";l(`Press ${r}+Enter to ${s}`)}else a==="single"&&l(`Press Enter to ${s}`)}return i&&(a!=="chat"||e)&&l(`${o.length}/${i}`,e&&o.length>=i),c.jsx(d,{"data-testid":"InputInstructions",className:m,children:n})};export{f as b};
