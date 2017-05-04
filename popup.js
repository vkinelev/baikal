// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var allLinks = [];
var visibleLinks = [];

function gotoURL(event) {
  // alert('1');

  const newURL = event.target.innerText;

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
  var filterValue = document.getElementById('filter').value;
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
  showLinks();
}

function showLinks() {
  var linksTable = document.getElementById('links');
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
  }
  for (var i = 0; i < visibleLinks.length; ++i) {
    var row = document.createElement('tr');

    var col1 = document.createElement('td');
    col1.innerText = visibleLinks[i];
    col1.onclick = gotoURL;
    col1.style.whiteSpace = 'nowrap';
    col1.tabIndex = i + 2;
    col1.onkeyup = function(event) {
      event.preventDefault();
      if (event.keyCode == 13) {
        gotoURL(event);
      }
    }
    row.appendChild(col1);
    linksTable.appendChild(row);
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
