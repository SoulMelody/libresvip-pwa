import{j as c,x as d,a4 as g,d5 as h}from"./index-Cto6lVBL.js";import{r as p}from"./styled-components-BwoIjXty-B1bPM1o4-CtOffJU2.js";const x=g`
  50% {
    color: rgba(0, 0, 0, 0);
  }
`,f=d("span",{target:"edlqvik0"})(({includeDot:o,shouldBlink:e,theme:t})=>({...o?{"&::before":{opacity:1,content:'"•"',animation:"none",color:t.colors.grayTextColor,margin:`0 ${t.spacing.twoXS}`}}:{},...e?{color:t.colors.redTextColor,animationName:`${x}`,animationDuration:"0.5s",animationIterationCount:5}:{}}),""),b=({dirty:o,value:e,inForm:t,maxLength:i,className:m,type:a="single",allowEnterToSubmit:u=!0})=>{const n=[],s=(r,l=!1)=>{n.push(c.jsx(f,{includeDot:n.length>0,shouldBlink:l,children:r},n.length))};if(u){const r=t?"submit form":"apply";if(a==="multiline"){const l=h()?"⌘":"Ctrl";s(`Press ${l}+Enter to ${r}`)}else a==="single"&&s(`Press Enter to ${r}`)}return i&&(a!=="chat"||o)&&s(`${e.length}/${i}`,o&&e.length>=i),c.jsx(p,{"data-testid":"InputInstructions",className:m,children:n})};export{b};
