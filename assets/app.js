"use strict";
const routes={overview:'/',customer:'/customer/','customer-service':'/customer-service/','customer-home':'/customer-home/','customer-enrollment':'/customer-enrollment/',enrollment:'/enrollment/',attendance:'/attendance/','workflow-home':'/workflow-home/',architecture:'/architecture/',investment:'/investment/'};
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
function enrollCustomer(){
 if(!checkCapturedPhoto())return;
 const id=document.getElementById('customerEnrollId').value.trim(), name=document.getElementById('customerEnrollName').value.trim(),branch=document.getElementById('customerEnrollBranch').value.trim();
 if(!id||!name||!branch){showModal('ENROLLMENT INCOMPLETE','Customer ID, name and branch are required.','No demo record created.',false,'!');return}
 if(!document.getElementById('customerEnrollConsent').checked){showModal('ACKNOWLEDGMENT REQUIRED','Acknowledge the demo consent field to continue.','No demo record created.',false,'!');return}
 const records=readState().customers||[];
 if(records.some(v=>v.id.toLowerCase()===id.toLowerCase())){showModal('DUPLICATE CUSTOMER ID','This demo customer ID is already registered.','Try another ID.',false,'!');return}
 updateState({customers:[{id,name,branch},...records].slice(0,100),customerHubTitle:'Customer enrollment successful (demo)',customerHubSummary:name+' • '+id+' • '+branch+' • No biometric template created.'});
 showModal('CUSTOMER ENROLLMENT SUCCESSFUL','The illustrative customer profile is enrolled in this browser session.','Customer: '+id+' • '+name+' • Simulated; no biometric template created.',true,'✓','customer-home');
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
async function startCamera(){const w=cameraWidget();if(!w)return;if(!window.isSecureContext){cameraStatus('Camera requires HTTPS or localhost. Use your Vercel HTTPS URL.',true);w.querySelector('.camera-start').hidden=false;return}if(!navigator.mediaDevices?.getUserMedia){cameraStatus('Browser camera API unavailable. Try Chrome, Edge or Safari.',true);w.querySelector('.camera-start').hidden=false;return}
 stoppedByUser=false;stopCamera(false);cameraStatus('Requesting camera access…');w.querySelector('.camera-start').hidden=true;
 try{const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:960},height:{ideal:720}}});currentCameraStream=stream;const video=w.querySelector('.camera-live');video.srcObject=stream;video.hidden=false;w.querySelector('.camera-placeholder').hidden=true;poseProgress();await video.play();w.querySelector('.camera-stop').disabled=false;cameraStatus('Loading face tracking…');await initializeLandmarks();if(!currentCameraStream)return;poseProgress();cameraStatus('Step 1/3 · Slowly turn your head to the RIGHT.');processCameraFrames();stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(currentCameraStream){stopCamera();cameraStatus('Camera disconnected. Press Restart Camera to retry.',true);w.querySelector('.camera-start').hidden=false}},{once:true})
 }catch(err){stopCamera(false);const errors={NotAllowedError:'Camera access denied. Allow camera permission in site settings, then press Restart Camera.',NotFoundError:'No camera detected. Connect a webcam and try again.',NotReadableError:'Camera is busy. Close other camera applications and retry.'};cameraStatus(errors[err.name]||err.message||'Could not start camera.',true);w.querySelector('.camera-start').hidden=false;}}
function capturePhotoAutomatically(){const w=cameraWidget(),video=w?.querySelector('.camera-live');if(!video||!currentCameraStream||!video.videoWidth)return;const canvas=w.querySelector('.camera-canvas');const scale=Math.min(1,960/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);capturedFrame=canvas.toDataURL('image/jpeg',0.86);poseProgress();const photo=w.querySelector('.camera-photo');photo.src=capturedFrame;photo.hidden=false;stopCamera(true);w.querySelector('.camera-placeholder').hidden=true;w.querySelector('.camera-retake').hidden=false;w.querySelector('.camera-start').hidden=true;cameraStatus('✓ Head movement steps completed. Photo automatically captured. Continue with the demo verification below.');}
function checkCapturedPhoto(){if(!cameraWidget())return true;if(capturedFrame)return true;cameraStatus('Complete all three head movements to auto-capture a photo.',true);cameraWidget().scrollIntoView({behavior:'smooth',block:'center'});return false}
(function initCamera(){const w=cameraWidget();if(!w)return;w.querySelector('.camera-start').addEventListener('click',startCamera);w.querySelector('.camera-stop').addEventListener('click',()=>{stoppedByUser=true;stopCamera();w.querySelector('.camera-start').hidden=false;cameraStatus('Camera stopped. Press Restart Camera when ready.')});w.querySelector('.camera-retake').addEventListener('click',startCamera);window.addEventListener('pagehide',()=>{stoppedByUser=true;stopCamera()});startCamera();})();
