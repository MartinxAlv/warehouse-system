import { QRCodeSVG } from 'qrcode.react'
import Modal from './Modal.jsx'
import BrandMark from './BrandMark.jsx'

export default function ProductLabel({ item, onClose }) {
  const { product, warehouse, binLocation } = item

  return (
    <Modal title="Product Label" onClose={onClose}>
      <div className="label-preview">
        <div className="label-card">
          <div className="label-header">
            <div className="label-brand-mark"><BrandMark size={13} /></div>
            <span className="label-brand-name">Stockwell</span>
          </div>
          <div className="label-body">
            <div className="label-qr">
              <QRCodeSVG value={product.sku} size={108} level="M" />
            </div>
            <div className="label-info">
              <div className="label-product-name">{product.name}</div>
              <div className="label-sku">{product.sku}</div>
              {binLocation
                ? <div className="label-bin">{binLocation}</div>
                : <div className="label-bin label-bin--unset">No bin location set</div>
              }
              <div className="label-warehouse">{warehouse.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: 20 }}>
        <button className="btn-secondary" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={() => window.print()}>Print Label</button>
      </div>
    </Modal>
  )
}
