import Link from 'next/link';

interface Props {
  href: string;
  label?: string;
}

export default function BackLink({ href, label = 'Retour' }: Props) {
  return (
    <Link href={href}>
      <a className="backLink" aria-label={label}>
        <span className="backLinkArrow" aria-hidden="true">‹</span>
        <span>{label}</span>
      </a>
    </Link>
  );
}
