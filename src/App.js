import React, { useState } from 'react';

// Demo Venemergencia - App React para mostrar Datadog RUM
// No requiere backend ni dependencias nuevas.
// Usa APIs públicas de prueba para generar recursos, latencias y errores.

const API = 'https://jsonplaceholder.typicode.com';
const HTTPBIN = 'https://httpbin.org';

const rum = () => (typeof window !== 'undefined' ? window.DD_RUM : undefined);

const styles = {
  page: { fontFamily: 'Arial, sans-serif', background: '#f4f6f9', minHeight: '100vh', margin: 0 },
  header: { background: '#c8102e', color: '#fff', padding: '20px 32px' },
  title: { margin: 0, fontSize: 26 },
  subtitle: { margin: '4px 0 0', opacity: 0.9 },
  main: { maxWidth: 960, margin: '24px auto', padding: '0 16px', display: 'grid', gap: 20 },
  card: { background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  h2: { marginTop: 0, color: '#c8102e' },
  label: { display: 'block', fontWeight: 'bold', margin: '12px 0 4px' },
  input: { width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' },
  row: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  btn: { background: '#c8102e', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold' },
  btnSec: { background: '#1f2d3d', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 18px', cursor: 'pointer' },
  btnWarn: { background: '#e67e22', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 18px', cursor: 'pointer' },
  ok: { background: '#e8f6ec', border: '1px solid #2e8b57', padding: 12, borderRadius: 4, marginTop: 16 },
  err: { background: '#fdecea', border: '1px solid #c8102e', padding: 12, borderRadius: 4, marginTop: 16 },
  list: { paddingLeft: 18, margin: '12px 0 0' },
  footer: { textAlign: 'center', color: '#888', fontSize: 12, padding: 24 },
};

function App() {
  const [form, setForm] = useState({ nombre: '', telefono: '', servicio: 'Médico a domicilio', sintomas: '' });
  const [solicitud, setSolicitud] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 1. Enviar solicitud de atención (POST)
  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    if (rum()) {
      rum().setUser({ name: form.nombre || 'Paciente demo' });
      rum().addAction('solicitud_atencion', { servicio: form.servicio });
    }
    try {
      const res = await fetch(`${API}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setSolicitud({ id: data.id, ...form });
    } catch (err) {
      setError('No se pudo enviar la solicitud');
      if (rum()) rum().addError(err, { flujo: 'solicitud_atencion' });
    } finally {
      setCargando(false);
    }
  };

  // 2. Consultar médicos disponibles (GET)
  const consultarMedicos = async () => {
    setError(null);
    setMensaje('Consultando médicos disponibles...');
    const res = await fetch(`${API}/users`);
    const data = await res.json();
    setMedicos(data.slice(0, 5));
    setMensaje(null);
  };

  // 3. Simular API lenta (3 segundos)
  const apiLenta = async () => {
    setError(null);
    setMensaje('Consultando historial clínico (servicio lento)...');
    await fetch(`${HTTPBIN}/delay/3`);
    setMensaje('Historial clínico recibido después de 3 segundos.');
  };

  // 4. Simular error del backend (HTTP 500)
  const error500 = async () => {
    setMensaje(null);
    const res = await fetch(`${HTTPBIN}/status/500`);
    if (!res.ok) {
      const err = new Error(`Servicio de despacho respondió HTTP ${res.status}`);
      setError(err.message);
      if (rum()) rum().addError(err, { flujo: 'despacho_ambulancia', status: res.status });
    }
  };

  // 5. Provocar error JavaScript no controlado
  const errorJS = () => {
    const paciente = null;
    // Error intencional para mostrar Error Tracking en Datadog
    return paciente.historial.length;
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Venemergencia</h1>
        <p style={styles.subtitle}>Demo de solicitud de atención · Monitoreada con Datadog RUM</p>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.h2}>Solicitar atención</h2>
          <form onSubmit={enviarSolicitud}>
            <label style={styles.label} htmlFor="nombre">Nombre del paciente</label>
            <input style={styles.input} id="nombre" name="nombre" value={form.nombre} onChange={onChange} required />

            <label style={styles.label} htmlFor="telefono">Teléfono</label>
            <input style={styles.input} id="telefono" name="telefono" value={form.telefono} onChange={onChange} />

            <label style={styles.label} htmlFor="servicio">Tipo de servicio</label>
            <select style={styles.input} id="servicio" name="servicio" value={form.servicio} onChange={onChange}>
              <option>Médico a domicilio</option>
              <option>Ambulancia</option>
              <option>Telemedicina</option>
              <option>Laboratorio a domicilio</option>
            </select>

            <label style={styles.label} htmlFor="sintomas">Síntomas</label>
            <textarea style={{ ...styles.input, minHeight: 80 }} id="sintomas" name="sintomas" value={form.sintomas} onChange={onChange} />

            <div style={{ marginTop: 16 }}>
              <button style={styles.btn} type="submit" disabled={cargando}>
                {cargando ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>

          {solicitud && (
            <div style={styles.ok}>
              Solicitud <strong>#{solicitud.id}</strong> registrada: {solicitud.servicio} para {solicitud.nombre}.
            </div>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.h2}>Servicios</h2>
          <div style={styles.row}>
            <button style={styles.btnSec} onClick={consultarMedicos}>Ver médicos disponibles</button>
            <button style={styles.btnSec} onClick={apiLenta}>Consultar historial (lento)</button>
            <button style={styles.btnWarn} onClick={error500}>Despachar ambulancia (falla 500)</button>
            <button style={styles.btnWarn} onClick={errorJS}>Provocar error JS</button>
          </div>

          {mensaje && <div style={styles.ok}>{mensaje}</div>}
          {error && <div style={styles.err}>{error}</div>}

          {medicos.length > 0 && (
            <ul style={styles.list}>
              {medicos.map((m) => (
                <li key={m.id}>Dr(a). {m.name} · {m.address.city}</li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer style={styles.footer}>Demo FYAGS · Datos de prueba, no corresponden a pacientes reales</footer>
    </div>
  );
}

export default App;
