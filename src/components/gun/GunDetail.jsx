import { useState } from 'react'
import { ArrowLeft, Star, Send, Loader, Share2, ShoppingBag, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier, getUserProfile } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import reviewService from '../../services/reviewService'
import { invalidateQueries } from '../../utils/queryCache'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger delete flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete, onAddToCart }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [editingReview, setEditingReview] = useState(null)
  const [votes, setVotes] = useState(() => { try { return JSON.parse(localStorage.getItem('bore_barrel_review_votes') || '{}') } catch { return {} } })
  const [shareMessage, setShareMessage] = useState('')

  const shareGun = async () => {
    const url = new URL(window.location.href)
    url.search = `?gun=${encodeURIComponent(gun.id)}`
    try { await navigator.clipboard.writeText(url.toString()); setShareMessage('Tautan produk disalin.') }
    catch { setShareMessage(url.toString()) }
    setTimeout(() => setShareMessage(''), 3500)
  }

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length
  const reviewEnabled = Boolean(gun.id) && !String(gun.id).startsWith('local-')

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const data = {
      user_identifier: getUserIdentifier(),
      username: getUserProfile().username || 'Shooter',
      rating,
      comment: comment.trim(),
    }
    let result
    try {
      result = editingReview
        ? await reviewService.updateReview(editingReview.id, data)
        : await createReview(gun.id, data)
    } catch (error) {
      setReviewError(error.message || 'Could not save review.')
      return
    }

    if (result) {
      setReviewSuccess(editingReview ? 'Review diperbarui.' : 'Review terkirim!')
      setComment('')
      setRating(5)
      setEditingReview(null)
      invalidateQueries(`reviews:${gun.id}`)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const vote = (review, value) => {
    const next = { ...votes, [review.id]: votes[review.id] === value ? null : value }
    setVotes(next)
    localStorage.setItem('bore_barrel_review_votes', JSON.stringify(next))
  }

  const deleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId)
      invalidateQueries(`reviews:${gun.id}`)
      refetchReviews()
    } catch (error) {
      setReviewError(error.message || 'Could not delete review.')
    }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            {onAddToCart && <button type="button" className="btn btn--primary" onClick={() => onAddToCart(gun)}><ShoppingBag size={16}/> Masukkan keranjang</button>}
            <button type="button" className="btn btn--outline" onClick={shareGun}><Share2 size={16}/> Bagikan tautan</button>
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--outline" onClick={() => onDelete(gun)}>
                Arsipkan
              </button>
            )}
          </div>
          {shareMessage && <p className="form-success share-message">{shareMessage}</p>}
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !reviewEnabled}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> {editingReview ? 'Simpan perubahan' : 'Submit Review'}</>
            )}
          </button>
          {editingReview && <button type="button" className="btn btn--outline" onClick={() => { setEditingReview(null); setComment(''); setRating(5) }}>Batal edit</button>}

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!reviewEnabled && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
          {reviews.map((rev) => {
            const own = String(rev.user_id || rev.user_identifier) === getUserIdentifier()
            const voteValue = votes[rev.id]
            return (
              <li key={rev.id} className="review-item">
                <div className="review-head">
                  <span className="review-user">{rev.username || (String(rev.user_id || rev.user_identifier) === getUserIdentifier() ? getUserProfile().username : 'Anonymous')}</span>
                  <span className="review-stars-display">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? 'var(--brass)' : 'none'}
                        stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                      />
                    ))}
                  </span>
                </div>
                {rev.comment && <p className="review-comment">{rev.comment}</p>}
                <div className="review-actions">
                  <button className={`review-vote ${voteValue === 'up' ? 'active' : ''}`} onClick={() => vote(rev, 'up')} aria-label="Thumbs up"><ThumbsUp size={15}/> {voteValue === 'up' ? 1 : 0}</button>
                  <button className={`review-vote ${voteValue === 'down' ? 'active' : ''}`} onClick={() => vote(rev, 'down')} aria-label="Thumbs down"><ThumbsDown size={15}/> {voteValue === 'down' ? 1 : 0}</button>
                  {own && <><button className="link-btn" onClick={() => { setEditingReview(rev); setRating(rev.rating); setComment(rev.comment || ''); setReviewSuccess('') }}>Edit</button><button className="link-btn" onClick={() => deleteReview(rev.id)} aria-label="Hapus review"><Trash2 size={14}/> Hapus</button></>}
                </div>
              </li>
            )
          })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
