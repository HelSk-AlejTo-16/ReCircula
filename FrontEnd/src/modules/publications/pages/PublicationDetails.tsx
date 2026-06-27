/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { publicationsApi } from '../services/api'
import { MapPin, Clock, Archive, ArrowLeft, Layers } from 'lucide-react'
import './PublicationDetails.css'

interface PublicationDetailsProps {
  publicationId: string
  onBack: () => void
  onEdit: () => void
}

export default function PublicationDetails({
  publicationId,
  onBack,
  onEdit,
}: PublicationDetailsProps) {
  const [pub, setPub] = useState<any>(null)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposalPrice, setProposalPrice] = useState('')
  const [proposalNotes, setProposalNotes] = useState('')
  const [proposing, setProposing] = useState(false)

  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('recircula_token')
    if (!token) {
      alert('Debes iniciar sesión para realizar esta acción.')
      return
    }

    if ((pub.modalidad === 'VENTA' || pub.modalidad === 'VENTA_PIEZAS') && !proposalPrice) {
      alert('Por favor especifica un precio.')
      return
    }

    try {
      setProposing(true)
      await publicationsApi.proposeTransaction(
        {
          publicacionId: publicationId,
          modalidad: pub.modalidad,
          precioAcordado: proposalPrice ? parseFloat(proposalPrice) : undefined,
          notas: proposalNotes || undefined,
        },
        token
      )
      alert('¡Propuesta de trato enviada con éxito!')
      setShowProposalModal(false)
      setProposalNotes('')
      setProposalPrice('')
      fetchDetail() // Refresh page details
    } catch (err: any) {
      alert(err.message || 'Error al proponer el trato.')
    } finally {
      setProposing(false)
    }
  }

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true)
      const data = await publicationsApi.getPublicationDetail(publicationId)
      setPub(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los detalles')
    } finally {
      setLoading(false)
    }
  }, [publicationId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleArchive = async () => {
    const token = localStorage.getItem('recircula_token')
    if (!token) {
      alert('Debes iniciar sesión para realizar esta acción.')
      return
    }

    if (
      !window.confirm(
        '¿Estás seguro de que deseas archivar esta publicación? Ya no será visible para intercambios.'
      )
    ) {
      return
    }

    try {
      setArchiving(true)
      await publicationsApi.archivePublication(publicationId, token)
      alert('Publicación archivada exitosamente.')
      fetchDetail() // Recargar detalles para reflejar estado
    } catch (err: any) {
      alert(err.message || 'Error al archivar la publicación')
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return (
      <div className="details-container text-center" style={{ padding: '60px' }}>
        <p>Cargando detalles del artículo...</p>
      </div>
    )
  }

  if (error || !pub) {
    return (
      <div className="details-container text-center" style={{ padding: '60px' }}>
        <p style={{ color: '#ef4444' }}>{error || 'No se encontró el artículo.'}</p>
        <button className="btn-secondary" onClick={onBack} style={{ margin: '20px auto 0' }}>
          Volver al catálogo
        </button>
      </div>
    )
  }

  const formatModalidad = (mod: string) => {
    switch (mod) {
      case 'DONACION':
        return 'Donación Gratuita'
      case 'VENTA':
        return 'Venta Directa'
      case 'TRUEQUE':
        return 'Trueque (Intercambio)'
      case 'VENTA_PIEZAS':
        return 'Venta por Piezas'
      default:
        return mod
    }
  }

  // Resolver URL base de imágenes locales
  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    return `http://localhost:3000${url}`
  }

  const currentImage =
    pub.imagenes && pub.imagenes.length > 0
      ? getImageUrl(pub.imagenes[activeImageIdx]?.url)
      : 'https://images.unsplash.com/photo-1588508065123-287b28e013da?q=80&w=600&auto=format&fit=crop' // fallback image

  return (
    <div className="details-container">
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      <span className="category-tag">{pub.categoria}</span>

      <h1 className="item-title" style={{ marginTop: '12px' }}>
        {pub.titulo}
      </h1>

      <div className="item-meta" style={{ marginTop: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={16} /> Publicado el:{' '}
          {new Date(pub.fechaCreacion).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <span>•</span>
        <span>Publicado por: {pub.publicador?.nombre || 'Usuario ReCircula'}</span>
        {pub.estado === 'ARCHIVADO' && (
          <>
            <span>•</span>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>[ARCHIVADO]</span>
          </>
        )}
      </div>

      <div className="details-grid">
        {/* Columna Izquierda: Galería */}
        <div className="gallery-section">
          <div className="main-image-container">
            <img src={currentImage} className="main-image" alt="Artículo principal" />
          </div>

          {pub.imagenes && pub.imagenes.length > 0 && (
            <div className="thumbs-row">
              {pub.imagenes.map((img: any, idx: number) => (
                <div
                  key={img.id || idx}
                  className={`thumb-item ${activeImageIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                >
                  <img
                    src={getImageUrl(img.url)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="Miniatura"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Información */}
        <div className="info-section">
          <div className="price-box">
            <span className="price-label">Modalidad: {formatModalidad(pub.modalidad)}</span>
            {pub.precio !== null && pub.precio !== undefined && (
              <span className="price-value">
                ${parseFloat(pub.precio).toLocaleString('es-MX')} {pub.moneda}
              </span>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px' }}>
              Descripción general
            </h3>
            <p className="item-desc">{pub.descripcion}</p>
          </div>

          {/* Desglose de Componentes */}
          {pub.componentes && pub.componentes.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Layers size={18} color="#2D6A4F" /> Desglose de Componentes (Hardware Mining)
              </h3>
              <div className="components-list">
                {pub.componentes.map((comp: any) => (
                  <div key={comp.id} className="component-item">
                    <div className="component-info">
                      <span className="comp-name">{comp.nombre}</span>
                      {comp.descripcion && <span className="comp-desc">{comp.descripcion}</span>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {comp.precioPieza && (
                        <span style={{ fontWeight: '700', color: '#2D6A4F' }}>
                          ${parseFloat(comp.precioPieza).toFixed(2)} MXN
                        </span>
                      )}
                      <span className={`status-badge ${comp.funcional ? 'functional' : 'damaged'}`}>
                        {comp.funcional ? 'Funcional' : 'Dañado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ubicación y Referencia */}
          <div className="map-card">
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MapPin size={18} color="#2D6A4F" /> Ubicación del artículo
            </h3>
            {pub.direccionReferencia && (
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                <strong>Referencia:</strong> {pub.direccionReferencia}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción según rol */}
      {pub.estado !== 'ARCHIVADO' && (
        <div className="action-row" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          {pub.publicadorId === '00000000-0000-0000-0000-000000000001' ? (
            <>
              <button
                className="btn-primary"
                onClick={onEdit}
                style={{
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Editar publicación
              </button>
              <button
                className="btn-secondary"
                onClick={handleArchive}
                disabled={archiving}
                style={{ flex: '1' }}
              >
                <Archive size={18} /> {archiving ? 'Archivando...' : 'Archivar publicación'}
              </button>
            </>
          ) : (
            pub.estado === 'PUBLICADO' && (
              <button
                className="btn-primary"
                onClick={() => {
                  setShowProposalModal(true)
                  setProposalPrice(pub.precio?.toString() || '')
                }}
                style={{
                  flex: '1',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px',
                  fontSize: '1.05rem',
                }}
              >
                Proponer Trato / Intercambio
              </button>
            )
          )}
        </div>
      )}

      {/* Modal de Propuesta de Trato */}
      {showProposalModal && (
        <div className="proposal-modal-overlay">
          <div className="proposal-modal">
            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              Proponer Trato
            </h3>
            <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)' }}>
              Artículo: <strong style={{ color: 'var(--primary)' }}>{pub.titulo}</strong>
            </p>
            <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)' }}>
              Modalidad:{' '}
              <strong>
                {pub.modalidad === 'DONACION'
                  ? 'Donación'
                  : pub.modalidad === 'VENTA'
                    ? 'Venta'
                    : pub.modalidad === 'TRUEQUE'
                      ? 'Trueque'
                      : 'Venta de piezas'}
              </strong>
            </p>

            <form onSubmit={handlePropose}>
              {(pub.modalidad === 'VENTA' || pub.modalidad === 'VENTA_PIEZAS') && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Precio acordado (MXN)
                  </label>
                  <input
                    type="number"
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Notas / Detalles del trato
                </label>
                <textarea
                  placeholder="Detalla tu propuesta aquí (ej. qué ofreces a cambio en caso de trueque, o qué piezas necesitas)."
                  value={proposalNotes}
                  onChange={(e) => setProposalNotes(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                className="modal-actions"
                style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProposalModal(false)}
                  style={{ padding: '8px 16px' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={proposing}
                  style={{ padding: '8px 16px' }}
                >
                  {proposing ? 'Enviando...' : 'Enviar propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
