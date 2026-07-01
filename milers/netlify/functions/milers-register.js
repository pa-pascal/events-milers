// Netlify Function: milers-register
// Empfängt Anmeldedaten, speichert in Supabase, sendet Brevo-Bestätigungsmail.

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const BREVO_API_KEY     = process.env.BREVO_API_KEY;
const TEMPLATE_ID       = parseInt(process.env.BREVO_TEMPLATE_ID_MILERS || '8', 10);
const LIST_ID           = parseInt(process.env.BREVO_LIST_ID_MILERS || '9', 10);

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

  const { vorname, nachname, email, geburtsjahr, zielzeit_10k, trainingsplan } = body;

  if (!email || !nachname) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Pflichtfelder fehlen' }) };
  }

  // 1. Supabase insert
  const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/milers_registrations`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({ vorname, nachname, email, geburtsjahr, zielzeit_10k, trainingsplan }),
  });

  if (!supaRes.ok) {
    const errText = await supaRes.text();
    console.error('Supabase error:', errText);
    return { statusCode: 500, body: JSON.stringify({ message: 'Datenbankfehler' }) };
  }

  // 2. Brevo: Kontakt anlegen / Liste zuweisen
  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      email,
      attributes:   { VORNAME: vorname, NACHNAME: nachname },
      listIds:      [LIST_ID],
      updateEnabled: true,
    }),
  }).catch(err => console.error('Brevo contact error:', err));

  // 3. Brevo: Transactional-Mail senden
  const mailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key':      BREVO_API_KEY,
    },
    body: JSON.stringify({
      to: [{ email, name: `${vorname} ${nachname}`.trim() }],
      templateId: TEMPLATE_ID,
      params: { VORNAME: vorname, NACHNAME: nachname },
    }),
  });

  if (!mailRes.ok) {
    const errText = await mailRes.text();
    console.error('Brevo mail error:', errText);
    // Mail-Fehler nicht an User weitergeben – Anmeldung ist schon gespeichert
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Anmeldung erfolgreich' }),
  };
};
