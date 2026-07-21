let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let originalImage = new Image();
let currentImage = new Image();
currentImage.crossOrigin = "anonymous";
originalImage.crossOrigin = "anonymous";
let currentFilter = 'none';

// Upload Image
document.getElementById('upload').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  showLoader(true);
  const reader = new FileReader();
  reader.onload = event => {
    originalImage.src = event.target.result;
    currentImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

originalImage.onload = () => {
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(originalImage, 0, 0);
  document.getElementById('editor').classList.remove('hidden');
  showLoader(false);
}

// 1. AI Background Removal
async function removeBackground(){
  if(!originalImage.src) return alert("Please upload an image first");
  showLoader(true);
  try {
    const blob = await backgroundRemoval.removeBackground(originalImage.src);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      currentImage = img; // update current image
      originalImage = img; // taake dobara BG remove na ho
      showLoader(false);
    }
  } catch(err){
    alert("AI Error: " + err.message);
    showLoader(false);
  }
}

// 2. New Background Options
function showBgOptions(){ togglePanel('bg-options'); }

// 2A. Apply Background Color
function applyBgColor(){
  if(!currentImage.src) return alert("Please upload an image first");
  const color = document.getElementById('bgColor').value;
  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  let tempCtx = tempCanvas.getContext('2d');
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0,0,tempCanvas.width,tempCanvas.height);
  tempCtx.drawImage(canvas, 0, 0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
  currentImage.src = canvas.toDataURL(); // update current
}

// 2B. Apply Background Image - NEW
function applyBgImage(){
  if(!currentImage.src) return alert("Please upload an image first");
  const file = document.getElementById('bgImage').files[0];
  if(!file) return alert("Please select background image");
  showLoader(true);
  const reader = new FileReader();
  reader.onload = e => {
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = e.target.result;
    bgImg.onload = () => {
      let tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      let tempCtx = tempCanvas.getContext('2d');
      // BG image ko canvas size pe fit karo
      tempCtx.drawImage(bgImg, 0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0); // foreground upar
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      currentImage.src = canvas.toDataURL();
      showLoader(false);
    }
  }
  reader.readAsDataURL(file);
}

// 3. Filters
function showFilters(){ togglePanel('filter-options'); }
function applyFilter(filter){
  if(!currentImage.src) return alert("Please upload an image first");
  currentFilter = filter;
  canvas.style.filter = filter;
  // filter ko permanent karne ke liye
  setTimeout(() => {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    let tempCtx = tempCanvas.getContext('2d');
    tempCtx.filter = filter;
    tempCtx.drawImage(canvas, 0, 0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    canvas.style.filter = 'none';
    currentImage.src = canvas.toDataURL();
  }, 100);
}

// 4. Edit - Rotate 90 deg
function editImage(){
  if(!currentImage.src) return alert("Please upload an image first");
  let w = canvas.width;
  let h = canvas.height;
  canvas.width = h;
  canvas.height = w;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(90 * Math.PI / 180);
  ctx.drawImage(currentImage, -w/2, -h/2);
  ctx.restore();
  currentImage.src = canvas.toDataURL();
}

// 5. Delete / Reset
function deleteImage(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  document.getElementById('editor').classList.add('hidden');
  document.getElementById('upload').value = "";
  originalImage = new Image();
  currentImage = new Image();
}

// 6. Save to LocalStorage
function saveImage(){
  if(!currentImage.src) return alert("Please upload an image first");
  localStorage.setItem('penaFlexImage', canvas.toDataURL("image/png"));
  alert("✅ Image Saved in Browser!");
  loadSavedImage();
}

// Load saved image on start
function loadSavedImage(){
  const saved = localStorage.getItem('penaFlexImage');
  if(saved){
    const img = new Image();
    img.src = saved;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img,0,0);
      currentImage = img;
      originalImage = img;
      document.getElementById('editor').classList.remove('hidden');
    }
  }
}
loadSavedImage(); // page load pe check karo

// 7. Share
async function shareImage(){
  if(!currentImage.src) return alert("Please upload an image first");
  canvas.toBlob(async blob => {
    const file = new File([blob], "PenaFlex_MIJAZ.png", {type: "image/png"});
    if(navigator.canShare && navigator.canShare({files: [file]})){
      await navigator.share({
        files: [file],
        title: "PenaFlex AI",
        text: "Edited with PenaFlex AI by M IJAZ"
      });
    } else {
      downloadImage(); // agar share na ho to download kar do
    }
  });
}

// 8. Download
function downloadImage(){
  if(!currentImage.src) return alert("Please upload an image first");
  const link = document.createElement('a');
  link.download = 'PenaFlex_MIJAZ.png';
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

// Utility Functions
function togglePanel(id){
  document.getElementById('bg-options').classList.add('hidden');
  document.getElementById('filter-options').classList.add('hidden');
  document.getElementById(id).classList.toggle('hidden');
}
function showLoader(show){
  document.getElementById('loader').classList.toggle('hidden',!show);
}

// Register SW
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
   .then(reg => console.log("SW Registered: ", reg))
   .catch(err => console.log("SW Error: ", err));
  });
}
