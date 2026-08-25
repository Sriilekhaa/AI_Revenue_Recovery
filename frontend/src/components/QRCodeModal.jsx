import React from 'react';
import { X, QrCode, ExternalLink, ShieldCheck, Smartphone, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatINRFull } from '../utils/formatters';
import './QRCodeModal.css';

export default function QRCodeModal({ isOpen, onClose, upiData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !upiData) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="qr-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="qmh-left">
            <QrCode size={20} color="#2563eb" />
            <div>
              <h3>Dynamic UPI Smart Intent & QR</h3>
              <p>Direct mobile app intent with automated bank switch failover</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="qr-modal-body">
          {/* Switch failover status badge */}
          <div className="switch-status-banner">
            <ShieldCheck size={16} color="#0d9488" />
            <span>{upiData.switch_routing_note}</span>
          </div>

          <div className="qr-interactive-grid">
            {/* SVG QR Code */}
            <div className="qr-visual-box">
              <div
                className="qr-svg-wrapper"
                dangerouslySetInnerHTML={{ __html: upiData.qr_svg_data }}
              />
              <span className="qr-scan-hint">Scan with any UPI App to Pay {formatINRFull(upiData.amount)}</span>
            </div>

            {/* Smart Intent App Launchers */}
            <div className="upi-apps-box">
              <h4 className="box-title">
                <Smartphone size={15} className="inline-icon" /> 1-Click App Launcher (Smart Intent)
              </h4>
              <p className="box-desc">Zero manual VPA entry. Triggers app on customer's phone directly:</p>

              <div className="app-intent-buttons">
                <a href={upiData.gpay_url} className="intent-btn gpay">
                  <span>Google Pay</span>
                  <ExternalLink size={14} />
                </a>
                <a href={upiData.phonepe_url} className="intent-btn phonepe">
                  <span>PhonePe</span>
                  <ExternalLink size={14} />
                </a>
                <a href={upiData.paytm_url} className="intent-btn paytm">
                  <span>Paytm UPI</span>
                  <ExternalLink size={14} />
                </a>
                <a href={upiData.cred_url} className="intent-btn cred">
                  <span>CRED Pay</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Raw VPA copy */}
              <div className="vpa-copy-group">
                <label>Active Receiving VPA:</label>
                <div className="vpa-input-wrap">
                  <input type="text" readOnly value={upiData.active_vpa} />
                  <button className="copy-btn" onClick={() => handleCopy(upiData.active_vpa)}>
                    {copied ? <Check size={14} color="#0d9488" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
