import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { clearTokens, getCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/router';
import { JwtUser } from '@/lib/types';
import { roleLabel } from '@/lib/ui-labels';
import { useI18n } from '@/lib/i18n';
import BetaBanner from '@/components/BetaBanner';
import { isBetaMode } from '@/lib/beta';

interface Props {
  children: ReactNode;
}

const footerBrandLinks = [
  { fr: 'Toyota', mg: 'Toyota', href: '/cars?Brand=toyota' },
  { fr: 'BMW', mg: 'BMW', href: '/cars?Brand=bmw' },
  { fr: 'Mercedes-Benz', mg: 'Mercedes-Benz', href: '/cars?Brand=mercedes-benz' },
  { fr: 'Hyundai', mg: 'Hyundai', href: '/cars?Brand=hyundai' },
  { fr: 'Kia', mg: 'Kia', href: '/cars?Brand=kia' },
  { fr: 'Dacia', mg: 'Dacia', href: '/cars?Brand=dacia' },
  { fr: 'Audi', mg: 'Audi', href: '/cars?Brand=audi' },
  { fr: 'Nissan', mg: 'Nissan', href: '/cars?Brand=nissan' },
  { fr: 'Chevrolet', mg: 'Chevrolet', href: '/cars?Brand=chevrolet' },
  { fr: 'Voir toutes les marques', mg: 'Hijery marika rehetra', href: '/cars' }
];

const footerCategoryLinks = [
  { fr: 'Citadine', mg: 'Citadine', href: '/cars?Category=citadine' },
  { fr: 'Berline', mg: 'Berline', href: '/cars?Category=berline' },
  { fr: 'Break', mg: 'Break', href: '/cars?Category=break' },
  { fr: 'SUV compact', mg: 'SUV compact', href: '/cars?Category=suv-compact' },
  { fr: 'SUV', mg: 'SUV', href: '/cars?Category=suv' },
  { fr: '4x4', mg: '4x4', href: '/cars?Category=4x4' },
  { fr: 'Pickup simple cabine', mg: 'Pickup cabine tsotra', href: '/cars?Category=pickup-simple-cabine' },
  { fr: 'Pickup double cabine', mg: 'Pickup cabine roa', href: '/cars?Category=pickup-double-cabine' },
  { fr: 'Utilitaire', mg: 'Fiara utilitaire', href: '/cars?Category=utilitaire' },
  { fr: 'Voir toutes les catégories', mg: 'Hijery sokajy rehetra', href: '/cars' }
];

const footerHelpLinks = [
  { fr: 'Acheter une voiture', mg: 'Hividy fiara', href: '/cars' },
  { fr: 'Vendre ma voiture', mg: 'Hivarotra fiara', href: '/login' },
  { fr: 'Tarifs', mg: 'Vidiny', href: '/pricing' },
  { fr: 'Espace vendeur', mg: 'Faritra mpivarotra', href: '/dashboard' },
  { fr: 'Connexion', mg: 'Hiditra', href: '/login' },
  { fr: 'Inscription', mg: 'Hisoratra anarana', href: '/register' },
  { fr: 'Politique de confidentialité', mg: 'Politikan’ny tsiambaratelo', href: '/privacy' },
  { fr: 'Conditions d\'utilisation', mg: 'Fepetra fampiasana', href: '/terms' },
  { fr: 'Contact', mg: 'Fifandraisana', href: '/contact' }
];

export default function Layout({ children }: Props) {
  const router = useRouter();
  const { lang, setLang, tr } = useI18n();
  const [user, setUser] = useState<JwtUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCookieInfo, setShowCookieInfo] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
    setHydrated(true);
    setProfileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accepted = window.localStorage.getItem('carhub_cookie_info_seen');
    setShowCookieInfo(accepted !== '1');
  }, []);

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/');
  };

  const acceptCookieInfo = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('carhub_cookie_info_seen', '1');
    }
    setShowCookieInfo(false);
  };

  const showSellButton = !hydrated || !user;
  const betaMode = isBetaMode();
  const userLabel = (user?.fullName || '').trim() || (user?.email ? user.email.split('@')[0] : '');
  const userFallbackLabel = tr('Utilisateur', 'Mpampiasa');
  const isProfessionalSeller = user?.role === 'Seller' && String(user?.accountType || '').toLowerCase() === 'professional';

  return (
    <div className="shell min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/">
            <a className="inline-flex items-center gap-2" aria-label="CarHub Madagascar">
              <img src="/logo-carhub-final.png" alt="CarHub" className="h-auto w-40 md:w-44" />
              <span className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground md:inline">Madagascar</span>
            </a>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <div className="langSwitcher" aria-label={tr('Sélecteur de langue', 'Safidy fiteny')} role="group">
              <button
                type="button"
                className={lang === 'fr' ? 'langBtn active' : 'langBtn'}
                onClick={() => setLang('fr')}
                aria-pressed={lang === 'fr'}
                title="Français"
              >
                <img className="langFlagImg" src="/flags/fr.svg" alt="" aria-hidden="true" />
                <span className="langCode">FR</span>
              </button>
              <button
                type="button"
                className={lang === 'mg' ? 'langBtn active' : 'langBtn'}
                onClick={() => setLang('mg')}
                aria-pressed={lang === 'mg'}
                title="Malagasy"
              >
                <img className="langFlagImg" src="/flags/mg.svg" alt="" aria-hidden="true" />
                <span className="langCode">MG</span>
              </button>
            </div>
            <Link href="/cars"><a className="rounded-md border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-muted/70">{tr('Rechercher', 'Hitady')}</a></Link>
            {showSellButton && (
              <Link href="/pricing"><a className="rounded-md border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-muted/70">{tr('Tarifs', 'Vidiny')}</a></Link>
            )}
            {showSellButton && (
              <Link href="/login">
                <a className="inline-flex items-center justify-center rounded-lg border-2 border-blue-900 px-4 py-1.5 text-lg font-semibold leading-none text-blue-900 transition hover:bg-blue-50">
                  {tr('Vendre', 'Hivarotra')}
                </a>
              </Link>
            )}
            {hydrated && user?.role === 'Seller' && <Link href="/dashboard"><a className="rounded-md border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-muted/70">{tr('Espace vendeur', 'Faritra mpivarotra')}</a></Link>}
            {hydrated && user?.role === 'Admin' && <Link href="/admin"><a className="rounded-md border border-transparent px-3 py-2 text-sm hover:border-border hover:bg-muted/70">Admin</a></Link>}
            {hydrated && user && (
              <div className="navbarUserMenu" ref={profileRef}>
                <button
                  type="button"
                  className="navbarUserCard"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <div className="navbarUserMeta">
                    <div className="navbarUserNameRow">
                      <p className="navbarUserName">{userLabel || userFallbackLabel}</p>
                      {isProfessionalSeller && <span className="navbarProfessionalBadge">⭐ PRO</span>}
                    </div>
                    <p className="navbarUserRole">{roleLabel(user.role, lang)}</p>
                  </div>
                  <span className="navbarUserChevron" aria-hidden="true">{profileOpen ? '▲' : '▼'}</span>
                </button>
                {profileOpen && (
                  <div className="navbarUserDropdown" role="menu">
                    <Link href="/account">
                      <a className="navbarMenuItem" role="menuitem" onClick={() => setProfileOpen(false)}>
                        {tr('Mon compte', 'Kaontiko')}
                      </a>
                    </Link>
                    {user.role === 'Seller' && !betaMode && (
                      <Link href="/dashboard/subscription">
                        <a className="navbarMenuItem" role="menuitem" onClick={() => setProfileOpen(false)}>
                          {tr('Mon abonnement', 'Ny famandrihako')}
                        </a>
                      </Link>
                    )}
                    <button type="button" className="navbarMenuItem" onClick={logout}>
                      {tr('Déconnexion', 'Hivoaka')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5">
        {betaMode && <BetaBanner compact />}
        {children}
      </main>

      <footer className="carhubFooter">
        <div className="carhubFooterInner">
          <p className="carhubFooterLead">{tr("Tu cherches une voiture d’occasion ? Découvre les offres disponibles sur CarHub Madagascar.", "Mitady fiara efa niasa ve ianao? Jereo ny tolotra hita ao amin’i CarHub Madagascar.")}</p>

          <section className="carhubFooterLinksBlock">
            <h4>{tr('Marques et catégories', 'Marika sy sokajy')}</h4>
            <div className="carhubFooterLinksGrid">
              <div>
                <h5>{tr('Marques populaires', 'Marika malaza')}</h5>
                <ul>
                  {footerBrandLinks.map((item) => (
                    <li key={item.fr}><Link href={item.href}><a>{lang === 'mg' ? item.mg : item.fr}</a></Link></li>
                  ))}
                </ul>
              </div>

              <div>
                <h5>{tr('Carrosserie', 'Karazana vatana')}</h5>
                <ul>
                  {footerCategoryLinks.map((item) => (
                    <li key={item.fr}><Link href={item.href}><a>{lang === 'mg' ? item.mg : item.fr}</a></Link></li>
                  ))}
                </ul>
              </div>

              <div>
                <h5>{tr('Services CarHub', 'Tolotra CarHub')}</h5>
                <ul>
                  {footerHelpLinks.map((item) => (
                    <li key={item.fr}><Link href={item.href}><a>{lang === 'mg' ? item.mg : item.fr}</a></Link></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="carhubFooterTextCard">
            <h4>{tr('Réalise tes projets auto avec CarHub Madagascar', 'Tanteraho miaraka amin’i CarHub Madagascar ny tetikasa momba ny fiara')}</h4>
            <p>{tr('CarHub Madagascar te permet de comparer rapidement les annonces publiées par les vendeurs, avec les informations essentielles : prix, kilométrage, année, ville et détails du véhicule.', 'CarHub Madagascar dia manampy anao hampitaha haingana ireo filazana navoakan’ny mpivarotra, miaraka amin’ny vaovao ilaina: vidiny, kilometatra, taona, tanàna ary mombamomba ny fiara.')}</p>
            <p>{tr('Cherche le véhicule de ton choix et contacte rapidement le vendeur.', 'Mitadiava fiara tianao ary mifandraisa haingana amin’ny mpivarotra.')}</p>
            <p>{tr('Que tu recherches une citadine, un SUV, un utilitaire ou un 4x4, la plateforme te donne une vue claire du marché local pour prendre une décision plus simple et plus rapide.', 'Na mitady citadine, SUV, utilitaire na 4x4 aza ianao dia manome topimaso mazava momba ny tsena eo an-toerana ny sehatra, mba hanapahanao hevitra mora sy haingana kokoa.')}</p>
            <p>{tr('Tu peux aussi vendre ton véhicule facilement en créant une annonce depuis ton espace vendeur.', 'Afaka mivarotra fiara mora ihany koa ianao amin’ny famoronana filazana ao amin’ny faritra mpivarotra.')}</p>
          </section>

          <div className="carhubFooterBottom">
            <div>
              <strong>CarHub Madagascar</strong>
              <span>{tr('© 2026 CarHub Madagascar. Tous droits réservés.', '© 2026 CarHub Madagascar. Zo rehetra voatokana.')}</span>
            </div>
            <div className="carhubFooterBottomLinks">
              <Link href="/privacy"><a>{tr('Confidentialité', 'Tsiambaratelo')}</a></Link>
              <Link href="/terms"><a>{tr('Conditions', 'Fepetra')}</a></Link>
              <Link href="/contact"><a>{tr('Contact', 'Fifandraisana')}</a></Link>
            </div>
          </div>
        </div>
      </footer>

      {showCookieInfo && (
        <aside className="cookieInfoBanner" role="status" aria-live="polite">
          <p>
            {tr(
              "CarHub utilise des cookies essentiels pour la connexion, la sécurité et les préférences du site.",
              "CarHub dia mampiasa cookies ilaina amin'ny fidirana, fiarovana ary safidy ao amin'ny tranonkala."
            )}{' '}
            <Link href="/privacy"><a>{tr('En savoir plus', 'Hijery misimisy')}</a></Link>
          </p>
          <button type="button" className="primaryBtn" onClick={acceptCookieInfo}>
            {tr("J'ai compris", 'Efa azoko')}
          </button>
        </aside>
      )}
    </div>
  );
}
