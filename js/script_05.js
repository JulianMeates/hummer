//
var glbVersion = '1.0'; 
var glbSubmitted = false; 
var glb_ox = "";
var glb_scriptName = document.currentScript.src;

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
//  element.innerHTML = "&nbsp;";
/*
  element = document.getElementById("SA_Side");
//  element.innerHTML = "&nbsp;";
 // element.style.display = "none";

  element = document.getElementById("SA_Lines");
//  element.innerHTML = "&nbsp;";
//  element.style.display = "none";

  element = document.getElementById("SA_Footer");
  element.innerHTML = "&nbsp;";
  element.style.display = "none";
*/
  element = document.getElementById("SA_ActionMenu");
//  element.style.display = "none";

  element = document.getElementById("Details");
  element.innerHTML = "&nbsp;";

  element = document.getElementById("Footer");
  element.innerHTML = "&nbsp";
/*
  element = document.getElementById("Header");
  element.innerHTML = "&nbsp;";

  element = document.getElementById("Settings");
  element.innerHTML = "&nbsp;";
  
  resizePanels();
 */ 
}


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


function requiredHeight(pElement) {
  var lLastChild = null;
  if (typeof(pElement) != 'undefined' && pElement != null ) {
    lLastChild = pElement.lastChild;
    if (typeof(lLastChild) != 'undefined' &&
      lLastChild != null &&
       isDivElement(lLastChild) &&
       lLastChild != document.body) {
      return (lLastChild.offsetTop - pElement.offsetTop) + lLastChild.clientHeight;
  }
  }
  return 0;
}

function resizePanels() {
  var sa_p = document.getElementById("SaPane");
  var footer_p = document.getElementById("FooterPane");
  var details_p = document.getElementById("DetailsPane");
  var action_p = document.getElementById("ActionPane");
  var action = document.getElementById("Action");
  var a_options = document.getElementById("A_Options");
  var options = document.getElementById("OPTIONS");
  var details = document.getElementById("Details");
  var footer = document.getElementById("Footer");
  var sa = document.getElementById("SA");
  var sa_lines = document.getElementById("SA_Lines");
  var sa_footer = document.getElementById("SA_Footer");
  var bottomOfAction = document.getElementById("bottomOfAction");
  var grid = action_p.parentElement;

/*  var max_Height = grid.offsetHeight;/* window.innerHeight;*/
  var max_Height = document.body.offsetHeight * .99;
  var max_Width = document.body.offsetWidth * .99;
  var top = grid.offsetTop;
  var height = 0;
  var heightSa = 0;
  var heightSaLines = 0;
  var width = 0;
  var lReqHeightSaHeader = requiredHeight(sa);
  var lReqHeightSaLines = requiredHeight(sa_lines);
  var lReqHeightSaFooter = requiredHeight(sa_footer);


  // the actions panel spans all the rows - so set this up first
  // as the other offsets and heights will be dependant on this  
  action.style.width = action_p.offsetWidth - 2;
  /*
  if (bottomOfAction != null) {
    height = bottomOfAction.offsetTop + bottomOfAction.offsetHeight;
    action.style.height = height + "px";
  } else {
    height = action.offsetHeight;
  }
  action_p.style.height = (max_Height - action_p.offsetTop) + "px";
  height = action_p.offsetHeight - height;
 // if (height < 650) {
 // a_options.style.height = "650px"; //(height - 12) + "px";
 // } else {
  a_options.style.height = (height - 12) + "px";
    
  //}
  if (options != null) {
    options.style.height = a_options.offsetHeight + "px";
  }

  // these are determined by the grid layout - can't change 
//  footer_p.offsetTop = max_Height - footer_p.offsetHeight;
//  details_p.offsetTop = footer_p.offsetTop - details_p.offsetHeight;
*/

  sa.style.overflow = "hidden";
  sa_lines.style.overflow = "hidden";
  width = max_Width - action_p.offsetWidth - 4;
  height = Math.round(max_Height + 1 - sa_p.offsetTop - details_p.offsetHeight- 20 - sa_footer.offsetHeight);
  // good to go if no lines
  if (lReqHeightSaHeader == 0 && lReqHeightSaLines == 0) {
    heightSa = height;
    lReqHeightSaHeader = height;
    sa.style.overflow = "auto";

  // we have lines
  // if there are no lines then the sa(header) take the whole remaining space
  } else if (lReqHeightSaLines == 0) {
    heightSa = height;
    sa.style.overflow = "auto";
  // we have lines
  // if there is no sa(header) then the lines take the whole remaining space
  } else if (lReqHeightSaHeader == 0) {
    heightSaLines = height;
    sa_lines.style.overflow = "auto";
  // now the fun begins - we have sa(header), lines (and possibly footer)
  // if the combined height is less than the available then expand lines height only
  } else if ((lReqHeightSaHeader + lReqHeightSaLines) < height) {
    heightSa = lReqHeightSaHeader;
    heightSaLines = height - lReqHeightSaHeader;
  // prefer to make the sa(header) no overflow
  // each block can have up to half the available
  } else if (lReqHeightSaHeader < (height / 2)) {
    heightSa = lReqHeightSaHeader;
    heightSaLines = height - lReqHeightSaHeader;
    sa_lines.style.overflow = "auto";
  } else if (lReqHeightSaLines < (height / 2)) {
    heightSaLines = lReqHeightSaLines;
    heightSa = height - lReqHeightSaLines;
    sa.style.overflow = "auto";
  } else {
    heightSaLines = height / 2;
    heightSa = heightSaLines;
    sa_lines.style.overflow = "auto";
  }

  if (lReqHeightSaHeader != 0) {
    sa.style.height = (heightSa - 2) + "px";
    sa.style.width = width + "px";
  }
  if (lReqHeightSaLines != 0) {
    sa_lines.style.height = (heightSaLines - 2) + "px";
    sa_lines.style.width = width + "px";
  }

  height = details_p.offsetHeight;
  details.style.height = (details_p.offsetHeight - 2) + "px";
  details.style.width = width + "px";

 footer.style.height = 20 + "px";
 footer.style.width = (action_p.offsetWidth - 4) + "px";
//  footer.style.width = width + "px";
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

function submitFileSplit (n){
  if (glbSubmitted) {
    return;
  }
  
  // send the file as chunks then submit the form
  let lFileHandle = null;
  let lBlockSize = null;
  let lNumberOfChunks = null;
  let lByteIndex = 0;
  let lByteEnd = 0;
  let lChunk = null;
  let lChunkNumber = 0;


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
  let reader = new FileReader();
let fileToUpload;
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
    window.document.body.style.cursor = "auto"; 
    glbSubmitted = false;
  });	


}



 

  function submitFile_DestinationHandle(){
    var lObj = {};
    var lResponse = {};
 
    //  make a call to jade requesting a destination file handle (Jade OID) - specify file size
    lObj["systemName"] = glbSystemName;  
    lObj["formName"] = "FileDestinationHandle";
    lObj["fileName"] = Conversions.base32.encode(fileToUpload.name);
    lObj["vin"] = Conversions.base32.encode(fileToUpload.size.toString());
    var lJson = JSON.stringify(lObj);
    lUrl = glbPostRestUrl;



  JadeRestRequest (lJson)
  .then (response =>  
      {
       if (glbReponseEncoded){
          var lResponse =  atob (response);
        } else {
            var lResponse = response; 
        }
        lJadeData = JSON.parse(lResponse);

      if (Object.keys(lJadeData).length > 0){
        lFileHandle = lJadeData.fileHandle;
        lBlockSize = lJadeData.blockSize;
        lNumberOfChunks = Math.ceil(fileToUpload.size/lBlockSize);
        submitFile_NextChunk();
      }
     })
     .catch(error => {
      glbSubmitted = false;
      window.document.body.style.cursor = "auto"; 
     // console.warn("File chunk handle request postJSON error, status:" + status + " error:" + error + " response:" + jqXHR.responseText);
      document.getElementById("Footer").innerHTML = "<div class='ftrError'>Sorry - we are unable to process your request - please contact Torro Software</div>";
    });
  }
  
  function submitFile_NextChunk(){
    //  send each chunk
    lChunkNumber += 1;
    //  should never happen
    if (lChunkNumber > lNumberOfChunks){
      return;
    }

    lByteEnd = Math.ceil((fileToUpload.size / lNumberOfChunks) * lChunkNumber);
    lChunk = fileToUpload.slice(lByteIndex, lByteEnd);
    lByteIndex += (lByteEnd - lByteIndex);
      
    reader.readAsDataURL(lChunk);
    reader.onloadend = function () {
      submitFile_SendChunk(reader.result);
    };
    reader.onerror = function (error) {
      glbSubmitted = false;
      window.document.body.style.cursor = "auto"; 
      console.log('Next Chunk Error: ', error);
      document.getElementById("Footer").innerHTML = "<div class='ftrError'>Sorry - we are unable to process your request - please contact Torro Software</div>";
    };
  }

  function submitFile_SendChunk(pChunk){
    var lObj = {};
    var lResponse = {};
    var lStatus = null;
    var lPercent = ((100 * lChunkNumber) / lNumberOfChunks).toFixed();

    lObj["systemName"] = glbSystemName;  
    lObj["formName"] = "FileChunkSave";
    lObj["vin"] = Conversions.base32.encode(lFileHandle);
    lObj["doc"] = pChunk;
    lObj["sid"] = Conversions.base32.encode(lChunkNumber.toString());
    var lJson = JSON.stringify(lObj);
    lUrl = glbPostRestUrl;
    document.getElementById("Footer").innerHTML = "<div class='ftrInfo'>Uploading file " + fileToUpload.name + '<div id="myProgress" style="width: 50px; background-color: #ddd;"><div id="myBar" style="width: ' + lPercent + '%;background-color: #04AA6D;height: 95%" ></div></div> ' + lPercent + "&#37; Complete</div>";

    JadeRestRequest (lJson)
    .then (response =>  
        {
        
        if (glbReponseEncoded){
          var lResponse =  atob (response);
        } else {
            var lResponse = response; 
        }
        lJadeData = JSON.parse(lResponse);

      if (Object.keys(lJadeData).length > 0){
        lStatus = lJadeData.status;
        if (lStatus == "Complete" ||   lChunkNumber >= lNumberOfChunks) {
          //  submit the form
          //  update the form to include the destimation file handle
          glbSubmitted = false;

          f.doc.value = lFileHandle;
          submitForm(f);
        } else if (lStatus == "Done"){
          submitFile_NextChunk();
        } else if (lStatus == "Error"){
          glbSubmitted = false;
          window.document.body.style.cursor = "auto"; 
          console.warn("Send chunk error:" + lJadeData.error);    
          document.getElementById("Footer").innerHTML = "<div class='ftrError'>Send Chunk1 - Sorry - we are unable to process your request - please contact Torro Software</div>";
        }
      }
    })
      .catch(error => {
     // console.warn("send chunk postJSON error, status:" + status + " error:" + error + " response:" + jqXHR.responseText);
      document.getElementById("Footer").innerHTML = "<div class='ftrError'>Send Chunk2 Sorry - we are unable to process your request - please contact Torro Softwarex" + error + "</div>";
      glbSubmitted = false;
      window.document.body.style.cursor = "auto"; 
      return lResponse;
    });
  }
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
      document.getElementById("Footer").innerHTML = "<div class='ftrError'>Rest Request - Sorry - we are unable to process your request - please contact Torro Software " + error + "</div>";
       glbSubmitted = false;
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
        document.getElementById("Footer").innerHTML = "<div class='ftrError'>There is a system name version error (" + element.value + " / " + glbSystemName + ") - please contact Torro Software</div>";
        document.getElementById("Action").innerHTML = "<div class='ftrError'>There is a system name version error (" + element.value + " / " + glbSystemName + ")<br>Please contact Torro Software<br>(" + glbSystemScriptName + ")</div>";
        return;
      }
    }
    element = document.getElementById("systemVersion");
    if (typeof(element) != 'undefined' && element != null  ) {
      if (element.value != glbSystemVersion){
        alert('Version error. Expecting system version:"' + element.value + '", current version:"' + glbSystemVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
        document.getElementById("Footer").innerHTML = "<div class='ftrError'>There is a system version error (" + element.value + " / " + glbSystemVersion + ") - please contact Torro Software</div>";
        document.getElementById("Action").innerHTML = "<div class='ftrError'>There is a system version error (" + element.value + " / " + glbSystemVersion + ")<br>Please contact Torro Software<br>(" + glbSystemScriptName + ")</div>";
        return;
      }
    }
    element = document.getElementById("scriptVersion");
    if (typeof(element) != 'undefined' && element != null  ) {
      if (element.value != glbVersion){
        alert('Version error. Expecting script version:"' + element.value + '", current version:"' + glbVersion + '". Please refresh your browser by holding down the "Ctrl" key on your keyboard while pressing the "F5" key once.')
        document.getElementById("Footer").innerHTML = "<div class='ftrError'>There is a script version error (" + element.value + " / " + glbVersion + ") - please contact Torro Software</div>";
        document.getElementById("Action").innerHTML = "<div class='ftrError'>There is a script version error (" + element.value + " / " + glbVersion + ")<br>Please contact Torro Software<br>(" + glb_scriptName + ")</div>";
        return;
      }
    }


  })
    .fail(function(){
      document.getElementById("Footer").innerHTML = "<div class='ftrError'>Request for logon form has failed - please contact Torro Software</div>";
    });


  /* clear initial text values */
  var element = document.getElementById("A_Options");
  element.innerHTML = "&nbsp;";


  element = document.getElementById("SA");
  element.innerHTML = "&nbsp;";
/*
  element = document.getElementById("SA_Side");
  element.innerHTML = "&nbsp;";
 // element.style.display = "none";

  element = document.getElementById("SA_Lines");
  element.innerHTML = "&nbsp;";
  element.style.display = "none";

  element = document.getElementById("SA_Footer");
  element.innerHTML = "&nbsp;";
  element.style.display = "none";

  element = document.getElementById("SA_ActionMenu");
  element.style.display = "none";

  element = document.getElementById("Details_ActionMenu");
  element.style.display = "none";
*/
  element = document.getElementById("Details");
  element.innerHTML = "&nbsp;";


  element = document.getElementById("Footer");
  element.innerHTML = "&nbsp;";
/*
  element = document.getElementById("Header");
  element.innerHTML = "&nbsp;";

  element = document.getElementById("Settings");
  element.innerHTML = "&nbsp;";
  */
  //resizePanels();

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
    // Reflect.has in favor of: object.hasOwnProperty(key)
//    lValue = value;

  

    if (key == "doc") {
         lValue = value;
    } else if (key == "fileName") {
         lValue = Conversions.base32.encode(value.name);
    } else if (key == "rid") {
        lValue = generateRandomString ();
    } else {
        lValue = Conversions.base32.encode(value);
    
    }
  //    lValue = value.replace("\\", "\\\\");
      if(!Reflect.has(object, key)){
          object[key] = lValue;
          return;
      }
      if(!Array.isArray(object[key])){
          object[key] = [object[key]];
      }
      object[key].push(lValue);
    });


 // object["systemName"].push(glbSystemName);
  var json = JSON.stringify(object);
  json = json.replace("}", ',"systemName":"' + glbSystemName + '"}');
  lUrl = glbPostRestUrl;


  JadeRestRequest (json)
  .then (response =>  
      {
     PopulatePanels (response);
     })
      .catch(error => {
    //   console.warn("getJSON error, status:" + " error:" + error + " response:" );
   //   document.getElementById("Footer").innerHTML = "<div class='ftrError'>Submit Form - Sorry - we are unable to process your request - please contact Torro Software " + error + "</div>";
       glbSubmitted = false;
       window.document.body.style.cursor = "auto"; 
    // Handle login failure here
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
    if (lSectionHtml != "" ){
      
        document.getElementById("SA_Side").innerHTML = lSectionHtml;
        if (lSectionHtml != "&nbsp;" ){

            document.getElementById("SA_ActionMenu").style.display = "block";
 //           document.getElementById("SA_Side").style.display = "block";
        } else {
            document.getElementById("SA_ActionMenu").style.display = "none";
 //           document.getElementById("SA_Side").style.display = "none";
        }
    }


    lSectionHtml = getBetweenDelim(lJadeData, "<!-- DetailsSection -->", "<!-- End_DetailsSection -->");
    if (lSectionHtml != "" ){
         document.getElementById("Details").innerHTML = lSectionHtml;
    }

    lSectionHtml = getBetweenDelim(lJadeData, "<!-- MessageSection -->", "<!-- End_MessageSection -->");
    if (lSectionHtml != "" ){
         document.getElementById("Footer").innerHTML = lSectionHtml;
    }
      
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- DocLinkSection -->", "<!-- End_DocLinkSection -->");
    if (lSectionHtml != "" ){
      if (lSectionHtml.indexOf("<html>") >= 0) {
        win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
        win.document.documentElement.innerHTML = lSectionHtml;
      } else {
        lPos = lSectionHtml.indexOf(';');
        var lFilename = lSectionHtml.substring(0, lPos);
        var lElement = document.createElement('a');
        lElement.setAttribute('href',lSectionHtml.substring(lPos+1));
        lElement.setAttribute('download', lFilename);
        document.body.appendChild(lElement);
        lElement.click();
        document.body.removeChild(lElement);
      }
    }
    lSectionHtml = getBetweenDelim(lJadeData, "<!-- ScriptsSection -->", "<!-- End_ScriptsSection -->");
    if (lSectionHtml != "" ){
        eval(lSectionHtml);
    }

    formElement.action.value = null;
    //  reinstate the ox so that the next button click will be for the correct step (has been changed by submitValue)
    if (glb_ox != "") {
      formElement.ox.value = glb_ox;
    }
    window.document.body.style.cursor = "auto"; 
   // resizePanels();

    glbSubmitted = false;
    glb_ox = "";
    var lElement = document.getElementById ("vin");
    if (lElement){lElement.focus();}  
    }
  
    

function submitForm_web (n) {
  n.submit();
}

function submitValue (n) {
  var f = document.getElementById(glbBaseFormName);
  glb_ox = f.ox.value;
  f.oxs.value = n;
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

function validateEmail (labelName, email){
   if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value)) {
     email.setAttribute ("valid", "true");
    updateLabel (labelName, email);
   
    return (true);
  } else {
    email.setAttribute ("valid", "false");
    alert("You have entered an invalid email address!");
     
    return (false);
  }
}

function validateName (labelName, name){
   if (name.value.length > 6) {
    name.setAttribute ("valid", "true");
    updateLabel (labelName, name);
    
    return (true);
  } else {
    name.setAttribute ("valid", "false");
    alert("Your Name must be at least 6 Characters!");
    CheckSubmit (false);
    return (false);
  }
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

function validatePhone (labelName, phone){
   if (/^[0-9]+$/.test(phone.value) && phone.value.length > 6) {
    phone.setAttribute ("valid", "true");
    updateLabel (labelName, phone);
    return (true);
  } else {
    phone.setAttribute ("valid", "false");
     alert("You have entered an invalid phone number, please only include numbers (including area code or mobile prefix)!");
    return (false);
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
      var jsonData = data; //JSON.stringify(data); //  JSON.stringify(normalizedData);
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
              console.logError('Error parsing JSON response:', e);
              resolve(xhr.responseText); // Fallback to raw text
            }
          } else {
            console.logError(`XHR failed with status: ${xhr.status}`);
            reject(new Error(`Request failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };
      
      xhr.ontimeout = function() {
        console.logError('XHR timed out');
        reject(new Error('Request timed out'));
      };
      
      xhr.onerror = function(e) {
        console.logError('XHR network error:', e);
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
        console.logError('XHR setup error:', error);
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

       
