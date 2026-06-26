/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react'
import { publicationsApi } from '../services/api'
import { Upload, Plus, Trash2, MapPin, CheckCircle, ArrowLeft } from 'lucide-react'
import './CreatePublication.css'

interface ComponenteInput {
  nombre: string
  funcional: boolean
  descripcion: string
  precioPieza?: number
}

const CATEGORIAS = [
  'Computadoras y Laptops',
  'Smartphones y Tablets',
  'Componentes PC',
  'Electrodomésticos',
  'Audio y Video',
  'Cámaras y Fotografía',
  'Consolas y Videojuegos',
  'Redes y Conectividad',
  'Herramientas Electrónicas',
  'Impresoras y Escáneres',
  'Antigüedades Tecnológicas',
  'Otros',
]

export default function CreatePublication({ onBack }: { onBack?: () => void }) {
  // Silent Login para desarrollo (RF-01)
  useEffect(() => {
    const fetchToken = async () => {
      const token = localStorage.getItem('recircula_token')
      if (!token) {
        try {
          const res = await fetch('http://localhost:3000/api/v1/identity/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'user@recircula.mx',
              password: 'Password123',
            }),
          })
          if (res.ok) {
            const data = await res.json()
            localStorage.setItem('recircula_token', data.token)
            console.log('🔑 Silent login successful for developer testing!')
          }
        } catch (e) {
          console.error('Failed silent login', e)
        }
      }
    }
    fetchToken()
  }, [])

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [modalidad, setModalidad] = useState('DONACION')
  const [precio, setPrecio] = useState('')
  const [latitud, setLatitud] = useState('21.1561') // Defecto Dolores Hidalgo
  const [longitud, setLongitud] = useState('-101.3562')
  const [direccionReferencia, setDireccionReferencia] = useState('')

  // Componentes (Hardware Mining)
  const [componentes, setComponentes] = useState<ComponenteInput[]>([])

  // Imágenes
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Agregar componente
  const addComponent = () => {
    setComponentes([
      ...componentes,
      { nombre: '', funcional: true, descripcion: '', precioPieza: undefined },
    ])
  }

  // Modificar componente
  const handleComponentChange = (index: number, field: keyof ComponenteInput, val: any) => {
    const updated = [...componentes]
    updated[index] = { ...updated[index], [field]: val }
    setComponentes(updated)
  }

  // Remover componente
  const removeComponent = (index: number) => {
    setComponentes(componentes.filter((_, i) => i !== index))
  }

  // Obtener geolocalización
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toFixed(6))
          setLongitud(position.coords.longitude.toFixed(6))
          setError(null)
        },
        () => {
          setError(
            'No se pudo obtener la ubicación automáticamente. Usando coordenadas Dolores Hidalgo por defecto.'
          )
        }
      )
    } else {
      setError('Geolocalización no soportada por el navegador.')
    }
  }

  // Seleccionar imágenes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const totalImages = images.length + selectedFiles.length

      if (totalImages > 10) {
        setError('Solo se permite subir un máximo de 10 imágenes.')
        return
      }

      const validFiles: File[] = []
      const validPreviews: string[] = []

      selectedFiles.forEach((file) => {
        // Validar tamaño <= 5MB
        if (file.size > 5 * 1024 * 1024) {
          setError(`La imagen ${file.name} excede el límite de 5MB.`)
          return
        }

        validFiles.push(file)
        validPreviews.push(URL.createObjectURL(file))
      })

      setImages([...images, ...validFiles])
      setImagePreviews([...imagePreviews, ...validPreviews])
      setError(null)
    }
  }

  // Eliminar imagen
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const token = localStorage.getItem('recircula_token')
    if (!token) {
      setError('Debes iniciar sesión para publicar.')
      setLoading(false)
      return
    }

    // Validar modalidad de venta
    if ((modalidad === 'VENTA' || modalidad === 'VENTA_PIEZAS') && !precio) {
      setError('Debes especificar un precio para la modalidad seleccionada.')
      setLoading(false)
      return
    }

    // Validar venta por piezas componentes obligatorios
    if (modalidad === 'VENTA_PIEZAS' && componentes.length === 0) {
      setError('Debes desglosar al menos un componente para vender por piezas.')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('titulo', titulo)
      formData.append('descripcion', descripcion)
      formData.append('categoria', categoria)
      formData.append('modalidad', modalidad)
      if (precio) formData.append('precio', precio)

      // Ubicación estructurada
      formData.append(
        'ubicacion',
        JSON.stringify({
          latitud: parseFloat(latitud),
          longitud: parseFloat(longitud),
        })
      )

      if (direccionReferencia) {
        formData.append('direccionReferencia', direccionReferencia)
      }

      // Componentes estructurados
      if (componentes.length > 0) {
        formData.append('componentes', JSON.stringify(componentes))
      }

      // Agregar imágenes al form data
      images.forEach((file) => {
        formData.append('imagenes', file)
      })

      await publicationsApi.createPublication(formData, token)
      setSuccess(true)
      setError(null)

      // Limpiar formulario
      setTitulo('')
      setDescripcion('')
      setPrecio('')
      setComponentes([])
      setImages([])
      setImagePreviews([])
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al enviar la publicación.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="publication-container text-center">
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px' }} />
        <h2 className="publication-title">¡Publicación Creada!</h2>
        <p className="publication-subtitle">
          El artículo ha sido registrado en la plataforma exitosamente y ya es visible en el
          catálogo.
        </p>
        <button
          className="submit-btn"
          onClick={() => {
            setSuccess(false)
            if (onBack) onBack()
          }}
        >
          Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="publication-container">
      {onBack && (
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
      )}

      <h1 className="publication-title">Publicar Artículo</h1>
      <p className="publication-subtitle">
        Comparte tu equipo tecnológico en desuso para darle una segunda vida.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Sección 1: Información Básica */}
        <div className="form-section">
          <h2 className="section-title">Información Básica</h2>

          <div className="form-group">
            <label htmlFor="titulo">Título de la Publicación</label>
            <input
              type="text"
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Laptop Dell Inspiron con teclado dañado"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción del Estado</label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe detalladamente el estado físico, fallas conocidas y qué funciona."
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="modalidad">Modalidad de Intercambio</label>
              <select
                id="modalidad"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
              >
                <option value="DONACION">Donación gratuita</option>
                <option value="VENTA">Venta</option>
                <option value="TRUEQUE">Trueque (Intercambio piezas)</option>
                <option value="VENTA_PIEZAS">Venta por piezas</option>
              </select>
            </div>
          </div>

          {(modalidad === 'VENTA' || modalidad === 'VENTA_PIEZAS') && (
            <div className="form-group">
              <label htmlFor="precio">Precio sugerido (MXN)</label>
              <input
                type="number"
                id="precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 1500"
                min="0"
                required
              />
            </div>
          )}
        </div>

        {/* Sección 2: Desglose de Componentes (Hardware Mining) */}
        <div className="form-section">
          <h2 className="section-title">Desglose de Componentes (Hardware Mining)</h2>
          <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '16px' }}>
            Especifica cuáles piezas internas aún sirven. Esto ayuda a los reparadores a encontrar
            materia prima útil.
          </p>

          {componentes.map((comp, idx) => (
            <div key={idx} className="component-card">
              <div className="component-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    placeholder="Nombre del componente (Ej: Memoria RAM 8GB)"
                    value={comp.nombre}
                    onChange={(e) => handleComponentChange(idx, 'nombre', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select
                    value={comp.funcional ? 'true' : 'false'}
                    onChange={(e) =>
                      handleComponentChange(idx, 'funcional', e.target.value === 'true')
                    }
                  >
                    <option value="true">Funcional</option>
                    <option value="false">Dañado / No verificado</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {modalidad === 'VENTA_PIEZAS' && (
                    <input
                      type="number"
                      placeholder="$ Pieza"
                      value={comp.precioPieza || ''}
                      onChange={(e) =>
                        handleComponentChange(
                          idx,
                          'precioPieza',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      style={{ width: '80px' }}
                      required
                    />
                  )}

                  <button type="button" className="remove-btn" onClick={() => removeComponent(idx)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Descripción del estado del componente (Opcional)"
                value={comp.descripcion}
                onChange={(e) => handleComponentChange(idx, 'descripcion', e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
          ))}

          <button type="button" className="add-btn" onClick={addComponent}>
            <Plus size={18} /> Agregar componente al desglose
          </button>
        </div>

        {/* Sección 3: Imágenes */}
        <div className="form-section">
          <h2 className="section-title">Imágenes del Artículo</h2>

          <div className="image-upload-zone" onClick={() => fileInputRef.current?.click()}>
            <Upload size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <p>Haz clic para subir hasta 10 imágenes</p>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Solo se permiten archivos JPG, PNG o WebP menores a 5MB.
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
          />

          {imagePreviews.length > 0 && (
            <div className="image-grid">
              {imagePreviews.map((prev, idx) => (
                <div key={idx} className={`image-thumb-container ${idx === 0 ? 'main' : ''}`}>
                  <img src={prev} className="image-thumb" alt={`Subida ${idx}`} />
                  {idx === 0 && <span className="image-badge">Portada</span>}
                  <button
                    type="button"
                    className="image-delete-badge"
                    onClick={() => removeImage(idx)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección 4: Ubicación */}
        <div className="form-section">
          <h2 className="section-title">Geolocalización</h2>

          <div className="form-row" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Latitud</label>
              <input type="text" value={latitud} readOnly />
            </div>
            <div className="form-group">
              <label>Longitud</label>
              <input type="text" value={longitud} readOnly />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ref">Dirección de Referencia (Opcional)</label>
            <input
              type="text"
              id="ref"
              value={direccionReferencia}
              onChange={(e) => setDireccionReferencia(e.target.value)}
              placeholder="Ej: Cruce de Av. Principal y Calle 2, Colonia Centro"
            />
          </div>

          <button type="button" className="geo-btn" onClick={handleGetLocation}>
            <MapPin size={18} /> Obtener mi ubicación actual
          </button>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar Artículo'}
        </button>
      </form>
    </div>
  )
}
