'use client';

import { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Flag } from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  images?: string[];
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
  averageRating?: number;
  totalReviews?: number;
  reviews?: Review[];
  showWriteReview?: boolean;
  className?: string;
}

export default function ProductReviews({
  productId,
  productName,
  averageRating = 4.5,
  totalReviews = 0,
  reviews = [],
  showWriteReview = true,
  className = ""
}: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [filterBy, setFilterBy] = useState<number | 'all'>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Mock reviews data for demonstration
  const mockReviews: Review[] = [
    {
      id: '1',
      customerName: 'Sarah Johnson',
      rating: 5,
      title: 'Perfect fit and great quality!',
      comment: 'I absolutely love these scrub tops! The fabric is soft, breathable, and holds up well after multiple washes. The sizing is accurate and the color is exactly as shown. Highly recommend for anyone in healthcare.',
      date: '2024-01-15',
      verified: true,
      helpful: 12,
      images: []
    },
    {
      id: '2',
      customerName: 'Dr. Michael Chen',
      rating: 4,
      title: 'Good quality, comfortable to wear',
      comment: 'These scrubs are comfortable for long shifts. The material is durable and the fit is good. Only minor complaint is that the colors fade slightly after many washes, but overall very satisfied.',
      date: '2024-01-10',
      verified: true,
      helpful: 8
    },
    {
      id: '3',
      customerName: 'Nurse Emily Rodriguez',
      rating: 5,
      title: 'Best scrubs I\'ve ever owned',
      comment: 'Exceptional quality and comfort. These are the only scrubs I wear now. The pockets are well-designed and the fabric doesn\'t wrinkle easily. Worth every penny!',
      date: '2024-01-08',
      verified: false,
      helpful: 15
    }
  ];

  const displayReviews = reviews.length > 0 ? reviews : mockReviews;
  const reviewsToShow = showAllReviews ? displayReviews : displayReviews.slice(0, 2);

  const filteredReviews = filterBy === 'all'
    ? reviewsToShow
    : reviewsToShow.filter(review => review.rating === filterBy);

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingDistribution = () => {
    const distribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: displayReviews.filter(review => review.rating === rating).length,
      percentage: displayReviews.length > 0
        ? (displayReviews.filter(review => review.rating === rating).length / displayReviews.length) * 100
        : 0
    }));
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-6">
        {/* Reviews Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Customer Reviews
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating), 'lg')}
                <span className="text-2xl font-bold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600">
                  ({totalReviews || displayReviews.length} reviews)
                </span>
              </div>
            </div>
          </div>

          {showWriteReview && (
            <button className="bg-[#173a6a] text-white px-6 py-3 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium">
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Overall Rating */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Rating Breakdown</h4>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <span className="w-8 text-gray-600">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-gray-600 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                >
                  <option value="all">All Ratings</option>
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {sortedReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">
                Be the first to review this product and help other customers make their decision.
              </p>
            </div>
          ) : (
            <>
              {sortedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {review.customerName.charAt(0)}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {review.customerName}
                        </span>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">
                          {formatDate(review.date)}
                        </span>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2">
                        {review.title}
                      </h4>

                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {review.images.map((image, index) => (
                            <div key={index} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Review Actions */}
                      <div className="flex items-center gap-4 text-sm">
                        <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful ({review.helpful})
                        </button>
                        <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                          <Flag className="h-4 w-4" />
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show More/Less Button */}
              {displayReviews.length > 2 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-[#173a6a] hover:text-[#1e4a7a] font-medium"
                  >
                    {showAllReviews
                      ? 'Show Less Reviews'
                      : `Show All ${displayReviews.length} Reviews`
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}