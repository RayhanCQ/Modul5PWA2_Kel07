import { Suspense, lazy, useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import PWABadge from './components/PWABadge.jsx'
import gunService from './services/gunService.js'
import archiveService from './services/archiveService.js'
import { invalidateQueries } from './utils/queryCache.js'
import GUNS_LOCAL from './data/guns.js'
import './App.css'

const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const GunDetail = lazy(() => import('./components/gun/GunDetail.jsx'))

const readCart = () => { try { return JSON.parse(localStorage.getItem('bore_barrel_cart') || '[]') } catch { return [] } }

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list')
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [cart, setCart] = useState(readCart)
  const [shareError, setShareError] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('gun')
    if (!id) return
    const localId = /^local-(\d+)$/.exec(id)
    if (localId && GUNS_LOCAL[Number(localId[1])]) { setSelectedGun({ ...GUNS_LOCAL[Number(localId[1])], id }); setMode('detail'); return }
    gunService.getGunById(id).then(({ data }) => { setSelectedGun(data); setMode('detail') }).catch(() => setShareError('Produk dari tautan ini tidak ditemukan.'))
  }, [])

  const saveCart = (items) => { setCart(items); localStorage.setItem('bore_barrel_cart', JSON.stringify(items)) }
  const changeCart = (gun, quantity) => {
    const next = cart.filter((item) => String(item.gun.id) !== String(gun.id))
    if (quantity > 0) next.push({ gun, quantity })
    saveCart(next)
  }
  const addToCart = (gun) => {
    const current = cart.find((item) => String(item.gun.id) === String(gun.id))
    changeCart(gun, (current?.quantity || 0) + 1)
    setTab('Cart'); setMode('list')
  }

  const handleNavigate = (target, payload) => {
    if (target === 'Create') { setMode('create'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else if (target === 'Edit') { setEditingGun(payload); setMode('edit'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else if (target === 'EditProfile') { setMode('edit-profile'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else if (target === 'Detail') { setSelectedGun(payload); setMode('detail'); window.history.replaceState({}, '', `${window.location.pathname}?gun=${encodeURIComponent(payload.id)}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    else { setTab(target); setMode('list'); setSelectedGun(null); setEditingGun(null); setShareError(''); window.history.replaceState({}, '', window.location.pathname); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }
  const handleBack = () => { setMode('list'); setSelectedGun(null); setEditingGun(null); window.history.replaceState({}, '', window.location.pathname) }

  return <div className="shell">
    {showSplash && <SplashScreen onFinish={() => setShowSplash(false)}/>}
    <Header tab={mode === 'list' ? tab : ''} onTab={(t) => handleNavigate(t)} onNavigateCreate={() => handleNavigate('Create')} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}/>
    <main className="main"><Suspense fallback={<div className="state-box">Memuat halaman…</div>}>
      {mode === 'create' && <CreateGunPage onBack={handleBack} onSuccess={() => { handleBack(); setTab('Catalog'); invalidateQueries('guns:') }}/>}
      {mode === 'edit' && <EditGunPage gun={editingGun} gunId={editingGun?.id} onBack={handleBack} onSuccess={() => { handleBack(); setTab('Catalog'); invalidateQueries('guns:'); invalidateQueries('gun:') }}/>}
      {mode === 'edit-profile' && <EditProfilePage onBack={handleBack} onSaved={() => { handleBack(); setTab('Profile') }}/>}
      {mode === 'detail' && selectedGun && <GunDetail gun={selectedGun} onBack={handleBack} onAddToCart={addToCart} onEdit={(g) => handleNavigate('Edit', g)} onDelete={setArchiveTarget}/>}
      {mode === 'list' && <>
        {shareError && <div className="toast toast--error">{shareError}</div>}
        {tab === 'Catalog' && <Catalog onNavigate={handleNavigate} onAddToCart={addToCart}/>}
        {tab === 'Favorites' && <FavoritesPage onSelectGun={(g) => handleNavigate('Detail', g)} onNavigateCatalog={() => setTab('Catalog')}/>}
        {tab === 'Profile' && <ProfilePage onReplaySplash={() => setShowSplash(true)} onEditProfile={() => handleNavigate('EditProfile')} onResumeDraft={(id) => id === 'create' ? handleNavigate('Create') : handleNavigate('Edit', { id })}/>}
        {tab === 'Cart' && <CartPage items={cart} onChange={changeCart} onBack={() => setTab('Catalog')}/>}
      </>}
    </Suspense></main>
    <ConfirmModal open={Boolean(archiveTarget)} title="Arsipkan produk" message={`Arsipkan “${archiveTarget?.name}”? Produk dapat dipulihkan dari bagian Arsip di profil.`} confirmLabel="Arsipkan" loading={false} onConfirm={() => { archiveService.archive(archiveTarget.id); setArchiveTarget(null); handleBack(); setTab('Catalog'); invalidateQueries('guns:') }} onCancel={() => setArchiveTarget(null)}/>
    <PWABadge/><Footer/>
  </div>
}

export default App
