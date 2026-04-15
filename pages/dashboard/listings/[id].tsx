import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ImageUploader from '@/components/ImageUploader';
import BackLink from '@/components/ui/back-link';
import { apiFetch, uploadFiles } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/media';
import { ListingPayload, MetadataItem } from '@/lib/types';
import { fuelTypeLabel, transmissionTypeLabel } from '@/lib/vehicle-labels';
import { listingStatusLabel } from '@/lib/ui-labels';
import { useI18n } from '@/lib/i18n';

const initial: ListingPayload = {
  brandId: '',
  modelId: '',
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  fuelType: 'Gasoline',
  transmissionType: 'Manual',
  cityId: '',
  categoryId: '',
  title: '',
  description: '',
  phoneNumber: ''
};

type ListingUiStatus = 'Draft' | 'Published' | 'Approved' | 'Rejected' | 'Archived' | 'Sold' | 'Unknown';

function toId(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return String(value.id || value.value || '');
  return '';
}

function fuelTypeFromApi(value: any): ListingPayload['fuelType'] {
  if (value === 'Diesel' || value === 2) return 'Diesel';
  if (value === 'Hybrid' || value === 3) return 'Hybrid';
  if (value === 'Electric' || value === 4) return 'Electric';
  return 'Gasoline';
}

function transmissionTypeFromApi(value: any): ListingPayload['transmissionType'] {
  if (value === 'Automatic' || value === 2) return 'Automatic';
  return 'Manual';
}

function fuelTypeToApi(value: ListingPayload['fuelType']): number {
  switch (value) {
    case 'Diesel': return 2;
    case 'Hybrid': return 3;
    case 'Electric': return 4;
    case 'Gasoline':
    default:
      return 1;
  }
}

function transmissionTypeToApi(value: ListingPayload['transmissionType']): number {
  switch (value) {
    case 'Automatic': return 2;
    case 'Manual':
    default:
      return 1;
  }
}

function toPayload(data: any): ListingPayload {
  return {
    brandId: toId(data.brandId || data.brand),
    modelId: toId(data.modelId || data.model),
    year: Number(data.year || initial.year),
    price: Number(data.price || 0),
    mileage: Number(data.mileage || 0),
    fuelType: fuelTypeFromApi(data.fuelType),
    transmissionType: transmissionTypeFromApi(data.transmissionType),
    cityId: toId(data.cityId || data.city),
    categoryId: toId(data.categoryId || data.category),
    title: data.title || '',
    description: data.description || '',
    engineSize: data.engineSize || '',
    color: data.color || '',
    doors: data.doors ? Number(data.doors) : undefined,
    condition: data.condition || '',
    phoneNumber: data.phoneNumber || data.seller?.phoneNumber || '',
    whatsAppNumber: data.whatsAppNumber || data.seller?.whatsAppNumber || ''
  };
}

function toImageUrls(data: any): string[] {
  const raw = Array.isArray(data?.images) ? data.images : [];
  return raw
    .map((x: any) => resolveMediaUrl(x?.url || x?.Url || ''))
    .filter((x: string) => !!x);
}

function toStatus(value: any): ListingUiStatus {
  if (value === 'Draft' || value === 1) return 'Draft';
  if (value === 'Published' || value === 'Approved' || value === 3) return 'Published';
  if (value === 'Rejected' || value === 4) return 'Rejected';
  if (value === 'Archived' || value === 5) return 'Archived';
  if (value === 'Sold' || value === 6) return 'Sold';
  return 'Unknown';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt);
}

export default function EditListingPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState<ListingPayload>(initial);
  const [brands, setBrands] = useState<MetadataItem[]>([]);
  const [models, setModels] = useState<MetadataItem[]>([]);
  const [cities, setCities] = useState<MetadataItem[]>([]);
  const [categories, setCatégories] = useState<MetadataItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [listingStatus, setListingStatus] = useState<ListingUiStatus>('Unknown');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [listingMeta, setListingMeta] = useState<{ createdAt?: string; updatedAt?: string; publishedAt?: string }>({});
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'Seller') {
      router.replace('/login');
      return;
    }

    apiFetch<MetadataItem[]>('/api/metadata/brands').then(setBrands).catch(() => setBrands([]));
    apiFetch<MetadataItem[]>('/api/metadata/cities').then(setCities).catch(() => setCities([]));
    apiFetch<MetadataItem[]>('/api/metadata/categories').then(setCatégories).catch(() => setCatégories([]));
  }, [router]);

  const loadListing = async (listingId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<any>(`/api/seller/listings/${listingId}`, {}, true);
      setForm(toPayload(data));
      setExistingImages(toImageUrls(data));
      setListingStatus(toStatus(data?.status));
      setRejectionReason(String(data?.rejectionReason || '').trim());
      setListingMeta({
        createdAt: data?.createdAt,
        updatedAt: data?.updatedAt,
        publishedAt: data?.publishedAt
      });
      setFiles([]);
    } catch (e: any) {
      setError(e?.message || "Impossible de charger l’annonce");
      setNotice({ tone: 'error', text: e?.message || "Impossible de charger l’annonce" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    loadListing(id);
  }, [id]);

  useEffect(() => {
    if (!form.brandId) {
      setModels([]);
      return;
    }
    apiFetch<MetadataItem[]>(`/api/metadata/brands/${form.brandId}/models`)
      .then(setModels)
      .catch(() => setModels([]));
  }, [form.brandId]);

  const set = (k: keyof ListingPayload, v: any) => setForm(p => ({ ...p, [k]: v }));
  const isReadonlyStatus = listingStatus === 'Sold' || listingStatus === 'Archived';
  const canMarkSold = listingStatus === 'Published' || listingStatus === 'Approved';
  const canRelist = listingStatus === 'Sold' || listingStatus === 'Archived';

  const runStatusAction = async (action: 'mark-sold' | 'submit') => {
    if (!id || typeof id !== 'string') return;
    const confirmText = action === 'mark-sold'
      ? 'Marquer cette annonce comme vendue ?'
      : 'Remettre cette annonce en ligne ?';
    if (!window.confirm(confirmText)) return;

    setSaving(true);
    setError('');
    setNotice(null);
    try {
      await apiFetch(`/api/seller/listings/${id}/${action}`, { method: 'POST' }, true);
      await loadListing(id);
      setNotice({
        tone: 'success',
        text: action === 'mark-sold' ? 'Annonce marquée comme vendue.' : 'Annonce publiée.'
      });
    } catch (e: any) {
      setError(e?.message || 'Opération impossible.');
      setNotice({ tone: 'error', text: e?.message || 'Opération impossible.' });
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || typeof id !== 'string') return;

    const payload = {
      ...form,
      fuelType: fuelTypeToApi(form.fuelType),
      transmissionType: transmissionTypeToApi(form.transmissionType)
    };

    setSaving(true);
    setError('');
    setNotice(null);
    try {
      await apiFetch(`/api/seller/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }, true);
      if (files.length > 0) {
        await uploadFiles(`/api/seller/listings/${id}/images`, files);
      }
      router.push('/dashboard?notice=updated');
    } catch (e: any) {
      setError(e?.message || "Impossible d’enregistrer les modifications");
      setNotice({ tone: 'error', text: e?.message || "Impossible d’enregistrer les modifications" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="muted">Chargement...</p>;

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <BackLink href="/dashboard" />
      <div className="listingEditHeader">
        <h1 className="text-2xl font-bold">{tr("Détails de l’annonce", "Antsipirian’ny filazana")}</h1>
        <p className={`listingStatusPill status-${listingStatus.toLowerCase()}`}>{tr('Statut', 'Sata')}: {listingStatusLabel(listingStatus, lang)}</p>
      </div>
      <form className="card cardBody grid" onSubmit={submit}>
        {notice && (
          <p className={`sellerNotice ${notice.tone === 'success' ? 'sellerNoticeSuccess' : notice.tone === 'error' ? 'sellerNoticeError' : 'sellerNoticeInfo'}`}>
            {notice.text}
          </p>
        )}
        <div className="sellerTrustPanel">
          <h3>Statut et traçabilité</h3>
          <p>Référence annonce: {(typeof id === 'string' ? id : '').slice(0, 8).toUpperCase() || '-'}</p>
          <p>Création: {formatDate(listingMeta.createdAt)}</p>
          <p>Dernière mise à jour: {formatDate(listingMeta.updatedAt || listingMeta.createdAt)}</p>
          <p>Dernière publication: {formatDate(listingMeta.publishedAt)}</p>
        </div>
        {isReadonlyStatus && (
          <p className="muted">
            Cette annonce n’est pas modifiable quand elle est vendue ou archivée. Utilise les actions disponibles ci-dessous.
          </p>
        )}
        <div className="formGrid">
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-title">Titre</label>
            <input id="edit-listing-title" value={form.title} onChange={e => set('title', e.target.value)} required disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-year">Année</label>
            <input id="edit-listing-year" type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} required disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-price">Prix (Ar)</label>
            <input id="edit-listing-price" type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} required disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-mileage">Kilométrage</label>
            <input id="edit-listing-mileage" type="number" value={form.mileage} onChange={e => set('mileage', Number(e.target.value))} required disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-phone">Téléphone</label>
            <input id="edit-listing-phone" value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} required disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-whatsapp">WhatsApp</label>
            <input id="edit-listing-whatsapp" value={form.whatsAppNumber || ''} onChange={e => set('whatsAppNumber', e.target.value)} disabled={saving || isReadonlyStatus} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-brand">Marque</label>
            <select id="edit-listing-brand" value={form.brandId} onChange={e => set('brandId', e.target.value)} required disabled={saving || isReadonlyStatus}>
              <option value="">Sélectionner</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-model">Modèle</label>
            <select id="edit-listing-model" value={form.modelId} onChange={e => set('modelId', e.target.value)} required disabled={saving || isReadonlyStatus}>
              <option value="">Sélectionner</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-city">Ville</label>
            <select id="edit-listing-city" value={form.cityId} onChange={e => set('cityId', e.target.value)} required disabled={saving || isReadonlyStatus}>
              <option value="">Sélectionner</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-category">Catégorie</label>
            <select id="edit-listing-category" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required disabled={saving || isReadonlyStatus}>
              <option value="">Sélectionner</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-fuel">Carburant</label>
            <select id="edit-listing-fuel" value={form.fuelType} onChange={e => set('fuelType', e.target.value)} disabled={saving || isReadonlyStatus}>
              <option value="Gasoline">{fuelTypeLabel('Gasoline', lang)}</option>
              <option value="Diesel">{fuelTypeLabel('Diesel', lang)}</option>
              <option value="Hybrid">{fuelTypeLabel('Hybrid', lang)}</option>
              <option value="Electric">{fuelTypeLabel('Electric', lang)}</option>
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="edit-listing-transmission">Transmission</label>
            <select id="edit-listing-transmission" value={form.transmissionType} onChange={e => set('transmissionType', e.target.value)} disabled={saving || isReadonlyStatus}>
              <option value="Manual">{transmissionTypeLabel('Manual', lang)}</option>
              <option value="Automatic">{transmissionTypeLabel('Automatic', lang)}</option>
            </select>
          </div>
        </div>
        <div className="formField">
          <label className="formLabel" htmlFor="edit-listing-description">Description</label>
          <textarea id="edit-listing-description" value={form.description} onChange={e => set('description', e.target.value)} required disabled={saving || isReadonlyStatus} />
        </div>
        {listingStatus === 'Rejected' && rejectionReason && (
          <div className="sellerRejectBox">
            <p><strong>Motif de rejet</strong></p>
            <p className="muted">{rejectionReason}</p>
          </div>
        )}
        {existingImages.length > 0 ? (
          <div className="listingImagesPreview">
            <p className="listingImagesPreviewTitle">Photos actuelles</p>
            <div className="listingImagesGrid listingImagesGridLarge">
              {existingImages.map((url, idx) => (
                <div key={`${url}-${idx}`} className="listingImageThumb listingImageThumbLarge">
                  <a href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Photo actuelle ${idx + 1}`} loading="lazy" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="sellerNotice sellerNoticeInfo">Aucune photo actuelle pour cette annonce.</p>
        )}
        {!isReadonlyStatus && <ImageUploader onSelect={setFiles} />}
        {previewUrls.length > 0 && (
          <div className="listingImagesPreview">
            <p className="listingImagesPreviewTitle">Nouvelles photos à ajouter</p>
            <div className="listingImagesGrid listingImagesGridLarge">
              {previewUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="listingImageThumb listingImageThumbLarge">
                  <a href={resolveMediaUrl(url)} target="_blank" rel="noreferrer">
                    <img src={resolveMediaUrl(url)} alt={`Nouvelle photo ${idx + 1}`} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p style={{ color: '#a82424' }}>{error}</p>}
        {isReadonlyStatus ? (
          <div className="inlineActions">
            {canMarkSold && (
              <button type="button" className="primaryBtn" onClick={() => runStatusAction('mark-sold')} disabled={saving}>
                {saving ? 'Traitement...' : 'Marquer vendu'}
              </button>
            )}
            {canRelist && (
              <button type="button" className="ghostBtn" onClick={() => runStatusAction('submit')} disabled={saving}>
                {saving ? 'Traitement...' : 'Remettre en ligne'}
              </button>
            )}
          </div>
        ) : (
          <div className="inlineActions">
            <button className="primaryBtn" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

