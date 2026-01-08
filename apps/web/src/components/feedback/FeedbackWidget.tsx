'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, Input } from '@wattweiser/ui';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FeedbackWidgetProps {
  messageId?: string;
  conversationId?: string;
  onSubmitted?: () => void;
}

const FEEDBACK_REASONS = [
  { value: 'helpful', label: 'Hilfreich' },
  { value: 'accurate', label: 'Genau' },
  { value: 'complete', label: 'Vollständig' },
  { value: 'not-helpful', label: 'Nicht hilfreich' },
  { value: 'inaccurate', label: 'Ungenau' },
  { value: 'incomplete', label: 'Unvollständig' },
  { value: 'other', label: 'Sonstiges' },
];

export function FeedbackWidget({ messageId, conversationId, onSubmitted }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRatingClick = (selectedRating: 'positive' | 'negative') => {
    setRating(selectedRating);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!rating) return;

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId,
          conversationId,
          rating,
          reason: reason || undefined,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast({
        title: 'Feedback gesendet',
        description: 'Vielen Dank für Ihr Feedback!',
      });

      setIsOpen(false);
      setRating(null);
      setReason('');
      setComment('');
      onSubmitted?.();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Feedback konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRatingClick('positive')}
          className="gap-2"
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="sr-only">Positives Feedback</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRatingClick('negative')}
          className="gap-2"
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="sr-only">Negatives Feedback</span>
        </Button>
      </div>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent onClose={() => setIsOpen(false)}>
          <ModalHeader>
            <ModalTitle>
              {rating === 'positive' ? '👍 Positives Feedback' : '👎 Negatives Feedback'}
            </ModalTitle>
            <ModalDescription>
              Bitte teilen Sie uns mit, warum Sie diese Bewertung abgegeben haben.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Grund</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Bitte wählen --</option>
                {FEEDBACK_REASONS.filter((r) =>
                  rating === 'positive'
                    ? ['helpful', 'accurate', 'complete', 'other'].includes(r.value)
                    : ['not-helpful', 'inaccurate', 'incomplete', 'other'].includes(r.value)
                ).map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kommentar (optional)
              </label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ihre zusätzlichen Anmerkungen..."
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={!reason || isSubmitting}>
                {isSubmitting ? 'Wird gesendet...' : 'Feedback senden'}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
