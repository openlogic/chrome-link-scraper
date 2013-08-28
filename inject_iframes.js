// Copyright OpenLogic, Inc.
// See LICENSE file for license information.
//

// only add iframes for "text/html" pages, not actual file downloads.
function check_mime_type(url, success) {
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', url);
  //console.log(url);
  xhr.onreadystatechange = function() {
    if (this.readyState == this.DONE && this.getResponseHeader('content-type').indexOf("text/html") != -1) {
      //console.log('success!')
      success(url);
    }
  }
  xhr.send();
}

var links = window.getLinks();
for (var index in links) {
  var url = links[index];
  var current_location = window.location.href;

  // - skip urls that look like "parents" of the current one
  if (url.indexOf(current_location) != -1) {
    check_mime_type(url, function(url){
      
      var frame = document.createElement('iframe');
      frame.width = 0;
      frame.height = 0;
      //frame.className = "_openlogic_remove_me hidden";
      frame.className = "hidden";

      document.body.appendChild(frame);
      //console.log(url);
      frame.src = url;
    })
    
    
  }
}

