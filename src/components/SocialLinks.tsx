import { Github, Linkedin, Twitter, Mail, MessageCircle } from "lucide-react";
import { site } from "@/config/site";

const items = [
  { href: site.social.github, label: "GitHub", Icon: Github },
  { href: site.social.linkedin, label: "LinkedIn", Icon: Linkedin },
  { href: site.social.twitter, label: "Twitter / X", Icon: Twitter },
  { href: site.social.whatsapp, label: "WhatsApp", Icon: MessageCircle },
  { href: site.social.emailUrl, label: "Email", Icon: Mail },
];

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          aria-label={label}
          className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-nebula-400/50 hover:text-nebula-300 hover:shadow-glow"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}
