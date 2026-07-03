import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AvisoPrivacidadPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F4EE',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      <header style={{
        backgroundColor: '#2D6A4F',
        padding: '24px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Shield size={32} color="#95D5B2" />
          <h1 style={{ margin: 0, fontSize: '24px' }}>Aviso de Privacidad Integral</h1>
        </div>
      </header>
      
      <main style={{
        flex: 1,
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 20px',
        color: '#1C1C1C'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          lineHeight: '1.6'
        }}>
          <p style={{ fontSize: '14px', color: '#6B6B6B', textAlign: 'right', marginBottom: '20px' }}>
            Última actualización: {new Date().toLocaleDateString('es-MX')}
          </p>
          
          <h2 style={{ color: '#2D6A4F', borderBottom: '2px solid #E0D9CF', paddingBottom: '10px' }}>1. Identidad y Domicilio del Responsable</h2>
          <p>
            De conformidad con la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados,
            ReCircula, con domicilio en [Tu Domicilio], es el responsable del tratamiento de los datos personales que nos proporcione,
            los cuales serán protegidos conforme a lo dispuesto por dicha Ley y demás normativa que resulte aplicable.
          </p>

          <h2 style={{ color: '#2D6A4F', borderBottom: '2px solid #E0D9CF', paddingBottom: '10px' }}>2. Datos Personales que se Recaban</h2>
          <p>
            Para llevar a cabo las finalidades descritas en el presente aviso de privacidad, utilizaremos los siguientes datos personales:
          </p>
          <ul>
            <li>Nombre completo o razón social.</li>
            <li>Correo electrónico.</li>
            <li>Información de perfil público (en caso de ser reparador).</li>
          </ul>

          <h2 style={{ color: '#2D6A4F', borderBottom: '2px solid #E0D9CF', paddingBottom: '10px' }}>3. Finalidades del Tratamiento de Datos</h2>
          <p>
            Los datos personales que recabamos de usted, los utilizaremos para las siguientes finalidades primarias que son necesarias para el servicio que solicita:
          </p>
          <ul>
            <li>Creación y gestión de su cuenta en la plataforma ReCircula.</li>
            <li>Facilitar el contacto entre usuarios mediante el sistema de Matchmaking automatizado.</li>
            <li>Gestión de la reputación (calificaciones y reseñas de transacciones).</li>
          </ul>

          <h2 style={{ color: '#2D6A4F', borderBottom: '2px solid #E0D9CF', paddingBottom: '10px' }}>4. Derechos ARCO</h2>
          <p>
            Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones de uso que les damos (Acceso).
            Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación);
            que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación);
            así como oponerse al uso de sus datos personales para fines específicos (Oposición).
          </p>
          <p>
            Para el ejercicio de cualquiera de los derechos ARCO, usted podrá hacerlo directamente desde su perfil en la sección <strong>Privacidad (ARCO)</strong> o presentar la solicitud respectiva a través del correo electrónico: privacidad@recircula.org.
          </p>

          <h2 style={{ color: '#2D6A4F', borderBottom: '2px solid #E0D9CF', paddingBottom: '10px' }}>5. Cambios al Aviso de Privacidad</h2>
          <p>
            El presente aviso de privacidad puede sufrir modificaciones, cambios o actualizaciones derivadas de nuevos requerimientos legales,
            de nuestras propias necesidades por los servicios que ofrecemos, de nuestras prácticas de privacidad, o por otras causas.
          </p>
          <p>
            Nos comprometemos a mantenerlo informado sobre los cambios que pueda sufrir el presente aviso de privacidad, a través de nuestra plataforma web.
          </p>
          
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link to="/login" style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#2D6A4F',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
