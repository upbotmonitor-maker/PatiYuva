const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('.'));

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: SMTP_USER, pass: SMTP_PASS }
});

// Kullanıcılar (geçici veritabanı)
let kullanicilar = [];
let dogrulamaKodlari = {};

// Kayıt ol
app.post('/api/kayit', (req, res) => {
  const { email, ad } = req.body;
  if (kullanicilar.find(k => k.email === email)) return res.json({ success: false, error: 'Bu email zaten kayıtlı' });
  const kod = Math.floor(100000 + Math.random() * 900000).toString();
  dogrulamaKodlari[email] = kod;
  transporter.sendMail({
    from: `"PatiYuva" <${SMTP_USER}>`,
    to: email,
    subject: 'PatiYuva - Doğrulama kodunuz',
    html: `<h2>Hoş geldiniz!</h2><p>Doğrulama kodunuz: <strong>${kod}</strong></p><p>Bu kodu giriş ekranına yapıştırın.</p>`
  }).catch(e => console.log(e));
  res.json({ success: true, email });
});

// Doğrulama + giriş
app.post('/api/dogrula', (req, res) => {
  const { email, kod } = req.body;
  if (dogrulamaKodlari[email] === kod) {
    delete dogrulamaKodlari[email];
    let kullanici = kullanicilar.find(k => k.email === email);
    if (!kullanici) {
      kullanici = { email, ad: email.split('@')[0] };
      kullanicilar.push(kullanici);
    }
    res.json({ success: true, kullanici });
  } else {
    res.json({ success: false, error: 'Kod hatalı' });
  }
});

// İlanlar
let ilanlar = [
  { id: 1, tur: 'kedi', isim: 'Pamuk', yas: 2, sehir: 'İstanbul', aciklama: 'Sevimli beyaz kedi, çok oyun sever', resim: 'https://i.imgur.com/FtQquVH.jpeg' },
  { id: 2, tur: 'kedi', isim: 'Zeytin', yas: 1, sehir: 'Ankara', aciklama: 'Sarman kedi, aşılı ve sağlıklı', resim: 'https://i.imgur.com/lGiee22.jpeg' }
];

app.get('/api/ilanlar', (req, res) => res.json(ilanlar));
app.post('/api/ilan-ekle', (req, res) => {
  const yeniIlan = { id: Date.now(), ...req.body };
  ilanlar.push(yeniIlan);
  res.json({ success: true, ilan: yeniIlan });
});

app.listen(PORT, () => console.log(`PatiYuva http://localhost:${PORT}`));
