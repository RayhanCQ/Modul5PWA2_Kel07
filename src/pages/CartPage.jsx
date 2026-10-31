import { useState } from 'react'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { formatPrice } from '../utils/helpers'

export default function CartPage({ items, onChange, onBack }) {
  const [phone, setPhone] = useState(() => localStorage.getItem('bore_barrel_whatsapp') || import.meta.env.VITE_WHATSAPP_NUMBER || '')
  const total = items.reduce((sum, { gun, quantity }) => sum + Number(gun.price || gun.cook_time || 0) * quantity, 0)

  const checkout = () => {
    const number = phone.replace(/\D/g, '')
    if (number.length < 8) return alert('Masukkan nomor WhatsApp dengan kode negara, contoh 6281234567890.')
    localStorage.setItem('bore_barrel_whatsapp', number)
    const detail = items.map(({ gun, quantity }) => `${gun.name} x${quantity} (${formatPrice(Number(gun.price || gun.cook_time || 0) * quantity)})`).join('\n')
    const message = `Hi aku mau pesan:\n${detail}\nTotal: ${formatPrice(total)}`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return <div className="form-page">
    <button className="detail-back" onClick={onBack}><ArrowLeft size={18}/> Kembali ke katalog</button>
    <h1 className="display">Keranjang</h1>
    {!items.length ? <div className="state-box"><ShoppingBag/><p>Keranjang masih kosong.</p></div> : <>
      <ul className="cart-list">{items.map(({ gun, quantity }) => <li className="cart-item" key={gun.id}>
        <img src={gun.image_url || gun.image || '/guns/pistol.svg'} alt="" loading="lazy"/>
        <div className="cart-item-info"><strong>{gun.name}</strong><span>{formatPrice(gun.price || gun.cook_time || 0)}</span></div>
        <button className="icon-btn" aria-label="Kurangi jumlah" onClick={() => onChange(gun, quantity - 1)}><Minus size={16}/></button>
        <span>{quantity}</span>
        <button className="icon-btn" aria-label="Tambah jumlah" onClick={() => onChange(gun, quantity + 1)}><Plus size={16}/></button>
        <button className="icon-btn" aria-label="Hapus" onClick={() => onChange(gun, 0)}><Trash2 size={16}/></button>
      </li>)}</ul>
      <div className="cart-total"><strong>Total</strong><strong>{formatPrice(total)}</strong></div>
      <label className="form-group"><span className="form-label">Nomor WhatsApp tujuan (kode negara)</span><input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="6281234567890"/></label>
      <button className="btn btn--primary" onClick={checkout}>Checkout via WhatsApp</button>
    </>}
  </div>
}
