"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ProductImage } from "@/components/ProductImage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CATEGORIES,
  COLLECTIONS,
  GENDERS,
  categoryLabel,
  formatPrice,
  type Product,
} from "@/lib/store";

const TOKEN_KEY = "pechies-admin-token";

function errMsg(e: unknown) {
  if (e instanceof ConvexError) return String(e.data);
  return e instanceof Error ? e.message : "Something went wrong.";
}

type SignUpload = ReturnType<typeof useAction<typeof api.cloudinary.signUpload>>;

/** Signed direct upload to Cloudinary; returns an optimised URL (auto format/quality, max 1200px wide). */
async function uploadToCloudinary(signUpload: SignUpload, token: string, file: File) {
  const sig = await signUpload({ token });
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Upload failed.");
  return {
    imageUrl: String(data.secure_url).replace("/upload/", "/upload/f_auto,q_auto,w_1200/"),
    imagePublicId: String(data.public_id),
  };
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read after hydration
      setToken(localStorage.getItem(TOKEN_KEY));
    } catch {
      setToken(null);
    }
  }, []);

  const valid = useQuery(api.auth.check, token ? { token } : "skip");

  const saveToken = (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setToken(t);
  };

  if (token === undefined || (token && valid === undefined)) {
    return <Shell><p className="py-32 text-center text-ivory/50">Loading…</p></Shell>;
  }
  if (!token || valid === false) return <Login onLogin={saveToken} />;
  return <Admin token={token} onLogout={() => saveToken(null)} />;
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-graphite">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-semibold">Pe’chies</span>
            <span className="eyebrow">Dashboard</span>
          </div>
          <div className="flex items-center gap-5 text-xs tracking-[0.2em] uppercase">
            <Link href="/" target="_blank" className="text-ivory/70 hover:text-champagne">View store ↗</Link>
            {right}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}

// ---------------- Login ----------------

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const login = useMutation(api.auth.login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Shell>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            onLogin(await login({ password }));
          } catch (err) {
            setError(errMsg(err));
          } finally {
            setBusy(false);
          }
        }}
        className="mx-auto mt-16 max-w-sm border border-graphite p-8"
      >
        <h1 className="font-serif text-3xl">Welcome back</h1>
        <p className="mt-1 text-sm text-ivory/60">Enter the admin password to manage products.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="field mt-6"
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button disabled={busy || !password} className="btn-gold mt-6 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Shell>
  );
}

// ---------------- Admin ----------------

type Editing = Product | "new" | null;

function Admin({ token, onLogout }: { token: string; onLogout: () => void }) {
  const products = useQuery(api.products.list);
  const logout = useMutation(api.auth.logout);
  const setStock = useMutation(api.products.setStock);
  const remove = useMutation(api.products.remove);

  const [editing, setEditing] = useState<Editing>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [products, search, category]);

  const stats = useMemo(() => {
    const list = products ?? [];
    return [
      { label: "Products", value: list.length },
      { label: "In stock", value: list.filter((p) => p.inStock).length },
      { label: "Out of stock", value: list.filter((p) => !p.inStock).length },
      { label: "Without photo", value: list.filter((p) => !p.imageUrl).length },
    ];
  }, [products]);

  const handleError = (e: unknown) => {
    const m = errMsg(e);
    alert(m);
    if (m.includes("Not authorised")) onLogout();
  };

  return (
    <Shell
      right={
        <button
          onClick={async () => {
            await logout({ token }).catch(() => {});
            onLogout();
          }}
          className="text-ivory/70 hover:text-champagne"
        >
          Log out
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-px bg-graphite sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink p-5">
            <p className="eyebrow">{s.label}</p>
            <p className="mt-2 font-serif text-4xl">{products ? s.value : "—"}</p>
          </div>
        ))}
      </div>

      <HeroEditor token={token} onAuthError={handleError} />

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <h1 className="font-serif text-4xl">Products</h1>
        <div className="flex flex-1 flex-wrap gap-3 sm:justify-end">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="field max-w-48"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-auto min-w-44" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={() => setEditing("new")} className="btn-gold">+ New product</button>
        </div>
      </div>

      <div className="mt-6 divide-y divide-graphite border-y border-graphite">
        {products === undefined && <p className="py-10 text-center text-ivory/50">Loading…</p>}
        {products && filtered.length === 0 && (
          <p className="py-10 text-center text-ivory/50">No products found.</p>
        )}
        {filtered.map((p) => (
          <div key={p._id} className="flex items-center gap-4 py-4">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-graphite">
              <ProductImage product={p} sizes="64px" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-xl">{p.name}</p>
              <p className="text-xs text-ivory/50">
                {categoryLabel(p.category)} · {p.gender} {p.tags.length > 0 && `· ${p.tags.join(", ")}`}
              </p>
              <p className="mt-1 text-sm font-semibold text-champagne">{formatPrice(p.price)}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ivory/70">
              <input
                type="checkbox"
                checked={p.inStock}
                onChange={(e) =>
                  setStock({ token, id: p._id, inStock: e.target.checked }).catch(handleError)
                }
                className="h-4 w-4 accent-champagne"
              />
              <span className="hidden sm:inline">In stock</span>
            </label>
            <div className="flex flex-col gap-1 text-xs tracking-[0.15em] uppercase sm:flex-row sm:gap-4">
              <button onClick={() => setEditing(p)} className="text-ivory/80 hover:text-champagne">Edit</button>
              <button
                onClick={() => {
                  if (confirm(`Delete “${p.name}”? This cannot be undone.`))
                    remove({ token, id: p._id }).catch(handleError);
                }}
                className="text-red-300/80 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductForm
          key={editing === "new" ? "new" : editing._id}
          token={token}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onAuthError={handleError}
        />
      )}
    </Shell>
  );
}

// ---------------- Homepage hero ----------------

type HeroState = { imageUrl?: string; imagePublicId?: string; label: string; title: string; subtitle: string };

function HeroEditor({ token, onAuthError }: { token: string; onAuthError: (e: unknown) => void }) {
  const hero = useQuery(api.hero.get);
  if (hero === undefined) {
    return <section className="mt-10 border border-graphite p-6 text-sm text-ivory/50">Loading hero…</section>;
  }
  return <HeroForm token={token} hero={hero} onAuthError={onAuthError} />;
}

function HeroForm({
  token,
  hero,
  onAuthError,
}: {
  token: string;
  hero: Doc<"hero"> | null;
  onAuthError: (e: unknown) => void;
}) {
  const save = useMutation(api.hero.save);
  const signUpload = useAction(api.cloudinary.signUpload);

  const initial: HeroState = {
    imageUrl: hero?.imageUrl,
    imagePublicId: hero?.imagePublicId,
    label: hero?.label ?? "Signature pick",
    title: hero?.title ?? "",
    subtitle: hero?.subtitle ?? "",
  };
  const [f, setF] = useState<HeroState>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof HeroState>(k: K, v: HeroState[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setStatus(null);
  };

  async function upload(file: File) {
    setUploading(true);
    setStatus(null);
    try {
      const img = await uploadToCloudinary(signUpload, token, file);
      setF((s) => ({ ...s, ...img }));
    } catch (e) {
      setStatus({ ok: false, text: errMsg(e) });
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await save({
        token,
        hero: {
          imageUrl: f.imageUrl,
          imagePublicId: f.imagePublicId,
          label: f.label,
          title: f.title,
          subtitle: f.subtitle,
        },
      });
      setStatus({ ok: true, text: "Saved — the homepage is updated." });
    } catch (err) {
      const m = errMsg(err);
      if (m.includes("Not authorised")) onAuthError(err);
      else setStatus({ ok: false, text: m });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10 border border-graphite">
      <div className="border-b border-graphite px-6 py-5">
        <h2 className="font-serif text-3xl">Homepage hero</h2>
        <p className="mt-1 text-sm text-ivory/60">
          The large picture card on the right of the homepage. Without a picture, the store shows a bestseller
          automatically.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-8 p-6 md:grid-cols-[minmax(0,18rem)_1fr]">
        {/* Live preview — mirrors the homepage card */}
        <div>
          <div className="relative aspect-[4/3.6] overflow-hidden rounded-[24px] bg-graphite ring-1 ring-white/[0.07]">
            {f.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- small admin preview
              <img src={f.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-ivory/40">
                No picture — showing a bestseller
              </div>
            )}
            {f.imageUrl && <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />}
            {f.imageUrl && (f.label || f.title || f.subtitle) && (
              <div className="absolute inset-x-0 bottom-0 p-4">
                {f.label && (
                  <p className="text-[0.5rem] font-bold tracking-[0.25em] text-champagne uppercase">{f.label}</p>
                )}
                {f.title && <p className="mt-1 font-serif text-xl leading-tight">{f.title}</p>}
                {f.subtitle && <p className="mt-0.5 text-xs text-ivory/70">{f.subtitle}</p>}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink/70 text-xs">Uploading…</div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <label className="btn-outline cursor-pointer">
              {f.imageUrl ? "Replace picture" : "Upload picture"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {f.imageUrl && (
              <button
                type="button"
                onClick={() => {
                  setF((s) => ({ ...s, imageUrl: undefined, imagePublicId: undefined }));
                  setStatus(null);
                }}
                className="text-xs tracking-[0.15em] text-ivory/50 uppercase hover:text-champagne"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ivory/40">Landscape or square pictures work best.</p>
        </div>

        <div className="space-y-5">
          <Field label="Small label (optional)">
            <input value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="Signature pick" className="field" />
          </Field>
          <Field label="Title (optional)">
            <input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Oud Royale" className="field" />
          </Field>
          <Field label="Subtitle (optional)">
            <input
              value={f.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Rose · Saffron · Amber"
              className="field"
            />
          </Field>
          <p className="text-xs text-ivory/40">Leave all three empty to show the picture on its own.</p>

          <div className="flex flex-wrap items-center gap-4">
            <button disabled={saving || uploading} className="btn-gold">
              {saving ? "Saving…" : "Save hero"}
            </button>
            {status && <p className={`text-sm ${status.ok ? "text-champagne" : "text-red-300"}`}>{status.text}</p>}
          </div>
        </div>
      </form>
    </section>
  );
}

// ---------------- Form ----------------

type FormState = {
  name: string;
  description: string;
  notes: string;
  price: string;
  category: Product["category"];
  gender: Product["gender"];
  tags: string[];
  imageUrl?: string;
  imagePublicId?: string;
  inStock: boolean;
};

function ProductForm({
  token,
  product,
  onClose,
  onAuthError,
}: {
  token: string;
  product: Product | null;
  onClose: () => void;
  onAuthError: (e: unknown) => void;
}) {
  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);
  const signUpload = useAction(api.cloudinary.signUpload);

  const [f, setF] = useState<FormState>(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    notes: product?.notes ?? "",
    price: product ? String(product.price) : "",
    category: product?.category ?? "oud",
    gender: product?.gender ?? "unisex",
    tags: product?.tags ?? [],
    imageUrl: product?.imageUrl,
    imagePublicId: product?.imagePublicId,
    inStock: product?.inStock ?? true,
  }));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const { imageUrl, imagePublicId } = await uploadToCloudinary(signUpload, token, file);
      setF((s) => ({ ...s, imageUrl, imagePublicId }));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: f.name.trim(),
      description: f.description.trim(),
      notes: f.notes.trim() || undefined,
      price: Number(f.price),
      category: f.category,
      gender: f.gender,
      tags: f.tags,
      imageUrl: f.imageUrl,
      imagePublicId: f.imagePublicId,
      inStock: f.inStock,
    };
    try {
      if (product) await update({ token, id: product._id as Id<"products">, product: payload });
      else await create({ token, product: payload });
      onClose();
    } catch (err) {
      const m = errMsg(err);
      if (m.includes("Not authorised")) onAuthError(err);
      else setError(m);
    } finally {
      setSaving(false);
    }
  }

  const preview = { ...(product ?? {}), name: f.name, category: f.category, imageUrl: f.imageUrl } as Product;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative flex h-full w-full max-w-lg flex-col border-l border-graphite bg-ink"
      >
        <div className="flex items-center justify-between border-b border-graphite px-6 py-5">
          <h2 className="font-serif text-2xl">{product ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="text-2xl text-ivory/60 hover:text-champagne" aria-label="Close">×</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div className="flex gap-4">
            <div className="relative h-36 w-28 shrink-0 overflow-hidden bg-graphite">
              <ProductImage product={preview} sizes="112px" />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/70 text-xs">Uploading…</div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="btn-outline cursor-pointer">
                {f.imageUrl ? "Replace photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {f.imageUrl && (
                <button
                  type="button"
                  onClick={() => setF((s) => ({ ...s, imageUrl: undefined, imagePublicId: undefined }))}
                  className="text-left text-xs tracking-[0.15em] text-ivory/50 uppercase hover:text-champagne"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-ivory/40">Portrait images (4:5) look best.</p>
            </div>
          </div>

          <Field label="Name">
            <input required value={f.name} onChange={(e) => set("name", e.target.value)} className="field" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₦)">
              <input
                required
                type="number"
                min={0}
                step={50}
                value={f.price}
                onChange={(e) => set("price", e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Status">
              <Select value={f.inStock ? "in" : "out"} onValueChange={(v) => set("inStock", v === "in")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">In stock</SelectItem>
                  <SelectItem value="out">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={f.category} onValueChange={(v) => set("category", v as FormState["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="For">
              <Select value={f.gender} onValueChange={(v) => set("gender", v as FormState["gender"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Scent notes (optional)">
            <input
              value={f.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Rose · Saffron · Amber"
              className="field"
            />
          </Field>

          <Field label="Description">
            <textarea
              required
              rows={4}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              className="field resize-y"
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-[0.65rem] tracking-[0.2em] text-ivory/60 uppercase">Collections</span>
            <div className="flex flex-wrap gap-2">
              {COLLECTIONS.map((c) => {
                const on = f.tags.includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() =>
                      set("tags", on ? f.tags.filter((t) => t !== c.value) : [...f.tags, c.value])
                    }
                    className={`border px-3 py-1.5 text-[0.65rem] tracking-[0.15em] uppercase ${
                      on ? "border-champagne bg-champagne text-ink" : "border-graphite text-ivory/70 hover:border-champagne"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-graphite px-6 py-5">
          <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
          <button disabled={saving || uploading} className="btn-gold flex-1">
            {saving ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.65rem] tracking-[0.2em] text-ivory/60 uppercase">{label}</span>
      {children}
    </label>
  );
}
