(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const progress = document.querySelector('.scroll-progress');
  const heroVideo = document.querySelector('#hero-video');
  const motionButton = document.querySelector('.motion-toggle');
  let userPaused = false, allowReducedPlayback = false, heroVisible = true, lenis;
  const loadVideo = video => { const source = video.querySelector('source'); if (source.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; video.load(); } };
  const syncVideo = () => {
    const paused = (reduced.matches && !allowReducedPlayback) || userPaused || !heroVisible || document.hidden || !!document.querySelector('dialog[open]');
    if (paused) heroVideo.pause();
    else { loadVideo(heroVideo); heroVideo.play().catch(() => { motionButton.setAttribute('aria-label','Воспроизвести видео'); motionButton.setAttribute('aria-pressed','true'); }); }
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Воспроизвести видео' : 'Приостановить видео');
  };
  motionButton.addEventListener('click', () => { userPaused = !heroVideo.paused; allowReducedPlayback = true; syncVideo(); });
  document.addEventListener('visibilitychange', syncVideo);
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncVideo(); }, {threshold:0.05}).observe(heroVideo);
  const updateScroll = () => { header.classList.toggle('scrolled',scrollY>20); const range=document.documentElement.scrollHeight-innerHeight; progress.style.transform=`scaleX(${range>0?scrollY/range:0})`; };
  addEventListener('scroll',updateScroll,{passive:true}); updateScroll();
  const menuButton = document.querySelector('.menu-toggle'), menu = document.querySelector('#mobile-nav');
  function closeMenu() { menu.hidden=true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Открыть меню'); }
  menuButton.addEventListener('click',()=>{ const open=menuButton.getAttribute('aria-expanded')==='true'; menu.hidden=open; menuButton.setAttribute('aria-expanded',String(!open)); menuButton.setAttribute('aria-label',open?'Открыть меню':'Закрыть меню'); });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu();});
  matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
  const dialogs = document.querySelectorAll('dialog');
  function openDialog(dialog) { dialogs.forEach(d=>{if(d.open)d.close();}); closeMenu(); dialog.showModal(); lenis?.stop(); syncVideo(); }
  dialogs.forEach(dialog=>{
    dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();lenis?.start();syncVideo();});
  });
  document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>openDialog(document.querySelector('#booking-dialog'))));
  document.querySelectorAll('[data-appointment]').forEach(form => {
    const name = form.elements.namedItem('name');
    const phone = form.elements.namedItem('phone');
    const consent = form.elements.namedItem('consent');
    const fields = form.querySelector('.form-fields');
    const result = form.querySelector('.form-result');
    function error(input, message) {
      input.setAttribute('aria-invalid', String(Boolean(message)));
      document.getElementById(input.getAttribute('aria-describedby')).textContent = message;
    }
    [name, phone, consent].forEach(input => input.addEventListener('input', () => error(input, '')));
    form.addEventListener('submit', event => {
      event.preventDefault();
      const digits = phone.value.replace(/\D/g, '');
      const errors = [
        [name, name.value.trim().length < 2 ? 'Укажите ваше имя — не менее двух символов.' : ''],
        [phone, digits.length < 10 || digits.length > 15 || !/^[+\d\s()\-]+$/.test(phone.value) ? 'Введите номер телефона с кодом города или оператора.' : ''],
        [consent, !consent.checked ? 'Отметьте согласие на обработку данных.' : '']
      ];
      errors.forEach(([input, message]) => error(input, message));
      const firstError = errors.find(([, message]) => message);
      if (firstError) { firstError[0].focus(); return; }
      // Visual prototype only: no network requests, storage, or real submission.
      fields.hidden = true;
      result.hidden = false;
      result.focus();
      window.ScrollTrigger?.refresh();
    });
    form.querySelector('[data-form-reset]').addEventListener('click', () => {
      form.reset();
      [name, phone, consent].forEach(input => error(input, ''));
      result.hidden = true;
      fields.hidden = false;
      name.focus();
      window.ScrollTrigger?.refresh();
    });
  });
  document.querySelector('[data-film]').addEventListener('click',()=>{const dialog=document.querySelector('#film-dialog');openDialog(dialog);const video=dialog.querySelector('video');loadVideo(video);video.play().catch(()=>{});});
  const services = {
    therapy:{title:'Сохранить своё',text:'Лечение кариеса и его осложнений, восстановление зубов и лечение корневых каналов. Начинаем с осмотра и диагностики, чтобы определить подходящий объём помощи.',prices:[['Лечение кариеса дентина','от 5 000 ₽'],['Лечение пульпита одноканального зуба','от 5 450 ₽']]},
    implant:{title:'Вернуть уверенность',text:'Восстановление утраченных зубов с помощью имплантации и протезирования. Врач оценит состояние полости рта, обсудит варианты и последовательность лечения. Цена импланта не включает протезирование.',prices:[['Установка импланта Riellen’s','30 000 ₽'],['Установка импланта NeoBiotec','30 000 ₽'],['Установка импланта MIS','40 000 ₽']]},
    ortho:{title:'Найти гармонию',text:'Исправление прикуса с помощью брекет-систем и элайнеров. Метод и продолжительность лечения определяет ортодонт после диагностики. Стоимость брекет-систем указана за одну челюсть.',prices:[['Металлическая брекет-система Damon Q','75 000 ₽'],['Керамическая брекет-система Damon Clear','110 000 ₽'],['Элайнеры, от 11 до 24 капп','270 000 ₽']]},
    aesthetic:{title:'Улыбаться ярче',text:'Виниры, эстетическая реставрация и профессиональное отбеливание. Обсудим форму и оттенок будущей улыбки с учётом состояния зубов и ваших пожеланий.',prices:[['Керамический винир, 1 единица','30 000 ₽'],['Отбеливание системой Fläsh','29 000 ₽']]},
    hygiene:{title:'Заботиться заранее',text:'Профессиональная гигиена полости рта — часть регулярной заботы о здоровье зубов. Подходящий метод и частоту процедур порекомендует специалист.',prices:[['Комплексная профессиональная гигиена','5 000 ₽'],['Профессиональная гигиена с AirFlow','от 5 000 ₽']]},
    surgery:{title:'Решить сложное',text:'Хирургическая стоматология, в том числе удаление зубов мудрости. Тактика лечения, вид обезболивания и рекомендации по восстановлению определяются индивидуально.',prices:[['Удаление постоянного резца','2 600 ₽'],['Удаление зуба мудрости','5 500 ₽']]}
  };
  document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{const s=services[button.dataset.service];document.querySelector('#service-title').textContent=s.title;document.querySelector('#service-text').textContent=s.text;const rows=document.querySelector('#service-prices');rows.replaceChildren(...s.prices.map(([label,price])=>{const row=document.createElement('div');const name=document.createElement('span');name.textContent=label;const value=document.createElement('strong');value.textContent=price;row.append(name,value);return row;}));openDialog(document.querySelector('#service-dialog'));}));
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    const mm=gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)',()=>{
      let tickerUpdate;
      if(window.Lenis){lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:{offset:-95}});lenis.on('scroll',ScrollTrigger.update);tickerUpdate=time=>lenis?.raf(time*1000);gsap.ticker.add(tickerUpdate);gsap.ticker.lagSmoothing(0);}
      gsap.from('.text-line>span',{yPercent:115,rotate:2,duration:1.15,ease:'power3.out',stagger:.14,delay:.15});
      gsap.from('.hero .eyebrow,.hero-description,.hero-buttons,.hero-proof',{y:18,opacity:0,duration:.85,stagger:.12,delay:.35,ease:'power2.out'});
      gsap.from('.hero-visual',{opacity:0,y:25,duration:1.2,ease:'power3.out',delay:.15});
      ScrollTrigger.batch('.reveal',{start:'top 93%',once:true,onEnter:batch=>gsap.fromTo(batch,{opacity:0,y:26},{opacity:1,y:0,duration:.9,stagger:.08,ease:'power3.out',clearProps:'opacity,transform'})});
      const desktop=gsap.matchMedia();desktop.add('(min-width: 701px)',()=>{document.querySelectorAll('[data-parallax]').forEach(image=>gsap.fromTo(image,{yPercent:-5},{yPercent:5,ease:'none',scrollTrigger:{trigger:image.parentElement,start:'top bottom',end:'bottom top',scrub:1}}));});
      return()=>{if(tickerUpdate)gsap.ticker.remove(tickerUpdate);lenis?.destroy();lenis=undefined;desktop.revert();};
    });
    addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
  }
  reduced.addEventListener('change',syncVideo);
  if(new Date()>new Date('2026-11-08T00:00:00+03:00'))document.querySelector('.closure-note').hidden=true;
})();
