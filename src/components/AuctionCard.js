"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  client,
  databases,
  DATABASE_ID,
  ITEMS_COLLECTION_ID,
  BIDS_COLLECTION_ID,
} from "@/lib/appwrite";
import { ID, Query } from "appwrite";

// ── Timer Logic ──────────────────────────────────────────────

function getTimeRemaining(endTime) {
  const total = new Date(endTime).getTime() - Date.now();
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 };

  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { total, hours, minutes, seconds };
}

function formatTime({ hours, minutes, seconds }) {
  const pad = (n) => String(n).padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

// ── Component ────────────────────────────────────────────────

export default function AuctionCard({ item: initialItem }) {
  const [item, setItem] = useState(initialItem);
  const [timeLeft, setTimeLeft] = useState(() =>
    getTimeRemaining(initialItem.end_time)
  );
  const [bidderName, setBidderName] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isEnded = item.status === "ended" || timeLeft.total <= 0;
  const isUrgent = !isEnded && timeLeft.total > 0 && timeLeft.total <= 60000;

  // ── Countdown Timer ──────────────────────────────────────
  useEffect(() => {
    if (isEnded) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(item.end_time);
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [item.end_time, isEnded]);

  // ── Realtime Subscription ────────────────────────────────
  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${ITEMS_COLLECTION_ID}.documents.${item.$id}`;

    const unsubscribe = client.subscribe(channel, (response) => {
      if (
        response.events.some(
          (e) => e.includes("update") || e.includes("delete")
        )
      ) {
        setItem(response.payload);
        setTimeLeft(getTimeRemaining(response.payload.end_time));
      }
    });

    return () => unsubscribe();
  }, [item.$id]);

  // ── Place Bid ────────────────────────────────────────────
  const handleBid = useCallback(
    async (e) => {
      e.preventDefault();
      setMessage(null);

      const name = bidderName.trim();
      const amount = parseFloat(bidAmount);

      if (!name) {
        setMessage({ type: "error", text: "Entrez votre nom" });
        return;
      }

      if (isNaN(amount) || amount <= item.current_price) {
        setMessage({
          type: "error",
          text: `L'enchère doit dépasser ${item.current_price.toFixed(2)} €`,
        });
        return;
      }

      if (isEnded) {
        setMessage({ type: "error", text: "Cette enchère est terminée" });
        return;
      }

      setIsSubmitting(true);

      try {
        // Create bid record
        await databases.createDocument(
          DATABASE_ID,
          BIDS_COLLECTION_ID,
          ID.unique(),
          {
            item_id: item.$id,
            bidder_name: name,
            amount: amount,
            created_at: new Date().toISOString(),
          }
        );

        // Update item with new highest bid
        await databases.updateDocument(
          DATABASE_ID,
          ITEMS_COLLECTION_ID,
          item.$id,
          {
            current_price: amount,
            current_bidder: name,
          }
        );

        setBidAmount("");
        setMessage({ type: "success", text: "Enchère placée !" });

        // Clear success message after 3s
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        setMessage({
          type: "error",
          text: err.message || "Erreur lors de l'enchère",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [bidderName, bidAmount, item, isEnded]
  );

  // ── Parse images ─────────────────────────────────────────
  const images =
    item.images && item.images.length > 0
      ? item.images
      : ["/placeholder.svg"];

  return (
    <article className="group">
      {/* ── Image Section ──────────────────────────────────── */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden mb-4">
        {images[0] !== "/placeholder.svg" ? (
          <Image
            src={images[currentImageIndex]}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
            Pas d&apos;image
          </div>
        )}

        {/* Image navigation dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentImageIndex
                    ? "bg-foreground"
                    : "bg-foreground/30"
                }`}
                aria-label={`Image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Status badge */}
        {isEnded && (
          <div className="absolute top-3 left-3 bg-foreground text-background px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Terminé
          </div>
        )}
      </div>

      {/* ── Info Section ───────────────────────────────────── */}
      <div className="space-y-3">
        {/* Timer */}
        <div
          className={`font-mono text-sm tracking-wider ${
            isEnded
              ? "text-bid-ended"
              : isUrgent
              ? "text-destructive timer-urgent"
              : "text-foreground"
          }`}
        >
          {isEnded ? "00:00" : formatTime(timeLeft)}
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-lg font-bold leading-tight">{item.name}</h2>
          <p className="text-sm text-muted mt-1 line-clamp-2">
            {item.description}
          </p>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">
            {item.current_price.toFixed(2)} €
          </span>
          {item.current_bidder && (
            <span className="text-xs text-muted truncate max-w-[120px]">
              par {item.current_bidder}
            </span>
          )}
        </div>

        {/* ── Bid Form ───────────────────────────────────── */}
        {!isEnded && (
          <form onSubmit={handleBid} className="space-y-2 pt-2">
            <input
              type="text"
              value={bidderName}
              onChange={(e) => setBidderName(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-3 py-2 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors"
              disabled={isSubmitting}
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Min. ${(item.current_price + 1).toFixed(2)} €`}
                step="0.01"
                min={item.current_price + 0.01}
                className="flex-1 px-3 py-2 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors font-mono"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "..." : "Enchérir"}
              </button>
            </div>
          </form>
        )}

        {/* Ended state */}
        {isEnded && item.current_bidder && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted">
              Remporté par{" "}
              <span className="text-foreground font-medium">
                {item.current_bidder}
              </span>
            </p>
          </div>
        )}

        {/* Message feedback */}
        {message && (
          <p
            className={`text-xs ${
              message.type === "error" ? "text-destructive" : "text-success"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </article>
  );
}
