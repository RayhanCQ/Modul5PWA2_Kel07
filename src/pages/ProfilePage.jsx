import { useMemo, useState } from 'react'
import { Archive, Camera, Check, Copy, FileText, Heart, Play, RotateCcw, Shield, Trash2, UserRoundPen } from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { useGuns } from '../hooks/useGuns'
import archiveService from '../services/archiveService'
import { About, Contact } from './ProfileSections'
import { deleteDraft, formatDraftTime, getAllDraftIds, getDraftTimestamp, loadDraft } from '../utils/draftStorage'
import GUNS_LOCAL from '../data/guns'

export default function ProfilePage({ onReplaySplash, onEditProfile, onResumeDraft }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [section, setSection] = useState('overview')
  const [copied, setCopied] = useState(false)
  const [version, refresh] = useState(0)
  const { favorites } = useFavorites()
  const { guns } = useGuns({ limit: 200 })
  const drafts = useMemo(() => getAllDraftIds().map((id) => ({ id, data: loadDraft(id), time: getDraftTimestamp(id) })), [version])
  const allGuns = [...guns, ...GUNS_LOCAL.map((gun, index) => ({ ...gun, id: gun.id || `local-${index}` }))]
  const archived = allGuns.filter((gun) => archiveService.isArchived(gun.id))

  const uploadAvatar = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Foto profil maksimal 2 MB.')
    const reader = new FileReader()
    reader.onload = () => {
      const result = userService.updateAvatar(reader.result)
      if (result.success) { setAvatar(reader.result); setProfile(result.data) }
    }
    reader.readAsDataURL(file)
  }

  const copyId = async () => {
    await navigator.clipboard.writeText(profile.userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return <div className="profile-page">
    <section className="masthead profile-heading">
      <div><h1 className="display">Profil</h1><p className="lede">Pengaturan akun dan aktivitas katalog.</p></div>
      {onReplaySplash && <button className="btn btn--outline btn--sm" onClick={onReplaySplash}><Play size={14}/> Replay Intro</button>}
    </section>
    <nav className="profile-sections" aria-label="Bagian profil">
      {[['overview','Profil'],['drafts','Draft'],['archive','Arsip'],['about','About'],['contact','Contact']].map(([id,label]) => <button key={id} className={`btn btn--sm ${section === id ? 'btn--primary' : 'btn--outline'}`} onClick={() => setSection(id)}>{label}</button>)}
    </nav>

    {section === 'overview' && <>
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">{avatar ? <img src={avatar} alt={profile.username} className="avatar-img"/> : <div className="avatar-placeholder"><Shield size={36}/></div>}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Ganti foto profil"><Camera size={14}/><input id="avatar-file-input" type="file" accept="image/*" onChange={uploadAvatar} className="hidden-file-input"/></label>
          </div>
          <div className="profile-identity"><h2 className="display">{profile.username || 'Shooter'}</h2><p>{profile.bio || 'Bio belum ditambahkan.'}</p><div className="profile-id-row"><span className="mono-badge">{profile.userId}</span><button className="icon-btn" onClick={copyId} aria-label="Salin ID">{copied ? <Check size={14}/> : <Copy size={14}/>}</button></div></div>
          <button className="btn btn--outline profile-edit-btn" onClick={onEditProfile}><UserRoundPen size={16}/> Edit profil</button>
        </div>
        <div className="profile-stats"><div className="stat-item"><Heart size={20}/><div className="stat-val">{favorites.length}</div><div className="stat-label">Favorit</div></div><div className="stat-item"><FileText size={20}/><div className="stat-val">{drafts.length}</div><div className="stat-label">Draft</div></div></div>
      </div>
    </>}

    {section === 'drafts' && <section className="profile-panel"><h2 className="section-title">Semua draft</h2>{drafts.length ? <ul className="profile-record-list">{drafts.map(({ id, data, time }) => <li key={id}><div><strong>{data?.formData?.name || (id === 'create' ? 'Produk baru' : `Edit produk ${id}`)}</strong><small>Disimpan {formatDraftTime(time)}</small></div><div className="profile-record-actions"><button className="btn btn--outline btn--sm" onClick={() => onResumeDraft(id)}>Buka draft</button><button className="icon-btn" aria-label="Hapus draft" onClick={() => { deleteDraft(id); refresh(n => n + 1) }}><Trash2 size={16}/></button></div></li>)}</ul> : <p className="detail-empty">Belum ada draft tersimpan.</p>}</section>}

    {section === 'archive' && <section className="profile-panel"><h2 className="section-title"><Archive size={18}/> Arsip produk</h2>{archived.length ? <ul className="profile-record-list">{archived.map(gun => <li key={gun.id}><div><strong>{gun.name}</strong><small>{gun.type || gun.category}</small></div><button className="btn btn--outline btn--sm" onClick={() => { archiveService.restore(gun.id); refresh(n => n + 1) }}><RotateCcw size={14}/> Pulihkan</button></li>)}</ul> : <p className="detail-empty">Belum ada produk diarsipkan.</p>}</section>}

    {section === 'about' && <About/>}
    {section === 'contact' && <Contact/>}
  </div>
}
