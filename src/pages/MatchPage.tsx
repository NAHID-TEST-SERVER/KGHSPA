import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, Commentary } from '../types';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { ChevronLeft, MessageSquare, ShieldAlert, Activity } from 'lucide-react';
import LiveMatchDetail from '../components/LiveMatchDetail';

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch match
    const fetchMatch = async () => {
      try {
        const docRef = doc(db, 'matches', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMatch({ id: docSnap.id, ...docSnap.data() } as Match);
        }
      } catch (error) {
        try { handleFirestoreError(error, OperationType.GET, `matches/${id}`); } catch(e) {}
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatch();

    // Listen to real-time updates for match
    const unsubscribeMatch = onSnapshot(doc(db, 'matches', id), (docSnap) => {
      if (docSnap.exists()) {
        setMatch({ id: docSnap.id, ...docSnap.data() } as Match);
      }
    });

    // Listen to commentary
    const q = query(
      collection(db, `matches/${id}/commentary`),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Commentary[];
      setCommentary(comments);
    });

    return () => {
      unsubscribeMatch();
      unsubscribeComments();
    };
  }, [id]);

  if (isLoading) return <div className="p-8 text-center text-sm text-brand-text-muted">Loading match...</div>;
  if (!match) return <div className="p-8 text-center text-sm text-brand-text-muted">Match not found.</div>;

  return (
    <div className="flex flex-col h-full bg-[#05060A]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#05060A]/90 backdrop-blur-md border-b border-white/5 flex items-center px-4 h-12 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-brand-text hover:text-white rounded-full">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center font-display font-medium text-[11px] uppercase tracking-wider text-white/80">
          Match Center
        </div>
        <div className="w-10"></div>
      </header>

      {/* Main Content using the new advanced Live Match Details UI */}
      <div className="flex-1 overflow-hidden">
        <LiveMatchDetail match={match} commentary={commentary} />
      </div>
    </div>
  );
}
