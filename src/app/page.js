"use client";

import { useState, useEffect } from "react";
import { databases, DATABASE_ID, ITEMS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import AuctionCard from "@/components/AuctionCard";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active"); // "active" | "ended" | "all"

  // ── Fetch Items ────────────────────────────────────────────
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      try {
        const queries = [Query.orderDesc("created_at"), Query.limit(50)];

        if (filter === "active") {
          queries.push(Query.equal("status", "active"));
        } else if (filter === "ended") {
          queries.push(Query.equal("status", "ended"));
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          ITEMS_COLLECTION_ID,
          queries
        );

        setItems(response.documents);
      } catch (err) {
        console.error("Erreur lors du chargement des articles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
          Enchères en
          <br />
          temps réel<span className="text-muted">.</span>
        </h1>
        <p className="mt-4 text-muted text-lg max-w-md">
          Participez sans créer de compte. Entrez votre nom et enchérissez.
        </p>
      </section>

      {/* ── Filters ───────────────────────────────────────── */}
      <section className="border-b border-border pb-4 mb-8 flex items-center gap-6">
        <span className="text-xs text-muted uppercase tracking-widest">
          Filtre
        </span>
        {[
          { key: "active", label: "En cours" },
          { key: "ended", label: "Terminées" },
          { key: "all", label: "Toutes" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm transition-colors ${
              filter === key
                ? "text-foreground font-medium"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}

        {/* Item count */}
        <span className="ml-auto text-xs text-muted font-mono">
          {items.length} article{items.length !== 1 ? "s" : ""}
        </span>
      </section>

      {/* ── Grid ──────────────────────────────────────────── */}
      {loading ? (
        <section className="py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/3] bg-zinc-100" />
                <div className="h-3 bg-zinc-100 w-1/3" />
                <div className="h-5 bg-zinc-100 w-2/3" />
                <div className="h-4 bg-zinc-100 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="py-24 text-center">
          <p className="text-muted text-sm">Aucune enchère disponible.</p>
          <p className="text-muted/50 text-xs mt-2">
            Revenez bientôt ou consultez la page Admin pour ajouter des
            articles.
          </p>
        </section>
      ) : (
        <section className="pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {items.map((item) => (
              <AuctionCard key={item.$id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
