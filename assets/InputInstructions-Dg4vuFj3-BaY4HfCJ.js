import{cX as d,j as c,cY as g,c as h,k as p}from"./index-DcYuNHN-.js";const $=p`
  50% {
    color: rgba(0, 0, 0, 0);
  }
`,f=h("span",{target:"edlqvik0"})(({includeDot:e,shouldBlink:n,theme:t})=>({...e?{"&::before":{opacity:1,content:'"•"',animation:"none",color:t.colors.gray,margin:`0 ${t.spacing.twoXS}`}}:{},...n?{color:t.colors.red,animationName:`${$}`,animationDuration:"0.5s",animationIterationCount:5}:{}}),""),x=({dirty:e,value:n,inForm:t,maxLength:s,className:m,type:r="single",allowEnterToSubmit:u=!0})=>{const o=[],i=(a,l=!1)=>{o.push(c.jsx(f,{includeDot:o.length>0,shouldBlink:l,children:a},o.length))};if(u){const a=t?"submit form":"apply";if(r==="multiline"){const l=d()?"⌘":"Ctrl";i(`Press ${l}+Enter to ${a}`)}else r==="single"&&i(`Press Enter to ${a}`)}return s&&(r!=="chat"||e)&&i(`${n.length}/${s}`,e&&n.length>=s),c.jsx(g,{"data-testid":"InputInstructions",className:m,children:o})};export{x as b};
