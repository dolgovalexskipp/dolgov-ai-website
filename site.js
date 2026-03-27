const header = document.getElementById('site-header');
const floatingCta = document.getElementById('floating-cta');
const sectionLinks = Array.from(document.querySelectorAll('[data-scroll-link]'));
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 12);
};

const syncFloatingCta = () => {
  if (!floatingCta) return;

  const ctaSection = document.querySelector('section:last-of-type');
  const heroSection = document.querySelector('section');
  const heroBottom = heroSection ? heroSection.getBoundingClientRect().bottom : 0;
  const finalCtaTop = ctaSection ? ctaSection.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
  const shouldShow = heroBottom < 0 && finalCtaTop > window.innerHeight * 0.65;

  floatingCta.classList.toggle('is-visible', shouldShow);
};

const setActiveLink = (id) => {
  sectionLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', isActive);
  });
};

if (sections.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry?.target?.id) {
        setActiveLink(visibleEntry.target.id);
      }
    },
    {
      rootMargin: '-20% 0px -55% 0px',
      threshold: [0.2, 0.35, 0.6],
    }
  );

  sections.forEach((section) => observer.observe(section));
}

window.addEventListener('scroll', () => {
  syncHeader();
  syncFloatingCta();
}, { passive: true });

window.addEventListener('load', () => {
  syncHeader();
  syncFloatingCta();
});
