// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found at https://code.google.com/google_bsd_license.html

// Send back to the popup a sorted deduped list of valid link URLs on this page.
// The popup injects this script into all frames in the active tab.

// This copyrighted code has been slightly modified by OpenLogic, Inc.
// Modifications include moving the code into callable functions.
window.getLinks = function() {
  try {
    var domain = window.parent.location.origin;
    var root = (domain == 'http://sourceforge.net' ? document.getElementById('files_list') : document);
    var links = [].slice.apply(root.getElementsByTagName('a'));
    links = links.map(function(element) {
      // Proceed only if the link is in the same domain.
      if (element.href.indexOf(domain) == 0) {
        // Return an anchor's href attribute, stripping any URL fragment (hash '#').
        // If the html specifies a relative path, chrome converts it to an absolute
        // URL.
        var href = element.href;
        var hashIndex = href.indexOf('#');
        if (hashIndex >= 0) {
          href = href.substr(0, hashIndex);
        }
        return href;
      }
    });

    // Remove undefined from the links array.
    for (var n = links.length - 1; n >= 0; --n) {
      if (links[n] == undefined)
        links.splice(n, 1);
    }

    links.sort();
    return links;
  } catch (error) {
    return [];
  }
}


window.sendLinks = function() {
  var links = getLinks();
  // console.log(links);

  // Remove duplicates and invalid URLs.
  var kBadPrefix = 'javascript';
  for (var i = 0; i < links.length;) {
    if (((i > 0) && (links[i] == links[i - 1])) ||
        (links[i] == '') ||
        (kBadPrefix == links[i].toLowerCase().substr(0, kBadPrefix.length))) {
      links.splice(i, 1);
    } else {
      ++i;
    }
  }
  
  chrome.extension.sendRequest(links);
}

window.sendLinks();
