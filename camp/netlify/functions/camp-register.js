// Netlify Function: camp-register
// Empfängt Vorname, Nachname, E-Mail und legt den Kontakt in der Brevo Liste "Camp 2027" an.

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const LIST_ID       = parseInt(process.env.BREVO_LIST_ID_CAMP, 10);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Ungültiges JSON' }) };
  }

  const vorname  = (body.vorname  || '').trim();
  const nachname = (body.nachname || '').trim();
  const email    = (body.email    || '').trim().toLowerCase();

  if (!vorname || !nachname || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Pflichtfelder fehlen' }) };
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      email,
      attributes:    { VORNAME: vorname, NACHNAME: nachname },
      listIds:       [LIST_ID],
      updateEnabled: true,
    }),
  });

  if (!res.ok) {
    console.error('Brevo contact error:', await res.text());
    return { statusCode: 500, body: JSON.stringify({ message: 'Eintrag fehlgeschlagen' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Vorgemerkt' }) };
};
