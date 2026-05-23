let aktifKullanici = null;

function kayitOl() {
  const email = document.getElementById('girisEmail').value;
  if (!email) return alert('E-posta girin');
  fetch('/api/kayit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, ad: email.split('@')[0] })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      const kod = prompt('E-postanıza gelen 6 haneli doğrulama kodunu girin:');
      dogrula(email, kod);
    } else alert(data.error);
  });
}

function dogrula(email, kod) {
  fetch('/api/dogrula', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, kod })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      aktifKullanici = data.kullanici;
      document.getElementById('girisEkrani').style.display = 'none';
      document.getElementById('anaUygulama').style.display = 'block';
      ilanlariYukle();
      showScreen('ilanlar');
    } else alert('Kod hatalı');
  });
}

function cikisYap() {
  aktifKullanici = null;
  document.getElementById('girisEkrani').style.display = 'flex';
  document.getElementById('anaUygulama').style.display = 'none';
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(`${screen}Screen`).classList.remove('hidden');
  if (screen === 'profil') {
    document.getElementById('kullaniciBilgi').innerHTML = `<p>${aktifKullanici.ad}<br>${aktifKullanici.email}</p>`;
  }
}

async function ilanlariYukle() {
  const res = await fetch('/api/ilanlar');
  const ilanlar = await res.json();
  const container = document.getElementById('ilanlarListesi');
  container.innerHTML = ilanlar.map(ilan => `
    <div class="ilan-card">
      <img src="${ilan.resim}" class="ilan-resim">
      <span class="ilan-tur">${ilan.tur === 'kedi' ? '🐱 Kedi' : '🐶 Köpek'}</span>
      <div class="ilan-isim">${ilan.isim}</div>
      <div>${ilan.yas} yaşında, ${ilan.sehir}</div>
      <p>${ilan.aciklama}</p>
    </div>
  `).join('');
}

async function ilanEkle() {
  if (!aktifKullanici) return alert('Giriş yapın');
  const tur = document.getElementById('ilanTur').value;
  const isim = document.getElementById('ilanIsim').value;
  const yas = document.getElementById('ilanYas').value;
  const sehir = document.getElementById('ilanSehir').value;
  const aciklama = document.getElementById('ilanAciklama').value;
  const resim = 'https://i.imgur.com/FtQquVH.jpeg';
  
  const yeni = { tur, isim, yas, sehir, aciklama, resim };
  await fetch('/api/ilan-ekle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(yeni) });
  alert('İlan eklendi!');
  ilanlariYukle();
  
  // Mail giden kişi: aktif kullanıcının kendi mailine
  await fetch('/send-auto-mail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: aktifKullanici.email,
      subject: `Yeni ilanınız yayında: ${isim}`,
      html: `<p>Merhaba ${aktifKullanici.ad},</p><p>“${isim}” adlı ilanın PatiYuva’da yayınlandı.</p><p>Sevgiler, PatiYuva ekibi</p>`
    })
  });
}

async function manuelMailGonder() {
  const to = document.getElementById('mailAlıcı').value;
  const subject = document.getElementById('mailKonu').value;
  const html = document.getElementById('mailHtml').value;
  if (!to || !html) return alert('Alıcı ve içerik gerekli');
  const res = await fetch('/send-manual-mail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html })
  });
  const data = await res.json();
  document.getElementById('mailSonuc').innerHTML = data.success ? '✅ Mail gönderildi' : '❌ Hata';
}
