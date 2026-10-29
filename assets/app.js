"use strict";
const routes={overview:'/',customer:'/customer/','customer-service':'/customer-service/','customer-home':'/customer-home/','customer-enrollment':'/customer-enrollment/',enrollment:'/enrollment/',attendance:'/attendance/','attendance-report':'/attendance-report/','workflow-home':'/workflow-home/',architecture:'/architecture/',investment:'/investment/'};
const page=document.body.dataset.page;
const cases={customer:'accept',attendance:'accept'};
let modalDestination=null;
function readState(){try{return JSON.parse(sessionStorage.getItem('facetrustDemo')||'{}')}catch{return {}}}
function updateState(patch){sessionStorage.setItem('facetrustDemo',JSON.stringify({...readState(),...patch}));syncAuthorizedMenu()}
// UI-only access indication: this demonstration is not a secure authorization system.
function syncAuthorizedMenu(){
 const enabled=readState().serviceAuthorized===true;
 document.querySelectorAll('[data-authorized-only="customer"]').forEach(el=>{
   el.hidden=!enabled;
   if(!enabled){el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1')}
   else {el.removeAttribute('aria-hidden');el.removeAttribute('tabindex')}
 });
}
syncAuthorizedMenu();
function revokeCustomerVerification(){
 const st=readState();
 if(st.serviceAuthorized){sessionStorage.setItem('facetrustDemo',JSON.stringify({...st,serviceAuthorized:false}));syncAuthorizedMenu()}
}
function nav(target){
 if(target==='customer-service'&&!readState().serviceAuthorized){location.href=routes.customer;return}
 if(page==='customer-service' && target!=='customer-service')revokeCustomerVerification();
 location.href=routes[target]||routes.overview;
}
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>nav(el.dataset.go)));
// Real anchor navigation, browser Back/Forward, refresh and tab exit must not preserve demo access.
if(page==='customer-service'){
 window.addEventListener('pagehide',revokeCustomerVerification);
 // Direct links in the sidebar do not use nav().
 document.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',()=>{
   if(new URL(a.href,location.href).pathname!==routes['customer-service'])revokeCustomerVerification();
 }));
 // A browser may restore this page from back-forward cache without running its scripts again.
 window.addEventListener('pageshow',e=>{
   if(e.persisted || !readState().serviceAuthorized){
     if(!readState().serviceAuthorized)location.replace(routes.customer);
   }
 });
}

function setCase(area,c){cases[area]=c;const names=area==='customer'?{accept:'Genuine customer',reject:'Different person',spoof:'Spoof attempt'}:{accept:'Correct employee',reject:'Wrong person',spoof:'Photo attack'};const x=document.getElementById(area+'Case');if(x)x.textContent='Selected: '+names[c]}
function showModal(title,message,detail,success=true,icon=null,destination=null){modalDestination=destination;const overlay=document.getElementById('resultModal');overlay.querySelector('.modal-card').classList.toggle('fail',!success);document.getElementById('modalTitle').textContent=title;document.getElementById('modalMessage').textContent=message;document.getElementById('modalDetail').textContent=detail;document.getElementById('modalIcon').textContent=icon||(success?'✓':'✕');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.getElementById('modalClose').focus()}
function closeModal(){const modal=document.getElementById('resultModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');if(modalDestination)nav(modalDestination)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('resultModal').classList.contains('open'))closeModal()});
document.getElementById('resultModal').addEventListener('click',e=>{if(e.target.id==='resultModal')closeModal()});
// LOCAL FMS INTEGRATION: real embedding generation + similarity. Local demo ONLY.
const FMS_API=(window.FACETRUST_CONFIG?.fmsBaseUrl||'').replace(/\/$/,'') + '/demo';
function frameToBlob(){
 if(!capturedFrame)throw new Error('Capture a face image first.');
 const [info,base64]=capturedFrame.split(',');
 const binary=atob(base64),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return new Blob([bytes],{type:'image/jpeg'});
}
async function sendFms(path,fields){
 const body=new FormData();Object.entries(fields).forEach(([k,v])=>body.append(k,v));
 const token=await getFmsToken();
 const res=await fetch(FMS_API+path,{method:'POST',headers:{Authorization:`Bearer ${token}`},body});
 let data;try{data=await res.json()}catch{throw new Error('FMS returned an invalid response');}
 if(!res.ok)throw new Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail||data));
 return data;
}
async function verify(area){
 if(!checkCapturedPhoto())return;
 const isCustomer=area==='customer',id=(document.getElementById(isCustomer?'customerId':'employeeId').value||'').trim();
 if(!id){showModal('ID REQUIRED','Please enter the enrolled ID.','',false);return}
 // Test-only: liveness disabled. Never use for real security decisions.
 try{
  const act=isCustomer?'check-in':(document.getElementById('attendanceAction').value==='Check Out'?'check-out':'check-in');
  const data=await sendFms('/verify',{kind:isCustomer?'customer':'employee',subject_id:id,image:frameToBlob(),threshold:'0.5',check_liveness:'false',action:act});
  const success=data.verified===true,detail='Similarity: '+data.similarity+' | threshold: '+data.threshold+' | Live FMS API (liveness disabled)';
  if(isCustomer){updateState({serviceAuthorized:success,customerId:id,requestedService:document.getElementById('service').value});}
  else if(success){const st=readState();updateState({homeWelcome:'Attendance recorded in Supabase',homeSummary:id+' — '+act+' • Actual AI match',attendanceRows:[{id,act,at:new Date().toISOString(),name:data.name},...(st.attendanceRows||[])].slice(0,500)});}
  showModal(success?(isCustomer?'VERIFIED — ACCEPTED':'ATTENDANCE RECORDED'):'NOT VERIFIED — REJECTED',success?'FMS matched the captured face to the enrolled ID.':'FMS did not match this face to the enrolled ID.',detail,success,success?'✓':'✕',success?(isCustomer?'customer-service':'workflow-home'):null);
 }catch(e){if(isCustomer)updateState({serviceAuthorized:false});showModal('FMS API ERROR','Could not complete the real verification.',e.message,false,'!')}
}
async function enrollEmployee(){
 if(!checkCapturedPhoto())return;
 const id=document.getElementById('enrollId').value.trim(),name=document.getElementById('enrollName').value.trim(),department=document.getElementById('enrollDepartment').value,branch=document.getElementById('enrollBranch').value.trim();
 if(!id||!name||!branch||!document.getElementById('enrollConsent').checked){showModal('ENROLLMENT INCOMPLETE','Enter ID, name, branch and acknowledge demo consent.','',false);return}
 try{const data=await sendFms('/enroll',{kind:'employee',subject_id:id,name,branch,image:frameToBlob()});const st=readState();updateState({enrolled:[{id,name,department,branch},...(st.enrolled||[])].slice(0,50),lastEmployee:id,homeWelcome:'Employee face enrolled in local FMS',homeSummary:id+' • '+data.embedding_dimensions+'-dimension embedding stored in Supabase'});showModal('ENROLLMENT SUCCESSFUL','FMS generated an embedding and saved the profile.','Employee: '+id+' • Supabase',true,'✓','workflow-home')}
 catch(e){showModal('ENROLLMENT ERROR','FMS could not enroll the employee.',e.message,false,'!')}
}
async function enrollCustomer(){
 if(!checkCapturedPhoto())return;
 const id=document.getElementById('customerEnrollId').value.trim(),name=document.getElementById('customerEnrollName').value.trim(),branch=document.getElementById('customerEnrollBranch').value.trim();
 if(!id||!name||!branch||!document.getElementById('customerEnrollConsent').checked){showModal('ENROLLMENT INCOMPLETE','Enter ID, name, branch and acknowledge demo consent.','',false);return}
 try{const data=await sendFms('/enroll',{kind:'customer',subject_id:id,name,branch,image:frameToBlob()});const st=readState();updateState({customers:[{id,name,branch},...(st.customers||[])].slice(0,100),customerHubTitle:'Customer enrolled in local FMS',customerHubSummary:id+' • '+data.embedding_dimensions+'-dimension face embedding stored in Supabase'});showModal('ENROLLMENT SUCCESSFUL','FMS generated a real face embedding.','Customer: '+id+' • Supabase',true,'✓','customer-home')}
 catch(e){showModal('ENROLLMENT ERROR','FMS could not enroll the customer.',e.message,false,'!')}
}
function demoServiceAction(){showModal('SERVICE DEMONSTRATION','This is a simulated banking service screen. Actual account access and financial transactions require the bank’s separate authorization controls.','No real transaction was initiated.',true,'ℹ',null)}
(function hydrate(){const st=readState();if(page==='customer-service'){if(!st.serviceAuthorized){location.replace(routes.customer);return}const id=st.customerId||'DEMO-ID',service=st.requestedService||'Cash Withdrawal';document.getElementById('serviceWelcome').textContent='Identity accepted — '+id;document.getElementById('serviceContext').textContent='Requested service: '+service;document.getElementById('chosenService').textContent=service;document.getElementById('serviceIdentity').textContent='Customer ID: '+id;}
if(page==='workflow-home'){document.getElementById('homeWelcome').textContent=st.homeWelcome||'Welcome to the employee services dashboard';document.getElementById('homeSummary').textContent=st.homeSummary||'Select a workflow to continue the demonstration.'}
if(page==='customer-home'){document.getElementById('customerHubTitle').textContent=st.customerHubTitle||'Customer Identity Services';document.getElementById('customerHubSummary').textContent=st.customerHubSummary||'Choose a customer workflow.'}
if(page==='customer-enrollment'){const body=document.getElementById('customerEnrollmentRows');(st.customers||[]).forEach(x=>{const r=document.createElement('tr');[x.id,x.name,x.branch].forEach(v=>{const c=document.createElement('td');c.textContent=v;r.appendChild(c)});body.appendChild(r)})}
if(page==='attendance'){if(st.lastEmployee)document.getElementById('employeeId').value=st.lastEmployee;const body=document.getElementById('attendanceRows');(st.attendanceRows||[]).forEach(x=>{const r=document.createElement('tr');[x.id,x.act,'Simulated ✓'].forEach(v=>{const c=document.createElement('td');c.textContent=v;r.appendChild(c)});body.prepend(r)})}
if(page==='enrollment'){const body=document.getElementById('enrollmentRows');(st.enrolled||[]).forEach(x=>{const r=document.createElement('tr');[x.id,x.name,x.department].forEach(v=>{const c=document.createElement('td');c.textContent=v;r.appendChild(c)});body.prepend(r)})}
})();

// Accessible responsive navigation for phones and tablets.
(function initResponsiveNavigation(){
  const menu=document.getElementById('menuToggle');
  const sidebar=document.getElementById('siteSidebar');
  const backdrop=document.getElementById('mobileNavBackdrop');
  if(!menu||!sidebar||!backdrop)return;
  let lastFocus=null;
  function setOpen(open){
    document.body.classList.toggle('nav-open',open);
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    backdrop.hidden=!open;
    if(open){lastFocus=document.activeElement;sidebar.querySelector('a')?.focus()}
    else if(sidebar.contains(document.activeElement))menu.focus();
  }
  menu.addEventListener('click',()=>setOpen(!document.body.classList.contains('nav-open')));
  backdrop.addEventListener('click',()=>setOpen(false));
  sidebar.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('nav-open'))setOpen(false)});
  window.addEventListener('resize',()=>{if(window.innerWidth>1024&&document.body.classList.contains('nav-open'))setOpen(false)});
})();

// Client-side landmark guided auto-capture. This is not anti-spoofing or identity verification.
let currentCameraStream=null, capturedFrame=null, faceMesh=null, processing=false, poseStage=0, stableFrames=0, lastPoseTime=0, stoppedByUser=false;
const poseSequence=['right','left','center'];
function cameraWidget(){return document.querySelector('[data-camera="true"]')}
function cameraStatus(message,error=false){const x=cameraWidget()?.querySelector('.camera-status');if(x){x.textContent=message;x.classList.toggle('camera-error',error)}}
function poseProgress(){const w=cameraWidget();if(!w)return;w.querySelectorAll('.pose-step').forEach((el,i)=>{el.classList.toggle('done',i<poseStage);el.classList.toggle('active',i===poseStage)});const stage=w.querySelector('.camera-stage');if(!stage)return;const pose=poseSequence[poseStage]||'complete';stage.dataset.poseState=pose;const words={right:'TURN RIGHT',left:'TURN LEFT',center:'LOOK STRAIGHT',complete:'CAPTURE COMPLETE'};const icons={right:'↪',left:'↩',center:'◎',complete:'✓'};const word=w.querySelector('.pose-direction-word');const icon=w.querySelector('.pose-direction-icon');const count=w.querySelector('.pose-counter');if(word)word.textContent=words[pose];if(icon)icon.textContent=icons[pose];if(count)count.textContent=poseStage>=3?'✓':String(poseStage+1).padStart(2,'0')+' / 03';stage.classList.toggle('is-captured',!!capturedFrame)}
function resetPhoto(){capturedFrame=null;const w=cameraWidget();if(!w)return;const photo=w.querySelector('.camera-photo');photo.hidden=true;photo.removeAttribute('src');w.querySelector('.camera-retake').hidden=true;poseStage=0;stableFrames=0;poseProgress();}
function stopCamera(keepPhoto=true){processing=false;if(currentCameraStream){currentCameraStream.getTracks().forEach(t=>t.stop());currentCameraStream=null}const w=cameraWidget();if(!w)return;w.querySelector('.camera-live').srcObject=null;w.querySelector('.camera-live').hidden=true;w.querySelector('.camera-stop').disabled=true;if(!keepPhoto)resetPhoto();if(!capturedFrame)w.querySelector('.camera-placeholder').hidden=false;}
function loadScript(url){return new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-facemesh]');if(existing){if(window.FaceMesh)resolve();else existing.addEventListener('load',resolve,{once:true});return}const el=document.createElement('script');el.dataset.facemesh='true';el.src=url;el.onload=resolve;el.onerror=()=>reject(new Error('Face landmark library failed to load. Connect to the internet and retry.'));document.head.appendChild(el)})}
async function initializeLandmarks(){if(faceMesh)return faceMesh;await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js');if(!window.FaceMesh)throw new Error('Face landmark library unavailable.');const mesh=new FaceMesh({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`});mesh.setOptions({maxNumFaces:1,refineLandmarks:false,minDetectionConfidence:0.65,minTrackingConfidence:0.65});mesh.onResults(handleFaceLandmarks);faceMesh=mesh;return mesh}
function handleFaceLandmarks(result){if(!currentCameraStream||capturedFrame)return;const landmarks=result.multiFaceLandmarks||[];if(landmarks.length!==1){stableFrames=0;cameraStatus(landmarks.length>1?'Only one person should be in the frame.':'Position one face inside the camera view.');return}
 const p=landmarks[0];const left=p[234],right=p[454],nose=p[1],eyeA=p[33],eyeB=p[263],chin=p[152],forehead=p[10];
 // Nose asymmetry against left/right face outlines approximates yaw. Thresholds are demo heuristics.
 const leftWidth=Math.hypot(nose.x-left.x,nose.y-left.y),rightWidth=Math.hypot(nose.x-right.x,nose.y-right.y);
 const yaw=(leftWidth-rightWidth)/(leftWidth+rightWidth);const faceWidth=Math.abs(right.x-left.x),faceHeight=Math.abs(chin.y-forehead.y);
 if(faceWidth<0.18||faceHeight<0.20){stableFrames=0;cameraStatus('Move closer and keep your face fully inside the frame.');return}
 const expected=poseSequence[poseStage];// MediaPipe landmarks use the unmirrored video frame, while our selfie preview is mirrored.
 // Flip the yaw mapping so RIGHT/LEFT mean the user's actual head-turn direction.
 const classified=yaw< -0.15?'right':yaw>0.15?'left':Math.abs(yaw)<0.09?'center':'transition';
 if(classified===expected){stableFrames++;}else stableFrames=0;
 const messages={right:'Step 1/3 · Slowly turn your head to the RIGHT.',left:'Step 2/3 · Now turn your head to the LEFT.',center:'Step 3/3 · Look STRAIGHT at the camera.'};
 cameraStatus(messages[expected]+(stableFrames>1?' Hold still…':''));
 if(stableFrames>=4 && performance.now()-lastPoseTime>450){poseStage++;lastPoseTime=performance.now();stableFrames=0;poseProgress();if(poseStage===3){capturePhotoAutomatically();return}cameraStatus('✓ Movement recorded. '+messages[poseSequence[poseStage]])}
}
async function processCameraFrames(){const video=cameraWidget()?.querySelector('.camera-live');while(currentCameraStream && !capturedFrame && !stoppedByUser){if(video?.readyState>=2 && faceMesh){try{await faceMesh.send({image:video})}catch(err){cameraStatus('Face tracking interrupted: '+err.message,true);break}}await new Promise(resolve=>setTimeout(resolve,75))}}
async function startCamera(){const w=cameraWidget();if(!w)return;clearCustomerUploadedImage(false);if(!window.isSecureContext){cameraStatus('Camera requires HTTPS or localhost. Use your Vercel HTTPS URL.',true);w.querySelector('.camera-start').hidden=false;return}if(!navigator.mediaDevices?.getUserMedia){cameraStatus('Browser camera API unavailable. Try Chrome, Edge or Safari.',true);w.querySelector('.camera-start').hidden=false;return}
 stoppedByUser=false;stopCamera(false);cameraStatus('Requesting camera access…');w.querySelector('.camera-start').hidden=true;
 try{const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:960},height:{ideal:720}}});currentCameraStream=stream;const video=w.querySelector('.camera-live');video.srcObject=stream;video.hidden=false;w.querySelector('.camera-placeholder').hidden=true;poseProgress();await video.play();w.querySelector('.camera-stop').disabled=false;cameraStatus('Loading face tracking…');await initializeLandmarks();if(!currentCameraStream)return;poseProgress();cameraStatus('Step 1/3 · Slowly turn your head to the RIGHT.');processCameraFrames();stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(currentCameraStream){stopCamera();cameraStatus('Camera disconnected. Press Restart Camera to retry.',true);w.querySelector('.camera-start').hidden=false}},{once:true})
 }catch(err){stopCamera(false);const errors={NotAllowedError:'Camera access denied. Allow camera permission in site settings, then press Restart Camera.',NotFoundError:'No camera detected. Connect a webcam and try again.',NotReadableError:'Camera is busy. Close other camera applications and retry.'};cameraStatus(errors[err.name]||err.message||'Could not start camera.',true);w.querySelector('.camera-start').hidden=false;}}
function capturePhotoAutomatically(){const w=cameraWidget(),video=w?.querySelector('.camera-live');if(!video||!currentCameraStream||!video.videoWidth)return;const canvas=w.querySelector('.camera-canvas');const scale=Math.min(1,960/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);capturedFrame=canvas.toDataURL('image/jpeg',0.86);poseProgress();const photo=w.querySelector('.camera-photo');photo.src=capturedFrame;photo.hidden=false;stopCamera(true);w.querySelector('.camera-placeholder').hidden=true;w.querySelector('.camera-retake').hidden=false;w.querySelector('.camera-start').hidden=true;cameraStatus('✓ Head movement steps completed. Photo automatically captured. Continue with the demo verification below.');}
function checkCapturedPhoto(){if(!cameraWidget())return true;if(capturedFrame)return true;cameraStatus('Complete all three head movements to auto-capture a photo.',true);cameraWidget().scrollIntoView({behavior:'smooth',block:'center'});return false}
(function initCamera(){const w=cameraWidget();if(!w)return;w.querySelector('.camera-start').addEventListener('click',startCamera);w.querySelector('.camera-stop').addEventListener('click',()=>{stoppedByUser=true;stopCamera();w.querySelector('.camera-start').hidden=false;cameraStatus('Camera stopped. Press Restart Camera when ready.')});w.querySelector('.camera-retake').addEventListener('click',startCamera);window.addEventListener('pagehide',()=>{stoppedByUser=true;stopCamera()});startCamera();})();

// V11: optional customer enrollment image upload. File stays in this tab; no server upload.
function clearCustomerUploadedImage(resetCaptured=true){
 const inp=document.getElementById('customerImageUpload');if(!inp)return;
 const preview=document.getElementById('customerUploadPreview');
 if(inp.dataset.uploaded==='yes' && resetCaptured)capturedFrame=null;
 inp.dataset.uploaded='no';inp.value='';
 document.getElementById('customerUploadPreviewWrap').hidden=true;
 document.getElementById('clearCustomerUpload').hidden=true;
 preview.removeAttribute('src');
 document.getElementById('customerUploadStatus').textContent='Upload a face image, or complete the guided camera capture below.';
 document.getElementById('customerUploadStatus').classList.remove('error');
}
(function initCustomerUpload(){
 const inp=document.getElementById('customerImageUpload');if(!inp)return;
 const status=document.getElementById('customerUploadStatus');
 document.getElementById('clearCustomerUpload').addEventListener('click',()=>{clearCustomerUploadedImage();startCamera()});
 inp.addEventListener('change',async()=>{
  const file=inp.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){
   status.textContent='Select a JPG, PNG or WebP image up to 5 MB.';status.classList.add('error');inp.value='';return;
  }
  try{
   const image=await createImageBitmap(file);
   if(image.width<160||image.height<160){image.close();throw new Error('Image is too small. Use at least 160 × 160 pixels.');}
   const canvas=document.createElement('canvas');const scale=Math.min(1,1024/image.width,1024/image.height);
   canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();
   const encoded=canvas.toDataURL('image/jpeg',0.85);
   stopCamera(false);capturedFrame=encoded;inp.dataset.uploaded='yes';
   document.getElementById('customerUploadPreview').src=encoded;
   document.getElementById('customerUploadPreviewWrap').hidden=false;
   document.getElementById('clearCustomerUpload').hidden=false;
   const widget=cameraWidget();if(widget){widget.querySelector('.camera-placeholder').hidden=false;widget.querySelector('.camera-start').hidden=false;cameraStatus('✓ Enrollment image selected from upload. No camera capture required.');}
   status.textContent='✓ Photo selected: '+file.name+'. Ready for demo enrollment.';status.classList.remove('error');
  }catch(err){status.textContent=err.message||'Could not read image.';status.classList.add('error');inp.value='';}
 });
})();

// Session-only attendance reporting. CSV export contains filtered demonstration events.
(function initAttendanceReport(){
 if(page!=='attendance-report')return;
 const get=id=>document.getElementById(id);
 const inputs=['reportFrom','reportTo','reportEmployee','reportAction'].map(get);
 const formatDate=d=>{const a=d.getFullYear(),b=String(d.getMonth()+1).padStart(2,'0'),c=String(d.getDate()).padStart(2,'0');return `${a}-${b}-${c}`};
 const sample=()=>{const now=new Date(),yesterday=new Date(now.getTime()-86400000);return [{id:'EMP-00142',name:'Sample employee',act:'Check In',at:formatDate(now)+'T09:00:00',sample:true},{id:'EMP-00138',name:'Sample employee',act:'Check Out',at:formatDate(yesterday)+'T17:20:00',sample:true}]};
 let filtered=[];
 function records(){return [...(readState().attendanceRows||[]),...sample()].map(x=>({...x,at:x.at||'',name:x.name||'Demo employee'}))}
 function draw(){
  const [from,to,id,action]=inputs.map(x=>x.value),terms=id.trim().toLowerCase();
  filtered=records().filter(r=>{const day=r.at.slice(0,10);return (!from||day>=from)&&(!to||day<=to)&&(!terms||r.id.toLowerCase().includes(terms))&&(action==='all'||r.act===action)});
  const body=get('reportRows');body.replaceChildren();
  for(const row of filtered){const tr=document.createElement('tr');const vals=[row.at.slice(0,10)||'—',row.at.slice(11,19)||'—',row.id,row.name,row.act,row.sample?'Illustrative sample':'Simulated event'];vals.forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});body.append(tr)}
  get('reportEmpty').hidden=filtered.length!==0;
  get('reportTotal').textContent=filtered.length;
  get('reportCheckins').textContent=filtered.filter(x=>x.act==='Check In').length;
  get('reportCheckouts').textContent=filtered.filter(x=>x.act==='Check Out').length;
  get('reportPeople').textContent=new Set(filtered.map(x=>x.id)).size;
 }
 inputs.forEach(x=>x.addEventListener('input',draw));
 get('reportReset').addEventListener('click',()=>{inputs.forEach((x,i)=>x.value=i===3?'all':'');draw()});
 get('reportExport').addEventListener('click',()=>{const rows=[['Date','Time','Employee ID','Name','Action','Record Type'],...filtered.map(x=>[x.at.slice(0,10),x.at.slice(11,19),x.id,x.name,x.act,x.sample?'Illustrative sample':'Simulated event'])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""').replace(/^[=+@\-]/,'\'')+'"').join(',')).join('\r\n');const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='facetrust-attendance-demo.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 draw();
})();
