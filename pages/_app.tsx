import type { AppProps } from 'next/app';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { I18nProvider } from '@/lib/i18n';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>CarHub Madagascar</title>
        <meta name="description" content="CarHub Madagascar - Achat et vente de voitures d’occasion" />
        <link rel="icon" type="image/svg+xml" href="/logo-carhub.svg" />
      </Head>
      <I18nProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </I18nProvider>
    </>
  );
}
