export default (App) => {
  Vue.mixin({
    methods: {
      t: browser.i18n.getMessage,
      formatBytes(bytes, decimals) {
        // https://stackoverflow.com/a/18650828
        if (bytes == 0) return '0 Bytes';
        let k = 1024,
          dm = decimals === undefined ? 2 : decimals,
          sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
          i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
      }
    }
  });

  return {
    el: '#app',
    render: h => h(App),
    mounted() {
      this.$on('savePreferences', async preferences => {
        try {
          await browser.runtime.sendMessage({
            method: 'savePreferences',
            payload: {
              preferences
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('error while saving preferences', error);
          showError('Error while saving preferences!');
        }
      });
    }
  };
};



window.isolationDomainAddRule = async () => {
  const domainPattern = document.querySelector('#isolationDomainPattern').value;

  preferences.isolation.domain[domainPattern] = {
    always: {
      action: document.querySelector('#isolationDomainAlways').value,
      allowedInPermanent: document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked
    },
    navigation: {
      action: document.querySelector('#isolationDomainNavigation').value
    },
    mouseClick: {
      middle: {
        action: document.querySelector('#isolationDomainMouseClickMiddle').value
      },
      ctrlleft: {
        action: document.querySelector('#isolationDomainMouseClickCtrlLeft').value
      },
      left: {
        action: document.querySelector('#isolationDomainMouseClickLeft').value
      }
    },
    excluded: isolationDomainExcludedDomains
  };

  await savePreferences();
  updateIsolationDomains();
};

window.isolationDomainEditRule = (domainPattern) => {
  domainPattern = decodeURIComponent(domainPattern);
  document.querySelector('#isolationDomainPattern').value = domainPattern;

  if (preferences.isolation.domain[domainPattern]) {
    const domainRules = preferences.isolation.domain[domainPattern];

    $('#isolationDomainAlways').dropdown('set selected', domainRules.always.action);
    document.querySelector('#isolationDomainAlwaysAllowedInPermanent').checked = domainRules.always.allowedInPermanent;
    $('#isolationDomainNavigation').dropdown('set selected', domainRules.navigation.action);
    $('#isolationDomainMouseClickMiddle').dropdown('set selected', domainRules.mouseClick.middle.action);
    $('#isolationDomainMouseClickCtrlLeft').dropdown('set selected', domainRules.mouseClick.ctrlleft.action);
    $('#isolationDomainMouseClickLeft').dropdown('set selected', domainRules.mouseClick.left.action);
    $('#isolationPerDomainAccordion').accordion('open', 0);
    $('#isolationPerDomainAccordion').accordion('open', 1);
    $('#isolationPerDomainAccordion').accordion('open', 2);
    $('#isolationPerDomainAccordion').accordion('open', 3);

    isolationDomainExcludedDomains = domainRules.excluded;
    updateIsolationDomainExcludeDomains();
  }
};

window.isolationDomainRulesClickEvent = false;
window.updateIsolationDomains = () => {
  const isolationDomainRules = $('#isolationDomains');
  const domainRules = Object.keys(preferences.isolation.domain);
  if (domainRules.length) {
    isolationDomainRules.html('');
    domainRules.map((domainPattern) => {
      const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
        `<span id="infoDomainRule" href="#">${domainPattern} <i class="icon-info-circled"></i></span> ` +
        '<a href="#" id="editDomainRule" data-tooltip="Edit"><i class="icon-pencil"></i>️</a> ' +
        '<a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
        '><i class="icon-trash-empty"></i>️</a></div>');
      isolationDomainRules.append(el);

      const domainRuleTooltip =
        '<div style="width:200%;">' +
        `<strong>Always</strong>: ${preferences.isolation.domain[domainPattern].always.action} <br>` +
        `> <strong>Permanent allowed</strong>: ${preferences.isolation.domain[domainPattern].always.allowedInPermanent} <br><br>` +
        `<strong>Navigation</strong>: ${preferences.isolation.domain[domainPattern].navigation.action} <br><br>` +
        '<strong>Mouse Clicks</strong><br>' +
        `Middle: ${preferences.isolation.domain[domainPattern].mouseClick.middle.action} <br>` +
        `Ctrl+Left: ${preferences.isolation.domain[domainPattern].mouseClick.ctrlleft.action} <br>` +
        `Left: ${preferences.isolation.domain[domainPattern].mouseClick.left.action}</div><br>` +
        '<strong>Excluded Target/Link Domains</strong>:<br>' +
        (preferences.isolation.domain[domainPattern].excluded &&
         Object.keys(preferences.isolation.domain[domainPattern].excluded).length > 0 ?
          `${Object.keys(preferences.isolation.domain[domainPattern].excluded).join('<br>')}` :
          'No Target/Link Domains excluded');
      el.find('#infoDomainRule').popup({
        html: domainRuleTooltip,
        inline: true
      });
    });

    if (!isolationDomainRulesClickEvent) {
      isolationDomainRules.on('click', async (event) => {
        event.preventDefault();
        const targetId = $(event.target).parent().attr('id');
        const domainPattern = $(event.target).parent().parent().attr('id');
        if (targetId === 'editDomainRule') {
          isolationDomainEditRule(domainPattern);
          return;
        }
        if (targetId === 'removeDomainPattern') {
          delete preferences.isolation.domain[decodeURIComponent(domainPattern)];
          // TODO show "rule deleted" instead of "preferences saved"
          await savePreferences();
          updateIsolationDomains();
        }
      });
      isolationDomainRulesClickEvent = true;
    }
  } else {
    isolationDomainRules.html('No Domains added');
  }
};



window.isolationDomainAddExcludeDomainRule = () => {
  const excludeDomainPattern = document.querySelector('#isolationDomainExcludeDomainPattern').value;
  if (!excludeDomainPattern) {
    $('#isolationDomainExcludeDomainPatternDiv').addClass('error');
    return;
  }
  $('#isolationDomainExcludeDomainPatternDiv').removeClass('error');
  isolationDomainExcludedDomains[excludeDomainPattern] = {};
  updateIsolationDomainExcludeDomains();
};


window.isolationDomainExcludedDomains = {};
window.isolationDomainExcludeDomainPatternsClickEvent = false;
window.updateIsolationDomainExcludeDomains = () => {
  const isolationDomainExcludeDomainPatternsDiv = $('#isolationDomainExcludedDomains');
  const isolationDomainExcludeDomainPatterns = Object.keys(isolationDomainExcludedDomains);
  if (!isolationDomainExcludeDomainPatterns.length) {
    isolationDomainExcludeDomainPatternsDiv.html('No domains excluded');
    return;
  }
  isolationDomainExcludeDomainPatternsDiv.html('');
  isolationDomainExcludeDomainPatterns.map((domainPattern) => {
    const el = $(`<div class="item" id="${encodeURIComponent(domainPattern)}">` +
      domainPattern +
      ' <a href="#" id="removeDomainPattern" data-tooltip="Remove (no confirmation)" ' +
      '><i class="icon-trash-empty"></i>️</a></div>');
    isolationDomainExcludeDomainPatternsDiv.append(el);
  });

  if (!isolationDomainExcludeDomainPatternsClickEvent) {
    isolationDomainExcludeDomainPatternsDiv.on('click', async (event) => {
      event.preventDefault();
      const targetId = $(event.target).parent().attr('id');
      const domainPattern = $(event.target).parent().parent().attr('id');
      if (targetId === 'removeDomainPattern') {
        delete isolationDomainExcludedDomains[decodeURIComponent(domainPattern)];
        updateIsolationDomainExcludeDomains();
      }
    });
    isolationDomainExcludeDomainPatternsClickEvent = true;
  }
};