import { MessageCircle, Phone } from "lucide-react";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-center">
      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919122257780"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
      </a>

      {/* Call Button */}
      <a
        href="tel:+919122257780"
        aria-label="Call Us"
        className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-blue hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
      >
        <Phone className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
      </a>
    </div>
  );
}
