"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  account,
  databases,
  DATABASE_ID,
  ITEMS_COLLECTION_ID,
} from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { uploadImages } from "@/lib/cloudinary";

function getActivationEndTime(duration) {
  return new Date(Date.now() + duration * 1000).toISOString();
}

async function listAdminItems() {
  return databases.listDocuments(
    DATABASE_ID,
    ITEMS_COLLECTION_ID,
    [Query.orderDesc("created_at"), Query.limit(100)]
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN PAGE — Protected Route
// ═══════════════════════════════════════════════════════════════

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Check Session ──────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await account.get();
        setUser(session);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-100 w-48" />
          <div className="h-4 bg-zinc-100 w-64" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN FORM
// ═══════════════════════════════════════════════════════════════

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      onLogin(user);
    } catch (err) {
      setError(err.message || "Identifiants invalides");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Administration
        </h1>
        <p className="text-muted text-sm mb-8">
          Connectez-vous pour gérer les enchères.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

function AdminDashboard({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ── Fetch All Items ────────────────────────────────────────
  const fetchItems = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    try {
      const response = await listAdminItems();
      setItems(response.documents);
    } catch (err) {
      console.error("Erreur chargement articles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      try {
        const response = await listAdminItems();
        if (!cancelled) setItems(response.documents);
      } catch (err) {
        console.error("Erreur chargement articles:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadItems();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      onLogout();
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    }
  };

  // ── Delete Item ────────────────────────────────────────────
  const handleDelete = async (itemId) => {
    if (!confirm("Supprimer cet article ?")) return;
    try {
      await databases.deleteDocument(DATABASE_ID, ITEMS_COLLECTION_ID, itemId);
      setItems((prev) => prev.filter((i) => i.$id !== itemId));
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // ── Toggle Status ──────────────────────────────────────────
  const handleToggleStatus = async (item) => {
    try {
      const isActivating = item.status !== "active";
      const updates = {
        status: isActivating ? "active" : "ended",
      };

      // Recalculate end_time when activating
      if (isActivating) {
        updates.end_time = getActivationEndTime(item.timer_duration);
      }

      await databases.updateDocument(
        DATABASE_ID,
        ITEMS_COLLECTION_ID,
        item.$id,
        updates
      );

      fetchItems();
    } catch (err) {
      console.error("Erreur changement statut:", err);
    }
  };

  // ── Edit Item ──────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // ── Form Saved ─────────────────────────────────────────────
  const handleFormSaved = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchItems();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Administration
          </h1>
          <p className="text-sm text-muted mt-1">
            Connecté : {user.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            {showForm ? "Annuler" : "+ Nouvel article"}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Create / Edit Form ──────────────────────────────── */}
      {showForm && (
        <ItemForm
          item={editingItem}
          onSaved={handleFormSaved}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* ── Items Table ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
          <h2 className="text-lg font-bold">Articles</h2>
          <span className="text-xs text-muted font-mono">
            {items.length} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 py-4">
                <div className="w-20 h-16 bg-zinc-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-100 w-1/3" />
                  <div className="h-3 bg-zinc-100 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted py-8">
            Aucun article. Cliquez sur &quot;+ Nouvel article&quot; pour
            commencer.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.$id} className="flex items-center gap-4 py-4">
                {/* Thumbnail */}
                <div className="w-20 h-16 bg-zinc-100 relative shrink-0 overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted">
                      N/A
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {item.current_price.toFixed(2)} €
                    {item.current_bidder &&
                      ` — ${item.current_bidder}`}
                  </p>
                </div>

                {/* Status */}
                <span
                  className={`text-xs font-mono px-2 py-1 ${
                    item.status === "active"
                      ? "bg-foreground text-background"
                      : item.status === "draft"
                      ? "bg-zinc-100 text-muted"
                      : "bg-zinc-100 text-muted"
                  }`}
                >
                  {item.status}
                </span>

                {/* Timer info */}
                <span className="text-xs text-muted font-mono w-16 text-right">
                  {item.timer_duration}s
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`text-xs px-3 py-1 border transition-colors ${
                      item.status === "active"
                        ? "border-destructive text-destructive hover:bg-destructive hover:text-background"
                        : "border-foreground text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {item.status === "active" ? "Terminer" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-xs px-3 py-1 border border-border text-muted hover:text-foreground hover:border-foreground transition-colors"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(item.$id)}
                    className="text-xs px-3 py-1 border border-border text-muted hover:text-destructive hover:border-destructive transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ITEM FORM (Create / Edit)
// ═══════════════════════════════════════════════════════════════

function ItemForm({ item, onSaved, onCancel }) {
  const isEditing = !!item;

  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(item?.description || "");
  const [startingPrice, setStartingPrice] = useState(
    item?.starting_price?.toString() || ""
  );
  const [timerMinutes, setTimerMinutes] = useState(
    item ? Math.floor(item.timer_duration / 60).toString() : ""
  );
  const [timerSeconds, setTimerSeconds] = useState(
    item ? (item.timer_duration % 60).toString() : ""
  );
  const [existingImages, setExistingImages] = useState(item?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const previewUrlsRef = useRef([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // ── Release preview URLs when the form unmounts ──────────
  useEffect(() => {
    return () =>
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const handleNewFiles = (files) => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = urls;
    setNewFiles(files);
    setPreviews(urls);
  };

  // ── Remove existing image ────────────────────────────────
  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate
      if (!name.trim()) throw new Error("Le nom est requis");
      if (!description.trim()) throw new Error("La description est requise");

      const price = parseFloat(startingPrice);
      if (isNaN(price) || price < 0) throw new Error("Prix invalide");

      const minutes = parseInt(timerMinutes) || 0;
      const seconds = parseInt(timerSeconds) || 0;
      const timerDuration = minutes * 60 + seconds;
      if (timerDuration <= 0) throw new Error("Le timer doit être > 0");

      // Upload new images to Cloudinary
      let imageUrls = [...existingImages];

      if (newFiles.length > 0) {
        setUploadProgress(
          `Upload de ${newFiles.length} image${newFiles.length > 1 ? "s" : ""}...`
        );
        const uploadedUrls = await uploadImages(newFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      if (imageUrls.length === 0) {
        throw new Error("Au moins une image est requise");
      }

      setUploadProgress("Enregistrement...");

      const data = {
        name: name.trim(),
        description: description.trim(),
        images: imageUrls,
        starting_price: price,
        current_price: isEditing ? item.current_price : price,
        current_bidder: isEditing ? item.current_bidder : "",
        timer_duration: timerDuration,
        status: isEditing ? item.status : "draft",
        created_at: isEditing
          ? item.created_at
          : new Date().toISOString(),
        end_time: isEditing
          ? item.end_time
          : new Date(Date.now() + timerDuration * 1000).toISOString(),
      };

      if (isEditing) {
        await databases.updateDocument(
          DATABASE_ID,
          ITEMS_COLLECTION_ID,
          item.$id,
          data
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          ITEMS_COLLECTION_ID,
          ID.unique(),
          data
        );
      }

      onSaved();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <section className="border-b border-border pb-10 mb-10">
      <h2 className="text-lg font-bold mb-6">
        {isEditing ? `Modifier : ${item.name}` : "Nouvel article"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 max-w-4xl">
        {/* ── Name ──────────────────────────────────────── */}
        <div className="md:col-span-2">
          <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
            Nom de l&apos;article
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors"
            placeholder="Ex: Carte Pokémon Dracaufeu 1ère Édition"
          />
        </div>

        {/* ── Description ───────────────────────────────── */}
        <div className="md:col-span-2">
          <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors resize-none"
            placeholder="Description détaillée de l'article, état, provenance..."
          />
        </div>

        {/* ── Starting Price ────────────────────────────── */}
        <div>
          <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
            Prix de départ (€)
          </label>
          <input
            type="number"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors font-mono"
            placeholder="0.00"
          />
        </div>

        {/* ── Timer ─────────────────────────────────────── */}
        <div>
          <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
            Durée du timer
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                min="0"
                className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors font-mono"
                placeholder="5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                min
              </span>
            </div>
            <div className="flex-1 relative">
              <input
                type="number"
                value={timerSeconds}
                onChange={(e) => setTimerSeconds(e.target.value)}
                min="0"
                max="59"
                className="w-full px-3 py-2.5 text-sm bg-transparent border border-border placeholder:text-muted/50 focus:border-foreground focus:outline-none transition-colors font-mono"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                sec
              </span>
            </div>
          </div>
        </div>

        {/* ── Images ────────────────────────────────────── */}
        <div className="md:col-span-2">
          <label className="block text-xs text-muted uppercase tracking-widest mb-1.5">
            Images
          </label>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {existingImages.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 bg-zinc-100 group"
                >
                  <Image
                    src={url}
                    alt={`Image ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-background text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New file previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 bg-zinc-100 border border-dashed border-foreground/20"
                >
                  <Image
                    src={url}
                    alt={`Nouveau ${idx + 1}`}
                    fill
                    className="object-cover opacity-70"
                    sizes="80px"
                  />
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] text-muted bg-background/80 px-1">
                    new
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* File input */}
          <label className="block border border-dashed border-border hover:border-foreground transition-colors cursor-pointer p-4 text-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => handleNewFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            <span className="text-sm text-muted">
              Cliquez pour ajouter des images
            </span>
            <br />
            <span className="text-xs text-muted/50">
              JPG, PNG, WebP, AVIF — 10 Mo max par image
            </span>
          </label>
        </div>

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div className="md:col-span-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* ── Upload progress ───────────────────────────── */}
        {uploadProgress && (
          <div className="md:col-span-2">
            <p className="text-xs text-muted font-mono">{uploadProgress}</p>
          </div>
        )}

        {/* ── Actions ───────────────────────────────────── */}
        <div className="md:col-span-2 flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Enregistrement..."
              : isEditing
              ? "Mettre à jour"
              : "Créer l'article"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </section>
  );
}
