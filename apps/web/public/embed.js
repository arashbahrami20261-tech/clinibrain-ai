(function () {
  'use strict';

  var scriptTag = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) return scripts[i];
    }
    return null;
  })();

  if (!scriptTag) {
    console.error('CliniBrain widget: could not find its own <script> tag.');
    return;
  }

  var CLINIC_ID = scriptTag.getAttribute('data-clinic-id');
  if (!CLINIC_ID) {
    console.error('CliniBrain widget: missing data-clinic-id attribute.');
    return;
  }

  var API_ORIGIN = new URL(scriptTag.src).origin;
  var LANGUAGE = (navigator.language || 'en').split('-')[0];

  var STATE = {
    open: false,
    conversationId: null,
    messages: [],
    loading: false,
    clinicName: 'Clinic',
  };

  var host = document.createElement('div');
  host.id = 'clinibrain-widget-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = [
    ':host { all: initial; }',
    '.cb-bubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%;',
    '  background: #0d9488; color: white; display: flex; align-items: center; justify-content: center;',
    '  cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.2); z-index: 999999; font-size: 26px;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; border: none; }',
    '.cb-bubble:hover { background: #0f766e; }',
    '.cb-panel { position: fixed; bottom: 92px; right: 20px; width: 340px; max-width: 90vw; height: 480px;',
    '  max-height: 70vh; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.25);',
    '  display: flex; flex-direction: column; z-index: 999999; overflow: hidden;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    '.cb-header { background: #0d9488; color: white; padding: 14px 16px; font-weight: 600; font-size: 15px; }',
    '.cb-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }',
    '.cb-msg { max-width: 80%; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; }',
    '.cb-msg.user { align-self: flex-end; background: #0d9488; color: white; border-bottom-right-radius: 4px; }',
    '.cb-msg.assistant { align-self: flex-start; background: #e2e8f0; color: #1e293b; border-bottom-left-radius: 4px; }',
    '.cb-input-row { display: flex; border-top: 1px solid #e2e8f0; padding: 8px; gap: 8px; }',
    '.cb-input { flex: 1; border: 1px solid #cbd5e1; border-radius: 20px; padding: 8px 14px; font-size: 14px; outline: none; }',
    '.cb-send { background: #0d9488; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 16px; }',
    '.cb-send:disabled { opacity: 0.5; cursor: default; }',
    '.cb-typing { align-self: flex-start; font-size: 12px; color: #94a3b8; padding-left: 4px; }'
  ].join('\n');
  shadow.appendChild(style);

  var bubble = document.createElement('button');
  bubble.className = 'cb-bubble';
  bubble.setAttribute('aria-label', 'Open chat assistant');
  bubble.textContent = '💬';
  shadow.appendChild(bubble);

  var panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.style.display = 'none';
  panel.innerHTML =
    '<div class="cb-header"></div>' +
    '<div class="cb-messages"></div>' +
    '<div class="cb-input-row">' +
    '<input class="cb-input" type="text" placeholder="Type a message…" />' +
    '<button class="cb-send">➤</button>' +
    '</div>';
  shadow.appendChild(panel);

  var headerEl = panel.querySelector('.cb-header');
  var messagesEl = panel.querySelector('.cb-messages');
  var inputEl = panel.querySelector('.cb-input');
  var sendBtn = panel.querySelector('.cb-send');

  function renderMessages() {
    messagesEl.innerHTML = '';
    STATE.messages.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'cb-msg ' + (m.role === 'user' ? 'user' : 'assistant');
      div.textContent = m.content;
      messagesEl.appendChild(div);
    });
    if (STATE.loading) {
      var typing = document.createElement('div');
      typing.className = 'cb-typing';
      typing.textContent = '...';
      messagesEl.appendChild(typing);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function togglePanel() {
    STATE.open = !STATE.open;
    panel.style.display = STATE.open ? 'flex' : 'none';
    if (STATE.open && STATE.messages.length === 0) {
      STATE.messages.push({
        role: 'assistant',
        content: 'Hi! How can I help you today? I can answer questions or book an appointment for you.',
      });
      renderMessages();
    }
  }

  bubble.addEventListener('click', togglePanel);

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || STATE.loading) return;

    STATE.messages.push({ role: 'user', content: text });
    inputEl.value = '';
    STATE.loading = true;
    renderMessages();

    fetch(API_ORIGIN + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: CLINIC_ID,
        conversationId: STATE.conversationId,
        message: text,
        language: LANGUAGE,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        STATE.loading = false;
        if (data.error) {
          STATE.messages.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
        } else {
          STATE.conversationId = data.conversationId;
          STATE.messages.push({ role: 'assistant', content: data.reply });
        }
        renderMessages();
      })
      .catch(function () {
        STATE.loading = false;
        STATE.messages.push({ role: 'assistant', content: 'Connection error. Please check your internet and try again.' });
        renderMessages();
      });
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  fetch(API_ORIGIN + '/api/widget-config/' + CLINIC_ID)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      STATE.clinicName = data.name || 'Clinic';
      headerEl.textContent = STATE.clinicName + ' — Assistant';
    })
    .catch(function () {
      headerEl.textContent = 'Clinic Assistant';
    });
})();
