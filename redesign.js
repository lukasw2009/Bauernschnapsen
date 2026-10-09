/* Ausschließlich Darstellung. Die Spiel- und Speicherlogik bleibt in app.js. */
'use strict';
(function(){
  const setup=document.getElementById('gameSetup');
  const count=document.getElementById('setupCount');
  const players=document.getElementById('activePlayers');
  const teamPicker=document.getElementById('teamPicker');
  const announcements=document.getElementById('announcementButtons');
  function decoratePlayers(root){
    root.querySelectorAll('.playerBtn').forEach(button=>{
      const initial=button.textContent.trim().slice(0,2).toLocaleUpperCase('de-AT');
      if(button.dataset.initial!==initial)button.dataset.initial=initial;
    });
  }
  function updateSetup(){
    decoratePlayers(players);decoratePlayers(teamPicker);
    const selected=players.querySelectorAll('.playerBtn.active').length;
    // Die Spielerzahl ist bereits im Untertitel der gewählten Regeln enthalten.
    const profileText=document.getElementById('subtitle').textContent;
    const total=Number(profileText.match(/·\s*(\d+) Spieler/)?.[1]||4);
    const text=selected+' / '+total;
    if(count.textContent!==text)count.textContent=text;
    count.classList.toggle('complete',selected===total);
  }
  function decorateAnnouncements(){
    announcements.querySelectorAll('.choiceBtn').forEach(button=>{
      if(button.querySelector('.announcementName'))return;
      const text=button.textContent;
      button.setAttribute('aria-label',text);
      const split=text.lastIndexOf(' · ');
      const name=document.createElement('span');name.className='announcementName';
      name.textContent=split<0?text:text.slice(0,split);
      button.replaceChildren(name);
      if(split>=0){const badge=document.createElement('span');badge.className='announcementValue';badge.textContent=text.slice(split+3);button.appendChild(badge)}
    });
  }
  const setupObserver=new MutationObserver(updateSetup);
  setupObserver.observe(setup,{childList:true,subtree:true});
  const announcementObserver=new MutationObserver(decorateAnnouncements);
  announcementObserver.observe(announcements,{childList:true});
  updateSetup();decorateAnnouncements();
})();
