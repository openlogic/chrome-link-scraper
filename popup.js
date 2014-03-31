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
var totalRequests = 0;
var totalReceived = 0;
var errorLinks = [];
var statusDisplay = {};


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

function convert_sourceforge_links(urls) {
  errorLinks = [];
  var downloadLinks = [];
  var totalUrlCount = urls.length;

  for (var n = 0; n < totalUrlCount; ++n)
  {
    // Get the components of this url
    var urlComponents = urls[n].split('/');
    if (urlComponents.pop() != 'download')
      downloadLinks.push(urls[n]);  // not a download redirect link
    else
    {
      var projectName = urlComponents[urlComponents.indexOf('projects') + 1];
      var fileName = urlComponents.
                       slice(urlComponents.indexOf('files') + 1).
                       join('/');

      // Get the mirror sites for this url
      // Note: This uses the synchronous request.  It is not ideal but is more
      //       deterministic.
      var mirrorListUrl = [
        "http://sourceforge.net/settings/mirror_choices?projectname=",
        projectName,
        "&filename=",
        fileName
      ].join('');

      var ok = true;
      var mirrorList = {};
      $.ajax({ url: mirrorListUrl,
               dataType: 'text',
               async: false,
               type: 'GET',
               success: function(data) {
                 mirrorList = $('#mirrorList', $.parseHTML(data));
               },
               error: function() {
                 errorLinks.push(urls[n]);
                 ok = false;
               }
      });

      if (ok)
      {
        var mirrorNames = [];
        $('li', mirrorList).each(function(index) {
          mirrorNames.push($(this).attr('id'));
        });
        mirrorNames.shift();  // Remove the first element because it is 'autoselect'.

        // Pick a random mirror site
        var mid = Math.floor((Math.random() * mirrorNames.length));

        // Construct the direct download url
        downloadLinks.push([
          "http://",
          mirrorNames[mid],
          ".dl.sourceforge.net/project/",
          projectName,
          '/',
          fileName
        ].join(''));
      }
    }
  }

  return downloadLinks;
}

function showCopying() {
  statusDisplay.html('<span style="color: blue;">Copying...</span>');
}

// OpenLogic
// Copy all visible checked links.
function copyCheckedLinks() {
  var urls = get_checked_links();
  if (urls[0].indexOf('http://sourceforge.net') == 0)
    urls = convert_sourceforge_links(urls);
  statusDisplay.html('<span style="color: green;">Complete</span>');
  result = copyTextToClipboard(urls.join("\n"));
  if (errorLinks.length > 0)
  {
    visibleLinks = errorLinks;
    var errorText = '<span style="color: red;">' +
        'These following links were not copied because their mirror site info could not be retrieved.' +
        '</span>';
    statusDisplay.html(errorText);
    showLinks();
    result.body.removeChild(result.child);
  }
  else
  {
    result.body.removeChild(result.child);
    window.close();
  }
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
  return { body: body, child: copyFrom };
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
        chrome.tabs.executeScript(tabId, {file: 'send_second_level_links.js', allFrames: true});
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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.total != undefined && request.total != null)
    {
      totalRequests = request.total;
      statusDisplay.html('<span style="color: darkslategray;">Estimating progress...</span>');
    }

    if (request.remainder != undefined && request.remainder != null)
    {
      var content = '<span style="color: green;">Complete</span>';
      totalReceived += 1;
      if (request.remainder > 0 && totalReceived < totalRequests)
      {
        var partial = Math.round(100.0 * (totalRequests - request.remainder) / totalRequests);
        content = '<span style="color: blue;">' + partial.toString() + '% done...</span>';
      }
      statusDisplay.html(content);
    }
  }
);


// OpenLogic
// when new DOM content is loaded, trigger all frames to send us their links again.
// we might have new ones now. (this is for when we inject frames into the page to get
// second-level links)
//chrome.webNavigation.onDOMContentLoaded.addListener(function(details){
//  getLinksFromAllFrames();
//});


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

  statusDisplay = $('#current_status');
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('copy0').onmousedown = showCopying;  // The only purpose of this is to display 'Copying...' in the status box.
  document.getElementById('copy0').onclick = copyCheckedLinks;
  document.getElementById('secondLevel').onclick = getSecondLevelLinks;
  getLinksFromAllFrames();
};
