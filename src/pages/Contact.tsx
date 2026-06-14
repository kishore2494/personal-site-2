import { useState, type FormEvent } from "react";
import { Mail, MessageCircle, Linkedin, Send, Github } from "lucide-react";
import { useMood } from "@/hooks/useMood";
import { site } from "@/config/site";
import SectionHeading from "@/components/SectionHeading";
import StationHero from "@/components/StationHero";
import Reveal from "@/components/Reveal";
import Seo from "@/components/Seo";

const channels = [
  { Icon: Mail, label: "Email", value: site.social.email, href: site.social.emailUrl },
  { Icon: MessageCircle, label: "WhatsApp", value: "+91 93449 01628", href: site.social.whatsapp },
  { Icon: Linkedin, label: "LinkedIn", value: "Kishore Kumar", href: site.social.linkedin },
  { Icon: Github, label: "GitHub", value: "@kishore2494", href: site.social.github },
];

export default function Contact() {
  useMood("contact");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const message = String(data.get("message") || "");

    const subject = encodeURIComponent(`Hello from ${name || "your site"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `${site.social.emailUrl}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <>
      <Seo
        title="Contact — Kishore Kumar A"
        description="Get in touch with Kishore Kumar A about AI systems, deep-tech ideas, or collaboration."
      />
      <StationHero>
        <SectionHeading
          eyebrow="Contact · Deep Space"
          title={
            <>
              Let's build something <span className="gradient-text">extraordinary</span>
            </>
          }
          intro="Whether it's an AI system, a deep-tech idea, or just a conversation about the universe — I'd love to hear from you."
        />
      </StationHero>

      <div className="section-pad pb-10 pt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* channels */}
        <Reveal className="space-y-3">
          {channels.map(({ Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="group glass glass-hover flex items-center gap-4 rounded-2xl p-5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-nebula-400/30 bg-nebula-500/10 text-nebula-300 transition-colors group-hover:bg-nebula-500/20">
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
                <p className="truncate text-sm text-slate-200">{value}</p>
              </div>
            </a>
          ))}
        </Reveal>

        {/* form */}
        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="glass rounded-2xl p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" placeholder="Your name" required />
              <Field label="Email" name="email" type="email" placeholder="you@email.com" required />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-300">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Tell me about your idea…"
                className="w-full resize-none rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-nebula-400/60 focus:ring-1 focus:ring-nebula-400/40"
              />
            </div>

            <button type="submit" className="btn-primary mt-6 w-full">
              <Send size={16} /> Send message
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              {sent
                ? "Your email app should have opened — if not, write to me directly."
                : "This opens your email app with the message pre-filled."}
            </p>
          </form>
        </Reveal>
      </div>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-void-900/60 px-4 py-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-nebula-400/60 focus:ring-1 focus:ring-nebula-400/40"
      />
    </div>
  );
}
