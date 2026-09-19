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
    // px-4 mobile, px-6 desktop
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="py-10 sm:py-16 md:py-24">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl text-[#263654]">
          Enchères en
          <br />
          temps réel<span className="text-[#c70a1a]">.</span>
        </h1>
        <p className="mt-3 sm:mt-4 text-[#5a6a85] text-base sm:text-lg max-w-md">
          Participez sans créer de compte. Entrez votre nom et enchérissez.
        </p>
      </section>

      {/* ── Filters ───────────────────────────────────────── */}
      {/* flex-wrap ensures buttons don't overflow on narrow screens */}
      <section className="border-b border-[#dce3ee] pb-3 mb-6 sm:mb-8 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs text-[#5a6a85] uppercase tracking-widest">
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
            // Generous touch target with py-1
            className={`text-sm transition-colors pb-0.5 py-1 ${
              filter === key
                ? "text-[#1258ca] font-semibold border-b-2 border-[#1258ca]"
                : "text-[#5a6a85] hover:text-[#263654]"
            }`}
          >
            {label}
          </button>
        ))}

        {/* Item count — pushed right on sm+, hidden on very small to avoid overflow */}
        <span className="ml-auto text-xs text-[#5a6a85] font-mono hidden xs:block sm:block">
          {items.length} article{items.length !== 1 ? "s" : ""}
        </span>
      </section>

      {/* ── Grid ──────────────────────────────────────────── */}
      {loading ? (
        <section className="py-8 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-[4/3] bg-[#dce3ee] rounded-lg" />
                <div className="h-3 bg-[#dce3ee] w-1/3 rounded" />
                <div className="h-5 bg-[#dce3ee] w-2/3 rounded" />
                <div className="h-4 bg-[#dce3ee] w-1/2 rounded" />
              </div>
            ))}
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="py-16 sm:py-24 text-center">
          <p className="text-[#5a6a85] text-sm">Aucune enchère disponible.</p>
          <p className="text-[#5a6a85]/50 text-xs mt-2">
            Revenez bientôt ou consultez la page Admin pour ajouter des
            articles.
          </p>
        </section>
      ) : (
        <section className="pb-12 sm:pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {items.map((item) => (
              <AuctionCard key={item.$id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
