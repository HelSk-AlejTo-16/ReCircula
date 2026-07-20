import React from 'react'
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react'
import './CustomModal.css'

export interface CustomModalProps {
  isOpen: boolean
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isAlert?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isAlert = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <XCircle size={28} className="modal-icon modal-icon--danger" />
      case 'warning':
        return <AlertTriangle size={28} className="modal-icon modal-icon--warning" />
      case 'success':
        return <CheckCircle2 size={28} className="modal-icon modal-icon--success" />
      case 'info':
      default:
        return <Info size={28} className="modal-icon modal-icon--info" />
    }
  }

  return (
    <div className="custom-modal-backdrop" onClick={onCancel || onConfirm}>
      <div
        className={`custom-modal-card custom-modal-card--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="custom-modal-close"
          onClick={onCancel || onConfirm}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="custom-modal-header">
          <div className={`custom-modal-icon-wrapper custom-modal-icon-wrapper--${variant}`}>
            {getIcon()}
          </div>
          <h3 className="custom-modal-title">{title}</h3>
        </div>

        <div className="custom-modal-body">
          <p>{message}</p>
        </div>

        <div className="custom-modal-actions">
          {!isAlert && onCancel && (
            <button
              type="button"
              className="custom-modal-btn custom-modal-btn--cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`custom-modal-btn custom-modal-btn--${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
