import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReviewsListProps {
  userId: string;
  reviewCount?: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
}

interface ReviewerProfile {
  first_name: string;
  last_name: string;
}

export function ReviewsList({ userId, reviewCount = 0 }: ReviewsListProps) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews-for-user', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });
      return (data || []) as Review[];
    },
  });

  const reviewerIds = reviews.map(r => r.reviewer_id);
  const { data: reviewerProfiles = [] } = useQuery({
    queryKey: ['reviewer-profiles', reviewerIds.join(',')],
    enabled: reviewerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', reviewerIds);
      return (data || []) as (ReviewerProfile & { user_id: string })[];
    },
  });

  const getReviewerName = (reviewerId: string) => {
    const p = reviewerProfiles.find(rp => rp.user_id === reviewerId);
    return p ? `${p.first_name} ${p.last_name}`.trim() || 'User' : 'User';
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-xl border bg-card p-4 text-center w-full hover:bg-accent/50 transition-colors">
          <p className="text-2xl font-bold text-primary">{reviews.length || reviewCount}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Reviews
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                · {avgRating} avg
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{getReviewerName(review.reviewer_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
