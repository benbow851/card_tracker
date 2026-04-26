import { Icon } from "@/components/ui/Icon";

export function Footer() {
  return (
    <footer className="bg-surface py-12 border-t border-white/5">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8 gap-8">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-headline font-bold text-on-surface text-xl mb-2">
            The Digital Vault
          </span>
          <p className="font-body text-sm text-on-surface-variant">
            © 2026 Collector Tech Editorial. All Rights Reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {["Data Sources", "About", "Community", "API Docs", "Privacy"].map(
            (label) => (
              <a
                key={label}
                href="#"
                className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                {label}
              </a>
            )
          )}
        </div>
        <div className="flex gap-3">
          <a
            href="#"
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-primary transition-all"
          >
            <Icon name="language" className="text-xl" />
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-on-surface-variant hover:text-primary transition-all"
          >
            <Icon name="rss_feed" className="text-xl" />
          </a>
        </div>
      </div>
    </footer>
  );
}
