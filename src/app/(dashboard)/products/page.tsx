'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MagnifyingGlass, PencilSimple, Plus, Trash, X } from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { useTenant } from '@/context/TenantContext';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import styles from './page.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  label: string;
  price: number;
  inStock: boolean;
  sku: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  variants: ProductVariant[];
  imageUrl: string;
  tags: string[];
  active: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priceRange(variants: ProductVariant[]): string {
  if (!variants.length) return '—';
  const prices = variants.map(v => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

// ─── Product card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  tenantId: string;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

type DeleteState = 'idle' | 'confirming' | 'deleting';

function ProductCard({ product, tenantId, onEdit, onDelete }: ProductCardProps) {
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
  const [deleteError, setDeleteError] = useState('');

  async function handleConfirmDelete() {
    setDeleteState('deleting');
    setDeleteError('');
    try {
      await api.del(`products/${product._id}?tenantId=${encodeURIComponent(tenantId)}`);
      onDelete(product._id);
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Delete failed');
      setDeleteState('confirming');
    }
  }

  return (
    <div className={clsx(styles.card, !product.active && styles.cardInactive)}>
      <div className={styles.cardTop}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.cardName}>{product.name}</div>
          {product.category && (
            <div className={styles.cardCategory}>{product.category}</div>
          )}
        </div>
        <div className={styles.cardPrice}>{priceRange(product.variants)}</div>
      </div>

      {product.variants.length > 0 && (
        <div className={styles.cardVariants}>
          {product.variants.map((v, i) => (
            <div key={i} className={styles.variantRow}>
              <span className={styles.variantLabel}>{v.label}</span>
              <span className={styles.variantPrice}>{formatCurrency(v.price)}</span>
              {!v.inStock && <span className={styles.variantOos}>Out of stock</span>}
            </div>
          ))}
        </div>
      )}

      {product.tags.length > 0 && (
        <div className={styles.cardTags}>
          {product.tags.slice(0, 4).map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* ── Bottom row: badge + actions ──────────────────────────────────── */}
      <div className={styles.cardFooter}>
        <Badge color={product.active ? 'green' : 'neutral'}>
          {product.active ? 'Active' : 'Inactive'}
        </Badge>

        {deleteState === 'idle' ? (
          <div className={styles.cardActions}>
            <button
              className={styles.cardActionBtn}
              onClick={onEdit}
              aria-label="Edit product"
              title="Edit"
            >
              <PencilSimple size={13} />
            </button>
            <button
              className={clsx(styles.cardActionBtn, styles.cardActionBtnDanger)}
              onClick={() => setDeleteState('confirming')}
              aria-label="Delete product"
              title="Delete"
            >
              <Trash size={13} />
            </button>
          </div>
        ) : (
          <div className={styles.deleteConfirm}>
            {deleteError && <span className={styles.deleteError}>{deleteError}</span>}
            <span className={styles.deleteConfirmLabel}>Delete?</span>
            <button
              className={styles.cardActionBtn}
              onClick={() => { setDeleteState('idle'); setDeleteError(''); }}
              disabled={deleteState === 'deleting'}
              aria-label="Cancel delete"
            >
              <X size={12} />
            </button>
            <button
              className={clsx(styles.cardActionBtn, styles.cardActionBtnConfirm)}
              onClick={handleConfirmDelete}
              disabled={deleteState === 'deleting'}
              aria-label="Confirm delete"
            >
              {deleteState === 'deleting' ? '…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product modal (add + edit) ───────────────────────────────────────────────

interface VariantForm {
  label: string;
  price: string;
  inStock: boolean;
  sku: string;
}

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  tags: string;
  active: boolean;
  variants: VariantForm[];
}

function productToForm(p: Product): ProductFormState {
  return {
    name: p.name,
    description: p.description,
    category: p.category,
    tags: p.tags.join(', '),
    active: p.active,
    variants: p.variants.length
      ? p.variants.map(v => ({ label: v.label, price: String(v.price), inStock: v.inStock, sku: v.sku }))
      : [{ label: 'Default', price: '', inStock: true, sku: '' }],
  };
}

const EMPTY_FORM: ProductFormState = {
  name: '', description: '', category: '', tags: '', active: true,
  variants: [{ label: 'Default', price: '', inStock: true, sku: '' }],
};

interface ProductModalProps {
  tenantId: string;
  product?: Product;
  onClose: () => void;
  onSaved: (p: Product, isEdit: boolean) => void;
}

function ProductModal({ tenantId, product, onClose, onSaved }: ProductModalProps) {
  const isEdit = !!product;
  const [form, setForm] = useState<ProductFormState>(
    isEdit ? productToForm(product!) : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function setField<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function setVariant(i: number, key: keyof VariantForm, value: string | boolean) {
    setForm(f => ({
      ...f,
      variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v),
    }));
  }

  function addVariant() {
    setForm(f => ({ ...f, variants: [...f.variants, { label: '', price: '', inStock: true, sku: '' }] }));
  }

  function removeVariant(i: number) {
    setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Product name is required.'); return; }
    if (!form.variants.length) { setError('Add at least one variant with a price.'); return; }
    for (const v of form.variants) {
      if (!v.label.trim()) { setError('Each variant needs a label.'); return; }
      const p = Number(v.price);
      if (!v.price || isNaN(p) || p < 0) { setError(`Price for "${v.label || 'variant'}" is invalid.`); return; }
    }

    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: form.active,
      variants: form.variants.map(v => ({
        label: v.label.trim(),
        price: Number(v.price),
        inStock: v.inStock,
        sku: v.sku.trim(),
      })),
    };

    try {
      if (isEdit) {
        const data = await api.patch<{ product: Product }>(
          `products/${product!._id}?tenantId=${encodeURIComponent(tenantId)}`,
          payload,
        );
        onSaved(data.product, true);
      } else {
        await api.post<{ inserted: number }>(`tenants/${tenantId}/products`, { products: [payload] });
        onSaved({ ...payload, _id: `temp_${Date.now()}`, imageUrl: '' }, false);
      }
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit product' : 'Add product'}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className={styles.modalTitle}>{isEdit ? 'Edit Product' : 'Add Product'}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {/* Name */}
            <div className={clsx(styles.formField, styles.formFieldFull)}>
              <label className={styles.formLabel}>Product name *</label>
              <input
                ref={nameRef}
                className={styles.formInput}
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Silk Kurta"
                required
              />
            </div>

            {/* Category */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Category</label>
              <input
                className={styles.formInput}
                value={form.category}
                onChange={e => setField('category', e.target.value)}
                placeholder="e.g. Ethnic wear"
              />
            </div>

            {/* Tags */}
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tags (comma-separated)</label>
              <input
                className={styles.formInput}
                value={form.tags}
                onChange={e => setField('tags', e.target.value)}
                placeholder="cotton, summer, XL"
              />
            </div>

            {/* Description */}
            <div className={clsx(styles.formField, styles.formFieldFull)}>
              <label className={styles.formLabel}>Description</label>
              <input
                className={styles.formInput}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Brief product description"
              />
            </div>

            {/* Active toggle */}
            {isEdit && (
              <div className={clsx(styles.formField, styles.formFieldFull)}>
                <label className={styles.formLabel}>Status</label>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setField('active', e.target.checked)}
                  />
                  <span>{form.active ? 'Active' : 'Inactive'}</span>
                </label>
              </div>
            )}

            {/* Variants */}
            <div className={clsx(styles.formField, styles.formFieldFull)}>
              <label className={styles.formLabel}>Variants *</label>
              <div className={styles.variantList}>
                {form.variants.map((v, i) => (
                  <div key={i} className={styles.variantFormRow}>
                    <input
                      className={styles.formInput}
                      value={v.label}
                      onChange={e => setVariant(i, 'label', e.target.value)}
                      placeholder="Label (e.g. S / M / L)"
                      style={{ flex: 2 }}
                    />
                    <input
                      className={styles.formInput}
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price}
                      onChange={e => setVariant(i, 'price', e.target.value)}
                      placeholder="Price ₹"
                      style={{ flex: 1 }}
                    />
                    <label className={styles.inStockCheck} title="In stock">
                      <input
                        type="checkbox"
                        checked={v.inStock}
                        onChange={e => setVariant(i, 'inStock', e.target.checked)}
                      />
                      <span>Stock</span>
                    </label>
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeVariantBtn}
                        onClick={() => removeVariant(i)}
                        aria-label="Remove variant"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.addVariantBtn} onClick={addVariant}>
                  <Plus size={12} />
                  Add variant
                </button>
              </div>
            </div>
          </div>

          <div className={styles.modalActions} style={{ marginTop: 12 }}>
            {error && <span className={styles.formError}>{error}</span>}
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {isEdit ? 'Save changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [modalProduct, setModalProduct] = useState<Product | null | 'new'>(null);

  const fetchProducts = useCallback(async (tenantId: string) => {
    try {
      const data = await api.get<{ products: Product[] }>(
        `tenants/${tenantId}/products`,
        { limit: 100 },
      );
      setProducts(data.products);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeTenant) return;
    setLoading(true);
    fetchProducts(activeTenant._id);
  }, [activeTenant, fetchProducts]);

  const filtered = products.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  function handleSaved(saved: Product, isEdit: boolean) {
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === saved._id ? saved : p));
    } else {
      setProducts(prev => [saved, ...prev]);
    }
  }

  function handleDelete(id: string) {
    setProducts(prev => prev.filter(p => p._id !== id));
  }

  if (tenantLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>Pricing data the AI uses to answer customer enquiries</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalProduct('new')}>
          <Plus size={14} />
          Add Product
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <MagnifyingGlass size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name, category, or tag…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Badge color="neutral">{filtered.length} products</Badge>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {query ? `No products matching "${query}"` : 'No products yet. Add the first one.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(p => (
            <ProductCard
              key={p._id}
              product={p}
              tenantId={activeTenant!._id}
              onEdit={() => setModalProduct(p)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modalProduct !== null && activeTenant && (
        <ProductModal
          tenantId={activeTenant._id}
          product={modalProduct === 'new' ? undefined : modalProduct}
          onClose={() => setModalProduct(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
