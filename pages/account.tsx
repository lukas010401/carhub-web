import Link from 'next/link';
import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BackLink from '@/components/ui/back-link';
import { getCurrentUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import { JwtUser } from '@/lib/types';
import { roleLabel } from '@/lib/ui-labels';
import { useI18n } from '@/lib/i18n';

function formatDisplayNameFromEmail(email?: string): string {
  const raw = String(email || '').trim();
  if (!raw.includes('@')) return raw || '-';
  const local = raw.split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return raw;
  return local
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatPhone(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  if (raw.startsWith('+261')) return raw;
  if (/^\d+$/.test(raw)) return `+261${raw.replace(/^0+/, '')}`;
  return raw;
}

function getInitials(name?: string, email?: string): string {
  const source = String(name || '').trim() || formatDisplayNameFromEmail(email);
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function AccountPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<JwtUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [cropSource, setCropSource] = useState<{ dataUrl: string; fileName: string; type: string } | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);

  useEffect(() => {
    const current = getCurrentUser();
    if (!current) {
      router.replace('/login');
      return;
    }
    setUser({
      ...current,
      fullName: current.fullName || formatDisplayNameFromEmail(current.email)
    });

    const loadProfile = async () => {
      try {
        const profile = await apiFetch<any>('/api/auth/me', {}, true);
        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fullName: String(profile?.fullName || '').trim() || prev.fullName || formatDisplayNameFromEmail(prev.email),
            phoneNumber: String(profile?.phoneNumber || '').trim() || prev.phoneNumber,
            whatsAppNumber: String(profile?.whatsAppNumber || profile?.whatsappNumber || '').trim() || prev.whatsAppNumber,
            profileImageUrl: String(profile?.profileImageUrl || '').trim() || prev.profileImageUrl,
            accountType: String(profile?.accountType || profile?.account_type || '').trim() || prev.accountType
          };
        });
      } catch {
        // Pas bloquant: on garde les données du token.
      }
    };

    loadProfile();
  }, [router]);

  if (!user) return <p className="muted">{tr('Chargement...', 'Mampiditra...')}</p>;
  const profileImageSrc = resolveMediaUrl(user.profileImageUrl);
  const initials = getInitials(user.fullName, user.email);
  const isProfessionalSeller = user.role === 'Seller' && String(user.accountType || '').toLowerCase() === 'professional';

  const onUploadProfileImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Lecture fichier impossible.'));
        reader.readAsDataURL(file);
      });
      setCropSource({ dataUrl, fileName: file.name, type: file.type || 'image/jpeg' });
      setCropZoom(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
    } catch (err: any) {
      setUploadError(err?.message || "Impossible de préparer l’image.");
    }
  };

  const closeCropper = () => {
    if (uploading) return;
    setCropSource(null);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  };

  const confirmCropAndUpload = async () => {
    if (!cropSource) return;
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Chargement image impossible.'));
        el.src = cropSource.dataUrl;
      });

      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponible.');

      const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
      const scale = baseScale * cropZoom;
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const baseX = (size - drawW) / 2;
      const baseY = (size - drawH) / 2;
      const maxShiftX = Math.max(0, (drawW - size) / 2);
      const maxShiftY = Math.max(0, (drawH - size) / 2);
      const drawX = baseX + cropOffsetX * maxShiftX;
      const drawY = baseY + cropOffsetY * maxShiftY;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Export image impossible.'));
        }, 'image/jpeg', 0.92);
      });

      const ext = cropSource.fileName.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
      const uploadFile = new File([blob], `profile_${Date.now()}.${ext}`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', uploadFile);

      const response = await apiFetch<{ profileImageUrl?: string }>('/api/auth/profile-image', { method: 'POST', body: formData }, true);
      const nextUrl = String(response?.profileImageUrl || '').trim();
      if (nextUrl) {
        setUser((prev) => (prev ? { ...prev, profileImageUrl: nextUrl } : prev));
      }
      setUploadSuccess('Photo de profil mise à jour.');
      closeCropper();
    } catch (err: any) {
      setUploadError(err?.message || "Impossible de rogner et téléverser l’image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="grid" style={{ gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <BackLink href="/" />

      <header className="card cardBody grid" style={{ gap: '0.4rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Mon compte', 'Kaontiko')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr('Consultez vos informations de compte et vos accès rapides.', 'Jereo ny mombamomba ny kaontinao sy ny fidirana haingana.')}
        </p>
        <div className="accountProfileHeader">
          {profileImageSrc ? (
            <img src={profileImageSrc} alt={`Photo de profil ${user.fullName || user.email}`} className="accountAvatarImg" />
          ) : (
            <div className="accountAvatarFallback" aria-label={`Initiales ${initials}`}>{initials}</div>
          )}
          <div className="grid" style={{ gap: '0.3rem' }}>
            <div className="accountNameRow">
              <p style={{ margin: 0, fontWeight: 700, color: '#173b6d' }}>
                {user.fullName || formatDisplayNameFromEmail(user.email)}
              </p>
                {isProfessionalSeller && (
                  <span className="accountProfessionalBadge">
                    {tr('⭐ PRO', '⭐ PRO')}
                  </span>
                )}
            </div>
            <label className="ghostBtn" style={{ width: 'fit-content', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
              {uploading ? tr('Téléversement...', 'Mampakatra...') : tr('Changer ma photo', 'Hanova ny sariko')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onUploadProfileImage}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
        {uploadError && <p className="sellerNotice sellerNoticeError" style={{ margin: 0 }}>{uploadError}</p>}
        {uploadSuccess && <p className="sellerNotice sellerNoticeSuccess" style={{ margin: 0 }}>{uploadSuccess}</p>}
      </header>

      {cropSource && (
        <section className="card cardBody grid" style={{ gap: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>{tr('Recadrer la photo de profil', 'Hanitsy ny sarin’ny profil')}</h2>
          <div className="accountCropStage">
            <img
              src={cropSource.dataUrl}
              alt="Aperçu recadrage profil"
              className="accountCropImage"
              style={{ transform: `translate(${cropOffsetX * 50}%, ${cropOffsetY * 50}%) scale(${cropZoom})` }}
            />
          </div>

          <div className="grid" style={{ gap: '0.55rem' }}>
            <label className="formLabel" htmlFor="crop-zoom">{tr('Zoom', 'Zoom')}</label>
            <input id="crop-zoom" type="range" min={100} max={300} step={1} value={Math.round(cropZoom * 100)} onChange={(e) => setCropZoom(Number(e.target.value) / 100)} />

            <label className="formLabel" htmlFor="crop-x">{tr('Déplacement horizontal', 'Fihetsika mitsivalana')}</label>
            <input id="crop-x" type="range" min={-100} max={100} step={1} value={Math.round(cropOffsetX * 100)} onChange={(e) => setCropOffsetX(Number(e.target.value) / 100)} />

            <label className="formLabel" htmlFor="crop-y">{tr('Déplacement vertical', 'Fihetsika mitsangana')}</label>
            <input id="crop-y" type="range" min={-100} max={100} step={1} value={Math.round(cropOffsetY * 100)} onChange={(e) => setCropOffsetY(Number(e.target.value) / 100)} />
          </div>

          <div className="inlineActions">
            <button type="button" className="primaryBtn" onClick={confirmCropAndUpload} disabled={uploading}>
              {uploading ? tr('Téléversement...', 'Mampakatra...') : tr('Appliquer et téléverser', 'Hampihatra sy hampakatra')}
            </button>
            <button type="button" className="ghostBtn" onClick={closeCropper} disabled={uploading}>
              {tr('Annuler', 'Hanafoana')}
            </button>
          </div>
        </section>
      )}

      <section className="card cardBody grid" style={{ gap: '0.7rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Informations personnelles', 'Momba anao')}</h2>
        <div className="formGrid">
          <article className="sellerTrustPanel">
            <h3>{tr('Nom', 'Anarana')}</h3>
            <p>{user.fullName || '-'}</p>
          </article>
          <article className="sellerTrustPanel">
            <h3>Email</h3>
            <p>{user.email || '-'}</p>
          </article>
          <article className="sellerTrustPanel">
            <h3>{tr('Rôle', 'Anjara')}</h3>
            <p>{roleLabel(user.role, lang)}</p>
          </article>
          <article className="sellerTrustPanel">
            <h3>{tr('Téléphone', 'Telefaona')}</h3>
            <p>{formatPhone(user.phoneNumber)}</p>
          </article>
          <article className="sellerTrustPanel">
            <h3>WhatsApp</h3>
            <p>{formatPhone(user.whatsAppNumber)}</p>
          </article>
        </div>
      </section>

      <section className="card cardBody grid" style={{ gap: '0.65rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Accès rapides', 'Fidirana haingana')}</h2>
        <div className="inlineActions">
          {user.role === 'Seller' && <Link href="/dashboard"><a className="primaryBtn">{tr('Espace vendeur', 'Faritra mpivarotra')}</a></Link>}
          {user.role === 'Admin' && <Link href="/admin"><a className="primaryBtn">{tr('Administration', 'Fitantanana')}</a></Link>}
          <Link href="/dashboard/listings/new"><a className="ghostBtn">{tr('Nouvelle annonce', 'Filazana vaovao')}</a></Link>
          <Link href="/privacy"><a className="ghostBtn">{tr('Confidentialité', 'Tsiambaratelo')}</a></Link>
        </div>
      </section>

      <section className="card cardBody grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>Besoin de modifier vos informations ?</h2>
        <p style={{ margin: 0 }}>
          Pour le moment, la mise à jour complète du profil se fait via le support.
        </p>
        <p style={{ margin: 0 }}>
          Contact: <a href="mailto:contact@carhub.mg" style={{ color: '#1d4ed8', fontWeight: 600 }}>contact@carhub.mg</a>
        </p>
      </section>
    </section>
  );
}


