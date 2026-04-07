(function () {
  var lastUrl = window.location.href;
  var injectTimer = null;

  function onUrlChange() {
    var path = window.location.pathname;
    var existing = document.getElementById('pca-panel');
    if (existing) existing.remove();
    if (path.indexOf('/property-') === -1) return;
    tryInjectPanel();
  }

  setInterval(function() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      onUrlChange();
    }
  }, 500);

  if (window.location.pathname.indexOf('/property-') !== -1) {
    tryInjectPanel();
  }

  function tryInjectPanel() {
    if (injectTimer) clearInterval(injectTimer);
    var attempts = 0;
    injectTimer = setInterval(function() {
      attempts++;
      if (attempts > 30) { clearInterval(injectTimer); return; }
      if (window.location.pathname.indexOf('/property-') === -1) { clearInterval(injectTimer); return; }

      var addressEl =
        document.querySelector('[data-testid="listing-details__summary-title"]') ||
        document.querySelector('[class*="property-info"] h1') ||
        document.querySelector('[class*="listing-details"] h1') ||
        document.querySelector('h1');

      if (addressEl && addressEl.innerText.trim().length > 5) {
        clearInterval(injectTimer);
        injectPanel(addressEl.innerText.trim());
      }
    }, 1000);
  }

  function injectPanel(address) {
    if (document.getElementById('pca-panel')) return;

    var panel = document.createElement('div');
    panel.id = 'pca-panel';

    var ICONS = {
      bus: '\uD83D\uDE8C',
      gear: '\u2699\uFE0F',
      left: '\u25C0',
      right: '\u25B6',
      warn: '\u26A0\uFE0F',
      transit: '\uD83D\uDE87',
      driving: '\uD83D\uDE97',
      walking: '\uD83D\uDEB6',
      bicycling: '\uD83D\uDEB2',
      search: '\uD83D\uDD0D'
    };

    panel.innerHTML =
      '<div id="pca-header">' +
        '<div id="pca-header-left">' +
          '<span class="pca-logo">' + ICONS.bus + '</span>' +
          '<h3>Commute Times</h3>' +
        '</div>' +
        '<button id="pca-toggle-btn">' + ICONS.left + '</button>' +
      '</div>' +
      '<div id="pca-body">' +
        '<div id="pca-address"><strong>From:</strong> ' + address + '</div>' +
        '<div id="pca-loading"><div class="pca-spinner"></div>Calculating options...</div>' +
        '<div id="pca-results"></div>' +
      '</div>' +
      '<div id="pca-footer">' +
        '<a id="pca-settings-link">' + ICONS.gear + ' Configure locations</a>' +
      '</div>';

    document.body.appendChild(panel);

    var collapsed = false;
    var toggleBtn = panel.querySelector('#pca-toggle-btn');
    panel.querySelector('#pca-header').addEventListener('click', function() {
      collapsed = !collapsed;
      panel.classList.toggle('pca-collapsed', collapsed);
      toggleBtn.textContent = collapsed ? ICONS.right : ICONS.left;
    });

    panel.querySelector('#pca-settings-link').addEventListener('click', function(e) {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'openOptions' });
    });

    chrome.runtime.sendMessage(
      { action: 'fetchCommute', originAddress: address + ', Australia' },
      function(response) {
        var loadingEl = document.getElementById('pca-loading');
        var resultsEl = document.getElementById('pca-results');
        if (loadingEl) loadingEl.remove();

        if (!response || response.error) {
          var msg = response ? response.error : 'Check extension settings.';
          resultsEl.innerHTML = '<div class="pca-item pca-error-item">' + ICONS.warn + ' ' + msg + '</div>';
          return;
        }

        if (response.results && response.results.length > 0) {
          var html = '';
          response.results.forEach(function(r) {
            if (r.ok && r.options && r.options.length > 0) {
              var modeIcon = ICONS[r.mode] || ICONS.transit;
              
              if (r.isDynamic) {
                var labelPrefix = (r.sortBy === 'distance') ? 'Nearest ' : 'Top ';
                html += '<div class="pca-item">';
                html += '  <div class="pca-item-name">' + ICONS.search + ' ' + labelPrefix + r.name + ' <span class="pca-mode-label">(' + r.mode + ')</span></div>';
                
                r.options.forEach(function(opt, index) {
                  var routeHtml = opt.route ? '<div class="pca-route-pill" style="margin-top:4px;">' + opt.route + '</div>' : '';
                  html += '  <div class="pca-option-block">';
                  html += '    <div style="font-weight:700; color:#333f48; font-size:0.85rem; margin-bottom:4px;">' + opt.placeName + ' <span style="font-weight:normal; color:#d69e2e; font-size:0.75rem; margin-left:4px;">' + opt.rating + '</span></div>';
                  html += '    <div class="pca-item-detail">';
                  html += '      <span class="pca-icon">' + modeIcon + '</span>';
                  html += '      <span class="pca-duration">' + opt.duration + '</span>';
                  html += '      <span class="pca-distance">' + opt.distance + '</span>';
                  html += '    </div>';
                  html +=      routeHtml;
                  html += '  </div>';
                });
                html += '</div>';

              } else {
                html += '<div class="pca-item">';
                html += '  <div class="pca-item-name">' + r.name + ' <span class="pca-mode-label">(' + r.mode + ')</span></div>';
                
                r.options.forEach(function(opt, index) {
                  var optionNum = r.options.length > 1 ? '<div class="pca-option-idx">Route ' + (index + 1) + '</div>' : '';
                  var routeHtml = opt.route ? '<div class="pca-route-pill">' + opt.route + '</div>' : '';
                  
                  html += '  <div class="pca-option-block">';
                  html +=      optionNum;
                  html += '    <div class="pca-item-detail">';
                  html += '      <span class="pca-icon">' + modeIcon + '</span>';
                  html += '      <span class="pca-duration">' + opt.duration + '</span>';
                  html += '      <span class="pca-distance">' + opt.distance + '</span>';
                  html += '    </div>';
                  html +=      routeHtml;
                  html += '  </div>';
                });
                html += '</div>';
              }
            } else {
              html += '<div class="pca-item pca-error-item">' + ICONS.warn + ' ' + r.name + ': Could not fetch options</div>';
            }
          });
          resultsEl.innerHTML = html;
        }
      }
    );
  }
})();
