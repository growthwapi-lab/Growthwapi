import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "Twitter / X", icon: Twitter, href: "#" },
  ];

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-3 text-center md:text-left">
            <Link href="/" className="inline-block bg-white p-2.5 rounded-xl">
              <Image
                src="/logo.png"
                alt="GrowthWapi Logo"
                width={120}
                height={40}
                className="h-[40px] w-[120px] object-contain"
              />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm">
              Growth tools for modern businesses
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <Link href="/services" className="hover:text-brand-orange transition-colors">
              Services
            </Link>
            <Link href="/pricing" className="hover:text-brand-orange transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-brand-orange transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand-orange transition-colors">
              Contact Us
            </Link>
          </div>

          {/* Social Links Row */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Follow us</span>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <a
                    key={idx}
                    href={social.href}
                    aria-label={social.name}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-orange text-slate-400 hover:text-white flex items-center justify-center transition-all duration-300"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright divider */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <p>© 2026 GrowthWapi. All rights reserved.</p>
          <p className="text-slate-400">
            India&apos;s managed growth platform 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
