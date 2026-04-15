import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ImageUploader from '@/components/ImageUploader';
import BackLink from '@/components/ui/back-link';
import { apiFetch, uploadFiles } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/media';
import { ListingPayload, MetadataItem } from '@/lib/types';
import { fuelTypeLabel, transmissionTypeLabel } from '@/lib/vehicle-labels';
import { useI18n } from '@/lib/i18n';

const initial: ListingPayload = {
  brandId: '', modelId: '', year: new Date().getFullYear(), price: 0, mileage: 0,
  fuelType: 'Gasoline', transmissionType: 'Manual', cityId: '', categoryId: '',
  title: '', description: '', phoneNumber: '', whatsAppNumber: ''
};

function toLocalPhone(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('261')) digits = digits.slice(3);
  digits = digits.replace(/^0+/, '');
  return digits;
}

function withCountryCode(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const local = toLocalPhone(raw);
  return local ? `+261${local}` : '';
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

export default function NewListingPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const currentUser = getCurrentUser();
  const isProfessional = currentUser?.accountType === 'Professional';
  const [form, setForm] = useState<ListingPayload>(initial);
  const [brands, setBrands] = useState<MetadataItem[]>([]);
  const [models, setModels] = useState<MetadataItem[]>([]);
  const [cities, setCities] = useState<MetadataItem[]>([]);
  const [categories, setCategories] = useState<MetadataItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'Seller') router.replace('/login');

    const defaultPhone = toLocalPhone(user?.phoneNumber);
    const defaultWhatsApp = toLocalPhone(user?.whatsAppNumber);
    if (defaultPhone || defaultWhatsApp) {
      setForm((prev) => ({
        ...prev,
        phoneNumber: prev.phoneNumber || defaultPhone,
        whatsAppNumber: prev.whatsAppNumber || defaultWhatsApp
      }));
    }

    const loadFallbackSellerContacts = async () => {
      if (defaultPhone || defaultWhatsApp) return;
      try {
        const result = await apiFetch<any>('/api/seller/listings?page=1&pageSize=1', {}, true);
        const latestId = result?.items?.[0]?.id;
        if (!latestId) return;
        const latest = await apiFetch<any>(`/api/seller/listings/${latestId}`, {}, true);
        const latestPhone = toLocalPhone(latest?.phoneNumber || latest?.seller?.phoneNumber);
        const latestWhatsApp = toLocalPhone(latest?.whatsAppNumber || latest?.seller?.whatsAppNumber);
        if (!latestPhone && !latestWhatsApp) return;
        setForm((prev) => ({
          ...prev,
          phoneNumber: prev.phoneNumber || latestPhone,
          whatsAppNumber: prev.whatsAppNumber || latestWhatsApp
        }));
      } catch {
        // Pas bloquant: l’utilisateur peut saisir ses coordonnées manuellement.
      }
    };

    loadFallbackSellerContacts();

    apiFetch<MetadataItem[]>('/api/metadata/brands').then(setBrands).catch(() => setBrands([]));
    apiFetch<MetadataItem[]>('/api/metadata/cities').then(setCities).catch(() => setCities([]));
    apiFetch<MetadataItem[]>('/api/metadata/categories').then(setCategories).catch(() => setCategories([]));
  }, [router]);

  useEffect(() => {
    if (!form.brandId) return;
    apiFetch<MetadataItem[]>(`/api/metadata/brands/${form.brandId}/models`).then(setModels).catch(() => setModels([]));
  }, [form.brandId]);

  const set = (k: keyof ListingPayload, v: any) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const phoneNumber = withCountryCode(form.phoneNumber);
      const whatsAppNumber = withCountryCode(form.whatsAppNumber);
      const payload = {
        ...form,
        phoneNumber,
        whatsAppNumber: whatsAppNumber || undefined,
        fuelType: fuelTypeToApi(form.fuelType),
        transmissionType: transmissionTypeToApi(form.transmissionType)
      };

      const created = await apiFetch<any>('/api/seller/listings', { method: 'POST', body: JSON.stringify(payload) }, true);
      if (files.length > 0) await uploadFiles(`/api/seller/listings/${created.id}/images`, files);
      if (isProfessional) {
        router.push(`/dashboard/listings/${created.id}?notice=created`);
      } else {
        try {
          const payRes = await apiFetch<any>('/api/seller/payments/initiate-listing', {
            method: 'POST',
            body: JSON.stringify({ listingId: created.id })
          }, true);
          const payment = payRes?.data || payRes;
          const paymentId = payment?.id || payment?.Id;
          if (paymentId) {
            router.push(`/dashboard/payments/${paymentId}`);
            return;
          }
        } catch {
          // fallback ci-dessous si l’initiation paiement échoue
        }
        router.push(`/dashboard/listings/${created.id}?notice=created`);
      }
    } catch (e: any) {
      setError(e?.message || "Impossible de créer l’annonce.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <BackLink href="/dashboard" />
      <h1 className="text-2xl font-bold">{tr('Nouvelle annonce', 'Filazana vaovao')}</h1>
      <section className="listingPricingBanner" aria-label="Tarification publication">
        <p className="listingPricingTitle">
          {isProfessional ? 'Compte professionnel (abonnement mensuel)' : '20 000 MGA par annonce'}
        </p>
        <p className="listingPricingText">
          {isProfessional
            ? 'Votre compte est professionnel: la mise en ligne necessite un abonnement mensuel actif.'
            : 'Paiement uniquement quand vous mettez une annonce en ligne. Aucun abonnement mensuel.'}
        </p>
      </section>
      <form className="card cardBody grid" onSubmit={submit}>
        {error && <p className="sellerNotice sellerNoticeError">{error}</p>}
        {(brands.length === 0 || cities.length === 0 || categories.length === 0) && (
          <p className="sellerNotice sellerNoticeInfo">
            Certaines données de référence sont vides. Vérifie les métadonnées (marques, villes, catégories).
          </p>
        )}
        <div className="formGrid">
          <div className="formField">
            <label className="formLabel" htmlFor="listing-title">Titre</label>
            <input id="listing-title" value={form.title} onChange={e => set('title', e.target.value)} required disabled={saving} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-year">Année</label>
            <input id="listing-year" type="number" value={form.year} onChange={e => set('year', Number(e.target.value))} required disabled={saving} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-price">Prix (Ar)</label>
            <input id="listing-price" type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} required disabled={saving} />
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-mileage">Kilométrage</label>
            <input id="listing-mileage" type="number" value={form.mileage} onChange={e => set('mileage', Number(e.target.value))} required disabled={saving} />
          </div>
          <div className="formField formFieldWide">
            <label className="formLabel" htmlFor="listing-phone">Téléphone</label>
            <div className="phoneWithCode">
              <input className="phoneWithCodePrefix" value="+261" readOnly aria-label="Indicatif pays téléphone" />
              <input
                className="phoneWithCodeValue"
                id="listing-phone"
                value={form.phoneNumber}
                onChange={e => set('phoneNumber', e.target.value)}
                autoComplete="tel-national"
                inputMode="numeric"
                placeholder="Ex: 34 12 345 67"
                required
                disabled={saving}
              />
            </div>
          </div>
          <div className="formField formFieldWide">
            <label className="formLabel" htmlFor="listing-whatsapp">WhatsApp</label>
            <div className="phoneWithCode">
              <input className="phoneWithCodePrefix" value="+261" readOnly aria-label="Indicatif pays WhatsApp" />
              <input
                className="phoneWithCodeValue"
                id="listing-whatsapp"
                value={form.whatsAppNumber || ''}
                onChange={e => set('whatsAppNumber', e.target.value)}
                autoComplete="tel-national"
                inputMode="numeric"
                placeholder="Ex: 34 12 345 67"
                disabled={saving}
              />
            </div>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-brand">Marque</label>
            <select id="listing-brand" value={form.brandId} onChange={e => set('brandId', e.target.value)} required disabled={saving}>
              <option value="">Sélectionner</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-model">Modèle</label>
            <select id="listing-model" value={form.modelId} onChange={e => set('modelId', e.target.value)} required disabled={saving}>
              <option value="">Sélectionner</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-city">Ville</label>
            <select id="listing-city" value={form.cityId} onChange={e => set('cityId', e.target.value)} required disabled={saving}>
              <option value="">Sélectionner</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-category">Catégorie</label>
            <select id="listing-category" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required disabled={saving}>
              <option value="">Sélectionner</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-fuel">Carburant</label>
            <select id="listing-fuel" value={form.fuelType} onChange={e => set('fuelType', e.target.value)} disabled={saving}>
              <option value="Gasoline">{fuelTypeLabel('Gasoline', lang)}</option>
              <option value="Diesel">{fuelTypeLabel('Diesel', lang)}</option>
              <option value="Hybrid">{fuelTypeLabel('Hybrid', lang)}</option>
              <option value="Electric">{fuelTypeLabel('Electric', lang)}</option>
            </select>
          </div>
          <div className="formField">
            <label className="formLabel" htmlFor="listing-transmission">Transmission</label>
            <select id="listing-transmission" value={form.transmissionType} onChange={e => set('transmissionType', e.target.value)} disabled={saving}>
              <option value="Manual">{transmissionTypeLabel('Manual', lang)}</option>
              <option value="Automatic">{transmissionTypeLabel('Automatic', lang)}</option>
            </select>
          </div>
        </div>
        <div className="formField">
          <label className="formLabel" htmlFor="listing-description">Description</label>
          <textarea id="listing-description" value={form.description} onChange={e => set('description', e.target.value)} required disabled={saving} />
        </div>
        <ImageUploader onSelect={setFiles} />
        {previewUrls.length > 0 && (
          <div className="listingImagesPreview">
            <p className="listingImagesPreviewTitle">Nouvelles photos</p>
            <div className="listingImagesGrid">
              {previewUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="listingImageThumb">
                  <img src={resolveMediaUrl(url)} alt={`Nouvelle photo ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="primaryBtn" type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Mettre en ligne'}
        </button>
      </form>
    </div>
  );
}

