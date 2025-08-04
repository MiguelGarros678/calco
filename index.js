const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment-timezone');

// Clé API du bot
const token = '7963497925:AAG4te90jP-KHN2oBHAGAvI6nWim7N9PxA8';
const bot = new TelegramBot(token, { polling: true });

// Base utilisateurs
const users = new Map();

// Filles disponibles
const girls = [
  { name: 'Blonde', photo: 'https://jedolomo.pages.dev/img/blonde.jpg' },
  { name: 'Maeva', photo: 'https://jedolomo.pages.dev/img/maeva.jpg' },
  { name: 'Lorrelle', photo: 'https://jedolomo.pages.dev/img/lorelle.jpg' },
  { name: 'Elda', photo: 'https://jedolomo.pages.dev/img/elsa.jpg' },
  { name: 'Blanche', photo: 'https://jedolomo.pages.dev/img/lor.jpg' },
];

const cities = ['Douala', 'Yaoundé', 'Bafoussam', 'Dschang', 'Buea', 'Bamenda', 'Kribi', 'Autre ville'];
const plans = [
  '🔞 1 COUP DE BAISE = 2500F',
  '🔞 2 COUP DE BAISE = 5000F',
  '🔞 12H (un nuit) DE BAISE =10000F',
  '🔞 24H DE BAISE = 15000F',
  '🔞 PARTOUZES (deux filles) 2h = 10000F',
  '🔞 PARTOUZES (deux filles) 24h = 25000F'
];

const paymentInstructions = {
  MTN: 'MTN MoMo\nNom : Rabiatou\nNuméro : 682930754',
  ORANGE: 'Orange Money\nNom : YINCHOWI WINCHO\nNuméro : 693846621'
};

// Logique principale
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  users.set(id, { step: 'city', name: msg.from.first_name });
  bot.sendMessage(id, `Bonjour ${msg.from.first_name}, bienvenue sur JEDOLO 🥰\nLe service de réservation de filles 100% camerounais 🇨🇲\nSouhaitez-vous réserver ?`, {
    reply_markup: {
      keyboard: [['Oui']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  const id = msg.chat.id;
  const data = users.get(id) || {};

  if (!data.step) return;

  switch (data.step) {
    case 'city':
      bot.sendMessage(id, 'Quelle est votre ville ?', {
        reply_markup: {
          keyboard: cities.map(c => [c]),
          resize_keyboard: true
        }
      });
      data.step = 'getCity';
      users.set(id, data);
      break;

    case 'getCity':
      if (cities.includes(msg.text)) {
        data.city = msg.text;
        if (msg.text === 'Autre ville') {
          bot.sendMessage(id, 'Entrez votre ville manuellement :');
        } else {
          bot.sendMessage(id, 'D’accord, quel est votre quartier ?');
          data.step = 'quartier';
        }
      } else {
        data.city = msg.text;
        bot.sendMessage(id, 'D’accord, quel est votre quartier ?');
        data.step = 'quartier';
      }
      users.set(id, data);
      break;

    case 'quartier':
      data.quartier = msg.text;
      bot.sendMessage(id, 'Voici les filles disponibles :');
      girls.forEach(girl => {
        bot.sendPhoto(id, girl.photo, {
          caption: `💋 ${girl.name}`,
          reply_markup: {
            inline_keyboard: [[{ text: `Choisir ${girl.name}`, callback_data: `girl_${girl.name}` }]]
          }
        });
      });
      data.step = 'choix_fille';
      users.set(id, data);
      break;

    case 'date':
      if (msg.text.toLowerCase().includes('aujourd')) {
        data.date = 'Aujourd’hui';
        data.step = 'heure';
        bot.sendMessage(id, 'À quelle heure aujourd’hui ?');
      } else if (msg.text.toLowerCase().includes('demain')) {
        data.date = 'Demain';
        data.step = 'heure';
        bot.sendMessage(id, 'À quelle heure demain ?');
      } else {
        data.date = msg.text;
        data.step = 'heure';
        bot.sendMessage(id, 'À quelle heure ?');
      }
      users.set(id, data);
      break;

    case 'heure':
      data.heure = msg.text;
      data.step = 'plan';
      bot.sendMessage(id, 'Choisissez un plan :', {
        reply_markup: {
          keyboard: plans.map(p => [p]),
          resize_keyboard: true
        }
      });
      users.set(id, data);
      break;

    case 'plan':
      data.plan = msg.text;
      data.step = 'paiement';
      bot.sendMessage(id, `✅ Résumé de votre commande :
👤 Client : ${data.name}
📍 Lieu : ${data.city}, ${data.quartier}
👠 Fille : ${data.fille}
📅 Date : ${data.date} à ${data.heure}
💵 Plan : ${data.plan}

Souhaitez-vous valider ?`, {
        reply_markup: {
          keyboard: [['Valider', 'Modifier']],
          resize_keyboard: true
        }
      });
      users.set(id, data);
      break;

    case 'paiement':
      if (msg.text.toLowerCase().includes('valider')) {
        data.step = 'methode_paiement';
        bot.sendMessage(id, 'Voulez-vous payer par MTN ou Orange ?', {
          reply_markup: {
            keyboard: [['MTN', 'ORANGE']],
            resize_keyboard: true
          }
        });
      } else {
        data.step = 'city';
        bot.sendMessage(id, 'D’accord, recommençons...');
      }
      users.set(id, data);
      break;

    case 'methode_paiement':
      if (msg.text === 'MTN' || msg.text === 'ORANGE') {
        data.moyen = msg.text;
        bot.sendMessage(id, `Voici les informations de paiement :\n\n${paymentInstructions[msg.text]}`);
        bot.sendMessage(id, `⏳ En attente de votre paiement...\nVeuillez envoyer la capture d’écran du paiement dans les 3 minutes.`);
        data.step = 'capture1';

        setTimeout(() => {
          if (data.step === 'capture1') {
            bot.sendMessage(id, '⏰ Avez-vous effectué le paiement ? Envoyez la capture d’écran.');
          }
        }, 180000);

        users.set(id, data);
      } else {
        bot.sendMessage(id, 'Merci de répondre avec MTN ou ORANGE.');
      }
      break;

    case 'capture1':
      if (msg.photo) {
        data.step = 'capture2';
        bot.sendMessage(id, 'Capture d’écran invalide. Veuillez renvoyer une capture claire du paiement.');
        users.set(id, data);
      }
      break;

    case 'capture2':
      if (msg.photo) {
        data.step = 'final';
        bot.sendMessage(id, '✅ Capture reçue. En cours de traitement par l’administration. Vous recevrez une confirmation dans 5 minutes.');
        setTimeout(() => {
          bot.sendMessage(id, '🎉 Réservation confirmée. Merci pour votre confiance noté que si vous n'avez effectuer le paiment votre commande ne sera pas traité bisou !\nSouhaitez-vous faire une nouvelle commande ?', {
            reply_markup: {
              keyboard: [['Oui']],
              resize_keyboard: true
            }
          });
          data.step = 'city';
          users.set(id, data);
        }, 300000);
      } else {
        bot.sendMessage(id, 'Merci de renvoyer une vraie image du paiement.');
      }
      break;
  }
});

// Gestion du choix de fille
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const id = msg.chat.id;
  const data = users.get(id);

  if (callbackQuery.data.startsWith('girl_')) {
    const name = callbackQuery.data.replace('girl_', '');
    data.fille = name;
    data.step = 'date';
    bot.sendMessage(id, `Vous avez choisi ${name}. Pour quelle date ? (Aujourd’hui, Demain, Autre date)`);
    users.set(id, data);
  }
  bot.answerCallbackQuery(callbackQuery.id);
});

// 💬 Messages automatiques journaliers
const sendDailyMessages = () => {
  const now = moment().tz('Africa/Douala');
  const hour = now.hour();

  for (let [id, data] of users) {
    if (hour === 5) bot.sendMessage(id, `Bonjour ${data.name} ! Tu as bien dormi ? Un rdv aujourd’hui ? on baise 😗😘`);
    if (hour === 14) bot.sendMessage(id, `Cc bb on baisse ${data.name} 😘`);
    if (hour === 17) bot.sendMessage(id, `Bonsoir bb ${data.name} ! Tu veux te détendre aujourd’hui ?`);
  }
};

// Exécuter toutes les heures
setInterval(() => {
  const now = moment().tz('Africa/Douala');
  const minute = now.minute();
  if (minute === 0) sendDailyMessages();
}, 60000);