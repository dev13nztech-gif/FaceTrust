"use strict";
const routes={overview:'/',customer:'/customer/','customer-service':'/customer-service/',enrollment:'/enrollment/',attendance:'/attendance/','workflow-home':'/workflow-home/',architecture:'/architecture/',investment:'/investment/'};
const page=document.body.dataset.page;
const cases={customer:'accept',attendance:'accept'};
let modalDestination=null;
function readState(){try{return JSON.parse(sessionStorage.getItem('facetrustDemo')||'{}')}catch{return {}}}
function updateState(patch){sessionStorage.setItem('facetrustDemo',JSON.stringify({...readState(),...patch}))}
function nav(target){if(target==='customer-service'&&!readState().serviceAuthorized){location.href=routes.customer;return}location.href=routes[target]||routes.overview}
document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>nav(el.dataset.go)));
function setCase(area,c){cases[area]=c;const names=area==='customer'?{accept:'Genuine customer',reject:'Different person',spoof:'Spoof attempt'}:{accept:'Correct employee',reject:'Wrong person',spoof:'Photo attack'};const x=document.getElementById(area+'Case');if(x)x.textContent='Selected: '+names[c]}
function showModal(title,message,detail,success=true,icon=null,destination=null){modalDestination=destination;const overlay=document.getElementById('resultModal');overlay.querySelector('.modal-card').classList.toggle('fail',!success);document.getElementById('modalTitle').textContent=title;document.getElementById('modalMessage').textContent=message;document.getElementById('modalDetail').textContent=detail;document.getElementById('modalIcon').textContent=icon||(success?'✓':'✕');overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.getElementById('modalClose').focus()}
function closeModal(){const modal=document.getElementById('resultModal');modal.classList.remove('open');modal.setAttribute('aria-hidden','true');if(modalDestination)nav(modalDestination)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('resultModal').classList.contains('open'))closeModal()});
document.getElementById('resultModal').addEventListener('click',e=>{if(e.target.id==='resultModal')closeModal()});
function verify(area){if(!checkCapturedPhoto())return;const scenario=cases[area],isCustomer=area==='customer',success=scenario==='accept',spoof=scenario==='spoof';const id=(document.getElementById(isCustomer?'customerId':'employeeId').value||'').trim()||'DEMO-ID';const msg=success?(isCustomer?'Face matches the selected customer reference. Proceed only after other required banking authorization steps.':'Employee matches the enrolled reference. Attendance recorded in this demo session only.'):spoof?'Presentation attack / liveness check failed in the simulated scenario. Refer to manual review.':'Captured face does not match the selected reference in the simulated scenario. Do not approve automatically.';
const title=success?'VERIFIED — ACCEPTED':spoof?'LIVENESS FAILED — REJECTED':'NOT VERIFIED — REJECTED';
if(isCustomer){if(success)updateState({serviceAuthorized:true,customerId:id,requestedService:document.getElementById('service').value});else updateState({serviceAuthorized:false})}
else if(success){const act=document.getElementById('attendanceAction').value;const state=readState();updateState({homeWelcome:'Attendance successfully recorded (demo)',homeSummary:id+' — '+act+' • Simulated event; no HR database write.',attendanceRows:[{id,act},...(state.attendanceRows||[])].slice(0,20)})}
showModal(success&&!isCustomer?'ATTENDANCE SUCCESSFUL':title,msg,(isCustomer?'Customer: ':'Employee: ')+id+' • Liveness: '+(spoof?'Failed':'Simulated pass')+' • No live AI inference',success,spoof?'!':null,success?(isCustomer?'customer-service':'workflow-home'):null)}
function enrollEmployee(){if(!checkCapturedPhoto())return;const id=document.getElementById('enrollId').value.trim(),name=document.getElementById('enrollName').value.trim(),department=document.getElementById('enrollDepartment').value,branch=document.getElementById('enrollBranch').value.trim();if(!id||!name||!branch){showModal('ENROLLMENT INCOMPLETE','Employee ID, Name and Branch are required.','No employee record was created.',false,'!');return}if(!document.getElementById('enrollConsent').checked){showModal('ACKNOWLEDGMENT REQUIRED','Please acknowledge the illustrative demo consent field before continuing.','No employee record was created.',false,'!');return}const st=readState(),list=st.enrolled||[];if(id.toUpperCase()==='EMP-00142'||list.some(x=>x.id.toUpperCase()===id.toUpperCase())){showModal('DUPLICATE EMPLOYEE ID','This employee ID already exists in the simulated enrollment list.','Try a different employee ID.',false,'!');return}updateState({enrolled:[{id,name,department,branch},...list].slice(0,50),homeWelcome:'Employee enrollment successful (demo)',homeSummary:name+' ('+id+') • '+branch+' • No biometric template generated.',lastEmployee:id});showModal('ENROLLMENT SUCCESSFUL','The employee profile was added to this demonstration session.','Employee: '+id+' • '+name+' • '+branch+' • Simulated; no face template created.',true,'✓','workflow-home')}
function demoServiceAction(){showModal('SERVICE DEMONSTRATION','This is a simulated banking service screen. Actual account access and financial transactions require the bank’s separate authorization controls.','No real transaction was initiated.',true,'ℹ',null)}
(function hydrate(){const st=readState();if(page==='customer-service'){if(!st.serviceAuthorized){location.replace(routes.customer);return}const id=st.customerId||'DEMO-ID',service=st.requestedService||'Cash Withdrawal';document.getElementById('serviceWelcome').textContent='Identity accepted — '+id;document.getElementById('serviceContext').textContent='Requested service: '+service;document.getElementById('chosenService').textContent=service;document.getElementById('serviceIdentity').textContent='Customer ID: '+id;}
if(page==='workflow-home'){document.getElementById('homeWelcome').textContent=st.homeWelcome||'Welcome to the employee services dashboard';document.getElementById('homeSummary').textContent=st.homeSummary||'Select a workflow to continue the demonstration.'}
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

// Browser camera demo: captures a local frame, never uploads or performs biometric inference.
let currentCameraStream=null;
let capturedFrame=null;
function cameraWidget(){return document.querySelector('[data-camera="true"]')}
function cameraStatus(message,error=false){const x=cameraWidget()?.querySelector('.camera-status');if(x){x.textContent=message;x.classList.toggle('camera-error',error)}}
function resetPhoto(){capturedFrame=null;const w=cameraWidget();if(!w)return;const photo=w.querySelector('.camera-photo');photo.hidden=true;photo.removeAttribute('src');w.querySelector('.camera-retake').hidden=true;}
function stopCamera(keepPhoto=true){if(currentCameraStream){currentCameraStream.getTracks().forEach(track=>track.stop());currentCameraStream=null;}const w=cameraWidget();if(!w)return;w.querySelector('.camera-live').srcObject=null;w.querySelector('.camera-live').hidden=true;w.querySelector('.camera-start').disabled=false;w.querySelector('.camera-capture').disabled=true;w.querySelector('.camera-stop').disabled=true;if(!keepPhoto)resetPhoto();if(!capturedFrame)w.querySelector('.camera-placeholder').hidden=false;}
async function startCamera(){const w=cameraWidget();if(!w)return;
  if(!window.isSecureContext){cameraStatus('Camera needs HTTPS or http://localhost. Open the Vercel HTTPS URL, or run a local server at localhost.',true);return}
  if(!navigator.mediaDevices?.getUserMedia){cameraStatus('Your browser does not provide camera access. Try an updated Chrome, Edge or Safari browser.',true);return}
  stopCamera(false);cameraStatus('Requesting camera permission…');const start=w.querySelector('.camera-start');start.disabled=true;
  try{let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}})}catch(err){if(err.name==='OverconstrainedError')stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true});else throw err}
    currentCameraStream=stream;const video=w.querySelector('.camera-live');video.srcObject=stream;video.hidden=false;w.querySelector('.camera-placeholder').hidden=true;await video.play();w.querySelector('.camera-capture').disabled=false;w.querySelector('.camera-stop').disabled=false;cameraStatus('Camera ready. Position your face and select Capture Photo.');
    stream.getVideoTracks()[0]?.addEventListener('ended',()=>{stopCamera();cameraStatus('Camera disconnected. Please reopen it.',true)},{once:true});
  }catch(err){stopCamera();const messages={NotAllowedError:'Camera permission denied. Allow camera access in the browser site settings and try again.',NotFoundError:'No camera detected. Connect a webcam or use a device with a camera.',NotReadableError:'Camera is busy or blocked by another application. Close other camera apps and retry.',SecurityError:'Camera blocked by the browser security settings. Use HTTPS or localhost.',AbortError:'Camera failed to initialize. Please try again.'};cameraStatus(messages[err.name]||('Could not open camera: '+err.message),true)}
}
function capturePhoto(){const w=cameraWidget(),video=w?.querySelector('.camera-live');if(!video||!currentCameraStream||!video.videoWidth){cameraStatus('Camera is not ready. Open Camera first.',true);return}const canvas=w.querySelector('.camera-canvas');const scale=Math.min(1,960/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);capturedFrame=canvas.toDataURL('image/jpeg',.85);const photo=w.querySelector('.camera-photo');photo.src=capturedFrame;photo.hidden=false;stopCamera(true);w.querySelector('.camera-placeholder').hidden=true;w.querySelector('.camera-retake').hidden=false;cameraStatus('Photo captured locally. You can retake it or continue with the simulated result.');}
function checkCapturedPhoto(){if(!cameraWidget())return true;if(capturedFrame)return true;cameraStatus('Please open the camera and capture a photo before continuing.',true);cameraWidget().scrollIntoView({behavior:'smooth',block:'center'});return false}
(function initCamera(){const w=cameraWidget();if(!w)return;w.querySelector('.camera-start').addEventListener('click',startCamera);w.querySelector('.camera-capture').addEventListener('click',capturePhoto);w.querySelector('.camera-stop').addEventListener('click',()=>{stopCamera();cameraStatus('Camera stopped.')});w.querySelector('.camera-retake').addEventListener('click',startCamera);window.addEventListener('pagehide',()=>stopCamera());})();
