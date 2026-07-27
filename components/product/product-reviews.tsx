'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  text: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id });
    });
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return setError('You must be logged in to leave a review.');

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, text }),
      });
      const data = await res.json();

      if (data.success) {
        setRating(5);
        setTitle('');
        setText('');
        fetchReviews(); // Refresh the list
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error(error);
      setError('A server error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-pearl">Loading reviews...</div>;

  return (
    <div className="py-16 border-t border-smoke/20 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Left Col: Stats */}
        <div className="w-full md:w-1/3">
          <h2 className="font-display text-4xl text-bone mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-mono text-5xl text-bone">{stats.averageRating.toFixed(1)}</span>
            <div className="flex flex-col">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= stats.averageRating ? 'fill-current' : 'text-smoke/30 fill-current'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-mono text-[10px] text-pearl uppercase tracking-widest mt-1">
                Based on {stats.totalReviews} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Review Form & List */}
        <div className="w-full md:w-2/3">
          {user ? (
            <form
              onSubmit={handleSubmit}
              className="mb-16 bg-graphite/50 p-6 rounded-xl border border-smoke/20"
            >
              <h3 className="font-mono text-sm text-bone uppercase tracking-widest mb-4">
                Write a Review
              </h3>

              <div className="mb-4">
                <label className="block font-mono text-[10px] text-pearl uppercase tracking-widest mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-current' : 'text-smoke/30 fill-current'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-mono text-[10px] text-pearl uppercase tracking-widest mb-2">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-charcoal border border-smoke/30 rounded-md p-3 text-bone font-sans text-sm focus:border-bone outline-none"
                  placeholder="Summarize your experience"
                  maxLength={100}
                />
              </div>

              <div className="mb-6">
                <label className="block font-mono text-[10px] text-pearl uppercase tracking-widest mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-charcoal border border-smoke/30 rounded-md p-3 text-bone font-sans text-sm h-24 focus:border-bone outline-none resize-none"
                  placeholder="Tell us what you liked or didn't like"
                  maxLength={1000}
                />
              </div>

              {error && (
                <p className="text-red-400 font-mono text-[10px] mb-4 uppercase tracking-widest">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-bone text-charcoal px-6 py-3 font-mono text-xs uppercase tracking-widest rounded-md hover:bg-pearl disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className="mb-16 p-6 border border-dashed border-smoke/20 rounded-xl text-center">
              <p className="font-mono text-xs text-pearl uppercase tracking-widest">
                Please log in to write a review
              </p>
            </div>
          )}

          <div className="space-y-8">
            {reviews.length === 0 ? (
              <p className="text-pearl font-mono text-xs uppercase tracking-widest">
                No reviews yet. Be the first!
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-smoke/10 pb-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-smoke/20 fill-current'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-mono text-[10px] text-pearl uppercase tracking-widest">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-sans font-medium text-bone text-lg mb-2">{review.title}</h4>
                  )}
                  {review.text && (
                    <p className="font-sans text-pearl text-sm mb-4 leading-relaxed">
                      {review.text}
                    </p>
                  )}
                  <p className="font-mono text-[9px] text-ash uppercase tracking-widest">
                    By {review.user.fullName || 'Verified Customer'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
