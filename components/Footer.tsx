import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-3 text-center md:text-left">
            <Link href="/" className="inline-block bg-white p-2 rounded-xl">
              <Image
                src="/logo.png"
                alt="GrowthWapi Logo"
                width={160}
                height={44}
                className="h-[44px] w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm">
              Growth tools for modern businesses
            </p>
          </div>

          {/* Simple Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <Link href="#services" className="hover:text-brand-orange transition-colors">
              Services
            </Link>
            <Link href="#pricing" className="hover:text-brand-orange transition-colors">
              Pricing
            </Link>
            <Link href="#about" className="hover:text-brand-orange transition-colors">
              About
            </Link>
            <a href="#privacy" className="hover:text-brand-orange transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-brand-orange transition-colors">
              Terms of Service
            </a>
            <a href="#contact" className="hover:text-brand-orange transition-colors">
              Contact Us
            </a>
          </div>
        </div>

        {/* Copyright divider */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© 2026 GrowthWapi. All rights reserved.</p>
          <p className="text-slate-400">
            Designed for businesses and NGOs across India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
