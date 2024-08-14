const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs'); 
const bcrypt = require('bcrypt'); 
const session = require('express-session');

const app = express();
const port = 3000;

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    paylasilanlar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
 });
  
  const User = mongoose.model('User', userSchema);


  mongoose.connect('mongodb://localhost:27017/not-defteri-db')
  .then(() => console.log('MongoDB ye bağlandı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

app.use(bodyParser.urlencoded({ extended: true }));

const notSchema = new mongoose.Schema({
    baslik: String,
    icerik: String,
    ekleyen: String,
    eklenmeZamani: { type: Date, default: Date.now },
    guncellenmeZamani: { type: Date },
    sahip: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paylasilanlar: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  });
  
  const Not = mongoose.model('Not', notSchema);

  

app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: false
  }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', async (req, res) => {
    const userId = req.session.userId; 
    const notlar = await Not.find({ 
        $or: [ 
            { sahip: userId }, 
            { paylasilanlar: userId } 
        ]
    }).populate('ekleyen'); // ekleyen alanı populate et
    const user = req.session.userId ? await User.findById(req.session.userId) : null;
    const users = await User.find({});
    res.render('index', { notlar, user, users });
});

  app.get('/oturum-ac', (req, res) => {
    res.render('oturum-ac'); 
  });

  app.get('/kayit', (req, res) => {
    res.render('kayit'); 
  });


  app.post('/kayit', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const newUser = new User({
        username,
        email,
        password: hashedPassword 
      });
  
      await newUser.save();
      res.redirect('/oturum-ac');
    } catch (err) {
      console.error('Kayıt hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });

  app.post('/oturum-ac', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });
  
      if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id; 
        res.redirect('/'); 
      } else {
        res.render('oturum-ac', { hata: 'Kullanıcı adı veya parola yanlış!' }); 
      }
    } catch (err) {
      console.error('Oturum açma hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });
  
  app.get('/oturum-kapat', (req, res) => {
    req.session.destroy(err => {
      if (err) {

      } else {
        res.redirect('/');
      }
    });
  });

  app.post('/yeni-not', async (req, res) => {
    try {
      const userId = req.session.userId;
      const yeniNot = new Not({
        baslik: req.body.baslik,
        icerik: req.body.icerik,
        ekleyen: userId,
        eklenmeZamani: Date.now(),
        sahip: userId
      });
      await yeniNot.save();
      res.redirect('/'); 
    } catch (err) {
      console.error('Not kaydetme hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });
  
  app.post('/not/:id/guncelle', async (req, res) => {
    const notId = req.params.id; 
    const baslik = req.body.baslik;
    const icerik = req.body.icerik;

    try {
        const not = await Not.findByIdAndUpdate(notId, { baslik, icerik }); 
        // res.redirect('/');  // Bu satırı sil!
        res.json({ success: true, message: 'Not başarıyla güncellendi!' }); //  AJAX'e başarılı yanıt gönder
    } catch (err) {
        console.error('Not güncelleme hatası:', err);
        res.status(500).send({ success: false, message: 'Bir hata oluştu.' });
    }
});

app.get('/not/:id/sil', async (req, res) => {
    const notId = req.params.id;
    try {
      await Not.findByIdAndDelete(notId);
      res.redirect('/');
    } catch (err) {
      console.error('Not silme hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });

  app.post('/not/:id/paylas', async (req, res) => {
    const notId = req.params.id;
    const paylasilanKullaniciId = req.body.paylasilanKullaniciId; 

    try {
        const not = await Not.findById(notId);

        console.log("notId:", notId); 
        console.log("paylasilanKullaniciId:", paylasilanKullaniciId); 
        console.log("not:", not); 
        console.log("not.paylasilanlar:", not.paylasilanlar); 

        if (!not.paylasilanlar.includes(paylasilanKullaniciId)) { 
            not.paylasilanlar.push(paylasilanKullaniciId);
            await not.save();
            console.log("not başarıyla kaydedildi"); 
            res.redirect('/'); 
            console.log('Not başarıyla paylaşıldı!');
        } else {
            res.status(400).send('Bu not zaten bu kullanıcıya paylaşılmış!'); 
        }
    } catch (err) {
        console.error('Paylaşım hatası:', err);
        res.status(500).send('Bir hata oluştu.');
    }
});

  app.get('/sifremi-unuttum', (req, res) => {
    res.render('sifremi-unuttum'); 
  });
  
  app.get('/sifre-sifirla/:token', async (req, res) => {
    const token = req.params.token; 
    const user = await User.findOne({ resetToken: token });
    if (user) {
      res.render('sifre-sifirla', { token });
    } else {
      res.redirect('/'); 
    }
  });
  
  app.post('/sifre-sifirla/:token', async (req, res) => {
    const token = req.params.token;
    const { newPassword } = req.body;
  
    try {
      const user = await User.findOne({ resetToken: token });
      if (user) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiration = null;
        await user.save();
        res.redirect('/oturum-ac');
      } else {
        res.redirect('/');
      }
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });
  
  app.get('/sifre-degistir', (req, res) => {
    res.render('sifre-degistir'); 
  });
  
  app.post('/sifre-degistir', async (req, res) => {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(userId);
      if (user && await bcrypt.compare(currentPassword, user.password)) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        res.redirect('/');
      } else {
        res.render('sifre-degistir', { hata: 'Geçerli parola yanlış!' });
      }
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });

  app.post('/not/:id/paylas', async (req, res) => {
    const notId = req.params.id;
    const paylasilanKullaniciId = req.body.paylasilanKullaniciId; 
  
    try {
      const not = await Not.findById(notId);
      if (!not.paylasilanlar.includes(paylasilanKullaniciId)) { 
        not.paylasilanlar.push(paylasilanKullaniciId);
        await not.save();
      } else {

      }
      res.redirect('/'); 
    } catch (err) {
      console.error('Paylaşım hatası:', err);
      res.status(500).send('Bir hata oluştu.');
    }
  });

app.listen(port, () => {
    console.log(`Sunucu ${port} numaralı portta çalışıyor...`);
  });