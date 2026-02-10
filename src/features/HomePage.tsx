import { Link } from 'react-router-dom';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { useI18n } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-fog-50 via-white to-white text-ink-900">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">U</div>
          <div>
            <p className="text-sm font-semibold">{t('common.appName')}</p>
            <p className="text-xs text-ink-500">{t('common.tagline')}</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-ink-600 md:flex">
          <a href="#services" className="hover:text-ink-900">
            {t('home.navServices')}
          </a>
          <a href="#pricing" className="hover:text-ink-900">
            {t('home.navPricing')}
          </a>
          <a href="#contact" className="hover:text-ink-900">
            {t('home.navContact')}
          </a>
          <Link to="/login" className="text-ink-900">
            {t('home.navLogin')}
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link to="/login" className="text-sm font-semibold text-ink-900">
            {t('home.navLogin')}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-20">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">
              {t('home.heroTag')}
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              {t('home.heroTitle')}
            </h1>
            <p className="text-base text-ink-600">{t('home.heroSubtitle')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button>{t('home.heroCta')}</Button>
              </Link>
              <a href="#contact">
                <Button variant="secondary">{t('home.heroSecondary')}</Button>
              </a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['home.heroCard1', 'home.heroCard2', 'home.heroCard3', 'home.heroCard4'].map((key) => (
              <Card key={key} className="border border-fog-200 bg-white/80 p-5">
                <p className="text-sm font-semibold text-ink-900">{t(`${key}.title`)}</p>
                <p className="mt-2 text-xs text-ink-500">{t(`${key}.body`)}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="services" className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{t('home.servicesTag')}</p>
            <h2 className="text-2xl font-semibold">{t('home.servicesTitle')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {['home.services1', 'home.services2', 'home.services3', 'home.services4', 'home.services5', 'home.services6'].map(
              (key) => (
                <Card key={key} className="border border-fog-200 bg-white p-5">
                  <p className="text-sm font-semibold text-ink-900">{t(`${key}.title`)}</p>
                  <p className="mt-2 text-xs text-ink-500">{t(`${key}.body`)}</p>
                </Card>
              )
            )}
          </div>
        </section>

        <section id="pricing" className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{t('home.pricingTag')}</p>
            <h2 className="text-2xl font-semibold">{t('home.pricingTitle')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {['home.pricingStarter', 'home.pricingGrowth', 'home.pricingScale'].map((key) => (
              <Card key={key} className="border border-fog-200 bg-white p-5">
                <p className="text-sm font-semibold text-ink-900">{t(`${key}.title`)}</p>
                <p className="mt-2 text-2xl font-semibold">{t(`${key}.price`)}</p>
                <p className="mt-2 text-xs text-ink-500">{t(`${key}.body`)}</p>
                <ul className="mt-4 space-y-2 text-xs text-ink-600">
                  {[1, 2, 3].map((idx) => (
                    <li key={idx}>• {t(`${key}.feature${idx}`)}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        <section id="contact" className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{t('home.contactTag')}</p>
            <h2 className="text-2xl font-semibold">{t('home.contactTitle')}</h2>
            <p className="text-sm text-ink-600">{t('home.contactBody')}</p>
          </div>
          <Card className="border border-fog-200 bg-white p-6">
            <form className="space-y-4">
              <input
                placeholder={t('home.contactName')}
                className="w-full rounded-lg border border-fog-200 px-3 py-2 text-sm outline-none focus:border-ink-900"
              />
              <input
                placeholder={t('home.contactEmail')}
                className="w-full rounded-lg border border-fog-200 px-3 py-2 text-sm outline-none focus:border-ink-900"
              />
              <textarea
                placeholder={t('home.contactMessage')}
                rows={4}
                className="w-full rounded-lg border border-fog-200 px-3 py-2 text-sm outline-none focus:border-ink-900"
              />
              <Button type="button" className="w-full">
                {t('home.contactCta')}
              </Button>
            </form>
          </Card>
        </section>
      </main>
    </div>
  );
}
