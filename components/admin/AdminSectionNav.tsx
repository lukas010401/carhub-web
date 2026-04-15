import Link from 'next/link';

type AdminSection = 'overview' | 'subscriptions' | 'payments';

type Props = {
  active: AdminSection;
};

export default function AdminSectionNav({ active }: Props) {
  const items: Array<{ key: AdminSection; href: string; label: string }> = [
    { key: 'overview', href: '/admin', label: 'Vue admin' },
    { key: 'subscriptions', href: '/admin/subscriptions', label: 'Abonnements pro' },
    { key: 'payments', href: '/admin/payments', label: 'Paiements' }
  ];

  return (
    <nav className="inlineActions" aria-label="Navigation admin" style={{ marginBottom: '0.75rem' }}>
      {items.map((item) => (
        <Link key={item.key} href={item.href}>
          <a className={item.key === active ? 'primaryBtn' : 'ghostBtn'}>{item.label}</a>
        </Link>
      ))}
    </nav>
  );
}
