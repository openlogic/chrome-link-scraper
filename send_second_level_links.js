// Copyright OpenLogic, Inc.
// See LICENSE file for license information.
//

var totalRequests = 0;

// First check the MIME type of the URL.  If it is the desired type, then make
// the AJAX request to get the content (DOM) and extract the relevant links
// in the content.
function follow_html_mime_type(url)
{
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', url);
  xhr.onreadystatechange = function() {
    if (this.readyState == this.DONE &&
        this.getResponseHeader('content-type').indexOf("text/html") != -1)
    {
      totalRequests += 1;
      chrome.runtime.sendMessage({ total: totalRequests });
      requestDOM(url);
    }
  }
  xhr.send();
}

function requestDOM(url)
{
  var domRequest = new XMLHttpRequest();
  domRequest.open('GET', url, true);
  domRequest.onreadystatechange = function() {
    if (this.readyState == this.DONE &&
        this.status == 200)
    {
      var dom = $.parseHTML(this.responseText);
      extractLinks(dom);
    }
  }
  domRequest.send();
}

function extractLinks(doc)
{
  try {
    var domain = window.parent.location.origin;
    var aTag = 'a';
    if (domain == 'http://sourceforge.net')
      aTag = 'a.name'
    var links = $(aTag, doc).toArray();
    links = links.map(function(element) {
      // Proceed only if the link is in the same domain.
      if (element.href.indexOf(domain) == 0)
      {
        // Return an anchor's href attribute, stripping any URL fragment (hash '#').
        // If the html specifies a relative path, chrome converts it to an absolute
        // URL.
        var href = element.href;
        var hashIndex = href.indexOf('#');
        if (hashIndex > -1)
          href = href.substr(0, hashIndex);

        return href;
      }
    });

    // Remove undefined from the links array.
    for (var n = links.length - 1; n >= 0; --n)
    {
      if (links[n] == undefined)
        links.splice(n, 1);
    }

    links.sort();
    totalRequests -= 1;
    chrome.runtime.sendMessage({ remainder: totalRequests });
    chrome.extension.sendRequest(links);
  }
  catch (error)
  {
    // Do nothing.
    totalRequests -= 1;
    chrome.runtime.sendMessage({ remainder: totalRequests });
  }
}

window.sendSecondLevelLinks = function() {
  var firstLevelLinks = window.getLinks();
  for (var index in firstLevelLinks)
  {
    var url = firstLevelLinks[index];
    var current_location = window.location.href;
    var domain = window.parent.location.origin;

    // - skip urls that look like "parents" of the current one
    if (url.indexOf(current_location) != -1 && url.indexOf(domain) == 0)
      follow_html_mime_type(url);
  }
}

window.sendSecondLevelLinks();
