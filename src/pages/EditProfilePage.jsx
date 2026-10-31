import { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSaved }) {
  const profile = userService.getUserProfile()
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [error, setError] = useState('')
  const save = (event) => {
    event.preventDefault()
    if (!username.trim()) return setError('Nama wajib diisi.')
    const result = userService.saveUserProfile({ ...profile, username: username.trim(), bio: bio.trim() })
    if (result.success) onSaved()
    else setError(result.message || 'Profil gagal disimpan.')
  }
  return <div className="form-page"><button className="detail-back" onClick={onBack}><ArrowLeft size={18}/> Kembali ke profil</button><h1 className="display">Edit profil</h1>
    <form className="profile-form" onSubmit={save}><label className="form-group"><span className="form-label">Nama</span><input className="form-input" value={username} onChange={e => setUsername(e.target.value)} maxLength={60}/></label><label className="form-group"><span className="form-label">Bio</span><textarea className="form-textarea" value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={300}/></label>{error && <p className="form-error">{error}</p>}<button className="btn btn--primary"><Save size={16}/> Simpan</button></form>
  </div>
}
