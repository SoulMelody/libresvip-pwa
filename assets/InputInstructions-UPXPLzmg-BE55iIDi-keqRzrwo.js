import{k as c,d5 as d,y as g,X as h,d6 as p}from"./index-CBpJgXau.js";const y=h`
  50% {
    color: rgba(0, 0, 0, 0);
  }
`,x=g("span",{target:"edlqvik0"})(({includeDot:e,shouldBlink:o,theme:t})=>({...e?{"&::before":{opacity:1,content:'"•"',animation:"none",color:t.colors.grayTextColor,margin:`0 ${t.spacing.twoXS}`}}:{},...o?{color:t.colors.redTextColor,animationName:`${y}`,animationDuration:"0.5s",animationIterationCount:5}:{}}),""),f=({dirty:e,value:o,inForm:t,maxLength:i,className:m,type:a="single",allowEnterToSubmit:u=!0})=>{const n=[],l=(s,r=!1)=>{n.push(c.jsx(x,{includeDot:n.length>0,shouldBlink:r,children:s},n.length))};if(u){const s=t?"submit form":"apply";if(a==="multiline"){const r=p()?"⌘":"Ctrl";l(`Press ${r}+Enter to ${s}`)}else a==="single"&&l(`Press Enter to ${s}`)}return i&&(a!=="chat"||e)&&l(`${o.length}/${i}`,e&&o.length>=i),c.jsx(d,{"data-testid":"InputInstructions",className:m,children:n})};export{f as $};
