import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const token = typeof router.query.token === 'string' ? router.query.token : '';
    if (!token) {
      setError('Lien de confirmation invalide.');
      setLoading(false);
      return;
    }

    apiFetch<any>(`/api/auth/confirm-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        setSuccess(res?.message || 'Email confirme avec succes.');
      })
      .catch((e: any) => {
        const msg = String(e?.message || '');
        if (msg.includes('Invalid or expired confirmation token')) {
          setError('Lien de confirmation invalide ou expire.');
        } else {
          setError(msg || 'Confirmation impossible.');
        }
      })
      .finally(() => setLoading(false));
  }, [router.isReady, router.query.token]);

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: '2rem', paddingBottom: '2rem' }}>
      <section className="card cardBody grid" style={{ gap: '0.85rem' }}>
        <h1 className="text-2xl font-bold" style={{ margin: 0 }}>Confirmation email</h1>

        {loading && <p className="muted" style={{ margin: 0 }}>Verification en cours...</p>}
        {!loading && success && <p className="sellerNotice sellerNoticeOk" style={{ margin: 0 }}>{success}</p>}
        {!loading && error && <p className="sellerNotice sellerNoticeError" style={{ margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <Link href="/login"><a className="primaryBtn">Aller a la connexion</a></Link>
          <Link href="/"><a className="ghostBtn">Retour accueil</a></Link>
        </div>
      </section>
    </div>
  );
}
