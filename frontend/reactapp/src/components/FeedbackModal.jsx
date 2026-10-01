import { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import api from "../../axiosConfig";

export default function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch existing feedback if any
      api.get("/api/feedback/")
        .then(res => {
          if (res.data.rating) {
            setRating(res.data.rating);
            setMessage(res.data.message || "");
          }
        })
        .catch(err => console.error("Error fetching feedback:", err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await api.post("/api/feedback/", { rating, message });
      setSuccess(true);
      localStorage.setItem('pytogether_feedback_submitted', 'true');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">How are you enjoying PyTogether?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {success ? (
          <div className="p-8 text-center text-green-400">
            <p className="text-lg font-semibold">Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col space-y-6">
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star 
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-600'
                    }`} 
                  />
                </button>
              ))}
            </div>
            
            <textarea
              placeholder="Tell us what you love or what we can improve..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32 resize-none transition-all"
            />
            
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
