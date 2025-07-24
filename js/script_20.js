//
var glbVersion = '1.0'; 
var glbSubmitted = false; 
var glb_ox = "";
var glb_scriptName = document.currentScript.src;
var glb_sid = "";
var lFileHandle = null;
var lBlockSize = null;
var lNumberOfChunks = null;
var lByteIndex = 0;
var lByteEnd = 0;
var lChunk = null;
var lChunkNumber = 0;
var reader = null;
var fileToUpload = null;
let settingsInitialized = false;

(function(exports) {
  var base32 = {
    a: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    pad: "=",
    encode: function (s) {
      var a = this.a;
      var pad = this.pad;
      var len = s.length;
      var o = "";
      var w, c, r=0, sh=0; // word, character, remainder, shift
      for(i=0; i<len; i+=5) {
        // mask top 5 bits
        c = s.charCodeAt(i);
        w = 0xf8 & c;
        o += a.charAt(w>>3);
        r = 0x07 & c;
        sh = 2;

        if ((i+1)<len) {
          c = s.charCodeAt(i+1);
          // mask top 2 bits
          w = 0xc0 & c;
          o += a.charAt((r<<2) + (w>>6));
          o += a.charAt( (0x3e & c) >> 1 );
          r = c & 0x01;
          sh = 4;
        }

        if ((i+2)<len) {
          c = s.charCodeAt(i+2);
          // mask top 4 bits
          w = 0xf0 & c;
          o += a.charAt((r<<4) + (w>>4));
          r = 0x0f & c;
          sh = 1;
        }

        if ((i+3)<len) {
          c = s.charCodeAt(i+3);
          // mask top 1 bit
          w = 0x80 & c;
          o += a.charAt((r<<1) + (w>>7));
          o += a.charAt((0x7c & c) >> 2);
          r = 0x03 & c;
          sh = 3;
        }

        if ((i+4)<len) {
          c = s.charCodeAt(i+4);
          // mask top 3 bits
          w = 0xe0 & c;
          o += a.charAt((r<<3) + (w>>5));
          o += a.charAt(0x1f & c);
          r = 0;
          sh = 0;
        }
      }
      // Encode the final character.
      if (sh != 0) { o += a.charAt(r<<sh); }
      // Calculate length of pad by getting the
      // number of words to reach an 8th octet.
      var padlen = 8 - (o.length % 8);
      // modulus
      if (padlen==8) { return o; }
      if (padlen==1) { return o + pad; }
      if (padlen==3) { return o + pad + pad + pad; }
      if (padlen==4) { return o + pad + pad + pad + pad; }
      if (padlen==6) { return o + pad + pad + pad + pad + pad + pad; }
      console.log('there was some kind of error');
      console.log('padlen:'+padlen+' ,r:'+r+' ,sh:'+sh+', w:'+w);
    },
    decode: function(s) {
      var len = s.length;
      var apad = this.a + this.pad;
      var v,x,r=0,bits=0,c,o='';

      s = s.toUpperCase();

      for(i=0;i<len;i+=1) {
        v = apad.indexOf(s.charAt(i));
        if (v>=0 && v<32) {
          x = (x << 5) | v;
          bits += 5;
          if (bits >= 8) {
            c = (x >> (bits - 8)) & 0xff;
            o = o + String.fromCharCode(c);
            bits -= 8;
          }
        }
      }
      // remaining bits are < 8
      if (bits>0) {
        c = ((x << (8 - bits)) & 0xff) >> (8 - bits);
        // Don't append a null terminator.
        // See the comment at the top about why this sucks.
        if (c!==0) {
          o = o + String.fromCharCode(c);
        }
      }
      return o;
    }
  };

  var base32hex = {
    a: '0123456789ABCDEFGHIJKLMNOPQRSTUV',
    pad: '=',
    encode: base32.encode,
    decode: base32.decode
  };
  exports.base32 = base32;
  exports.base32hex = base32hex;
})(this.Conversions = {});


window.onload = function(){checkMessage();}

window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  var lElement = event.target;
  var lElementClick = null;
  var lKey = null;
  var lFindValue = ";" + event.key + ";";
  var lPos = 0;
  var lClickElementId = null;

  if (lElement.hasAttribute("eky")){
    lKey = lElement.getAttribute("eky");
    lPos = lKey.indexOf(lFindValue);
    if (lPos != -1 ){
      if (lElement.hasAttribute("ekyid")){
        lClickElementId = lElement.getAttribute("ekyid");
        lElementClick = document.getElementById(lClickElementId);
        if (typeof(lElementClick) != 'undefined' && lElementClick != null){
          lElementClick.click();
          // Cancel the default action to avoid it being handled twice
          event.preventDefault()
        }
      }
    }
  }
}, true);

//#QRCODE.onload = MakeQRCode();

$(document).on("keypress", 'form', function (e) {
    var code = e.keyCode || e.which;
    var lElement = e.target;

    if (lElement != null && lElement.type != "textarea"){

      if (code == 13 && !e.shiftKey) {
          e.preventDefault();
          return true;
      }
  }
});


$.postJSON_JGS = function(url, data, callback) {
    return jQuery.ajax({
        'type': 'POST',
        'url': url,
        'contentType': 'application/json',
        'data': data,
        'dataType': 'json',
        'success': callback
    });
};

function ActionMenuChange (obj) {
   obj.classList.toggle("ActionMenuBarChange");
  
   document.getElementById("SIDEPANEL").style.width = "100%" ; //
}

function CheckFormLoad (a){ 
  alert ("FormLoaded");
}

function CheckScroll () {

  // Get the header
  var header = document.getElementById("ACTIONHEADINGSECTION");

  // Get the offset position of the navbar
  var sticky = header.offsetTop;

  // Add the sticky class to the header when you reach its scroll position. Remove "sticky" when you leave the scroll position
  
    if (window.pageYOffset > sticky) {
      header.classList.add("ActionHeaderSticky");
    } else {
      header.classList.remove("ActionHeaderSticky");
    }

}

function CheckSubmit (val){
    var next = document.getElementById ("NextButton");
    var form = document.getElementById ("WMCForm");
    var Children = form.childNodes;
    var child = Children[1];


    if (val == false){
      next.disabled = true;
      return;
    }
    var result = true;
    for (var i=0; i < Children.length; i++) {
        child = Children[i];

        if (isDivElement (child) && child.hasAttribute ("validate")){
            var Babies = child.childNodes;
            var baby = Babies[1];
            for (var b=0; b< Babies.length; b++) {
                baby = Babies [b];
              if (isInputElement (baby)) {
                if (baby.hasAttribute ("valid")){
                //  var text = baby.valid.value;
               //   alert (text);
                  if (baby.getAttribute ("valid") == "false"){
                       next.disabled = true;
                    return;
                  }
                }
              }
            }
        }
    }
    next.disabled = false;
}

function CheckSwitch (event) {

  var form = document.getElementById ('WMMForm');   
 
  var Children = form.childNodes;
  var child = Children[1];
 
 if (event.checked){
    lShowChild = true;
  } else {
    lShowChild = false;
  }

  for (var i=0; i < Children.length; i++) {
    child = Children[i];
    if (isDivElement (child) && child.hasAttribute ("parentid"))
    {
      lParentId = child.getAttribute("parentid");
      if (lParentId == event.id)
      {
        if (lShowChild){
          $(child).show();
        } else {
          $(child).hide();
        }
      }
    }
  }


}

function ClickBack (m) {
  var f = document.getElementById(glbBaseFormName);
  glb_ox = f.ox.value;
  f.ox.value = m;
  f.action.value = "Back";
  submitForm(f);

}

function ClickFilter (m) {
  var f = document.getElementById(glbBaseFormName);
  var t = document.getElementById ("SEARCH");
//  f.ox.value = m;
  f.filter.value = t.value;
  f.action.value = "Filter";
  submitForm(f);
  return false;

}

function ClickQRCode (f){

   f.style.visibility='hidden';
 
 /*
  var s1 = f.getAttribute ('size');
  var s2 = f.getAttribute ('size2');
  
 var at = f.getAttribute ('value');

 f.setAttribute('size', s2);
 f.setAttribute('size2', s1);

//  f.classList.toggle ("ActionQRCodeSmall");
  MakeQRCode (at, s2);
*/
 
}

function MakeQRCode (qrc) {
    var qrcode = new QRCode(document.getElementById("QRCODE"), {
      width : 300,
      height : 300
    });
       
    qrcode.makeCode(qrc);

}

function SA_ActionMenuChange () {
  return;
  let changeFlag = document.querySelector('.sa_ActionMenu');
  var saSide = document.getElementById("SA_Side"); 
  var isTrue = changeFlag.classList.toggle("SASideMenuChange");
  if (isTrue){
  //  saSide.style.width = "25%" ;
    saSide.style.display = "block";
  } else {
  //  saSide.style.width = "0" ;
    saSide.style.display = "none";
  }
}

function SAzipZip (event){
  var PCell = event; 
  var PRow = PCell.parentElement;   
  var Children = PRow.parentElement.childNodes;
  var child = Children[1];
  var lParentId = PRow.getAttribute ("oxr") ;
  var lRowID  = null;
  var lShowChild = false;
  
  if (PCell.hasAttribute ("xp") && PCell.getAttribute("xp") == 'Y'){

 //   PCell.classList.remove ("fa-caret-down");
  //  PCell.classList.add ("fa-caret-right");
    PCell.setAttribute("xp", "N");
  } else {
  //  PCell.classList.remove ("fa-caret-right");
  //  PCell.classList.add ("fa-caret-down");
    PCell.setAttribute("xp", "Y");
    lShowChild = true;
  }


  for (var i=0; i < Children.length; i++) {
    child = Children[i];
    if (isRowElement (child) && child.hasAttribute ("poxr")) {
        lRowId = child.getAttribute("poxr");
        if (lParentId == lRowId) {
            if (lShowChild){
              $(child).show();
            } else {
              $(child).hide();
            }

      }
    }
  }
}

function SAzipZipParent (event){
  var PCell = event; 
  var PRow = PCell.parentElement;   
  var LRows = PRow.parentElement.childNodes;
  var child = LRows[1];
  var lSwitchFlag = 'Y';
  
  if (PCell.hasAttribute ("xp") && PCell.getAttribute("xp") == 'Y'){

    PCell.classList.remove ("fa-caret-down");
    PCell.classList.add ("fa-caret-right");
    PCell.setAttribute("xp", "N");
  } else {
    PCell.classList.remove ("fa-caret-right");
    PCell.classList.add ("fa-caret-down");
    PCell.setAttribute("xp", "Y");
    lSwitchFlag = 'N';
  }


  for (var i=0; i < LRows.length; i++) {
    PRow = LRows[i];
    if (isRowElement (PRow) && PRow.hasAttribute("oxr") && PRow.childElementCount > 0) {
      child = PRow.firstElementChild;
      if (child.hasAttribute ("xp") && child.getAttribute("xp") == lSwitchFlag){
        SAzipZip(child);
      }
    }
  }
}


function Details_ActionMenuChange () {
  return;
  let changeFlag = document.querySelector('.details_ActionMenu');
  var detailsSide = document.getElementById("Details_Side"); 
  var isTrue = changeFlag.classList.toggle("DetailsSideMenuChange");
  if (isTrue){
 
     detailsSide.style.display = "block";
  } else {

    detailsSide.style.display = "none";
  }
}

function SendQRCode (n){

  //  var canv =  document.querySelector("#QRCanvas")
    var canv = document.getElementById ("QRCanvas");
 
    var f = document.getElementById("WMMForm");
 
   if (canv != null){
      f.doc.value = canv.toDataURL("image/png"); //"image/webp"    
      f.ox.value = n; 
 
//      f.submit();
      SubmitWebForm(f);
    
    return true;
  
} else {
    alert ("You cannot do this on this device sorry");
}
   

}

function SubmitAction (pAction) {
  var f = document.getElementById(glbBaseFormName);
  f.action.value = pAction;
  submitForm(f);
}

function SubmitWebForm(f){
  if (glbSubmitted) {
    return;
  }
  glbSubmitted = true;
  f.style.cursor = "wait";
  f.submit();
  glbSubmitted = false;
  f.style.cursor = "pointer";
}

function checkMessage (){
  //  alert ("Check Message");
  var n = document.getElementById ("ERRORMESSAGE");
  if (typeof(n) != 'undefined' && n != null && n.innerHTML != null){

    n.className = "show";

  // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ n.className = n.className.replace("show", ""); }, 3000);

  }
   var q = document.getElementById ("QRCODE");
  if (typeof(q) != 'undefined' && q != null ) {
      var at = q.getAttribute ('value');
      var sz = q.getAttribute ('size');
      MakeQRCode (at, sz);
  }
   var r = document.getElementById ("GOTOPAGE");
   if (typeof(r) != 'undefined' && r != null ) {
     var newTab = window.open (r.getAttribute ('value'), '_blank');

    if (newTab == null || typeof(newTab)=='undefined'){
      
        var btn = r.createElement("BUTTON");
        btn.addAttribute ("onclick", "window.location='" & r.getAttribute ('value') & " ';");
        btn.innerHTML = "CLICK HERE to open PDF"; 
            //   alert("The Page has been blocked by your Pop-up blocker\n\nWe try to open the following url:\n"+url);
    } else {
       newTab.focus();
    }
  }

}

function checkPasswordMatch() {
    var password = $("#et_EntityAPassword_1").val();
    var confirmPassword = $("#et_EntityAPassword_2").val();

    if (password != confirmPassword){
         CheckSubmit (false);

     //   $("#divCheckPasswordMatch").html("Passwords do not match!");
    } else {
        $("#et_EntityAPassword_1").attr ("valid", "true");
        $("#et_EntityAPassword_2").attr ("valid", "true");
        CheckSubmit (true);
    }
}

function checkPasswordMatch1() {
    var password = $("#et_EntityAPassword").val();
    var confirmPassword = $("#et_EntityAPassword2").val();

    if (password != confirmPassword){
         CheckSubmit (false);

     //   $("#divCheckPasswordMatch").html("Passwords do not match!");
    } else {
        $("#et_EntityAPassword").attr ("valid", "true");
        $("#et_EntityAPassword2").attr ("valid", "true");
        CheckSubmit (true);
    }
}

function closeNav() {
  document.getElementById("SIDEPANEL").style.width = "0";
}

function highlightOption(clickedElement, value) {
    // Remove highlight from all options
    const allOptions = document.querySelectorAll('.Option');
    allOptions.forEach(option => {
        option.classList.remove('option-selected');
    });
    

    let elementToHighlight;
    
    if (value && value.startsWith('s')) {
        // If value starts with 's', highlight the parent Option
        elementToHighlight = clickedElement.closest('.Option').parentElement;
        // Fallback to current option if parent isn't found or isn't an Option
        if (!elementToHighlight || !elementToHighlight.classList.contains('Option')) {
            elementToHighlight = clickedElement.closest('.Option');
        }
    } else {
        // If value doesn't start with 's', highlight the current Option
        elementToHighlight = clickedElement.closest('.Option');
    }
    
    // Add highlight
    if (elementToHighlight && elementToHighlight.classList.contains('Option')) {
        elementToHighlight.classList.add('option-selected');
    }

}

// Alternative: If you prefer to pass the option ID instead of the element
function highlightOptionById(optionId) {
    // Remove highlight from all options
    const allOptions = document.querySelectorAll('.Option');
    allOptions.forEach(option => {
        option.classList.remove('option-selected');
    });
    
    // Add highlight to the specified option
    const targetOption = document.getElementById(optionId);
    if (targetOption) {
        targetOption.classList.add('option-selected');
    }
}



function delaySubmit () {
   setTimeout(function(){document.getElementById(glbBaseFormName).submit()}, 2000);
}

function getBetweenDelim(pSourceString, pStartDelim, pEndDelim){
  var lStartPos = 0;
  var lEndPos = 0;
  var lReturn = "";
  if (pSourceString == null || pSourceString == "" ||
      pStartDelim == null || pStartDelim == "" ||
      pEndDelim == null || pEndDelim == "" ){
      return lReturn;
  }
  lStartPos = pSourceString.indexOf(pStartDelim);
  if (lStartPos == -1 ){
    return lReturn;
  }
  lStartPos += pStartDelim.length;
  lEndPos = pSourceString.indexOf(pEndDelim, lStartPos);
  if (lEndPos == -1 || lEndPos == lStartPos){
    return lReturn;
  }
  lEndPos -= 1;
  lReturn = pSourceString.substring(lStartPos, lEndPos).trim();
  if (lReturn == null) {
    lReturn = "&nbsp;"
  }
  return lReturn;
}

function isDivElement(obj) {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLDivElement;
  }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}

function isInputElement (obj){
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLInputElement || obj instanceof HTMLTextAreaElement;
  }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}

function isNumberKey(evt){
  var charCode = (evt.which) ? evt.which : event.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57))
    return false;
  return true;
}

function isRowElement(obj) {
  try {
    //Using W3 DOM2 (works for FF, Opera and Chrome)
    return obj instanceof HTMLTableRowElement;
  }
  catch(e){
    //Browsers not supporting W3 DOM2 don't have HTMLElement and
    //an exception is thrown and we end up here. Testing some
    //properties that all elements have (works on IE7)
    return (typeof obj==="object") &&
      (obj.nodeType===1) && (typeof obj.style === "object") &&
      (typeof obj.ownerDocument ==="object");
  }
}

function jgsLoadInitialise() {


  /* clear initial text values */
  var element = document.getElementById("A_Options");


  element = document.getElementById("SA");

  element = document.getElementById("SA_ActionMenu");


  element = document.getElementById("Details");
  element.innerHTML = "&nbsp;";

  element = document.getElementById("Footer");
  element.innerHTML = "&nbsp";

}

function processFilter () {
    var Options = document.getElementById ("A_Options");
    var Filter = document.getElementById ("SEARCH");
    var Children = Options.childNodes;
    var Child = Children[1];
    var Baby = Children[1];
    var FilterText = Filter.value.toUpperCase ();
    var Found  = false;
    var lParent = null;
    var lIcon = null;
    for (var i=0; i < Children.length; i++) {
        Child = Children[i];

       

        //alert (child + "   " + i);
        if (isDivElement (Child) && Child.hasAttribute ("id")){
             if (Child.hasAttribute ("xp")){
                 $(Child).show(); 

             } else {

    
                if (FilterText == ""){   
                  if (Child.hasAttribute ("parentid")){
                    lParent = document.getElementById  (Child.getAttribute ("parentid"));
                    lIcon = lParent.getElementsByTagName('I')[0];
                    if (lIcon != null) {
                      if (lIcon.classList.contains ("fa-caret-down")) {
                         $(Child).show(); 
                      } else {
                         $(Child).hide(); 
                      }
                    } else {
                       $(Child).hide(); 
                    }                     
                  } else {      
                    $(Child).show();
                  }
                } else {
                      Found = false;
                      for (var c=0; c<Child.childNodes.length; c++){
                            Baby = Child.childNodes[c];
                            if (isDivElement (Baby) && Baby.innerText.toUpperCase().search (FilterText) >=0){
                               Found = true;
                               break;
                            }
                            if (isDivElement (Baby) && Baby.hasAttribute ("srch")) {
                              let lSrch = Baby.getAttribute ("srch");  
                              if (lSrch.toUpperCase().search (FilterText) >=0){
                                Found = true;
                                break;
                              }
                            }
                            

                      }  
                      if (Found) {
                        $(Child).show(); 

                      } else {
                        $(Child).hide();
                      
                     };
                }; 
            }         
        }
    }
}




function submitAddRemove (n) {
  var f = document.getElementById(glbBaseFormName);
  f.oxs.value = n;
  var selectedIds = $('.Option_Selected').map(function() {
        return this.id;
      }).get();
  f.choices.value = selectedIds;  
  submitForm(f);
  f.oxs.value = "";
}

function submitAddRemoveSorted (n) {
  var f = document.getElementById(glbBaseFormName);
  f.oxs.value = n;
  var selectedIds = $('.SelectSorted').map(function() {
        return this.getAttribute("data-id");
      }).get();
  f.choices.value = selectedIds;  
  submitForm(f);
  f.oxs.value = "";
}

function submitFile (n) {
 
  var f = document.getElementById(glbBaseFormName);
  var file = document.querySelector('input[type=file]').files[0];
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onloadend = function () {
    //   f.filename.value = file.name;
       f.doc.value = reader.result;//reader.result;
      submitForm(f);
   };

   reader.onerror = function (error) {
     console.log('Error: ', error);
   };  
}

var lFileHandle = null;
var lBlockSize = null;
var lNumberOfChunks = null;
var lByteIndex = 0;
var lByteEnd = 0;
var lChunk = null;
var lChunkNumber = 0;
var reader = null;
var fileToUpload = null;

function submitFileSplit (n){
  if (glbSubmitted) {
    return;
  }
  
  // send the file as chunks then submit the form
 
  

  showProcessingForAction ("Loading files");
  //  stop other stuff from happening
  window.document.body.style.cursor = "wait"; 
  glbSubmitted = true;

  //  first get the file into the reader
  var f = document.getElementById(glbBaseFormName);

// Get the file from any of the three input methods:

// 1. From the file input
const fileFromInput = document.getElementById('fileInput').files[0];

// 2. From the camera input
const fileFromCamera = document.getElementById('cameraInput').files[0];

// 3. For clipboard, we already set it to the fileInput when pasted
// So you can use fileFromInput above

// Check which one has a file and use that
  
  fileToUpload = null;
  if (fileFromInput) {
    fileToUpload = fileFromInput;
    submitFile_DestinationHandle();
  } else if (fileFromCamera) {
    
   compressImage(fileFromCamera, {
      maxWidth: 1200,
      quality: 0.7
  })
  .then(function(compressedFile) {
    // Log compression results
    console.log('Original size: ' + (fileFromCamera.size / 1024) + ' KB');
    console.log('Compressed size: ' + (compressedFile.size / 1024) + ' KB');
    
    fileToUpload = compressedFile;
    
  
  submitFile_DestinationHandle();
 
  }  )
  .catch(function(error) {
    console.error('Compression failed:', error);
    hideProcessing ();
    window.document.body.style.cursor = "auto"; 
    glbSubmitted = false;
  }); 
}
}


function submitFileSplit(n) {
    if (glbSubmitted) {
        return;
    }
    
    // send the file as chunks then submit the form
    showProcessingForAction("Loading files");
    //  stop other stuff from happening
    window.document.body.style.cursor = "wait"; 
    glbSubmitted = true;

    //  first get the file into the reader
    var f = document.getElementById(glbBaseFormName);

    // Get the file from any of the three input methods:
    // 1. From the file input
    const fileFromInput = document.getElementById('fileInput').files[0];

    // 2. From the camera input
    const fileFromCamera = document.getElementById('cameraInput').files[0];

    // 3. For clipboard, we already set it to the fileInput when pasted
    // So you can use fileFromInput above

    // Check which one has a file and use that
    fileToUpload = null;
    if (fileFromInput) {
        fileToUpload = fileFromInput;
        submitFile_DestinationHandle();
    } else if (fileFromCamera) {
        compressImage(fileFromCamera, {
            maxWidth: 1200,
            quality: 0.7
        })
        .then(function(compressedFile) {
            // Log compression results
            console.log('Original size: ' + (fileFromCamera.size / 1024) + ' KB');
            console.log('Compressed size: ' + (compressedFile.size / 1024) + ' KB');
            
            fileToUpload = compressedFile;
            submitFile_DestinationHandle();
        })
        .catch(function(error) {
            console.error('Compression failed:', error);
            hideProcessing();
            window.document.body.style.cursor = "auto"; 
            glbSubmitted = false;
        }); 
    }
}

function submitFile_DestinationHandle() {
    // Reset all variables at start
    lFileHandle = null;
    lBlockSize = null;
    lNumberOfChunks = null;
    lByteIndex = 0;
    lByteEnd = 0;
    lChunk = null;
    lChunkNumber = 0;
    reader = new FileReader();
    
    var lObj = {};
    var lResponse = {};

    //  make a call to jade requesting a destination file handle (Jade OID) - specify file size
    lObj["systemName"] = glbSystemName;  
    lObj["formName"] = "FileDestinationHandle";
    lObj["fileName"] = Conversions.base32.encode(fileToUpload.name);
    lObj["vin"] = Conversions.base32.encode(fileToUpload.size.toString());
    lObj["sid"] = Conversions.base32.encode(glb_sid);
    lObj["rid"] = generateRandomString();

    var lJson = JSON.stringify(lObj);
    
    console.log('Requesting destination handle for file:', fileToUpload.name, 'Size:', fileToUpload.size);
  
    JadeRestRequest(lJson)
    .then(response => {
        try {
            var lResponse;
            if (glbReponseEncoded) {
                lResponse = atob(response);
            } else {
                lResponse = response; 
            }
            
            var lJadeData = JSON.parse(lResponse);
            console.log('Destination handle response:', lJadeData);

            if (Object.keys(lJadeData).length > 0 && lJadeData.fileHandle) {
                lFileHandle = lJadeData.fileHandle;
                lBlockSize = lJadeData.blockSize;
                lNumberOfChunks = Math.ceil(fileToUpload.size / lBlockSize);
                
                console.log('Got file handle:', lFileHandle, 'Block size:', lBlockSize, 'Number of chunks:', lNumberOfChunks);
                
                // Reset chunk counter and start uploading
                lChunkNumber = 0;
                submitFile_NextChunk();
            } else {
                throw new Error('No file handle received from server');
            }
        } catch (error) {
            console.error('Error parsing destination handle response:', error);
            glbSubmitted = false;
            hideProcessing();
            window.document.body.style.cursor = "auto"; 
           showFooterError("Error parsing server response - please contact Torro Software");
         }
    })
    .catch(error => {
        console.error("File chunk handle request error:", error);
        glbSubmitted = false;
        hideProcessing();
        window.document.body.style.cursor = "auto"; 
        showFooterError("Sorry - we are unable to process your request - please contact Torro Software");
    });
}
  
function submitFile_NextChunk() {
    //  send each chunk
    lChunkNumber += 1;
    
    console.log('Preparing chunk', lChunkNumber, 'of', lNumberOfChunks);
    
    //  should never happen
    if (lChunkNumber > lNumberOfChunks) {
        console.error('Chunk number exceeds total chunks!');
        return;
    }

    lByteEnd = Math.ceil((fileToUpload.size / lNumberOfChunks) * lChunkNumber);
    lChunk = fileToUpload.slice(lByteIndex, lByteEnd);
    
    console.log('Chunk', lChunkNumber, 'bytes:', lByteIndex, 'to', lByteEnd, 'size:', lChunk.size);
    
    lByteIndex += (lByteEnd - lByteIndex);
      
    reader.readAsDataURL(lChunk);
    reader.onloadend = function() {
        console.log('Chunk', lChunkNumber, 'read successfully, data length:', reader.result.length);
        submitFile_SendChunk(reader.result, lChunkNumber, lNumberOfChunks);
    };
    
    reader.onerror = function(error) {
        console.error('Next Chunk Error:', error);
        glbSubmitted = false;
        hideProcessing();
        window.document.body.style.cursor = "auto"; 
        showFooterError("Error reading file chunk - please contact Torro Software");
    };
}

function submitFile_SendChunk(pChunk, pChunkNumber, pNumberOfChunks) {
    var lObj = {};
    var lStatus = null;
    var lPercent = ((100 * pChunkNumber) / pNumberOfChunks).toFixed();
    var f = document.getElementById(glbBaseFormName);
    
    console.log('Sending chunk', pChunkNumber, 'of', pNumberOfChunks, 'Progress:', lPercent + '%');
    
    lObj["systemName"] = glbSystemName;  
    lObj["formName"] = "FileChunkSave";
    lObj["vin"] = Conversions.base32.encode(lFileHandle);
    lObj["doc"] = pChunk;
    lObj["sid"] = Conversions.base32.encode(glb_sid);
    lObj["rid"] = generateRandomString();
    lObj["ck"] = pChunkNumber.toString();
    lObj["ct"] = pNumberOfChunks.toString();
    
    var lJson = JSON.stringify(lObj);
    
    showFooterError("Uploading file " + fileToUpload.name + " " + lPercent + '% Complete');

    JadeRestRequest(lJson)
    .then(response => {
        try {
            var lResponse;
            if (glbReponseEncoded) {
                lResponse = atob(response);
            } else {
                lResponse = response; 
            }
            
            var lJadeData = JSON.parse(lResponse);
            console.log('Chunk', pChunkNumber, 'response:', lJadeData);

            if (Object.keys(lJadeData).length > 0) {
                lStatus = lJadeData.status;
                console.log('Chunk', pChunkNumber, 'status:', lStatus);
                
                if (lStatus === "Complete" || pChunkNumber >= pNumberOfChunks) {
                    console.log('Upload complete! Submitting form with file handle:', lFileHandle);
                    //  submit the form
                    //  update the form to include the destination file handle
                    glbSubmitted = false;
                    var f = document.getElementById(glbBaseFormName);
                    f.doc.value = lFileHandle;
                    submitForm(f);
                    
                } else if (lStatus === "Done") {
                    console.log('Chunk', pChunkNumber, 'completed, sending next chunk');
                    submitFile_NextChunk();
                    
                } else if (lStatus === "Error") {
                    console.error('Server reported error for chunk', pChunkNumber, ':', lJadeData.error);
                    glbSubmitted = false;
                    hideProcessing();
                    window.document.body.style.cursor = "auto"; 
                    showFooterError("Server error processing chunk - please contact Torro Software");
                    
                } else {
                    console.warn('Unknown status for chunk', pChunkNumber, ':', lStatus);
                    // Continue anyway
                    submitFile_NextChunk();
                }
            } else {
                console.error('Empty response for chunk', pChunkNumber);
                glbSubmitted = false;
                hideProcessing();
                window.document.body.style.cursor = "auto"; 
                showFooterError("Empty server response - please contact Torro Software");
            }
        } catch (error) {
            console.error('Error parsing chunk response:', error);
            glbSubmitted = false;
            hideProcessing();
            window.document.body.style.cursor = "auto"; 
            showFooterError("Error parsing server response - please contact Torro Software");
        }
    })
    .catch(error => {
        console.error("Send chunk error:", error);
        showFooterError("Network error sending chunk - please contact Torro Software: " + error);
        glbSubmitted = false;
        hideProcessing();
        window.document.body.style.cursor = "auto"; 
    });
}




function submitFile_web (n) {
 
  var f = document.getElementById(glbBaseFormName);
  var file = document.querySelector('input[type=file]').files[0];
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onloadend = function () {
       
       f.doc.value = reader.result;//reader.result;
       f.submit();
   };

   reader.onerror = function (error) {
     console.log('Error: ', error);
   };  
}


function loadLogon_New() {
  var object = {};
  object["formName"] = "WMCLogon";

  var json = JSON.stringify(object);
  json = json.replace("}", ',"systemName":"' + glbSystemName + '"}');
 

JadeRestRequest (json)
  .then (response =>  
      {
     PopulatePanels (response);
     })
      .catch(error => {
    //   console.warn("getJSON error, status:" + " error:" + error + " response:" );
       showFooterError("Rest Request - Sorry - we are unable to process your request - please contact Torro Software " + error );
       glbSubmitted = false;
       hideProcessing ();
       window.document.body.style.cursor = "auto"; 
    // Handle login failure here
  });
}


function loadLogon() {
  var object = {};
  object["formName"] = glbBaseFormLogon;

  var url = glbLogonUrl;
  var json = JSON.stringify(object);




  $.postJSON_JGS(url, json, function(loadLogonData){
  if (glbReponseEncoded){
           var lJadeData = atob (loadLogonData);
    } else {
           var lJadeData = (loadLogonData);
    }


    if (lJadeData == null || lJadeData == ""){
      lJadeData = "Request failed to respond";
    }
    document.getElementById("Action").innerHTML = lJadeData;

    var element = document.getElementById("systemName");
    if (typeof(element) != 'undefined' && element != null  ) {
      if (element.value != glbSystemName){
        alert('Version error. Expecting system:"' + element.value + '", current system:"' + glbSystemName + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
        showFooterError("There is a system name version error (" + element.value + " / " + glbSystemName + ") - please contact Torro Software");
        return;
      }
    }
    element = document.getElementById("systemVersion");
    if (typeof(element) != 'undefined' && element != null  ) {
      if (element.value != glbSystemVersion){
        alert('Version error. Expecting system version:"' + element.value + '", current version:"' + glbSystemVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
        showFooterError("There is a system version error (" + element.value + " / " + glbSystemVersion + ") - please contact Torro Software");
        return;
      }
    }
    element = document.getElementById("scriptVersion");
    if (typeof(element) != 'undefined' && element != null  ) {
      if (element.value != glbVersion){
        alert('Version error. Expecting script version:"' + element.value + '", current version:"' + glbVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
        showFooterError("There is a script version error (" + element.value + " / " + glbVersion + ") - please contact Torro Software");
        return;
      }
    }

    showFooterError("Welcome to " + glbSystemName );
    checkForStoredImages ();

  })
    .fail(function(){
      showFooterError("Request for logon form has failed - please contact Torro Software");
    });


  /* clear initial text values */
  var element = document.getElementById("A_Options");
  element.innerHTML = "&nbsp;";


  element = document.getElementById("SA");
  element.innerHTML = "&nbsp;";

  element = document.getElementById("Details");
  element.innerHTML = "&nbsp;";


  }


function submitForm(formElement) {

  if (glbSubmitted) {
    return;
  }

  var lOz = formElement.oz;
  if (typeof(lOz) == 'undefined' || lOz == null  || lOz.value != "Rest" ) {
    formElement.submit();
    return;
  }

  glbSubmitted = true;

  showProcessingForAction ("");
  window.document.body.style.cursor = "wait"; 

  var win = window;
  var formData = new FormData(formElement);
  var object = {};
  var lSectionHtml = "";
  var lUrl = "";
  var lValue = "";
  var lHaveAction = false;
  var lHaveSA = false;
  var lHaveSALines = false;
  
  object["formName"] = formElement.name;
  formData.forEach((value, key) => {
 

  if (key == "doc") {
       lValue = value;
  } else if (key == "fileName") {
       lValue = Conversions.base32.encode(value.name);
  } else if (key == "file") {
       lValue = Conversions.base32.encode(value.name);
  } else if (key == "rid") {
      lValue = generateRandomString ();
  } else {
     cleanedText = value.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
     cleanedText = cleanedText.replace(/<0x[0-9A-Fa-f]{1,2}>/gi, '');   
     cleanedText = cleanedText.replace(/[–—]/g, '-');
     lValue = Conversions.base32.encode(cleanedText);
  
  }


  if(!Reflect.has(object, key)){
      object[key] = lValue;
      return;
  }
  if(!Array.isArray(object[key])){
      object[key] = [object[key]];
  }
  object[key].push(lValue);
});

var json = JSON.stringify(object);
json = json.replace("}", ',"systemName":"' + glbSystemName + '"}');
lUrl = glbPostRestUrl;


JadeRestRequest (json)
  .then (response =>  
      {
     PopulatePanels (response);
     })
      .catch(error => {
       glbSubmitted = false;
       hideProcessing ();
       window.document.body.style.cursor = "auto"; 

  });
}

function PopulatePanels (pResponse){
   
  if (glbReponseEncoded){
      var xJadeData =  atob (pResponse);
  } else {
      var xJadeData = pResponse; 
  }
    var newData = xJadeData.replace(/\\r\\n/g, '\r\n');

    var lJadeData =  newData; // atob (newData);
    var match = null;
    lHaveAction = false;
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- VersionSection -->", "<!-- End_VersionSection -->");
  
    if (lSectionHtml != "" ){
        var lSystemName  = getBetweenDelim(lSectionHtml, "SystemName=", "!");
        var lSystemVersion  = getBetweenDelim(lSectionHtml, "SystemVersion=", "!");
        var lScriptVersion  = getBetweenDelim(lSectionHtml, "ScriptVersion=", "!");
        if (lSystemName != glbSystemName){
            alert('Version error. Expecting system:"' + lSystemName + '", current system:"' + glbSystemName + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
            return;
        }
        if (lSystemVersion != glbVersion){
            alert('Version error. Expecting system version:"' + lSystemVersion + '", current version:"' + glbSystemVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
            return;
        }
        if (lScriptVersion != glbVersion){
            alert('Version error. Expecting script version:"' + lScriptVersion + '", current version:"' + glbVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
            return;
        }
    }
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- ActionSection -->", "<!-- End_ActionSection -->");
       //  console.log('Action string: ' + lSectionHtml);
    if (lSectionHtml != "" ){
        document.getElementById("Action").innerHTML = lSectionHtml;
        var searchElement = document.getElementById ("SEARCH");
        if (isInputElement (searchElement)){
            var end = searchElement.value.length;
              searchElement.setSelectionRange(end, end);
              searchElement.focus();
        }
        
        lHaveAction = true;
    }
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- A_OptionsSection -->", "<!-- End_A_OptionsSection -->");
        // console.log('AOptions string: ' + lSectionHtml);
    if (lSectionHtml != "" ){
          var element = document.getElementById("A_Options");
          element.scrollTop = 0;
          $(element).html(lSectionHtml);

          var searchElement = document.getElementById ("SEARCH");
          if (isInputElement (searchElement)){
              var end = searchElement.value.length;
              searchElement.setSelectionRange(end, end);
              searchElement.focus();
          }

      const regex = /scrolltome="([^"]+)"/i;
       match = lSectionHtml.match(regex);
       if (match){
        console.log(match[1]);
         }
    } else if (lHaveAction) {
        var element = document.getElementById("A_Options");
        element.innerHTML = "&nbsp;";
  
        var searchElement = document.getElementById ("SEARCH");
        if (isInputElement (searchElement)){
             var end = searchElement.value.length;
              searchElement.setSelectionRange(end, end);
              searchElement.focus();
        }
    }
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- SASection -->", "<!-- End_SASection -->");
    if (lSectionHtml != "" ){
        var element = document.getElementById("SA");
         element.style.display = "block";
         element.innerHTML = lSectionHtml;
         lHaveSA  = true;
    }
   
     
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- SASideSection -->", "<!-- End_SASideSection -->");
    /*
    if (lSectionHtml != "" ){
      
        document.getElementById("SA_Side").innerHTML = lSectionHtml;
        if (lSectionHtml != "&nbsp;" ){

            document.getElementById("SA_ActionMenu").style.display = "block";

        } else {
            document.getElementById("SA_ActionMenu").style.display = "none";

        }
    }
    */


    lSectionHtml = getBetweenDelim(lJadeData, "<!-- DetailsSection -->", "<!-- End_DetailsSection -->");
    if (lSectionHtml != "" ){
         document.getElementById("Details").innerHTML = lSectionHtml;
    }

    lSectionHtml = getBetweenDelim(lJadeData, "<!-- MessageSection -->", "<!-- End_MessageSection -->");
    if (lSectionHtml != "" ){
         showFooterError(lSectionHtml);
    }
      
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- DocLinkSection -->", "<!-- End_DocLinkSection -->");
    if (lSectionHtml != "" ){
      if (lSectionHtml.indexOf("<html>") >= 0) {
        win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
        win.document.documentElement.innerHTML = lSectionHtml;
      } else {
        lPos = lSectionHtml.indexOf(';');
        lPos2 = lSectionHtml.indexOf (';base64,',lPos);
        var lFilename = lSectionHtml.substring(0, lPos);
        var lElement = lSectionHtml.substring(lPos2+8);

        pdfManager.openPDF(lElement, lFilename,'pdf-container') ; 

      }
    }
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- ScriptsSection -->", "<!-- End_ScriptsSection -->");
    if (lSectionHtml != "" ){
        eval(lSectionHtml);
    }

    //formElement.action.value = null;
    //  reinstate the ox so that the next button click will be for the correct step (has been changed by submitValue)
    if (glb_ox != "") {
    //  formElement.ox.value = glb_ox;
    }

    var f = document.getElementById(glbBaseFormName);
    if (f.sid){
      glb_sid = f.sid.value;
    }
   
    checkForStoredImages ();
    hideProcessing ();
    window.document.body.style.cursor = "auto"; 
   // resizePanels();

   if (match){
        setTimeout(() => {

        scrollToElement(match[1],"A_Options");
    }, 100);
        
    }
    glbSubmitted = false;
    glb_ox = "";

    

    var lElement = document.getElementById ("vin");
    if (lElement){lElement.focus();}  

    }
  

function showProcessingForAction(optionDesc) {
    let message =  `Processing ${optionDesc}...`;
    
    showProcessing(message);
}  

let processingTimeout = null;

function showProcessing(message = 'Processing...', delay = 1000) {
    // Clear any existing timeout
    if (processingTimeout) {
        clearTimeout(processingTimeout);
        processingTimeout = null;
    }
    
    processingTimeout = setTimeout(() => {
        const overlay = document.getElementById('processingOverlay');
        const text = document.getElementById('processingText');
        
        if (text) {
            text.textContent = message;
        }
        
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
        
        console.log('Processing overlay shown:', message);
        processingTimeout = null; // Clear the timeout ID
    }, delay);
}

function hideProcessing() {
    // Cancel the pending timeout if it exists
    if (processingTimeout) {
        clearTimeout(processingTimeout);
        processingTimeout = null;
        console.log('Processing overlay timeout cancelled');
    }
    
    const overlay = document.getElementById('processingOverlay');
    
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    console.log('Processing overlay hidden');
}
function scrollToElement(elementId, containerId) {
    const container = document.getElementById(containerId);
    const element = document.getElementById(elementId);
    
    if (container && element && container.contains(element)) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
      
        
        // More detailed calculation
        const relativeTop = elementRect.top - containerRect.top;
        
        const scrollTop = elementRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
        
        // Try different scroll approaches
        container.scrollTop = scrollTop;
        
        return true;
    }
    return false;
}

function submitForm_web (n) {
  n.submit();
}


function submitValue(clickedElement, value) {

  var f = document.getElementById(glbBaseFormName);
  glb_ox = f.ox.value;
  f.oxs.value = value;

  highlightOption (clickedElement, value);

//  f.submit();
  submitForm(f);
  f.oxs.value = "";
}


function toggleAddRemove (event) {
  var element = event;  
   $(element).toggleClass('Option_Selected');
   var selectedIds = $('Option_Selected').map(function() {
        return this.id;
      }).get();
//  console.log(selectedIds);
}

function toggleAddRemoveSorted (event) {
  var element = event
  if (element.hasAttribute("data-id")) {return}
  var lAddRemoveSorted = document.getElementById("AddRemoveSorted");
  var lNoItems = document.getElementById("ars-noItems");
  if (!$(element).hasClass("Option_Selected")) {    
    var lNew = $(element).clone();
    $(lNew).attr("data-id", element.id);
    $(lNew).addClass("SelectSorted");
    $(lNew).appendTo(lAddRemoveSorted);
    if (lAddRemoveSorted.childElementCount > 1 && $(lNoItems).hasClass("d-block")){
      $(lNoItems).toggleClass("d-block d-none");
    }
  } else {
    var lRem = $("[data-id=" + element.id + "]");
    if (lRem) {$(lRem).remove()}
    if (lAddRemoveSorted.childElementCount == 1 && $(lNoItems).hasClass("d-none")){
      $(lNoItems).toggleClass("d-block d-none");
    }
  }
  $(element).toggleClass("Option_Selected");
}

function updateLabel (labelName, ele) {
    var f = document.getElementById(labelName);
    if (ele.value != null){
        f.classList.add ("Option_Label_Show");
    } else {
       f.classList.remove ("Option_Label_Show");
    }
    CheckSubmit ();
}



function validatePassword (labelName, pword){
   if (pword.value.length > 5) {
     pword.setAttribute ("valid", "true");
    updateLabel (labelName, pword);
    
    return (true);
  } else {
    pword.setAttribute ("valid", "false");
    alert("Your Password must be at least 6 Characters!");
    CheckSubmit (false);
    return (false);
  }
}

function validatePassword2 (labelName, password1, pword){
      var p = document.getElementById(password1);
      if (p.value != pword.value) {
         pword.setAttribute ("valid", "false");
        alert("The 2 passwords do not match!");  
        CheckSubmit (false);
        return false;
      } else {
         pword.setAttribute ("valid", "true");
          updateLabel (labelName, pword);

        return true;
      }
}



function zipZip (event){
  var form = event.parentElement;   
  var len = event.id.length;
  var Children = form.childNodes;
  var child = Children[1];
  var Icon = event.getElementsByTagName('I')[0];
  var lParentId = null;
  var lShowChild = false;
  
  if (event.hasAttribute ("xp") && event.xp == 'Y'){
 //   Icon.classList.remove ("fa-caret-down");
  //  Icon.classList.add ("fa-caret-right");
    event.xp = 'N';
  } else {
  //  Icon.classList.remove ("fa-caret-right");
  //  Icon.classList.add ("fa-caret-down");
    event.xp = 'Y';
     lShowChild = true;
  }


  for (var i=0; i < Children.length; i++) {
    child = Children[i];
    if (isDivElement (child) && child.hasAttribute ("parentid")) {
          lParentId = child.getAttribute("parentid");
        if (lParentId == event.id) {
            if (lShowChild){
              $(child).show();
            } else {
              $(child).hide();
            }
        }
    }
  }
}

var DragDrop_SelectedElement = null;
function allowDrop(ev) {
  ev.preventDefault();
}

function dragStart(ev) {
  DragDrop_SelectedElement = getDragDropOption (ev.target);
}

function dragDrop(ev) {
  var lOption = null;
  var lActionList = null;
  ev.preventDefault();
 
  lOption = getDragDropOption (ev.target);
  lActionList = document.getElementById ('DragDropOptions'); 
  lActionList.insertBefore (DragDrop_SelectedElement, lOption);
  DragDrop_SelectedElement = null;
}

function submitDragDrop (n) {
  var f = document.getElementById(glbBaseFormName);
  var selectedIds = $('.Option_DragDrop').map(function() {
        return this.id;
      }).get();
  f.choices.value = selectedIds;  
  submitForm(f);
}

function getDragDropOption (pElement)  {

  var rCheckElement = pElement;
  
  while (rCheckElement != null) {
    if (rCheckElement.hasAttribute("name") && (rCheckElement.getAttribute ("name") == 'DragDropOption')){
       return rCheckElement;
      }
      rCheckElement =              rCheckElement.parentElement;
  }
  return null;
}




function ClickBack_Web (m) {
  var f = document.getElementById("WMMForm");
  f.ox.value = m;
  f.action.value = "Back";
//  f.submit();
  SubmitWebForm(f);

}

  function clickRegister_Web () {
  var f = document.getElementById("ACTIONLOGON");
   f.action.value = "Register";
//  f.submit();
  SubmitWebForm(f);

  }

   function clickLogon_Web () {
  var f = document.getElementById("ACTIONLOGON");
   f.action.value = "Logon";
//  f.submit();
  SubmitWebForm(f);

  }


function ClickFilter_Web (m) {
  var f = document.getElementById("WMMForm");
  var t = document.getElementById ("SEARCH");
//  f.ox.value = m;
  f.filter.value = t.value;
  f.action.value = "Filter";
//  f.submit();
  SubmitWebForm(f);
  return false;

}

function CheckSubmit_Web (val){
    var next = document.getElementById ("NextButton");
    var form = document.getElementById ("WMMForm");
    var Children = form.childNodes;
    var child = Children[1];


    if (val == false){
      next.disabled = true;
      return;
    }
    var result = true;
    for (var i=0; i < Children.length; i++) {
        child = Children[i];

        if (isDivElement (child) && child.hasAttribute ("validate")){
            var Babies = child.childNodes;
            var baby = Babies[1];
            for (var b=0; b< Babies.length; b++) {
                baby = Babies [b];
              if (isInputElement (baby)) {
                if (baby.hasAttribute ("valid")){
                //  var text = baby.valid.value;
               //   alert (text);
                  if (baby.getAttribute ("valid") == "false"){
                       next.disabled = true;
                    return;
                  }
                }
              }
            }
        }
    }
    next.disabled = false;
}
function SubmitAction_Web (pAction) {
  var f = document.getElementById("WMMForm");
  f.action.value = pAction;
  submitForm(f);
}


function submitAddRemove_Web (n) {
  var f = document.getElementById("WMMForm");
  var selectedIds = $('.Option_Selected').map(function() {
        return this.id;
      }).get();
  f.choices.value = selectedIds;  

  SubmitWebForm(f);
}
function submitValue_Web (n) {
  //document.body.style.cursor = 'wait';
  
  var str = getBetweenDelim (n + "~", ".","~");
  var option = document.getElementById (str);
  if (typeof(option) != 'undefined' && option != null){
    option.disabled = true;
  }

  $('#'+str).toggleClass('Option_Inactive');

  var f = document.getElementById("WMMForm");
  f.ox.value = n;
  f.submit();
}





  function JadeRestRequest (formData, options = {}) {
  // Default options
  const config = {
    maxRetries: options.maxRetries || 3,           // Maximum number of retry attempts
    retryDelay: options.retryDelay || 1000,        // Delay between retries in ms
    timeout: options.timeout || 30000,             // Request timeout in ms
    forceXHR: options.forceXHR || false,           // Force XMLHttpRequest instead of fetch
    debug: options.debug || false,                 // Enable detailed logging
    url: options.url || glbPostRestUrl
  };
  
  // Track retry count
  let retryCount = 0;
  
  // Set up logging based on debug flag
  const log = config.debug 
    ? (...args) => console.log(`[JSON Login]`, ...args)
    : () => {};
    
  const logError = config.debug
    ? (...args) => console.error(`[JSON Login ERROR]`, ...args)
    : () => {};
  
  
  
  // Create the request function with retry logic
  const makeRequest = (data, retries) => {
    return new Promise((resolve, reject) => {
     // const normalizedData = data; //normalizeData(data);
      
      // Convert to JSON string
      var jsonData = data; 
     console.log(`Attempt ${retries + 1}/${config.maxRetries + 1} - Sending JSON data:`, jsonData);
      
      // Create an abort controller for timeout handling with fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      //  logError(`Request timed out after ${config.timeout}ms`);
      }, config.timeout);
      
      // Choose between fetch and XMLHttpRequest
      if (!config.forceXHR && 'fetch' in window) {
       console.log('Using fetch API with JSON payload');
        
        fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': "*/*", 
            'Cache-Control': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            // Add a random header to prevent caching
            'X-Request-ID': `torro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          },
          body: jsonData,
          credentials: 'include',
          mode: 'cors',
          signal: controller.signal
        })
        .then(response => {
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
         console.log('Request successful!');
          resolve(data);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          logError('Fetch error:', error);
          
          // Determine if we should retry
          if (retries < config.maxRetries) {
           console.log(`Retrying in ${config.retryDelay}ms...`);
            setTimeout(() => {
              makeRequest(data, retries + 1)
                .then(resolve)
                .catch(reject);
            }, config.retryDelay);
          } else {
            // Fall back to XMLHttpRequest on the last retry
           console.log('Falling back to XMLHttpRequest');
            xhrFallback(jsonData)
              .then(resolve)
              .catch(reject);
          }
        });
      } else {
        // Use XMLHttpRequest
        xhrFallback(jsonData)
          .then(resolve)
          .catch(error => {
            logError('XHR error:', error);
            
            // Determine if we should retry
            if (retries < config.maxRetries) {
             console.log(`Retrying in ${config.retryDelay}ms...`);
              setTimeout(() => {
                makeRequest(data, retries + 1)
                  .then(resolve)
                  .catch(reject);
              }, config.retryDelay);
            } else {
              reject(error);
            }
          });
      }
    });
  };
  
  // XMLHttpRequest fallback function
  const xhrFallback = (jsonData) => {
    return new Promise((resolve, reject) => {
     console.log('Using XMLHttpRequest with JSON payload');
      
      const xhr = new XMLHttpRequest();
      
      // Set up timeout handling
      xhr.timeout = config.timeout;
      
      xhr.onreadystatechange = function() {
       console.log(`XHR state: ${xhr.readyState}, status: ${xhr.status}`);
        
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
           console.log('XHR successful!');
            try {
              const jsonResponse = JSON.parse(xhr.responseText);
              resolve(jsonResponse);
            } catch (e) {
              console.log('Error parsing JSON response:', e);
              resolve(xhr.responseText); // Fallback to raw text
            }
          } else {
            console.log(`XHR failed with status: ${xhr.status}`);
            reject(new Error(`Request failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };
      
      xhr.ontimeout = function() {
        console.log('XHR timed out');
        reject(new Error('Request timed out'));
      };
      
      xhr.onerror = function(e) {
        console.log('XHR network error:', e);
        reject(new Error('Network error occurred'));
      };
      
      try {
        xhr.open('POST', config.url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader("Accept", "*/*");
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        // Add a random header to prevent caching
        xhr.setRequestHeader('X-Request-ID', `torro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        
        // iOS can have issues with withCredentials in some contexts
        xhr.withCredentials = true;
        
        xhr.send(jsonData);
      } catch (error) {
        console.log('XHR setup error:', error);
        reject(error);
      }
    });
  };
  
  // Start the request process
  return makeRequest(formData, 0);
}



function generateRandomString(length = 20) {
  // Define possible characters to use
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const special = '_-#$!%&@';
  const allChars = alphanumeric + special;
  
  // Create a timestamp prefix (first 8 chars) to enhance uniqueness
  const timestamp = Date.now().toString(36).substring(0, 8).padStart(8, '0');
  
  // Generate the remaining characters randomly
  let randomPart = '';
  const remainingLength = length - timestamp.length;
  
  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    randomPart += allChars.charAt(randomIndex);
  }
  
  // Combine timestamp and random part
  return timestamp + randomPart;
}


function openImageInNewWindow(element) {
    const imgSrc = element.src;
    const newWindow = window.open('', '_blank');
    
     newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Viewer</title>
            <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
        </head>
        <body>
            <img src="${imgSrc}">
        </body>
        </html>
    `);
    newWindow.document.close();

    return false;
}

/*
 * Compresses an image file and returns a Promise that resolves to the compressed file
 * @param {File} file - The original image file
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<File>} - Promise that resolves to the compressed File
 */
function compressImage(file, options = {}) {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(file);
  }
  
  // Default options
  const settings = {
    maxWidth: options.maxWidth || 1200,
    maxHeight: options.maxHeight || 1200,
    quality: options.quality || 0.7,
    mimeType: options.mimeType || file.type
  };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = function() {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      // Maintain aspect ratio while resizing
      if (width > height) {
        if (width > settings.maxWidth) {
          height *= settings.maxWidth / width;
          width = settings.maxWidth;
        }
      } else {
        if (height > settings.maxHeight) {
          width *= settings.maxHeight / height;
          height = settings.maxHeight;
        }
      }
      
      // Round dimensions to integers
      width = Math.floor(width);
      height = Math.floor(height);
      
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw the resized image
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(function(blob) {
        // Clean up object URL
        URL.revokeObjectURL(img.src);
        
        // Create a new File object with the original filename
        const compressedFile = new File(
          [blob], 
          file.name, 
          { 
            type: settings.mimeType,
            lastModified: file.lastModified || new Date().getTime()
          }
        );
        
        resolve(compressedFile);
      }, settings.mimeType, settings.quality);
    };
    
    img.onerror = function() {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}


class FloatingPDFManager {
  constructor() {
    // Set up PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    this.currentPDF = null;
    this.currentCanvas = null;
    this.currentContext = null;
    this.currentPage = 1;
    this.floatingContainer = null;
    this.lastPDFData = null; // Store last opened PDF data
    this.lastFileName = null; // Store last opened filename
    
    // Drag functionality properties
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.containerStartX = 0;
    this.containerStartY = 0;
  }

  // Convert base64 to blob
  base64ToBlob(base64Data, contentType = 'application/pdf') {
    const base64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  // Cache PDF using OPFS
  async cachePDFFromBase64(base64Data, fileName) {
    try {
      const pdfBlob = this.base64ToBlob(base64Data);
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return fileName;
    } catch (error) {
      console.error('Error caching PDF:', error);
      return null;
    }
  }

  // Get cached PDF
  async getCachedPDF(fileName) {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }

  // Create floating container
  createFloatingContainer() {
    // Remove existing container if it exists
    if (this.floatingContainer) {
      this.floatingContainer.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'pdf-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create floating container
    const container = document.createElement('div');
    container.className = 'pdf-floating-container';
    container.style.cssText = `
      width: 90%;
      height: 90%;
      max-width: 1200px;
      max-height: 900px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      overflow: hidden;
      min-width: 300px;
      min-height: 200px;
    `;

    // Create header with close button
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      cursor: move;
      user-select: none;
    `;

    // Add drag functionality to header
    this.setupDragFunctionality(header, container);

    const title = document.createElement('h3');
    title.textContent = 'PDF Viewer';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
      margin-left: 10px;
    `;

    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#f0f0f0';
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = 'transparent';
    };

    closeButton.onclick = () => this.closeFloatingPDF();

    // Add minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.innerHTML = '−';
    minimizeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;

    minimizeButton.onmouseover = () => {
      minimizeButton.style.backgroundColor = '#f0f0f0';
    };
    minimizeButton.onmouseout = () => {
      minimizeButton.style.backgroundColor = 'transparent';
    };

    minimizeButton.onclick = () => this.minimizeFloatingPDF();

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
    `;
    
    buttonContainer.appendChild(minimizeButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.id = 'pdf-content-area';
    contentArea.style.cssText = `
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    container.appendChild(header);
    container.appendChild(contentArea);
    overlay.appendChild(container);

    // Click outside to close
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.closeFloatingPDF();
      }
    };

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.floatingContainer) {
        this.closeFloatingPDF();
      }
    });

    document.body.appendChild(overlay);
    this.floatingContainer = overlay;

    // Animate in
    setTimeout(() => {
      overlay.style.opacity = '1';
      container.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);

    return contentArea;
  }

  // Setup drag functionality
  setupDragFunctionality(header, container) {
    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on buttons
      if (e.target.tagName === 'BUTTON') return;
      
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      
      // Get current position
      const rect = container.getBoundingClientRect();
      this.containerStartX = rect.left + rect.width / 2;
      this.containerStartY = rect.top + rect.height / 2;
      
      // Change cursor
      document.body.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';
      
      // Prevent text selection
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.dragStartX;
      const deltaY = e.clientY - this.dragStartY;
      
      const newX = this.containerStartX + deltaX;
      const newY = this.containerStartY + deltaY;
      
      // Update position
      container.style.left = `${newX}px`;
      container.style.top = `${newY}px`;
      container.style.transform = 'translate(-50%, -50%) scale(1)';
      
      e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.cursor = '';
        header.style.cursor = 'move';
      }
    });

    // Handle window resize to keep container visible
    window.addEventListener('resize', () => {
      if (container) {
        this.keepContainerInBounds(container);
      }
    });
  }

  // Keep container within viewport bounds
  keepContainerInBounds(container) {
    const rect = container.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let newX = parseFloat(container.style.left) || windowWidth / 2;
    let newY = parseFloat(container.style.top) || windowHeight / 2;
    
    // Ensure container stays within bounds
    const minX = rect.width / 2;
    const maxX = windowWidth - rect.width / 2;
    const minY = rect.height / 2;
    const maxY = windowHeight - rect.height / 2;
    
    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.max(minY, Math.min(maxY, newY));
    
    container.style.left = `${newX}px`;
    container.style.top = `${newY}px`;
  }
  closeFloatingPDF() {
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      // Animate out
      overlay.style.opacity = '0';
      container.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        overlay.remove();
        this.floatingContainer = null;
      }, 300);
    }
  }

  // New method to minimize instead of close
  minimizeFloatingPDF() {
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      // Hide the main container
      overlay.style.opacity = '0';
      container.style.transform = 'translate(-50%, -50%) scale(0.8)';
      
      setTimeout(() => {
        overlay.style.display = 'none';
        this.createMinimizedIcon();
      }, 300);
    }
  }

  // Create minimized icon
  createMinimizedIcon() {
    // Remove existing icon if present
    const existingIcon = document.getElementById('pdf-minimized-icon');
    if (existingIcon) {
      existingIcon.remove();
    }

    const minimizedIcon = document.createElement('div');
    minimizedIcon.id = 'pdf-minimized-icon';
    minimizedIcon.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #007AFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0, 123, 255, 0.3);
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
    `;
    
    minimizedIcon.innerHTML = '📄';
    minimizedIcon.title = 'Restore PDF Viewer';
    
    // Hover effects
    minimizedIcon.onmouseover = () => {
      minimizedIcon.style.transform = 'scale(1.1)';
      minimizedIcon.style.boxShadow = '0 6px 25px rgba(0, 123, 255, 0.4)';
    };
    
    minimizedIcon.onmouseout = () => {
      minimizedIcon.style.transform = 'scale(1)';
      minimizedIcon.style.boxShadow = '0 4px 20px rgba(0, 123, 255, 0.3)';
    };
    
    // Click to restore
    minimizedIcon.onclick = () => this.restoreFloatingPDF();
    
    document.body.appendChild(minimizedIcon);
  }

  // Restore from minimized state
  restoreFloatingPDF() {
    const minimizedIcon = document.getElementById('pdf-minimized-icon');
    if (minimizedIcon) {
      minimizedIcon.remove();
    }
    
    if (this.floatingContainer) {
      const overlay = this.floatingContainer;
      const container = overlay.querySelector('.pdf-floating-container');
      
      overlay.style.display = 'flex';
      
      setTimeout(() => {
        overlay.style.opacity = '1';
        container.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 10);
    }
  }

  // Main function to open PDF with caching in floating window
  async openPDF(base64Data, fileName) {
    // Store the data for potential re-opening
    this.lastPDFData = base64Data;
    this.lastFileName = fileName;
    
    let pdfUrl = null;

    // Try to get from cache first
    if (fileName) {
      // pdfUrl = await this.getCachedPDF(fileName);
    }

    if (!pdfUrl) {
      console.log('Creating PDF from base64 data...');
      const pdfBlob = this.base64ToBlob(base64Data);
      pdfUrl = URL.createObjectURL(pdfBlob);

      // Cache for next time (async, doesn't block opening)
      if (fileName) {
        this.cachePDFFromBase64(base64Data, fileName).then(() => {
          console.log('PDF cached successfully');
        });
      }
    } else {
      console.log('Opening from cache');
    }

    // Create floating container and display PDF
    const contentArea = this.createFloatingContainer();
    await this.displayPDF(pdfUrl, contentArea);
  }

  // Method to reopen the last PDF
  async reopenLastPDF() {
    if (this.lastPDFData) {
      await this.openFloatingPDF(this.lastPDFData, this.lastFileName);
    } else {
      console.log('No PDF to reopen');
    }
  }

  // Smart PDF display with mobile detection (modified for floating)
  async displayPDF(blobUrl, container) {
    container.innerHTML = '';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPDFJSAvailable = typeof pdfjsLib !== 'undefined';

    if (isMobile && isPDFJSAvailable) {
      // Use PDF.js for mobile
      await this.displayWithPDFJS(blobUrl, container);
    } else if (isMobile) {
      // Fallback for mobile without PDF.js
      this.displayMobileFallback(blobUrl, container);
    } else {
      // Desktop: use iframe
      this.displayIframe(blobUrl, container);
    }
  }

  // PDF.js implementation for mobile (modified for floating)
  async displayWithPDFJS(blobUrl, container) {
    try {
      const pdf = await pdfjsLib.getDocument(blobUrl).promise;
      
      // Store references
      this.currentPDF = pdf;
      this.currentPage = 1;
      
      // Create container structure
      const viewerDiv = document.createElement('div');
      viewerDiv.style.cssText = `
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        display: flex;
        flex-direction: column;
      `;
      
      // Create controls
      const controls = this.createControls(pdf.numPages);
      viewerDiv.appendChild(controls);
      
      // Create canvas container
      const canvasContainer = document.createElement('div');
      canvasContainer.style.cssText = `
        flex: 1;
        overflow: auto;
        background: white;
        text-align: center;
        padding: 10px;
      `;
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        max-width: 100%;
        height: auto;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      `;
      
      this.currentCanvas = canvas;
      this.currentContext = canvas.getContext('2d');
      
      canvasContainer.appendChild(canvas);
      viewerDiv.appendChild(canvasContainer);
      container.appendChild(viewerDiv);
      
      // Render first page
      await this.renderPage(1);
      
    } catch (error) {
      console.error('Error loading PDF with PDF.js:', error);
      this.displayMobileFallback(blobUrl, container);
    }
  }

  // Create navigation controls (updated styling for floating)
  createControls(totalPages) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #007AFF;
      color: white;
      flex-shrink: 0;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.style.cssText = `
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.style.cssText = prevBtn.style.cssText;
    nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
    
    const pageInfo = document.createElement('span');
    pageInfo.id = 'page-info';
    pageInfo.textContent = `Page 1 of ${totalPages}`;
    pageInfo.style.cssText = `
      font-weight: bold;
      font-size: 16px;
    `;
    
    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(pageInfo);
    controlsDiv.appendChild(nextBtn);
    
    return controlsDiv;
  }

  // Render specific page
  async renderPage(pageNum) {
    if (!this.currentPDF || !this.currentCanvas) return;
    
    try {
      const page = await this.currentPDF.getPage(pageNum);
      
      // Calculate scale for container optimization
      const container = this.currentCanvas.parentElement;
      const containerWidth = container.clientWidth - 20;
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(containerWidth / viewport.width, 2);
      
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas size
      this.currentCanvas.height = scaledViewport.height;
      this.currentCanvas.width = scaledViewport.width;
      
      // Render page
      await page.render({
        canvasContext: this.currentContext,
        viewport: scaledViewport
      }).promise;
      
      // Update page info
      const pageInfoElement = document.getElementById('page-info');
      if (pageInfoElement) {
        pageInfoElement.textContent = `Page ${pageNum} of ${this.currentPDF.numPages}`;
      }
      
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  }

  // Navigate to specific page
  async goToPage(pageNum) {
    if (!this.currentPDF || pageNum < 1 || pageNum > this.currentPDF.numPages) {
      return;
    }
    
    this.currentPage = pageNum;
    await this.renderPage(pageNum);
  }

  // Mobile fallback without PDF.js (updated for floating)
  displayMobileFallback(blobUrl, container) {
    container.innerHTML = `
      <div style="height: 100%; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; max-width: 400px;">
          <div style="margin-bottom: 15px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#007AFF">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 style="margin: 0 0 10px 0; color: #333;">PDF Document</h3>
          <p style="margin: 0 0 20px 0; color: #666;">Tap below to open the PDF in your device's PDF viewer</p>
          <a href="${blobUrl}" target="_blank" download="document.pdf" 
             style="display: inline-block; padding: 12px 24px; background: #007AFF; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Open PDF
          </a>
        </div>
      </div>
    `;
  }

  // Desktop iframe display (updated for floating)
  displayIframe(blobUrl, container) {
    const iframe = document.createElement('iframe');
    iframe.src = blobUrl;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 0 0 8px 8px;
    `;
    container.appendChild(iframe);
  }

  // List cached PDFs
  async listCachedPDFs() {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const files = [];
      for await (const [name, handle] of opfsRoot.entries()) {
        if (name.endsWith('.pdf')) {
          files.push(name);
        }
      }
      return files;
    } catch (error) {
      console.error('Error listing cached PDFs:', error);
      return [];
    }
  }

  // Clear PDF cache
  async clearCache() {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      for await (const [name, handle] of opfsRoot.entries()) {
        if (name.endsWith('.pdf')) {
          await opfsRoot.removeEntry(name);
        }
      }
      console.log('PDF cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

// Initialize the floating PDF manager
const floatingPDFManager = new FloatingPDFManager();

// Example usage:
// When user clicks something in panel 1:
// floatingPDFManager.openFloatingPDF(base64Data, 'document.pdf');

// Initialize the floating PDF manager
const pdfManager = new FloatingPDFManager();

// Example usage:
// When user clicks something in panel 1:
// floatingPDFManager.openFloatingPDF(base64Data, 'document.pdf');    


//CAMERA STUFF


let currentStream = null;
let currentFacingMode = 'back';
let flashSupported = false;
let flashEnabled = false;
let uploadEnabled = false;

let db = null;



// Image quality settings
let imageQualitySettings = {
    quality: 'high', // 'full', 'high', 'medium', 'low'
    mimeType: 'image/jpeg',
    maxWidth: null,
    maxHeight: null,
    compressionQuality: 0.9
};

// Quality presets
const qualityPresets = {
    full: {
        maxWidth: null,
        maxHeight: null,
        compressionQuality: 1.0,
        mimeType: 'image/jpeg',
        description: 'Original size, no compression'
    },
    high: {
        maxWidth: 1920,
        maxHeight: 1080,
        compressionQuality: 0.9,
        mimeType: 'image/jpeg',
        description: 'High quality, slight compression'
    },
    medium: {
        maxWidth: 1280,
        maxHeight: 720,
        compressionQuality: 0.8,
        mimeType: 'image/jpeg',
        description: 'Medium quality, good for sharing'
    },
    low: {
        maxWidth: 640,
        maxHeight: 480,
        compressionQuality: 0.6,
        mimeType: 'image/jpeg',
        description: 'Small size, fast upload'
    }
};

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

// Detect Safari specifically
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}





// Enhanced image compression function
async function compressImage(canvas, settings = imageQualitySettings) {
    return new Promise((resolve) => {
        // Calculate target dimensions
        let { width, height } = canvas;
        const { maxWidth, maxHeight } = settings;
        
        if (maxWidth && maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            if (ratio < 1) {
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
        }
        
        // Create target canvas if resizing is needed
        let targetCanvas = canvas;
        if (width !== canvas.width || height !== canvas.height) {
            targetCanvas = document.createElement('canvas');
            targetCanvas.width = width;
            targetCanvas.height = height;
            
            const ctx = targetCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw resized image
            ctx.drawImage(canvas, 0, 0, width, height);
        }
        
        // Convert to blob with compression
        targetCanvas.toBlob(
            (blob) => {
                const compressedFile = new File(
                    [blob],
                    `photo-${Date.now()}.jpg`,
                    {
                        type: settings.mimeType,
                        lastModified: new Date().getTime()
                    }
                );
                
                resolve({
                    file: compressedFile,
                    blob: blob,
                    originalSize: canvas.width * canvas.height,
                    compressedSize: width * height,
                    compressionRatio: (width * height) / (canvas.width * canvas.height)
                });
            },
            settings.mimeType,
            settings.compressionQuality
        );
    });
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    await initCamera();
}

async function toggleFlash() {
    if (!flashSupported || !currentStream) return;
    
    try {
        const track = currentStream.getVideoTracks()[0];
        await track.applyConstraints({
            advanced: [{ torch: !flashEnabled }]
        });
        flashEnabled = !flashEnabled;
        flashToggle.classList.toggle('active', flashEnabled);
    } catch (error) {
        console.error('Error toggling flash:', error);
    }
}



//Quality Stuff

// Main function to select and apply quality
function selectQuality(quality) {
    // Validate quality exists
    if (!qualityPresets[quality]) {
        console.error(`Unknown quality: ${quality}`);
        quality = 'high'; // fallback
    }
    
    // Update global imageQualitySettings object
    const preset = qualityPresets[quality];
    imageQualitySettings = {
        quality: quality,
        mimeType: preset.mimeType,
        maxWidth: preset.maxWidth,
        maxHeight: preset.maxHeight,
        compressionQuality: preset.compressionQuality
    };
    
    // Update radio button
    const qualityInput = document.querySelector(`input[name="quality"][value="${quality}"]`);
    if (qualityInput) {
        qualityInput.checked = true;
    }
    
    // Update UI
    updateQualitySelector();
    updateQualityInfo();
    
    console.log(`Quality selected: ${quality}`, imageQualitySettings);
}

// Update quality selector visual styling
function updateQualitySelector() {
    const options = document.querySelectorAll('#quality-options > div');
    options.forEach((option) => {
        // Get quality from onclick attribute
        const onclick = option.getAttribute('onclick');
        const match = onclick?.match(/selectQuality\('(\w+)'\)/);
        const optionQuality = match ? match[1] : null;
        
        const isSelected = imageQualitySettings.quality === optionQuality;
        
        option.style.background = isSelected ? 'rgba(0, 122, 255, 0.3)' : 'transparent';
        option.style.borderColor = isSelected ? 'rgba(0, 122, 255, 0.8)' : 'transparent';
    });
}

// Update quality info display
function updateQualityInfo() {
    const info = document.getElementById('qualityInfo'); // Fixed ID
    if (!info) return;
    
    const settings = imageQualitySettings;
    const sizeText = settings.maxWidth ? 
        `Max: ${settings.maxWidth}×${settings.maxHeight}` : 
        'Original size';
    const qualityText = `Quality: ${Math.round(settings.compressionQuality * 100)}%`;
    
    info.textContent = `${sizeText} • ${qualityText}`;
}

// Load quality preference from localStorage
function loadQualityPreference() {
    const saved = localStorage.getItem('cameraSettings');
    let quality = 'high'; // default
    
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            quality = settings.quality || 'high';
        } catch (error) {
            console.error('Error parsing saved settings:', error);
        }
    }
    
    // Apply the loaded/default quality
    selectQuality(quality);
    return quality;
}

// Initialize image quality system
function initializeImageQuality() {
    const quality = loadQualityPreference();
    console.log('Image quality initialized:', imageQualitySettings);
    return quality;
}

// Save quality settings (called from main saveSettings)
function saveQualitySettings(quality) {
    if (qualityPresets[quality]) {
        selectQuality(quality); // This updates imageQualitySettings
        
        // Save to localStorage as part of main settings
        const currentSettings = JSON.parse(localStorage.getItem('cameraSettings') || '{}');
        currentSettings.quality = quality;
        localStorage.setItem('cameraSettings', JSON.stringify(currentSettings));
        
        console.log('Quality settings saved:', quality);
    }
}

// Get current quality setting
function getCurrentQuality() {
    return imageQualitySettings.quality;
}

// Get detailed quality info for debugging
function getCurrentImageQualityInfo() {
    return {
        ...imageQualitySettings,
        preset: qualityPresets[imageQualitySettings.quality],
        sizeLimit: imageQualitySettings.maxWidth && imageQualitySettings.maxHeight 
            ? `${imageQualitySettings.maxWidth}×${imageQualitySettings.maxHeight}` 
            : 'Original size'
    };
}
// Show photo review with compression details
function showPhotoReview(compressionResult) {
    const photoReview = document.getElementById('photoReview');
    photoReview.classList.add('active');
    
    // Add compression info to the review
    let infoDisplay = document.getElementById('compression-info');
    if (!infoDisplay) {
        infoDisplay = document.createElement('div');
        infoDisplay.id = 'compression-info';
        infoDisplay.style.cssText = `
            position: absolute;
            bottom: 180px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            backdrop-filter: blur(5px);
        `;
        photoReview.appendChild(infoDisplay);
    }
    
    const { file, compressionRatio } = compressionResult;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const compressionPercent = Math.round((1 - compressionRatio) * 100);
    
    infoDisplay.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">📊 Image Info</div>
        <div>Quality: ${imageQualitySettings.quality.toUpperCase()}</div>
        <div>Size: ${fileSizeMB}MB</div>
        ${compressionPercent > 0 ? `<div>Compressed: ${compressionPercent}%</div>` : ''}
    `;
}

// Show processing indicator
function showProcessingIndicator(show) {
    let indicator = document.getElementById('processing-indicator');
    
    if (show && !indicator) {
        indicator = document.createElement('div');
        indicator.id = 'processing-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            z-index: 200;
            text-align: center;
            backdrop-filter: blur(10px);
        `;
        indicator.innerHTML = `
            <div style="margin-bottom: 10px;">📸</div>
            <div>Processing image...</div>
            <div style="font-size: 12px; color: #ccc; margin-top: 8px;">
                Quality: ${imageQualitySettings.quality.toUpperCase()}
            </div>
        `;
        document.body.appendChild(indicator);
    } else if (!show && indicator) {
        indicator.remove();
    }
}






// Helper function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Update progress display for photo uploads
function updateUploadProgress(fileName, percent) {
    // Create or update progress indicator
    let progressDiv = document.getElementById('upload-progress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 100;
            backdrop-filter: blur(10px);
        `;
        document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
        <div style="margin-bottom: 8px; font-size: 14px;">Uploading ${fileName}</div>
        <div style="background: #333; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percent}%; background: #04AA6D; height: 6px; transition: width 0.3s ease;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; margin-top: 4px;">${percent}% Complete</div>
    `;
    
    // Remove progress indicator when complete
    if (percent >= 100) {
        setTimeout(() => {
            if (progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 2000);
    }
}


// Helper function to hide photo review
function hidePhotoReview() {
    const photoReview = document.getElementById('photoReview');
    if (photoReview) {
        photoReview.style.display = 'none';
    }
    
    // Clear the captured photo data
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (capturedPhoto) {
        capturedPhoto.photoBlob = null;
        capturedPhoto.photoFile = null;
        capturedPhoto.compressionInfo = null;
    }
}

// Enhanced progress update for direct uploads
function updateUploadProgress(fileName, percent) {
    let progressDiv = document.getElementById('upload-progress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'upload-progress';
        progressDiv.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 16px;
            border-radius: 12px;
            z-index: 150;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        document.body.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="margin-right: 8px;">📤</span>
            <span style="font-size: 14px; font-weight: 500;">Uploading ${fileName}</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
            <div style="width: ${percent}%; background: linear-gradient(90deg, #04AA6D, #00ff88); height: 8px; transition: width 0.3s ease;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #ccc;">${percent}% Complete</div>
    `;
    
    // Remove progress indicator when complete
    if (parseInt(percent) >= 100) {
        setTimeout(() => {
            if (progressDiv && progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 2000);
    }
}




function showSuccessMessage(message) {
    // Remove any existing success message
    const existingSuccess = document.getElementById('success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.id = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(52, 199, 89, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">✅</span>
            ${message}
        </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Animate in
    requestAnimationFrame(() => {
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 300);
    }, 4000);
}

// Enhanced background sync to handle registration and upload
async function checkAndProcessPendingUploads() {
      
    try {
        // Use the unified getAllStoredPhotos method
        const allPhotos = await getAllStoredPhotos();
        
        if (allPhotos.length === 0) {
            console.log('No photos found to process');
            return;
        }
        
        console.log(`Found ${allPhotos.length} photos to process`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Iterate through all photos and attempt upload
        for (const photo of allPhotos) {
            const phoneImageId = photo.phoneImageId || photo.id;
            
            if (!phoneImageId) {
                console.warn('Photo found without phoneImageId, skipping:', photo);
                failCount++;
                continue;
            }
            
            try {
                console.log(`Processing photo: ${phoneImageId}`);
                
                // Call your complete upload function
                await completePhotoUpload(phoneImageId);
                
                successCount++;
                console.log(`✅ Successfully processed photo: ${phoneImageId}`);
                
            } catch (error) {
                failCount++;
                console.error(`❌ Failed to process photo ${phoneImageId}:`, error);
                // Continue with next photo instead of stopping the whole process
            }
        }
        
        console.log(`Upload processing complete: ${successCount} successful, ${failCount} failed`);
      
       
        return {
            total: allPhotos.length,
            successful: successCount,
            failed: failCount
        };
        
    } catch (error) {
        console.error('Error processing pending uploads:', error);
        throw error;
    }
}

// Get unique client ID for device/session identification
function getClientId() {
    let clientId = localStorage.getItem('clientId');
    if (!clientId) {
        clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('clientId', clientId);
    }
    return clientId;
}




function initializeCameraUI() {
    console.log('🎛️ Setting up camera UI event listeners...');
    
    const settingsOverlay = document.getElementById('settingsOverlay');
    
    // Only add event listener if it doesn't already exist
    if (settingsOverlay && !settingsOverlay.hasAttribute('data-listener-added')) {
        settingsOverlay.addEventListener('click', function (e){
            if (e.target === this) {
                toggleSettings();
            }
        });
        settingsOverlay.setAttribute('data-listener-added', 'true');
    
    
    // **ADD THIS CAMERA INITIALIZATION CODE:**
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    const cameraSwitchBtn = document.getElementById('cameraSwitchBtn');
    const uploadToggle = document.getElementById('uploadToggle');
    const flashToggle = document.getElementById('flashToggle');
    const photoReview = document.getElementById('photoReview');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const retakeBtn = document.getElementById('retakeBtn');
    const uploadNowBtn = document.getElementById('uploadNowBtn');
    const uploadLaterBtn = document.getElementById('uploadLaterBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loadingState = document.getElementById('loadingState');
    const errorText = document.getElementById('errorText');
    const closeBtn = document.getElementById('closeBtn');
    }
    
}
   
   

    
    

async function initCamera() {
    console.log('📷 Initializing camera stream...');
    initializeCameraUI ();
    // Load preferences
    loadQualityPreference();
    
    const video = document.getElementById('videoElement');
    const flashToggle = document.getElementById('flashToggle');
    
    if (!video) {
        console.error('❌ Video element not found');
        return false;
    }
    
    try {
        showLoading(true);
        hideError();
        
        // Stop any existing stream
        if (currentStream) {
            console.log('🔄 Stopping existing stream...');
            currentStream.getTracks().forEach(track => {
                console.log(`Stopping ${track.kind} track`);
                track.stop();
            });
            currentStream = null;
        }
        
        // Clear video source
        video.srcObject = null;
        
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };
        
        console.log('🎥 Requesting camera with constraints:', constraints);
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera stream obtained');
        
        video.srcObject = currentStream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Video load timeout'));
            }, 5000);
            
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                console.log('📺 Video metadata loaded');
                resolve();
            };
            
            video.onerror = (error) => {
                clearTimeout(timeout);
                reject(error);
            };
        });
        
        // Update video mirroring based on camera
        video.className = currentFacingMode === 'user' ? '' : 'back-camera';
        console.log('🔄 Video class set to:', video.className);
        
        // Check for flash support
        const track = currentStream.getVideoTracks()[0];
        if (track) {
            const capabilities = track.getCapabilities();
            flashSupported = 'torch' in capabilities;
            console.log('💡 Flash supported:', flashSupported);
            
            if (flashToggle) {
                flashToggle.style.display = flashSupported ? 'flex' : 'none';
            }
        }
        
        showLoading(false);
        console.log('✅ Camera initialization complete');
        return true;
        
    } catch (error) {
        console.error('❌ Error accessing camera:', error);
        
        let errorMessage = 'Unable to access camera. ';
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is already in use by another application.';
        } else {
            errorMessage += 'Please check permissions and try again.';
        }
        
        showError(errorMessage);
        showLoading(false);
        return false;
    }
}


// Enhanced initialization
async function initCameraXXX() {
    // Load preferences
   
   

/*
    qualityValue.addEventListener ('input', function (){
      qualityValue.textContent = this.value + '%';
    });
*/
    settingsOverlay.addEventListener ('click', function (e){
       if (e.target === this) {
                toggleSettings();
            }
    });
    try {
        showLoading(true);
        hideError();
        
        // Stop any existing stream
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        
        // Update video mirroring based on camera
        video.className = currentFacingMode === 'user' ? '' : 'back-camera';
        
        // Check for flash support
        const track = currentStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        flashSupported = 'torch' in capabilities;
        flashToggle.style.display = flashSupported ? 'flex' : 'none';
        
        showLoading(false);
    } catch (error) {
        console.error('Error accessing camera:', error);
        showError('Unable to access camera. Please check permissions and try again.');
        showLoading(false);
    }
    
    
}

// Clean up photo review
function retakePhoto() {
    const photoReview = document.getElementById('photoReview');
    photoReview.classList.remove('active');
    
    // Clean up compression info display
    const infoDisplay = document.getElementById('compression-info');
    if (infoDisplay) {
        infoDisplay.remove();
    }
    
    // Clean up the blob URL
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (capturedPhoto.src.startsWith('blob:')) {
        URL.revokeObjectURL(capturedPhoto.src);
    }
    
    // Clear stored data
    delete capturedPhoto.photoBlob;
    delete capturedPhoto.photoFile;
    delete capturedPhoto.compressionInfo;

}



 async function loadPhotos() {
      try {
          showLoading(true);
          clearError();
          
                  
          const transaction = db.transaction(['pendingUploads'], 'readonly');
          const store = transaction.objectStore('pendingUploads');
          const request = store.getAll();
          
          request.onsuccess = () => {
              photos = request.result;
              displayPhotos();
              updateStats();
              showLoading(false);
          };
          
          request.onerror = () => {
              showError('Failed to load photos from database');
              showLoading(false);
          };
          
      } catch (error) {
          console.error('Error loading photos:', error);
          showError('Database connection failed: ' + error.message);
          showLoading(false);
      }
  }

  // Display photos in the grid
  function displayPhotos() {
      const container = document.getElementById('Footer'); // 'photos-container');
      
      if (photos.length === 0) {
          container.innerHTML = `
              <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4H5V21H19V9Z"/>
                  </svg>
                  <h3>No photos in queue</h3>
                  <p>Photos will appear here when they're waiting to be uploaded</p>
              </div>
          `;
          return;
      }

      const photosHtml = photos.map(photo => {
          const metadata = photo.metadata || {};
          const status = metadata.status || 'unknown';
          const timestamp = new Date(metadata.timestamp || photo.id).toLocaleString();
          const size = formatFileSize(metadata.size || 0);
          
          return `
              <div class="photo-card ${status}">
                  <div class="photo-header">
                      <span class="status-badge status-${status}">${status}</span>
                      <small>${timestamp}</small>
                  </div>
                  <div class="photo-details">
                      <strong>ID:</strong> ${photo.id}<br>
                      <strong>Size:</strong> ${size}<br>
                      <strong>Camera:</strong> ${metadata.camera || 'unknown'}<br>
                      <strong>Upload Type:</strong> ${metadata.uploadType || 'unknown'}
                      ${metadata.metadataSyncPending ? '<br><strong>⚠️ Metadata sync pending</strong>' : ''}
                  </div>
                  <div class="photo-actions">
                      <button class="btn-small" onclick="deletePhotoFromLocalStorate('${photo.id}')">Delete</button>
                      ${status === 'pending' ? `<button class="btn-small" onclick="retryUpload('${photo.id}')">Retry</button>` : ''}
                      <button class="btn-small" onclick="viewPhotoDetails('${photo.id}')">Details</button>
                  </div>
              </div>
          `;
      }).join('');
      
      container.innerHTML = `<div class="photos-grid">${photosHtml}</div>`;
  }

  // Update statistics
  function updateStats() {
      const pending = photos.filter(p => (p.metadata?.status || 'pending') === 'pending').length;
      const uploaded = photos.filter(p => (p.metadata?.status || 'pending') === 'uploaded').length;
      const failed = photos.filter(p => (p.metadata?.status || 'pending') === 'failed').length;
      const totalSize = photos.reduce((sum, p) => sum + (p.metadata?.size || 0), 0);
      //'stats'
      document.getElementById('Footer').innerHTML = `
           <div class="stat-label">Pending ${pending}  Uploaded ${uploaded}  Failed ${failed}</div>
     `;
  }

  
  // View photo details
  function viewPhotoDetails(photoId) {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;
      
      const details = JSON.stringify(photo, null, 2);
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
          <html>
              <head><title>Photo Details - ${photoId}</title></head>
              <body style="font-family: monospace; padding: 20px;">
                  <h2>Photo Details</h2>
                  <pre>${details}</pre>
                  <br>
                  <button onclick="window.close()">Close</button>
              </body>
          </html>
      `);
  }

  // Export data as JSON
  function exportData() {
      const dataStr = JSON.stringify(photos, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-queue-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
  }

  // Retry failed uploads (placeholder - would need actual upload logic)
  function retryFailed() {
      alert('Retry functionality would trigger your background sync or upload process');
  }

  // Retry specific upload
  function retryUpload(photoId) {
      alert(`Would retry upload for photo ${photoId}`);
  }

  // Utility functions
  function formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showLoading(show) {
      const container = document.getElementById('Footer');
      container.innerHTML = show ? '<div class="loading">Loading photos...</div>' : '';
  }
   

 function showError(message) {
      const container = document.getElementById('Footer');
      if (container) {
          container.innerHTML = `<div class="error">❌ ${message}</div>`;
      } else {
          // Fallback options when Footer element doesn't exist
          console.error('Error (Footer element not found):', message);
          
          // Try alternative elements
          const messages = document.getElementById('messages');
          if (messages) {
              messages.innerHTML = `<div class="error">❌ ${message}</div>`;
          } else {
              // Final fallback
              alert('Error: ' + message);
          }
      }
  }

  function clearError() {
     lElement =  document.getElementById('Footer');
     if (lElement != null){
        lElement.innerHTML = '';
     }
  }


function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorText = document.getElementById('Footer');
    const errorMessage = document.getElementById('Footer');
    if (errorText) errorText.textContent = message;
    if (errorMessage) errorMessage.classList.add('show');
}

function hideError() {
    const errorMessage = document.getElementById('Footer');
    if (errorMessage) errorMessage.classList.remove('show');
}


// 29 JUL 2025
// Generate unique phone image ID with device fingerprint
function generatePhoneImageId() {
    const deviceId = getOrCreateDeviceId();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    // Format: deviceId_timestamp_random
    return `${deviceId}_${timestamp}_${random}`;
}

// Get or create a unique device identifier
function getOrCreateDeviceId() {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('deviceUniqueId');
    
    if (!deviceId) {
        // Generate a new device ID using multiple factors
        const deviceFingerprint = generateDeviceFingerprint();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 12);
        
        // Create device ID: fingerprint_timestamp_random
        deviceId = `dev_${deviceFingerprint}_${timestamp}_${random}`;
        
        // Store it persistently
        localStorage.setItem('deviceUniqueId', deviceId);
        
        // Also try to store in IndexedDB as backup
        storeDeviceIdInDB(deviceId);
        
        console.log('Generated new device ID:', deviceId);
    }
    
    return deviceId;
}

// Generate device fingerprint based on available browser/device info
function generateDeviceFingerprint() {
    const factors = [];
    
    // Screen resolution
    factors.push(`${screen.width}x${screen.height}`);
    
    // Timezone
    factors.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // User agent hash (shortened)
    const uaHash = hashString(navigator.userAgent).toString(36).substr(0, 8);
    factors.push(uaHash);
    
    // Language
    factors.push(navigator.language || 'unknown');
    
    // Platform
    factors.push(navigator.platform || 'unknown');
    
    // Hardware concurrency (CPU cores)
    factors.push(navigator.hardwareConcurrency || 'unknown');
    
    // Memory (if available)
    if ('deviceMemory' in navigator) {
        factors.push(navigator.deviceMemory);
    }
    
    // Combine all factors and hash
    const combined = factors.join('|');
    const fingerprint = hashString(combined).toString(36).substr(0, 12);
    
    return fingerprint;
}

// Simple hash function for strings
function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
}

// Store device ID in IndexedDB as backup
async function storeDeviceIdInDB(deviceId) {
    try {
        // Use a separate database for device info
        const dbRequest = indexedDB.open('DeviceInfo', 1);
        
        dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('device')) {
                db.createObjectStore('device', { keyPath: 'key' });
            }
        };
        
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['device'], 'readwrite');
            const store = transaction.objectStore('device');
            
            store.put({
                key: 'deviceId',
                value: deviceId,
                created: new Date().toISOString()
            });
        };
    } catch (error) {
        console.warn('Could not store device ID in IndexedDB:', error);
    }
}

// Enhanced device ID recovery
async function recoverDeviceIdIfNeeded() {
    let deviceId = localStorage.getItem('deviceUniqueId');
    
    if (!deviceId) {
        // Try to recover from IndexedDB
        try {
            deviceId = await getDeviceIdFromDB();
            if (deviceId) {
                localStorage.setItem('deviceUniqueId', deviceId);
                console.log('Recovered device ID from IndexedDB:', deviceId);
            }
        } catch (error) {
            console.warn('Could not recover device ID from IndexedDB:', error);
        }
    }
    
    return deviceId;
}

// Get device ID from IndexedDB
function getDeviceIdFromDB() {
    return new Promise((resolve, reject) => {
        const dbRequest = indexedDB.open('DeviceInfo', 1);
        
        dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['device'], 'readonly');
            const store = transaction.objectStore('device');
            const request = store.get('deviceId');
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        };
        
        dbRequest.onerror = () => reject(dbRequest.error);
    });
}

async function capturePhoto() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = document.getElementById('videoElement');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Handle mirroring for front camera
    if (currentFacingMode === 'user') {
        context.scale(-1, 1);
        context.translate(-canvas.width, 0);
    }
    
    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    showProcessingIndicator(true);
    
    try {
        // Compress image
        const result = await compressImage(canvas, imageQualitySettings);
        
        // Generate unique phone image ID
        const phoneImageId = generatePhoneImageId();
        
        // Create metadata
        const metadata = {
            phoneImageId: phoneImageId,
            timestamp: new Date().toISOString(),
            camera: currentFacingMode,
            quality: imageQualitySettings.quality,
            mimeType: imageQualitySettings.mimeType,
            clientId: getClientId(),
            status: 'captured',
            serverUniqueId: null,
            compressionInfo: {
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
                fileSize: result.blob.size
            }
        };
        
        // Save to OPFS (replaces IndexedDB)
        await photoStorage.savePhoto(phoneImageId, result.blob, metadata);
        
        // Create preview URL
        const url = URL.createObjectURL(result.blob);
        const capturedPhoto = document.getElementById('capturedPhoto');
        capturedPhoto.src = url;
        
        // Store references
        capturedPhoto.photoBlob = result.blob;
        capturedPhoto.photoFile = result.file;
        capturedPhoto.phoneImageId = phoneImageId;
        capturedPhoto.compressionInfo = metadata.compressionInfo;
        
        // Show photo review
        showPhotoReview(result, phoneImageId);
        
    } catch (error) {
        console.error('Error processing image:', error);
        showError('Failed to process image. Please try again.');
    } finally {
        showProcessingIndicator(false);
    }
}

function stopCamera() {
    if (currentStream) {
        console.log('🔴 Stopping camera stream...');
        currentStream.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped track: ${track.kind}`);
        });
        currentStream = null;
        
        // Clear video element
        const video = document.getElementById('videoElement');
        if (video) {
            video.srcObject = null;
        }
        
        console.log('✅ Camera stopped');
    }
}

async function compressForIOS(file, maxSize = 500000) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            let { width, height } = img;
            const maxDimension = 1024; // Smaller for iOS
            
            if (width > height && width > maxDimension) {
                height = (height * maxDimension) / width;
                width = maxDimension;
            } else if (height > maxDimension) {
                width = (width * maxDimension) / height;
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(resolve, 'image/jpeg', 0.5);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

async function uploadLater() {
    const capturedPhoto = document.getElementById('capturedPhoto');
    showProcessingOverlay('Saving Photo...');
    stopCamera();
    if (!capturedPhoto.phoneImageId) return;
    
    try {
        uploadLaterBtn.disabled = true;
        uploadNowBtn.disabled = true;
        uploadLaterBtn.textContent = 'Registering...';
        
        // Photo is already saved in OPFS, now register with server
        const registrationResult = await registerPhotoWithServer(capturedPhoto.phoneImageId);
        
        // Update OPFS record with server details
        await photoStorage.updatePhoto(capturedPhoto.phoneImageId, {
            serverUniqueId: registrationResult.serverUniqueId,
            status: 'registered',
            uploadReady: true,
            registeredAt: new Date().toISOString(),
            fileHandle: registrationResult.fileHandle,
            blockSize: registrationResult.blockSize,
            numberOfChunks: registrationResult.numberOfChunks
        });

        var f = document.getElementById(glbBaseFormName);
        f.doc.value = registrationResult.fileHandle;
        submitForm(f);

    } catch (error) {
        console.error('Failed to register photo:', error);
        showSuccessMessage('Photo saved locally. Will register with server when connection is available.');
        retakePhoto();
        
    } finally {
        uploadLaterBtn.disabled = false;
        uploadNowBtn.disabled = false;
        uploadLaterBtn.textContent = 'Queue Upload';
    }
}

// Updated image upload function for server chunks

async function uploadImageToServer(phoneImageId) {
    try {
        // Get photo from storage
        const photoData = await photoStorage.getPhoto(phoneImageId);
        
        if (!photoData) {
            throw new Error('Photo not found in storage');
        }

        // Check if photo has file handle
        if (!photoData.metadata.fileHandle) {
            console.log(`❌ Photo ${phoneImageId} has no file handle - deleting it`);
            
            // Delete the photo without file handle
            await photoStorage.deletePhoto(phoneImageId);
            
            // Optionally show notification
            showFooterNotification(`Photo ${phoneImageId} deleted (no file handle)`);
            
            // Return early - no upload needed
            return { 
                success: false, 
                deleted: true, 
                reason: 'No file handle - photo deleted' 
            };
        }

        // Continue with normal upload process
        const { fileHandle, numberOfChunks } = photoData.metadata;
        const fileToUpload = photoData.imageBlob;
        
        console.log(`Starting upload: ${numberOfChunks} chunks for ${fileToUpload.size} bytes`);
        
        // Upload chunks
        let lByteIndex = 0;
        let lChunkStatus = null;
        
        for (let lChunkNumber = 1; lChunkNumber <= numberOfChunks; lChunkNumber++) {
            const lByteEnd = Math.ceil((fileToUpload.size / numberOfChunks) * lChunkNumber);
            const lChunk = fileToUpload.slice(lByteIndex, lByteEnd);
            
            console.log(`Uploading chunk ${lChunkNumber}/${numberOfChunks} (${lChunk.size} bytes)`);
            
            try {
                const chunkDataURL = await readChunkAsDataURL(lChunk);
                const chunkResponse = await sendChunkToServer(fileHandle, lChunkNumber, numberOfChunks, chunkDataURL);
                
                let lJadeData;
                if (typeof chunkResponse === 'string') {
                    lJadeData = JSON.parse(chunkResponse);
                } else {
                    lJadeData = chunkResponse;
                }
                
                if (Object.keys(lJadeData).length > 0) {
                    lChunkStatus = lJadeData.status;
                    
                    if (lChunkStatus === "Error") {
                        throw new Error(`Server error on chunk ${lChunkNumber}: ${lJadeData.error || 'Unknown error'}`);
                    }
                    
                    // Update progress
                    const progressPercent = Math.round((lChunkNumber / numberOfChunks) * 100);
                    updateUploadProgress(`photo-${phoneImageId}.jpg`, progressPercent);
                }
                
                lByteIndex += (lByteEnd - lByteIndex);
                
            } catch (chunkError) {
                console.error(`Error uploading chunk ${lChunkNumber}:`, chunkError);
                throw new Error(`Failed to upload chunk ${lChunkNumber}: ${chunkError.message}`);
            }
        }
        
        console.log(`All chunks sent. Final status: ${lChunkStatus}`);
        
        if (lChunkStatus === "Complete") {
            console.log('Upload completed successfully, deleting from storage');
            await photoStorage.deletePhoto(phoneImageId);
        }
        
        return { success: true, fileHandle };
        
    } catch (error) {
        console.error('Upload failed:', error);
        
        // Mark as failed in storage
        await photoStorage.updatePhoto(phoneImageId, {
            uploadStatus: 'upload_failed',
            error: error.message,
            failedAt: Date.now()
        });
        
        throw error;
    }
}


// Safe error handling function
async function registerPhotoWithServer(phoneImageId) {
    try {
        // Check if photo is already registered to avoid duplicate server calls
        const existingPhoto = await getPhotoByPhoneId(phoneImageId);
        if (existingPhoto && existingPhoto.fileHandle && existingPhoto.uploadStatus === 'registered') {
            console.log('Photo already registered, using existing fileHandle');
            return {
                success: true,
                fileHandle: existingPhoto.fileHandle,
                blockSize: existingPhoto.blockSize,
                numberOfChunks: existingPhoto.numberOfChunks,
                size: existingPhoto.metadata?.size || existingPhoto.size
            };
        }

       
        console.log('Retrieved photoData:', existingPhoto);
        
        if (!existingPhoto) {
            throw new Error('Photo not found in IndexedDB');
        }

        // Extract metadata safely
        const metadata = existingPhoto.metadata || {};
        const size = metadata.size || existingPhoto.size || 0;
        
        if (!size || size === 0) {
            throw new Error('Photo size not available');
        }

        // Prepare payload for server
        const payload = {
            filename: Conversions.base32.encode(`${phoneImageId}.jpg`),
            vin: Conversions.base32.encode(size.toString()),
            systemName : glbSystemName,
            formName: "FileDestinationDelay",
            meta:  Conversions.base32.encode(JSON.stringify(metadata)),
            sid : Conversions.base32.encode(glb_sid),
            rid : generateRandomString ()
        };

        const lJson = JSON.stringify(payload);
        console.log('Sending payload:', lJson);

        // Make server request
        const response = await JadeRestRequest(lJson);
        
        let lResponse;
        if (glbReponseEncoded) {
            lResponse = atob(response);
        } else {
            lResponse = response;
        }
        console.log('The Response', lResponse );
        const serverData = JSON.parse(lResponse);
        console.log ('Server Data', serverData);
        if (Object.keys(serverData).length > 0 && serverData.fileHandle) {
            // Set global variables for backward compatibility
            lJadeData = serverData;
            lFileHandle = serverData.fileHandle;
            lBlockSize = serverData.blockSize;
            lNumberOfChunks = Math.ceil(size / lBlockSize);
            
            console.log('Registration successful:', {
                fileHandle: lFileHandle,
                blockSize: lBlockSize,
                numberOfChunks: lNumberOfChunks
            });

            // CRITICAL: Save the fileHandle and upload info back to IndexedDB
            await updatePhotoWithUploadInfo(phoneImageId, {
                fileHandle: lFileHandle,
                blockSize: lBlockSize,
                numberOfChunks: lNumberOfChunks,
                uploadStatus: 'registered',
                registeredAt: Date.now()
            });

            return {
                success: true,
                fileHandle: lFileHandle,
                blockSize: lBlockSize,
                numberOfChunks: lNumberOfChunks,
                size: size
            };
        } else {
            throw new Error('Server returned empty response or missing fileHandle');
        }
        
    } catch (error) {
        console.error('Registration failed:', error);
        
        // Update photo status to failed in IndexedDB
        try {
            await updatePhotoWithUploadInfo(phoneImageId, {
                uploadStatus: 'registration_failed',
                error: error.message,
                failedAt: Date.now()
            });
        } catch (dbError) {
            console.error('Failed to update photo status in DB:', dbError);
        }
        
        // Reset global state safely
        if (typeof glbSubmitted !== 'undefined') {
            glbSubmitted = false;
        }
        
        // Reset cursor safely
        if (window.document && window.document.body) {
            hideProcessing ();
            window.document.body.style.cursor = "auto";
        }
        
        // Show error message safely
        showFooterError("Sorry - we are unable to process your request - please contact Torro Software");
        
        // Re-throw so calling code knows it failed
        throw error;
    }
}




// Helper function to convert stored data back to Blob
async function convertStoredImageToBlob(storedRecord) {
    if (!storedRecord) return null;
    
    const { imageBlob, imageMetadata } = storedRecord;
    
    if (imageMetadata?.storageFormat === 'arrayBuffer') {
        // Convert ArrayBuffer back to Blob
        return new Blob([imageBlob], { 
            type: imageMetadata.type || 'image/jpeg'
        });
    } else if (typeof imageBlob === 'string' && imageBlob.startsWith('data:')) {
        // Convert base64 back to Blob
        const response = await fetch(imageBlob);
        return await response.blob();
    } else if (imageBlob instanceof Blob) {
        // Already a Blob
        return imageBlob;
    } else {
        console.error('Unknown image storage format');
        return null;
    }
}



// Fixed sendChunkToServer function with better error handling
async function sendChunkToServer(fileHandle, chunkIndex, numChunks, chunkDataURL) {
    const payload = {
        systemName: glbSystemName,
        formName: "FileChunkSave",
        vin: Conversions.base32.encode(fileHandle),
        doc: chunkDataURL,
        ck: chunkIndex.toString(),
        ct: numChunks.toString(),  
        sid: Conversions.base32.encode(glb_sid),
        rid: generateRandomString()
    };
    
    console.log(`Sending chunk ${chunkIndex}/${numChunks} with payload keys:`, Object.keys(payload));
    
    try {
        const response = await JadeRestRequest(JSON.stringify(payload));
        
        let result;
        if (glbReponseEncoded) {
            const decodedResponse = atob(response);
            result = JSON.parse(decodedResponse);
        } else {
            if (typeof response === 'string') {
                result = JSON.parse(response);
            } else {
                result = response;
            }
        }
         console.log('The Response', result );
        
        console.log(`Chunk ${chunkIndex} server response:`, result);
        return result;
        
    } catch (error) {
        console.error(`Error sending chunk ${chunkIndex}:`, error);
        throw new Error(`Network error sending chunk ${chunkIndex}: ${error.message}`);
    }
}

// Helper function to read chunk as data URL (like your reader.readAsDataURL)
function readChunkAsDataURL(chunk) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => {
            console.log('Chunk read error:', error);
            reject(error);
        };
        reader.readAsDataURL(chunk);
    });
}

// Helper function to convert data URL to blob
function dataURLToBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


// Function to update upload progress
async function updateUploadProgress(phoneImageId, chunksUploaded, totalChunks) {
    const progress = Math.round((chunksUploaded / totalChunks) * 100);
    
    await updatePhotoWithUploadInfo(phoneImageId, {
        uploadStatus: 'uploading',
        progress: progress,
        chunksUploaded: chunksUploaded,
        totalChunks: totalChunks,
        lastChunkAt: Date.now()
    });
}

// Helper function to convert blob to array buffer
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

// Complete upload workflow function
async function completePhotoUpload(phoneImageId) {
    try {
       
        await uploadImageToServer(phoneImageId);
        
        console.log('Complete upload workflow finished successfully!');
        return { success: true };
        
    } catch (error) {
        console.error('Complete upload workflow failed:', error);
        throw error;
    }
}


// Modified upload now function that uses your existing submitFile_DestinationHandle
async function uploadNow() {
    showProcessingOverlay('Uploading Photo to Server...');
    stopCamera();
    const capturedPhoto = document.getElementById('capturedPhoto');
    if (!capturedPhoto.phoneImageId) return;

    try {
        uploadNowBtn.disabled = true;
        uploadLaterBtn.disabled = true;
        uploadNowBtn.textContent = 'Preparing...';
        
        // Get photo data from local storage
        const photoData = await getPhotoByPhoneId(capturedPhoto.phoneImageId);
        if (!photoData) {
            throw new Error('Photo not found in local storage');
        }
        
        // Create File object and set global fileToUpload variable for your existing system
        window.fileToUpload = new File([photoData.imageBlob], `photo-${photoData.phoneImageId}.jpg`, {
            type: photoData.metadata.mimeType,
            lastModified: Date.now()
        });
        
        // Store phone image ID globally so your existing system can access it
        window.currentPhoneImageId = photoData.phoneImageId;
        
        uploadNowBtn.textContent = 'Uploading...';
        
        // Set up success/error callbacks for your existing upload system
        const originalOnSuccess = window.uploadOnSuccess;
        const originalOnError = window.uploadOnError;
        
        window.uploadOnSuccess = async function(serverResponse) {
            try {
                // Your existing system completed successfully
                // Update photo status to uploaded
                await updatePhotoStatus(photoData.phoneImageId, 'uploaded');
                
                showSuccessMessage('📸 Photo uploaded successfully!');
                hidePhotoReview();
                
                // Restore original callbacks
                window.uploadOnSuccess = originalOnSuccess;
                window.uploadOnError = originalOnError;
                
            } catch (error) {
                console.error('Error updating photo status:', error);
                showSuccessMessage('📸 Photo uploaded (status update failed)');
                hidePhotoReview();
            } finally {
                uploadNowBtn.disabled = false;
                uploadLaterBtn.disabled = false;
                uploadNowBtn.textContent = 'Upload Now';
            }
        };
        
        window.uploadOnError = function(error) {
            console.error('Upload failed:', error);
            showError(`Upload failed: ${error}`);
            
            // Restore original callbacks
            window.uploadOnSuccess = originalOnSuccess;
            window.uploadOnError = originalOnError;
            
            uploadNowBtn.disabled = false;
            uploadLaterBtn.disabled = false;
            uploadNowBtn.textContent = 'Upload Now';
        };
        
        // Call your existing upload method
        submitFile_DestinationHandle();
        
    } catch (error) {
        console.error('Upload preparation failed:', error);
        
       
        await uploadLater();
       
        
        uploadNowBtn.disabled = false;
        uploadLaterBtn.disabled = false;
        uploadNowBtn.textContent = 'Upload Now';
    }
}



// Helper function to convert blob to array buffer
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}




let tempSettings = {
    flash: null,
    camera: null,
    quality: null,
    upload: null
};

function toggleSettings() {
    if (!settingsInitialized) {
        initializeSettingsListeners();
        settingsInitialized = true;
    }
   
    const overlay = document.getElementById('settingsOverlay');
    
    if (overlay.classList.contains('active')) {
        // CLOSING - Apply changes and close
        const currentUpload = document.getElementById('uploadToggle').checked;
        const currentFlash = document.getElementById('flashToggle').checked;
        const currentCamera = document.querySelector('input[name="camera"]:checked').value;
        const currentQuality = document.querySelector('input[name="quality"]:checked').value;
       
        // Check what changed
        const changes = {
            upload: currentUpload !== tempSettings.upload,
            flash: currentFlash !== tempSettings.flash,
            camera: currentCamera !== tempSettings.camera,
            quality: currentQuality !== tempSettings.quality,
           
        };
        
        // Apply changes
        if (changes.camera) {
            console.log(`Camera changed from ${tempSettings.camera} to ${currentCamera}`);
            switchCamera(currentCamera);
        }
        
         if (changes.upload) {
            console.log(`Upload changed from ${tempSettings.upload} to ${currentUpload}`);
          //Need to Upload Files   
        }


        if (changes.flash) {
            console.log(`Flash changed from ${tempSettings.flash} to ${currentFlash}`);
            updateFlashSetting(currentFlash);
        }
        
        if (changes.quality) {
            console.log(`Quality changed from ${tempSettings.quality} to ${currentQuality}`);
            selectQuality(currentQuality);
        }
        
     
        
        // Save all settings
        saveSettings({
            flash: currentFlash,
            camera: currentCamera,
            quality: currentQuality,
            upload : currentUpload
        });
        
        // Close overlay
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
    } else {
        // OPENING - Load current settings and open
        
        // Initialize settings in overlay first
        initializeSettingsOnOpen();
        
        // Store current values for comparison when closing
        tempSettings.upload = document.getElementById('uploadToggle').checked;
        tempSettings.flash = document.getElementById('flashToggle').checked;
        tempSettings.camera = document.querySelector('input[name="camera"]:checked').value;
        tempSettings.quality = document.querySelector('input[name="quality"]:checked').value;
       
        console.log('Settings opened, current values:', tempSettings);
        
        // Open overlay
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update UI elements
        setTimeout(() => {
            updateQualityInfo();
        }, 50);
    }
}
function saveSettings(settings) {
    // Apply quality using consolidated function
    if (settings.quality) {
        selectQuality(settings.quality);
    }
    
    localStorage.setItem('cameraSettings', JSON.stringify(settings));
    console.log('All settings saved:', settings);
}

function initializeSettingsOnOpen() {
    console.log('Initializing settings in overlay...');
    
    // Load saved settings
    const saved = localStorage.getItem('cameraSettings');
    let settings;
    
    if (saved) {
        try {
            settings = JSON.parse(saved);
            console.log('Loaded saved settings:', settings);
        } catch (error) {
            console.error('Error parsing saved settings:', error);
            settings = getDefaultSettings();
        }
    } else {
        settings = getDefaultSettings();
        console.log('Using default settings:', settings);
    }
    
    // Apply settings to form elements
    applySettingsToForm(settings);
}

function getDefaultSettings() {
    return {
        flash: false,
        camera: 'back',
        quality: 'high',
        upload: false
    };
}

function applySettingsToForm(settings) {
    // Apply flash setting
    const flashToggle = document.getElementById('flashToggle');
    if (flashToggle) {
        flashToggle.checked = settings.flash || false;
    }

    const uploadToggle = document.getElementById('uploadToggle');
    if (uploadToggle) {
        uploadToggle.checked = settings.upload || false;
    }
    
    // Apply camera setting
    const cameraInput = document.querySelector(`input[name="camera"][value="${settings.camera || 'back'}"]`);
    if (cameraInput) {
        cameraInput.checked = true;
    }
    
      
    // Apply quality setting
    const qualityInput = document.querySelector(`input[name="quality"][value="${settings.quality || 'high'}"]`);
    if (qualityInput) {
        qualityInput.checked = true;
    }
    
    // Update quality display
    if (settings.quality) {
        selectQuality(settings.quality);
    }
}


function initializeSettingsListeners() {
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const flashToggle = document.getElementById ('flashToggle')
    
    if (qualitySlider) {
        qualitySlider.addEventListener('input', function() {
            const value = this.value;
            if (qualityValue) qualityValue.textContent = value;
            window.imageQuality = value;
            console.log('Quality changed to:', value);
        });
    }

    if (flashToggle){
      flashToggle.addEventListener ('click',toggleFlash);
    }
    
    // Add other settings listeners here
}

 function initializeCameraSettings() {
            // Update quality display
            const qualitySlider = document.getElementById('qualitySlider');
            const qualityValue = document.getElementById('qualityValue');
            
            if (qualitySlider && qualityValue) {
                qualitySlider.addEventListener('input', function() {
                    qualityValue.textContent = this.value + '%';
                });
            }

            // Close overlay when clicking outside settings content
            const settingsOverlay = document.getElementById('settingsOverlay');
            if (settingsOverlay) {
                settingsOverlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        toggleSettings();
                    }
                });
            }
        }
   async function deleteAllFiles() {
            if (!confirm('Are you sure you want to delete all stored files? This action cannot be undone.')) {
                return;
            }

            try {
                // Get all databases (you may need to adjust database names based on your setup)
                const databases = await indexedDB.databases();
                
                for (const db of databases) {
                    if (db.name) {
                        await deleteDatabase(db.name);
                    }
                }
                
                alert('All files have been deleted successfully.');
                console.log('All IndexedDB files deleted');
                
            } catch (error) {
                console.error('Error deleting files:', error);
                alert('Error deleting files. Please try again.');
            }
        }

        // Helper function to delete a specific database
        function deleteDatabase(dbName) {
            return new Promise((resolve, reject) => {
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                
                deleteRequest.onerror = () => {
                    console.error(`Error deleting database ${dbName}:`, deleteRequest.error);
                    reject(deleteRequest.error);
                };
                
                deleteRequest.onsuccess = () => {
                    console.log(`Database ${dbName} deleted successfully`);
                    resolve();
                };
                
                deleteRequest.onblocked = () => {
                    console.warn(`Delete blocked for database ${dbName}. Close other tabs using this database.`);
                    // Still resolve as the delete will complete when unblocked
                    resolve();
                };
            });
        }

        // Alternative function if you know specific database/store names
        async function deleteSpecificFiles(dbName, storeName) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName);
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const clearRequest = store.clear();
                    
                    clearRequest.onsuccess = () => {
                        console.log(`All records cleared from ${storeName}`);
                        resolve();
                    };
                    
                    clearRequest.onerror = () => {
                        reject(clearRequest.error);
                    };
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
        }



function toggleSAMenu() {
    const menuOverlay = document.getElementById('SAMenuOverlay');
    const menuButton = document.querySelector('.sa-menu-button');
    menuOverlay.classList.toggle('open');
    menuButton.classList.toggle('active');
}

function toggleDetailsMenu() {
    const detailsMenuOverlay = document.getElementById('DetailsMenuOverlay');
    const detailsMenuButton = document.querySelector('.details-menu-button');
    detailsMenuOverlay.classList.toggle('open');
    detailsMenuButton.classList.toggle('active');
}

document.querySelectorAll('.sa-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSAMenu();
        console.log('Navigate to:', this.textContent);
    });
});

document.querySelectorAll('.details-menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        toggleDetailsMenu();
        console.log('Open tool:', this.textContent);
    });
});

let isResizing = false;
let currentResizer = null;
let startX = 0;
let startY = 0;
let startLeftWidth = 0;
let startTopHeight = 0;


document.addEventListener('DOMContentLoaded', function() {
    initializeResizers();
});

function initializeResizers() {
    const verticalResizer = document.getElementById('VerticleResizer');
    const horizontalResizer = document.getElementById('HorizontalResizer');
    
    if (verticalResizer) {
        setupVerticalResizer(verticalResizer);
    }
    
    if (horizontalResizer) {
        setupHorizontalResizer(horizontalResizer);
    }
}

function setupVerticalResizer(resizer) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    
    const sidebar = document.querySelector('.gdActions');
    const container = document.querySelector('.container');
    
    // Mouse events
    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
        
        // Add global styles during resize
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        // Prevent text selection
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const newWidth = startWidth + deltaX;
        
        // Set minimum and maximum widths
        const minWidth = 250;
        const maxWidth = window.innerWidth * 0.6; // Max 60% of viewport
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            sidebar.style.width = newWidth + 'px';
            sidebar.style.minWidth = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    // Touch events for mobile
    resizer.addEventListener('touchstart', function(e) {
        isResizing = true;
        startX = e.touches[0].clientX;
        startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isResizing) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const newWidth = startWidth + deltaX;
        
        const minWidth = 250;
        const maxWidth = window.innerWidth * 0.6;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
            sidebar.style.width = newWidth + 'px';
            sidebar.style.minWidth = newWidth + 'px';
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isResizing = false;
    });
}

function setupHorizontalResizer(resizer) {
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    
    const saPanel = document.querySelector('.sa-panel');
    const detailsPanel = document.querySelector('.details-panel');
    
    // Mouse events
    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startY = e.clientY;
        startHeight = parseInt(window.getComputedStyle(saPanel).height, 10);
        
        // Add global styles during resize
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const deltaY = e.clientY - startY;
        const containerHeight = document.querySelector('.display-container').clientHeight;
        const resizerHeight = resizer.clientHeight;
        const availableHeight = containerHeight - resizerHeight;
        
        const newSaHeight = startHeight + deltaY;
        const newDetailsHeight = availableHeight - newSaHeight;
        
        // Set minimum heights
        const minHeight = 100;
        
        if (newSaHeight >= minHeight && newDetailsHeight >= minHeight) {
            saPanel.style.height = newSaHeight + 'px';
            saPanel.style.flex = 'none'; // Override flex behavior
            detailsPanel.style.height = newDetailsHeight + 'px';
            detailsPanel.style.flex = 'none'; // Override flex behavior
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
    
    // Touch events for mobile
    resizer.addEventListener('touchstart', function(e) {
        isResizing = true;
        startY = e.touches[0].clientY;
        startHeight = parseInt(window.getComputedStyle(saPanel).height, 10);
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isResizing) return;
        
        const deltaY = e.touches[0].clientY - startY;
        const containerHeight = document.querySelector('.display-container').clientHeight;
        const resizerHeight = resizer.clientHeight;
        const availableHeight = containerHeight - resizerHeight;
        
        const newSaHeight = startHeight + deltaY;
        const newDetailsHeight = availableHeight - newSaHeight;
        
        const minHeight = 100;
        
        if (newSaHeight >= minHeight && newDetailsHeight >= minHeight) {
            saPanel.style.height = newSaHeight + 'px';
            saPanel.style.flex = 'none';
            detailsPanel.style.height = newDetailsHeight + 'px';
            detailsPanel.style.flex = 'none';
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isResizing = false;
    });
}

// Optional: Add double-click to reset to default sizes
function addDoubleClickReset() {
    const verticalResizer = document.getElementById('VerticleResizer');
    const horizontalResizer = document.getElementById('HorizontalResizer');
    
    if (verticalResizer) {
        verticalResizer.addEventListener('dblclick', function() {
            const sidebar = document.querySelector('.gdActions');
            sidebar.style.width = '400px';
            sidebar.style.minWidth = '400px';
        });
    }
    
    if (horizontalResizer) {
        horizontalResizer.addEventListener('dblclick', function() {
            const saPanel = document.querySelector('.sa-panel');
            const detailsPanel = document.querySelector('.details-panel');
            
            // Reset to flex behavior
            saPanel.style.flex = '2';
            saPanel.style.height = '';
            detailsPanel.style.flex = '1';
            detailsPanel.style.height = '';
        });
    }
}

async function checkForStoredImages() {
    try {
        const photos = await getAllStoredPhotos();
        
        if (photos.length > 0) {
            addImageButton (photos.length);
        } else {
            hideUploadImagesOption();
        }
        
    } catch (error) {
        console.error('Error checking for stored images:', error);
        // Hide the option if there's an error
        hideUploadImagesOption();
    }
}

function showUploadImagesOption(imageCount) {
    // Check if the option already exists
    let uploadOption = document.getElementById('uploadImagesOption');
    
    if (!uploadOption) {
        // Create the upload images option
        uploadOption = document.createElement('div');
        uploadOption.id = 'uploadImagesOption';
        uploadOption.className = 'upload-option';
        
        // Insert after the logon button in the logonWrap div
        const logonWrap = document.querySelector('.logonWrap');
        if (logonWrap) {
            logonWrap.appendChild(uploadOption);
        }
    }
    
    // Update the content
    uploadOption.innerHTML = `
        <button type="button" class="logonButton upload-images-btn" onclick="UploadStoredImages()">
            📤 Process ${imageCount} Stored Image${imageCount > 1 ? 's' : ''}
        </button>
    `;
    
    uploadOption.style.display = 'block';
}

function hideUploadImagesOption() {
    const uploadOption = document.getElementById('uploadImagesOption');
    if (uploadOption) {
        uploadOption.style.display = 'none';
    }
}


async function UploadStoredImages() {
    console.log('🚀 Starting UploadStoredImages...');
    
    try {
        // Show processing overlay
        showProcessingOverlay('Processing stored images...');
        console.log('✅ Processing overlay shown');
        
        // Use your existing upload method
        console.log('📊 Calling checkAndProcessPendingUploads...');
        const results = await checkAndProcessPendingUploads();
        console.log('📊 checkAndProcessPendingUploads completed:', results);
        
        // Update the display after processing
        console.log('🔄 Updating stored images display...');
        await checkForStoredImages();
        console.log('✅ Display updated');
        
        hideProcessingOverlay();
        console.log('✅ Processing overlay hidden');
      /*
        // Show detailed success message
        if (results) {
            const { total, successful, failed } = results;
            let message = `Processing complete: ${successful}/${total} photos processed`;
            if (failed > 0) {
                message += ` (${failed} failed)`;
            }
            console.log('📢 Showing success message:', message);
            showUploadMessage(message, failed > 0 ? 'warning' : 'success');
        } else {
            console.log('📢 Showing default success message');
            showUploadMessage('Upload processing completed!', 'success');
        }
        */
        
    } catch (error) {
        console.error('❌ Error processing uploads:', error);
        hideProcessingOverlay();
        showUploadMessage('Error processing uploads: ' + error.message, 'error');
    }
}

// Helper functions to work with your existing UI
function showProcessingOverlay(message = 'Processing...') {
    const overlay = document.getElementById('processingOverlay');
    const text = document.getElementById('processingText');
    
    if (overlay && text) {
        text.textContent = message;
        overlay.classList.add('active');
      //  overlay.style.display = 'flex';
    }
}

function hideProcessingOverlay() {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
       // overlay.style.display = 'none';
    }
}

function showUploadMessage(message, type = 'success') {
    // Create a temporary message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `upload-message ${type}`;
    messageDiv.textContent = message;
    
    // Style the message
    let backgroundColor;
    switch(type) {
        case 'success':
            backgroundColor = '#4CAF50';
            break;
        case 'warning':
            backgroundColor = '#ff9800';
            break;
        case 'error':
            backgroundColor = '#f44336';
            break;
        default:
            backgroundColor = '#4CAF50';
    }
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background-color: ${backgroundColor};
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        max-width: 300px;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 7 seconds (longer for detailed messages)
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 7000);
}


function addImageButton(count) {
    const footer = document.getElementById ('Footer');
   const ftrInfo = document.querySelector('#Footer .ftrInfo');
            
    // Check if ftrInfo exists
    if (!ftrInfo && !footer) {
        console.error('ftrInfo element not found');
        return;
    }
    

    // Remove existing button if it exists
    const existingButton = ftrInfo.querySelector('.image-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Only add button if count > 0
    if (count > 0) {
        // Convert ftrInfo to flexbox layout
        ftrInfo.style.display = 'flex';
        ftrInfo.style.justifyContent = 'space-between';
        ftrInfo.style.alignItems = 'center';
        
        // Wrap existing content in a span
        const timeText = ftrInfo.textContent.trim();
        ftrInfo.innerHTML = `<span>${timeText}</span>`;
        
        // Create image button
        const imageButton = document.createElement('div');
        imageButton.className = 'image-button';
    
        imageButton.setAttribute('onclick', `UploadStoredImages()`);
        imageButton.title = `${count} images detected`;
        imageButton.innerHTML = `
            <i class="fa-solid fa-images"></i>
            <span class="image-count">${count}</span>
        `;
        
        // Add button to footer
        ftrInfo.appendChild(imageButton);
    
    }
}


function showFooterError(message) {
    const footer = document.getElementById("Footer");
    if (!footer) return;
    
    // Remove any existing error messages
    const existingError = footer.querySelector('.ftrInfo');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ftrInfo';
    errorDiv.textContent = message;
    
    // Add to footer (preserves existing content)
    footer.appendChild(errorDiv);
    
  
}

function showFooterInfo(message) {
    const footer = document.getElementById("Footer");
    if (!footer) return;
    
    // Update the span text inside ftrInfo, preserving the image button
    const ftrInfo = footer.querySelector('.ftrInfo');
    if (ftrInfo) {
        const span = ftrInfo.querySelector('span');
        if (span) {
            span.textContent = message;
        }
    }
}

function showUploadProgress(fileName, percent) {
    const footer = document.getElementById("Footer");
    if (!footer) return;
    
    // Remove existing progress
    const existingProgress = footer.querySelector('.upload-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    // Create progress element
    const progressDiv = document.createElement('div');
    progressDiv.className = 'upload-progress';
    progressDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        z-index: 99;
    `;
    
    progressDiv.innerHTML = `
        <div style="margin-bottom: 8px; font-size: 14px;">Uploading ${fileName}</div>
        <div style="background: #333; border-radius: 4px; overflow: hidden;">
            <div style="width: ${percent}%; background: #04AA6D; height: 6px; transition: width 0.3s ease;"></div>
        </div>
        <div style="text-align: right; font-size: 12px; margin-top: 4px;">${percent}% Complete</div>
    `;
    
    footer.appendChild(progressDiv);
    
    // Remove when complete
    if (parseInt(percent) >= 100) {
        setTimeout(() => {
            if (progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 2000);
    }
}

function clearFooterMessages() {
    const footer = document.getElementById("Footer");
    if (!footer) return;
    
    // Remove error and progress messages but keep the main content
    const error = footer.querySelector('.ftrInfo');
    const progress = footer.querySelector('.upload-progress');
    
    if (error) error.remove();
    if (progress) progress.remove();
}
// Simple IndexedDB-Only Photo Storage (iPhone Optimized)
class IndexedDBPhotoStorage {
    constructor() {
        this.db = null;
        this.isReady = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            // Use a simple database name
            const request = indexedDB.open('PhotoStorage', 1);
            
            request.onerror = () => {
                console.error('❌ IndexedDB failed to open:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('✅ IndexedDB photo storage ready');
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create photos store
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'phoneImageId' });
                    photoStore.createIndex('timestamp', 'timestamp', { unique: false });
                    photoStore.createIndex('status', 'metadata.status', { unique: false });
                    photoStore.createIndex('savedAt', 'savedAt', { unique: false });
                }
            };
        });
    }

    async savePhoto(phoneImageId, imageBlob, metadata) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            // Convert blob to ArrayBuffer for better iOS compatibility
            const reader = new FileReader();
            
            reader.onload = () => {
                const transaction = this.db.transaction(['photos'], 'readwrite');
                const store = transaction.objectStore('photos');
                
                const photoData = {
                    phoneImageId,
                    imageData: reader.result, // ArrayBuffer
                    metadata: {
                        ...metadata,
                        savedAt: new Date().toISOString(),
                        size: imageBlob.size,
                        type: imageBlob.type
                    },
                    timestamp: Date.now()
                };
                
                const request = store.put(photoData);
                
                request.onsuccess = () => {
                    console.log(`💾 Photo saved: ${phoneImageId} (${this.formatFileSize(imageBlob.size)})`);
                    resolve(phoneImageId);
                };
                
                request.onerror = () => {
                    console.error('Save failed:', request.error);
                    reject(request.error);
                };
            };
            
            reader.onerror = () => {
                console.error('FileReader error:', reader.error);
                reject(reader.error);
            };
            
            // Use ArrayBuffer for better iOS support
            reader.readAsArrayBuffer(imageBlob);
        });
    }

    async getPhoto(phoneImageId) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.get(phoneImageId);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    // Convert ArrayBuffer back to Blob
                    const blob = new Blob([result.imageData], { 
                        type: result.metadata.type || 'image/jpeg' 
                    });
                    
                    resolve({
                        id: phoneImageId,
                        phoneImageId,
                        imageBlob: blob,
                        metadata: result.metadata,
                        size: blob.size,
                        type: blob.type,
                        timestamp: result.timestamp
                    });
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('Get photo failed:', request.error);
                reject(request.error);
            };
        });
    }

    async getAllPhotos() {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const store = transaction.objectStore('photos');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result.map(result => {
                    const blob = new Blob([result.imageData], { 
                        type: result.metadata.type || 'image/jpeg' 
                    });
                    
                    return {
                        id: result.phoneImageId,
                        phoneImageId: result.phoneImageId,
                        imageBlob: blob,
                        metadata: result.metadata,
                        size: blob.size,
                        type: blob.type,
                        timestamp: result.timestamp
                    };
                });
                
                // Sort by timestamp (newest first)
                results.sort((a, b) => b.timestamp - a.timestamp);
                
                console.log(`📋 Found ${results.length} photos`);
                resolve(results);
            };
            
            request.onerror = () => {
                console.error('Get all photos failed:', request.error);
                reject(request.error);
            };
        });
    }

    async updatePhoto(phoneImageId, updates) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            
            // First get the existing photo
            const getRequest = store.get(phoneImageId);
            
            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (!existing) {
                    console.warn(`Photo not found for update: ${phoneImageId}`);
                    resolve(false);
                    return;
                }
                
                // Update metadata
                existing.metadata = {
                    ...existing.metadata,
                    ...updates,
                    updatedAt: new Date().toISOString()
                };
                
                // Save updated record
                const putRequest = store.put(existing);
                
                putRequest.onsuccess = () => {
                    console.log(`📝 Updated: ${phoneImageId}`);
                    resolve(true);
                };
                
                putRequest.onerror = () => {
                    console.error('Update failed:', putRequest.error);
                    reject(putRequest.error);
                };
            };
            
            getRequest.onerror = () => {
                console.error('Get for update failed:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }

    async deletePhoto(phoneImageId) {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.delete(phoneImageId);
            
            request.onsuccess = () => {
                console.log(`🗑️ Deleted: ${phoneImageId}`);
                checkForStoredImages ();
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Delete failed:', request.error);
                reject(request.error);
            };
        });
    }

    async clearAllPhotos() {
        if (!this.isReady) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const store = transaction.objectStore('photos');
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('🧹 All photos cleared');
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Clear all failed:', request.error);
                reject(request.error);
            };
        });
    }

    async getStorageStats() {
        if (!this.isReady) await this.init();
        
        try {
            const photos = await this.getAllPhotos();
            const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
            
            const statusCounts = {
                pending: 0,
                uploaded: 0,
                failed: 0,
                registered: 0
            };

            photos.forEach(photo => {
                const status = photo.metadata?.status || 'pending';
                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                } else {
                    statusCounts.pending++;
                }
            });

            // Get storage estimate if available
            let storageUsed = 0;
            let storageQuota = 0;
            
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                try {
                    const estimate = await navigator.storage.estimate();
                    storageUsed = estimate.usage || 0;
                    storageQuota = estimate.quota || 0;
                } catch (e) {
                    console.warn('Storage estimate not available');
                }
            }

            return {
                totalPhotos: photos.length,
                totalSize,
                totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
                statusCounts,
                storageUsed,
                storageQuota,
                storageUsedMB: Math.round(storageUsed / 1024 / 1024),
                storageQuotaMB: Math.round(storageQuota / 1024 / 1024),
                storageType: 'IndexedDB'
            };
        } catch (error) {
            console.error('Stats failed:', error);
            return null;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global instance
const photoStorage = new IndexedDBPhotoStorage();

// Your existing wrapper functions - no changes needed!
async function storeImageLocally(imageBlob, metadata) {
    return await photoStorage.savePhoto(metadata.phoneImageId, imageBlob, metadata);
}

async function getPhotoByPhoneId(phoneImageId) {
    return await photoStorage.getPhoto(phoneImageId);
}

async function getAllStoredPhotos() {
    return await photoStorage.getAllPhotos();
}

async function updatePhotoWithUploadInfo(phoneImageId, uploadInfo) {
    return await photoStorage.updatePhoto(phoneImageId, uploadInfo);
}

async function deletePhotoFromLocalStorage(phoneImageId) {
    return await photoStorage.deletePhoto(phoneImageId);
}

async function updatePhotoStatus(phoneImageId, status) {
    return await photoStorage.updatePhoto(phoneImageId, { 
        status, 
        lastUpdated: new Date().toISOString() 
    });
}

async function getStorageInfo() {
    return await photoStorage.getStorageStats();
}