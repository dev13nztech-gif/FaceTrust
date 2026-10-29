"use strict";
document.getElementById('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.currentTarget.querySelector('button');const error=document.getElementById('error');error.textContent='';button.disabled=true;
 try{await loginFms(document.getElementById('email').value.trim(),document.getElementById('password').value);
 const p=new URLSearchParams(location.search).get('next')||'/';
 location.replace(p.startsWith('/')&&!p.startsWith('//')?p:'/');
 }catch(err){error.textContent=err.message;button.disabled=false;}
});
