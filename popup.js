// Code marked "Chromium"
// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found at https://code.google.com/google_bsd_license.html

// Code marked "OpenLogic"
// Copyright (c) OpenLogic, Inc.
// See LICENSE file for license information.
//


// Chromium
var allLinks = [];
var visibleLinks = [];


// Chromium
// Display all visible links.
function showLinks() {
  var linksTable = document.getElementById('links');
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
  }
  for (var i = 0; i < visibleLinks.length; ++i) {
    var row = document.createElement('tr');
    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;
    col0.appendChild(checkbox);
    col1.innerText = visibleLinks[i];
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function() {
      checkbox.checked = !checkbox.checked;
    }
    row.appendChild(col0);
    row.appendChild(col1);
    linksTable.appendChild(row);
  }
}


// Chromium
// Toggle the checked state of all visible links.
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

function get_checked_links() {
  var urls = [];
  // Chromium
  for (var i = 0; i < visibleLinks.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      urls.push(visibleLinks[i]);
    }
  }
  return urls;
}

// OpenLogic
// Copy all visible checked links.
function copyCheckedLinks() {
  var urls = get_checked_links();
  copyTextToClipboard(urls.join("\n"));
  window.close();
}


// OpenLogic
// Copy provided text to the clipboard.
// 
// Usage:
// copyTextToClipboard('This text will be copied to the clipboard.');
function copyTextToClipboard(text) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = text;
  var body = document.getElementsByTagName('body')[0];
  body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  body.removeChild(copyFrom);
}


// OpenLogic
function do_filter_radios(f){
  var radios = document.getElementsByName("filters");
  for(var i = 0; i < radios.length; i++){
    f(radios[i]);
  }
}

// OpenLogic
function get_current_filter_radio(){
  var val;
  do_filter_radios(function(radio){
    if(radio.checked){
      val = radio;
    }
  })
  return val;
}

// OpenLogic
function get_current_filter_value() {
  var radio = get_current_filter_radio();
  var val;
  if(radio.id == "custom_filter") {
    val = document.getElementById('filter').value
  } else {
    val = radio.value;
  }
  return val;
}


// Chromium
// Re-filter allLinks into visibleLinks and reshow visibleLinks.
function filterLinks() {
  var filterRadio = get_current_filter_radio();
  var filterValue = get_current_filter_value();

  if (document.getElementById('regex').checked || filterRadio.id != 'custom_filter') {
    visibleLinks = allLinks.filter(function(link) {
      return link.match(filterValue);
    });
  } else {
    var terms = filterValue.split(' ');
    visibleLinks = allLinks.filter(function(link) {
      for (var termI = 0; termI < terms.length; ++termI) {
        var term = terms[termI];
        if (term.length != 0) {
          var expected = (term[0] != '-');
          if (!expected) {
            term = term.substr(1);
            if (term.length == 0) {
              continue;
            }
          }
          var found = (-1 !== link.indexOf(term));
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  showLinks();
}

// OpenLogic
function getSecondLevelLinks() {
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id},
                      function(activeTabs) {
                        var tabId = activeTabs[0].id;
                        chrome.tabs.executeScript(tabId, {file: 'inject_iframes.js', allFrames: true});
                        chrome.tabs.insertCSS(tabId, {code: '.hidden {display: none;}', allFrames: true});
                      });
  });
}

// Chromium
// Add links to allLinks and visibleLinks, sort and show them.  send_links.js is
// injected into all frames of the active tab, so this listener may be called
// multiple times.
chrome.extension.onRequest.addListener(function(links) {
  
  for (var index in links) {
    var link = links[index];
    if (allLinks.indexOf(link) == -1)
      allLinks.push(link);
  }
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();
});


// OpenLogic
// when new DOM content is loaded, trigger all frames to send us their links again.
// we might have new ones now. (this is for when we inject frames into the page to get
// second-level links)
chrome.webNavigation.onDOMContentLoaded.addListener(function(details){
  getLinksFromAllFrames();
});


// OpenLogic
// // callback for when the popup is closed down. here we clean up any iframes we inserted.
// doesn't work :(
// chrome.runtime.onSuspend.addListener(function(){
//   chrome.windows.getCurrent(function (currentWindow) {
//     chrome.tabs.query({active: true, windowId: currentWindow.id},
//                       function(activeTabs) {
//                         var tabId = activeTabs[0].id;
//                         chrome.tabs.executeScript(tabId, {file: 'cleanup_iframes.js'});
//                       });
//   });
// })


function getLinksFromAllFrames(){
  // Chromium
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id},
                      function(activeTabs) {
                        chrome.tabs.executeScript(
                          activeTabs[0].id, {file: 'send_links.js', allFrames: true});
                      });
  });
}

// Chromium
// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('filter').onkeyup = filterLinks;
  document.getElementById('regex').onchange = filterLinks;

  do_filter_radios(function(radio){
    radio.onchange = filterLinks;
  })
  
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('copy0').onclick = copyCheckedLinks;
  document.getElementById('secondLevel').onclick = getSecondLevelLinks;
  getLinksFromAllFrames();
};
