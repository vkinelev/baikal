// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var allLinks = [];
var visibleLinks = [];

function gotoURL(event) {
  const newURL = event.target.querySelector('.link-href').innerText;

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query(
      { active: true, windowId: currentWindow.id },
      function(activeTabs) {
        chrome.tabs.update(activeTabs[0].id, {url: newURL});
        window.close();
      }
    );
  });
}

// Re-filter allLinks into visibleLinks and reshow visibleLinks.
function filterLinks() {
  var filterValue = document.getElementById('filter').value.toLowerCase();
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
        var found = (
          -1 !== link.href.toLowerCase().indexOf(term) ||
          -1 !== link.innerText.toLowerCase().indexOf(term)
        );

        if (found != expected) {
          return false;
        }
      }
    }
    return true;
  });
  showLinks();
}

function showLinks() {
  var linksTable = document.querySelector('#links > tbody');
  while (linksTable.children.length > 0) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
  }

  var templete = document.querySelector('#linkRowTemplate');
  const tr = templete.content.querySelector("tr");
  const td = templete.content.querySelector("td");
  const linkCaptionElement = td.querySelector(".link-caption");
  const linkHrefElement = td.querySelector(".link-href");

  // Clone the new row and insert it into the table
  const tb = document.querySelector("tbody");

  for (var i = 0; i < visibleLinks.length; ++i) {
    linkCaptionElement.innerText = visibleLinks[i].innerText;
    linkHrefElement.innerText = visibleLinks[i].href;
    let clone = document.importNode(templete.content, true);

    const newTr = clone.querySelector('tr');
    newTr.onclick = gotoURL;
    newTr.tabIndex = i + 2;
    newTr.onkeyup = function(event) {
      event.preventDefault();
      if (event.keyCode == 13) {
        gotoURL(event);
      }
    }
    tb.appendChild(clone);
  }
}

chrome.extension.onRequest.addListener(function(links) {
  for (var index in links) {
    allLinks.push(links[index]);
  }
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();
});


// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('filter').focus();
  document.getElementById('filter').onkeyup = filterLinks;
  // document.getElementById('regex').onchange = filterLinks;
  // document.getElementById('toggle_all').onchange = toggleAll;

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id},
                      function(activeTabs) {
      chrome.tabs.executeScript(
        activeTabs[0].id, {file: 'send_links.js', allFrames: true});
    });
  });
};
