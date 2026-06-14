import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Rewrite Site-1-relative image paths to this site's base; leave external URLs.
function urlTransform(url: string): string {
  if (url.startsWith("/images/") || url.startsWith("/desktop_pc/")) return BASE + url;
  return url;
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        urlTransform={urlTransform}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
